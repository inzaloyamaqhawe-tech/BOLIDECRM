/**
 * Bolide CRM — core data model.
 *
 * This file is the single source of truth for the CRM's shape. It's written
 * to look like a real backend schema (not just view-model props) on purpose:
 * the plan is to swap `src/lib/store.ts` (currently backed by localStorage)
 * for real API calls against a hosted database without touching any
 * component code, and to reuse these same shapes when the Shopfront starts
 * handing quote requests to the CRM.
 */

export type DivisionKey = "energy" | "secure" | "connect" | "water" | "saas";

export interface Division {
  key: DivisionKey;
  name: string;
  legalEntity: string;
  color: string; // tailwind color token, e.g. "division-energy"
  description: string;
  productLines: string[];
}

export type StageKey = "lead" | "qualified" | "quote" | "negotiation" | "won" | "lost";

export interface Stage {
  key: StageKey;
  label: string;
  probability: number; // 0-100
}

export type Segment = "Commercial" | "Industrial" | "Forecourt" | "MDU";

export type CompanyStatus = "Prospect" | "Customer" | "Churned";

export interface Company {
  id: string;
  name: string;
  industry: string;
  status: CompanyStatus;
  divisions: DivisionKey[];
  website?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  createdAt: string;
}

/** Division-specific line items captured per deal — kept optional/typed loosely
 * so new divisions can add fields without a migration. */
export interface SecureDealDetails {
  camerasInstalled?: number;
  camerasMonitored?: number;
}

export interface EnergyDealDetails {
  solarKwp?: number;
  bessKwh?: number;
  ratePerKwh?: number;
}

export interface WaterDealDetails {
  litresPerDay?: number;
}

export interface Deal {
  id: string;
  title: string;
  companyId: string;
  primaryContactId?: string;
  site?: string;
  division: DivisionKey;
  segment?: Segment;
  productLine?: string;
  stage: StageKey;
  onceOff: number; // ZAR, excl. VAT
  mrr: number; // ZAR / month, excl. VAT
  ownerId: string;
  closeDate?: string; // ISO date
  notes?: string;
  /** Only meaningful once stage === "lost" — captured at the moment it's lost
   * so a reason isn't just implied by the deal quietly disappearing. */
  lostReason?: string;
  secureDetails?: SecureDealDetails;
  energyDetails?: EnergyDealDetails;
  waterDetails?: WaterDealDetails;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "rep";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export type ActivityType = "note" | "call" | "task" | "stage-change" | "update" | "system";

/** An audit-trail entry. Most are tied to a deal (`dealId`); a few — like
 * merging two companies — are tied to a company instead (`companyId`).
 * `getAllActivities()` is the project-wide feed either way. */
export interface Activity {
  id: string;
  dealId?: string;
  companyId?: string;
  type: ActivityType;
  body: string;
  userId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string; // ISO date
  dealId?: string;
  done: boolean;
  createdAt: string;
}

/** A file attached to a deal (quote PDF, contract, photo). Stored as a data
 * URL — fine at the size a browser's storage can hold, and it's the only
 * option without a backend to upload to. */
export interface Attachment {
  id: string;
  dealId: string;
  filename: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  createdAt: string;
}

/** Herotel Business wholesale catalogue — reference pricing Bolide Connect pays,
 * shown read-only under Settings. */
export interface WholesalePackage {
  package: string;
  family: "WTTB" | "FTTB";
  access: "PTMP" | "PTP" | "—";
  nrc: number;
  m12: number | null;
  m24: number | null;
  m36: number | null;
  m48: number | null;
  m60: number | null;
}

export const ALLOWED_EMAIL_DOMAINS = ["bolide.co.za", "airnergize.co.za", "newgx.co.za"] as const;

export const arr = (mrr: number) => mrr * 12;
