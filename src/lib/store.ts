import type { Activity, Company, Contact, Deal, StageKey, User } from "../types";
import { SEED_COMPANIES, SEED_DEALS, SEED_USERS } from "./seed-data";

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
  return () => listeners.delete(listener);
}

function seedIfEmpty() {
  if (!localStorage.getItem(KEYS.companies)) save(KEYS.companies, SEED_COMPANIES);
  if (!localStorage.getItem(KEYS.contacts)) save(KEYS.contacts, [] as Contact[]);
  if (!localStorage.getItem(KEYS.deals)) save(KEYS.deals, SEED_DEALS);
  if (!localStorage.getItem(KEYS.users)) save(KEYS.users, SEED_USERS);
  if (!localStorage.getItem(KEYS.activities)) save(KEYS.activities, [] as Activity[]);
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

export function logActivity(dealId: string, type: Activity["type"], body: string, userId = "system") {
  const activity: Activity = { id: uid("a"), dealId, type, body, userId, createdAt: new Date().toISOString() };
  const all = load<Activity[]>(KEYS.activities, []);
  save(KEYS.activities, [...all, activity]);
  return activity;
}

export function getAllActivities(): Activity[] {
  return load(KEYS.activities, [] as Activity[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export { KEYS as STORAGE_KEYS };
