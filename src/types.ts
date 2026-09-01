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
  secureDetails?: SecureDealDetails;
  energyDetails?: EnergyDealDetails;
  waterDetails?: WaterDealDetails;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export type ActivityType = "note" | "call" | "task" | "stage-change";

export interface Activity {
  id: string;
  dealId: string;
  type: ActivityType;
  body: string;
  userId: string;
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
