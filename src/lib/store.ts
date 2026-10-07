import { api, hosted } from "./remote";
import { getAllAttachments, replaceRemoteAttachments } from "./attachments";
import type { Activity, Company, Contact, Deal, Division, DivisionKey, Stage, StageKey, Task, User } from "../types";
import { DIVISIONS, SEED_COMPANIES, SEED_DEALS, SEED_USERS, STAGES } from "./seed-data";

/**
 * Local data store for the CRM.
 *
 * This is intentionally written as a small repository layer (get/create/update
 * functions + a subscribe/notify pub-sub) rather than components reading
 * localStorage directly. When the Shopfront integration is ready, this file
 * is the only place that needs to change — swap the body of each function for
 * a `fetch()`/Supabase call against the same shapes in `src/types.ts` and
 * every page keeps working unmodified.
 *
 * Data is namespaced under `bolide-crm:v1:*` in localStorage so it survives
 * refreshes but stays sandboxed to this app.
 */

const KEYS = {
  companies: "bolide-crm:v1:companies",
  contacts: "bolide-crm:v1:contacts",
  deals: "bolide-crm:v1:deals",
  users: "bolide-crm:v1:users",
  activities: "bolide-crm:v1:activities",
  session: "bolide-crm:v1:session",
  tasks: "bolide-crm:v1:tasks",
  divisionOverrides: "bolide-crm:v1:division-overrides",
  stageOverrides: "bolide-crm:v1:stage-overrides",
} as const;

/**
 * In-memory cache mirroring localStorage, keyed by storage key.
 *
 * `useSyncExternalStore` (see `use-store.ts`) requires its snapshot getter to
 * return the *same reference* across calls unless the data actually changed
 * — otherwise React sees "changed" on every render and loops forever
 * (React error #185, "Maximum update depth exceeded"). Parsing JSON fresh out
 * of localStorage on every `load()` call violates that: it hands back a new
 * array/object every time even when nothing changed. Caching the parsed
 * value here, and only replacing it inside `save()`, keeps the reference
 * stable between real changes.
 */
let remoteReady=false;
let remoteRevision=0;
let remoteTimer: ReturnType<typeof setTimeout> | undefined;
let saving=false;
let dirty=false;
let blocked=false;
const cache = new Map<string, unknown>();

function load<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(key, value);
  return value;
}

function save<T>(key: string, value: T) {
  cache.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — in-memory cache still works for this session
  }
  notify();
  if(remoteReady) scheduleRemoteSave();
}

// --- reactivity -------------------------------------------------------
// Declared before `seedIfEmpty()` runs below: `save()` calls `notify()` at
// module load time (via seeding), so `listeners` must already be
// initialized by then — otherwise it's a temporal-dead-zone ReferenceError
// the moment this module loads.

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function seedIfEmpty() {
  if (!localStorage.getItem(KEYS.companies)) save(KEYS.companies, SEED_COMPANIES);
  if (!localStorage.getItem(KEYS.contacts)) save(KEYS.contacts, [] as Contact[]);
  if (!localStorage.getItem(KEYS.deals)) save(KEYS.deals, SEED_DEALS);
  if (!localStorage.getItem(KEYS.users)) save(KEYS.users, SEED_USERS);
  if (!localStorage.getItem(KEYS.activities)) save(KEYS.activities, [] as Activity[]);
  if (!localStorage.getItem(KEYS.tasks)) save(KEYS.tasks, [] as Task[]);
  if (!localStorage.getItem(KEYS.divisionOverrides)) save(KEYS.divisionOverrides, {} as Record<DivisionKey, Partial<Division>>);
  if (!localStorage.getItem(KEYS.stageOverrides)) save(KEYS.stageOverrides, {} as Record<StageKey, Partial<Stage>>);
}
if(!hosted) seedIfEmpty();

/** Adds any seed users that don't exist yet — runs every load, not just on
 * an empty store. `seedIfEmpty()` alone only populates a brand-new browser;
 * anyone already using the CRM keeps their own saved `users` list forever,
 * so a new team member added to SEED_USERS later (e.g. Herman Ras, Welcome
 * Nyathi) would never actually show up for existing users without this. */
function migrateNewSeedUsers() {
  const existing = load<User[]>(KEYS.users, SEED_USERS);
  const missing = SEED_USERS.filter((seedUser) => !existing.some((u) => u.id === seedUser.id));
  if (missing.length > 0) save(KEYS.users, [...existing, ...missing]);
}
if(!hosted) migrateNewSeedUsers();
const correctedUsers=load<User[]>(KEYS.users,SEED_USERS);
if(!hosted && correctedUsers.some(u=>u.email==="langa@bolide.co.za")) save(KEYS.users,correctedUsers.map(u=>u.email==="langa@bolide.co.za"?{...u,email:"langelihle@bolide.co.za"}:u));
const oldStages=load<Record<string,Partial<Stage>>>(KEYS.stageOverrides,{});
for(const key of ["qualified","quote","won"]) if(oldStages[key]) delete oldStages[key].label;
if(!hosted) save(KEYS.stageOverrides,oldStages);

/** Swaps the old placeholder Energy deals for the client's real pipeline
 * from their own "Lead Tracker v1.xlsx" (Sep 2026) — same reasoning as
 * `migrateNewSeedUsers()`: anyone who already opened the CRM has their own
 * saved `deals`/`companies` and would otherwise keep the old zero-value
 * placeholder leads (d-11..d-14) forever, never seeing the real numbers. */
const OLD_PLACEHOLDER_ENERGY_DEAL_IDS = ["d-11", "d-12", "d-13", "d-14"];
function migrateLeadTrackerDeals() {
  const existingCompanies = load<Company[]>(KEYS.companies, SEED_COMPANIES);
  const missingCompanies = SEED_COMPANIES.filter((c) => !existingCompanies.some((ec) => ec.id === c.id));
  if (missingCompanies.length > 0) save(KEYS.companies, [...existingCompanies, ...missingCompanies]);

  const existingDeals = load<Deal[]>(KEYS.deals, SEED_DEALS);
  const withoutPlaceholders = existingDeals.filter((d) => !OLD_PLACEHOLDER_ENERGY_DEAL_IDS.includes(d.id));
  const missingDeals = SEED_DEALS.filter((d) => d.id.startsWith("d-e") && !withoutPlaceholders.some((ed) => ed.id === d.id));
  if (withoutPlaceholders.length !== existingDeals.length || missingDeals.length > 0) {
    save(KEYS.deals, [...withoutPlaceholders, ...missingDeals]);
  }
}
if(!hosted) migrateLeadTrackerDeals();

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// --- companies ----------------------------------------------------------

export function getCompanies(): Company[] {
  return load(KEYS.companies, SEED_COMPANIES);
}

export function getCompany(id: string): Company | undefined {
  return getCompanies().find((c) => c.id === id);
}

export function createCompany(input: Omit<Company, "id" | "createdAt">): Company {
  const company: Company = { ...input, id: uid("c"), createdAt: new Date().toISOString() };
  save(KEYS.companies, [...getCompanies(), company]);
  return company;
}

export function updateCompany(id: string, patch: Partial<Company>) {
  save(
    KEYS.companies,
    getCompanies().map((c) => (c.id === id ? { ...c, ...patch } : c))
  );
}

/** Folds `mergeId` into `keepId`: every deal and contact pointing at the
 * duplicate is repointed at the kept company, then the duplicate is removed.
 * Used when the free-text company field on a deal created an accidental
 * near-duplicate (a typo'd name, etc.). */
export function mergeCompanies(keepId: string, mergeId: string) {
  if (keepId === mergeId) return;
  save(
    KEYS.deals,
    getDeals().map((d) => (d.companyId === mergeId ? { ...d, companyId: keepId } : d))
  );
  save(
    KEYS.contacts,
    getContacts().map((c) => (c.companyId === mergeId ? { ...c, companyId: keepId } : c))
  );
  const merged = getCompany(mergeId);
  save(
    KEYS.companies,
    getCompanies().filter((c) => c.id !== mergeId)
  );
  if (merged) logCompanyActivity(keepId, "system", `Merged company "${merged.name}" into this record`);
}

// --- contacts -------------------------------------------------------------

export function getContacts(): Contact[] {
  return load(KEYS.contacts, [] as Contact[]);
}

export function getContactsByCompany(companyId: string): Contact[] {
  return getContacts().filter((c) => c.companyId === companyId);
}

export function createContact(input: Omit<Contact, "id" | "createdAt">): Contact {
  const contact: Contact = { ...input, id: uid("ct"), createdAt: new Date().toISOString() };
  save(KEYS.contacts, [...getContacts(), contact]);
  return contact;
}

// --- deals ------------------------------------------------------------

export function getDeals(): Deal[] {
  return load(KEYS.deals, SEED_DEALS);
}

export function getDeal(id: string): Deal | undefined {
  return getDeals().find((d) => d.id === id);
}

export function createDeal(input: Omit<Deal, "id" | "createdAt" | "updatedAt">): Deal {
  if(input.stage === "lost" && !input.lostReason?.trim()) throw new Error("A lost reason is required.");
  const nowIso = new Date().toISOString();
  const deal: Deal = { ...input, id: uid("d"), receivedAt: input.receivedAt ?? nowIso, stageChangedAt: nowIso, proposalSentAt: ["quote","final_proposal","negotiation","won"].includes(input.stage) ? nowIso : undefined, createdAt: nowIso, updatedAt: nowIso };
  save(KEYS.deals, [...getDeals(), deal]);
  logActivity(deal.id, "note", `Deal created: ${deal.title}`);
  return deal;
}

export function updateDeal(id: string, patch: Partial<Deal>) {
  const before=getDeal(id); if(!before) return;
  const after={...before,...patch};
  if(after.stage === "lost" && !after.lostReason?.trim()) throw new Error("A lost reason is required.");
  if(patch.stage && patch.stage!==before.stage) patch.stageChangedAt=new Date().toISOString();
  if(!before.proposalSentAt && patch.stage && ["quote","final_proposal","negotiation","won"].includes(patch.stage)) patch.proposalSentAt=new Date().toISOString();
  save(
    KEYS.deals,
    getDeals().map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d))
  );
}

export function moveDealStage(id: string, stage: StageKey) {
  const deal = getDeal(id);
  if (!deal || deal.stage === stage) return;
  updateDeal(id, { stage });
  logActivity(id, "stage-change", `Moved from ${deal.stage} to ${stage}`);
}

export function deleteDeal(id: string) {
  save(KEYS.activities, load<Activity[]>(KEYS.activities, []).filter(a=>a.dealId!==id));
  save(KEYS.tasks, getTasks().map(t=>t.dealId===id?{...t,dealId:undefined}:t));
  save(
    KEYS.deals,
    getDeals().filter((d) => d.id !== id)
  );
}

/** Re-inserts a deal exactly as it was (same id) — used to undo a delete.
 * Not exposed as a general "create with a specific id" API on purpose. */
export function restoreDeal(deal: Deal) {
  if (getDeal(deal.id)) return; // already there — nothing to restore
  save(KEYS.deals, [...getDeals(), deal]);
}

export function cloneDeal(id: string): Deal | undefined {
  const source = getDeal(id);
  if (!source) return undefined;
  const nowIso = new Date().toISOString();
  const clone: Deal = {
    ...source,
    id: uid("d"),
    title: `${source.title} (Copy)`,
    stage: "lead",
    receivedAt: nowIso,
    stageChangedAt: nowIso,
    proposalSentAt: undefined,
    lostReason: undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  save(KEYS.deals, [...getDeals(), clone]);
  logActivity(clone.id, "note", `Duplicated from "${source.title}"`);
  return clone;
}

// --- users --------------------------------------------------------------

export function getUsers(): User[] {
  return load(KEYS.users, SEED_USERS);
}

export function getUser(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function createUser(input: Omit<User, "id">): User {
  const user: User = { ...input, id: uid("u") };
  save(KEYS.users, [...getUsers(), user]);
  return user;
}

export function updateUser(id: string, patch: Partial<User>) {
  save(
    KEYS.users,
    getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u))
  );
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// --- activities ----------------------------------------------------------

export function getActivities(dealId: string): Activity[] {
  return load(KEYS.activities, [] as Activity[])
    .filter((a) => a.dealId === dealId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCompanyActivities(companyId: string): Activity[] {
  return load(KEYS.activities, [] as Activity[])
    .filter((a) => a.companyId === companyId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function logActivity(dealId: string, type: Activity["type"], body: string, userId = "system") {
  const activity: Activity = { id: uid("a"), dealId, type, body, userId, createdAt: new Date().toISOString() };
  const all = load<Activity[]>(KEYS.activities, []);
  save(KEYS.activities, [...all, activity]);
  return activity;
}

export function logCompanyActivity(companyId: string, type: Activity["type"], body: string, userId = "system") {
  const activity: Activity = { id: uid("a"), companyId, type, body, userId, createdAt: new Date().toISOString() };
  const all = load<Activity[]>(KEYS.activities, []);
  save(KEYS.activities, [...all, activity]);
  return activity;
}

/** Project-wide audit feed — every deal and company event, newest first. */
export function getAllActivities(): Activity[] {
  return load(KEYS.activities, [] as Activity[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- tasks / follow-ups --------------------------------------------------

export function getTasks(): Task[] {
  return load(KEYS.tasks, [] as Task[]);
}

export function createTask(input: Omit<Task, "id" | "createdAt" | "done">): Task {
  const task: Task = { ...input, id: uid("t"), done: false, createdAt: new Date().toISOString() };
  save(KEYS.tasks, [...getTasks(), task]);
  if (task.dealId) logActivity(task.dealId, "task", `Follow-up added: ${task.title}`);
  return task;
}

export function setTaskDone(id: string, done: boolean) {
  save(
    KEYS.tasks,
    getTasks().map((t) => (t.id === id ? { ...t, done } : t))
  );
}

export function deleteTask(id: string) {
  save(
    KEYS.tasks,
    getTasks().filter((t) => t.id !== id)
  );
}

// --- editable reference data: divisions & pipeline stages -----------------
// Divisions and stages ship as fixed seed data (src/lib/seed-data.ts) since
// their *keys* are wired into TypeScript unions used for colours, Kanban
// columns, and dashboard buckets throughout the app — turning those into
// fully dynamic data is a bigger change than "make Settings editable" calls
// for. What Settings actually needs to edit — a division's description and
// product-line list, a stage's label and win probability — is layered on
// top of the seed data as a small override map instead, so the existing
// keys/colours/columns keep working unmodified.

// Both getters below feed `useSyncExternalStore` (via `useCrm`) on Dashboard,
// Settings, KanbanBoard and Deals — which requires a *stable* reference back
// when nothing changed, or React sees "changed" on every render and loops
// forever (the same "Maximum update depth exceeded" class of bug fixed
// earlier for the main entity caches). `.map()`-ing a fresh array on every
// call breaks that guarantee just as badly as re-parsing JSON did, so the
// merged result is cached here too and only rebuilt when an override
// actually changes.
let cachedDivisions: Division[] | null = null;
let cachedStages: Stage[] | null = null;

export function getDivisions(): Division[] {
  if (cachedDivisions) return cachedDivisions;
  const overrides = load<Record<string, Partial<Division>>>(KEYS.divisionOverrides, {});
  cachedDivisions = DIVISIONS.map((d) => ({ ...d, ...overrides[d.key] }));
  return cachedDivisions;
}

export function updateDivisionMeta(key: DivisionKey, patch: Partial<Pick<Division, "description" | "productLines">>) {
  const overrides = load<Record<string, Partial<Division>>>(KEYS.divisionOverrides, {});
  cachedDivisions = null;
  save(KEYS.divisionOverrides, { ...overrides, [key]: { ...overrides[key], ...patch } });
}

export function getStagesLive(): Stage[] {
  if (cachedStages) return cachedStages;
  const overrides = load<Record<string, Partial<Stage>>>(KEYS.stageOverrides, {});
  cachedStages = STAGES.map((s) => ({ ...s, ...overrides[s.key] }));
  return cachedStages;
}

export function updateStageMeta(key: StageKey, patch: Partial<Pick<Stage, "label" | "probability">>) {
  const overrides = load<Record<string, Partial<Stage>>>(KEYS.stageOverrides, {});
  cachedStages = null;
  save(KEYS.stageOverrides, { ...overrides, [key]: { ...overrides[key], ...patch } });
}

export function exportCrmSnapshot() {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    users: getUsers(),
    companies: getCompanies(),
    contacts: getContacts(),
    deals: getDeals(),
    activities: getAllActivities(),
    tasks: getTasks(),
    divisionOverrides: load<Record<string, Partial<Division>>>(KEYS.divisionOverrides, {}),
    stageOverrides: load<Record<string, Partial<Stage>>>(KEYS.stageOverrides, {}),
  };
}

export { KEYS as STORAGE_KEYS };

export async function initializeRemoteStore(poll=false) {
 const data=await api("state");
 if(poll && (dirty || saving || blocked || document.querySelector('[role="dialog"]') || data.revision===remoteRevision))return;
 remoteReady=false;
 for(const name of ["users","companies","contacts","deals","activities","tasks","divisionOverrides","stageOverrides"] as const) {
   cache.set(KEYS[name],data.snapshot[name]);
 }
 replaceRemoteAttachments(data.snapshot.attachments);
 cachedDivisions=null;cachedStages=null;remoteRevision=data.revision;remoteReady=true;notify();
}
export function scheduleRemoteSave() {
 if(!hosted || !remoteReady || blocked)return;
 dirty=true;window.dispatchEvent(new CustomEvent("crm-save-status",{detail:"Saving changes…"}));
 clearTimeout(remoteTimer); remoteTimer=setTimeout(flushRemoteSave,250);
}
async function flushRemoteSave() {
 if(saving || !dirty || blocked)return;
 saving=true;dirty=false;
 try {
   const base=exportCrmSnapshot();
   const snapshot={...base,attachments:(await getAllAttachments()).filter(a=>base.deals.some(d=>d.id===a.dealId))};
   const data=await api("state",{revision:remoteRevision,snapshot}); remoteRevision=data.revision;
   window.dispatchEvent(new CustomEvent("crm-save-status",{detail:dirty?"Saving changes…":"All changes saved"}));
 } catch(e) {blocked=true;window.dispatchEvent(new CustomEvent("crm-save-status",{detail:(e as Error).message}));window.alert((e as Error).message + "\nPlease keep this tab open. Export your snapshot from Settings before reloading if you need to preserve unsaved changes.");}
 finally {saving=false;if(dirty && !blocked)void flushRemoteSave();}
}
window.addEventListener("beforeunload",e=>{if(hosted && (dirty || saving || blocked)){e.preventDefault();e.returnValue="";}});
if(hosted) setInterval(()=>{if(remoteReady && !saving && !dirty && !blocked && !document.querySelector('[role="dialog"]')) void initializeRemoteStore(true).catch(()=>{});},30000);
