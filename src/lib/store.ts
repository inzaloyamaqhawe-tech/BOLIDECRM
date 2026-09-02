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
seedIfEmpty();

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
  const nowIso = new Date().toISOString();
  const deal: Deal = { ...input, id: uid("d"), createdAt: nowIso, updatedAt: nowIso };
  save(KEYS.deals, [...getDeals(), deal]);
  logActivity(deal.id, "note", `Deal created: ${deal.title}`);
  return deal;
}

export function updateDeal(id: string, patch: Partial<Deal>) {
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

export { KEYS as STORAGE_KEYS };
