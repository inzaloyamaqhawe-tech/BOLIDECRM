import { companies as trackerCompanies, contacts as trackerContacts, deals as trackerDeals, datasetVersion } from "../data/lead-tracker.json";
import type { Company, Contact, Deal, Division, Stage, User, WholesalePackage } from "../types";

export const DIVISIONS: Division[] = [
  {
    key: "energy",
    name: "Bolide Energy",
    legalEntity: "Bolide Energy",
    color: "division-energy",
    description: "Solar & BESS (battery energy storage)",
    productLines: ["Solar PV", "BESS", "Hybrid Solar + BESS", "O&M"],
  },
  {
    key: "secure",
    name: "Bolide Secure",
    legalEntity: "Bolide Connect (Pty) Ltd",
    color: "division-secure",
    description: "AI security & monitoring",
    productLines: ["AI Surveillance", "Off-site Monitoring", "Access Control"],
  },
  {
    key: "connect",
    name: "Bolide Connect",
    legalEntity: "Bolide Connect (Pty) Ltd",
    color: "division-connect",
    description: "Connectivity resale (Herotel Business wholesale)",
    productLines: ["WTTB (Wireless)", "FTTB (Fibre)"],
  },
  {
    key: "water",
    name: "Bolide Water",
    legalEntity: "Bolide Water",
    color: "division-water",
    description: "Water solutions",
    productLines: ["Purification", "Borehole & Pumping", "Water Reuse", "Monitoring"],
  },
  {
    key: "saas",
    name: "Bolide SaaS",
    legalEntity: "Bolide SaaS",
    color: "division-saas",
    description: "Software products: BEAM and Concierge",
    productLines: ["BEAM", "Concierge"],
  },
];

export const STAGES: Stage[] = [
  { key: "lead", label: "Lead Received", description: "A new enquiry received and assigned. A proposal is due within seven working days.", probability: 10 },
  { key: "qualified", label: "Qualify/KYC Onboarding", description: "Confirm the client requirements, suitability and KYC onboarding information.", probability: 30 },
  { key: "quote", label: "Preliminary Proposal", description: "Initial scope and indicative pricing prepared and sent to the client.", probability: 50 },
  { key: "final_proposal", label: "Final Proposal", probability: 65, description: "Complete scope, commercial terms and final pricing sent for approval and signature." },
  { key: "negotiation", label: "Negotiation", description: "Discuss proposal terms, pricing and outstanding requirements with the client.", probability: 75 },
  { key: "won", label: "Won (Final Proposal Signed)", description: "The client has signed the final proposal and accepted the deal.", probability: 100 },
  { key: "lost", label: "Lost", description: "The opportunity did not proceed. A reason is required so the team can learn from the outcome.", probability: 0 },
];

export const SEED_USERS: User[] = import.meta.env.BASE_URL === "/crm/" ? [] : [
  { id: "u-khudusela", name: "Khudusela Pitje", email: "khudu.pitje@newgx.co.za", passwordHash: "", role: "admin" },
  { id: "u-ravani", name: "Ravani Reddi", email: "ravani@newgx.co.za", passwordHash: "", role: "rep" },
  { id: "u-suhail", name: "Suhail Asvat", email: "suhail@airnergize.co.za", passwordHash: "", role: "rep" },
  { id: "u-langelihle", name: "Langelihle Ngidi", email: "langelihle@bolide.co.za", passwordHash: "", role: "admin" },
  { id: "u-gianna", name: "Gianna de Figueiredo", email: "gianna@bolide.co.za", passwordHash: "", role: "rep" },
  { id: "u-herman", name: "Herman Ras", email: "herman@bolide.co.za", passwordHash: "", role: "rep" },
  { id: "u-welcome", name: "Welcome Nyathi", email: "welcome@bolide.co.za", passwordHash: "", role: "rep" },
];

export const PREVIEW_DATASET_VERSION = datasetVersion;
export const SEED_COMPANIES: Company[] = import.meta.env.BASE_URL === "/crm/" ? [] : trackerCompanies as Company[];
export const SEED_CONTACTS: Contact[] = import.meta.env.BASE_URL === "/crm/" ? [] : trackerContacts as Contact[];
export const SEED_DEALS: Deal[] = import.meta.env.BASE_URL === "/crm/" ? [] : trackerDeals as Deal[];

export const WHOLESALE_CATALOGUE: WholesalePackage[] = [
  { package: "HB WTTB 6/6", family: "WTTB", access: "PTMP", nrc: 3478, m12: 1599, m24: 1099, m36: 999, m48: null, m60: null },
  { package: "HB WTTB 10/10", family: "WTTB", access: "PTMP", nrc: 3478, m12: 2199, m24: 1799, m36: 1649, m48: null, m60: null },
  { package: "HB WTTB 20/20", family: "WTTB", access: "PTP", nrc: 4783, m12: 3399, m24: 2949, m36: 2699, m48: null, m60: null },
  { package: "HB WTTB 30/30", family: "WTTB", access: "PTP", nrc: 4783, m12: 4149, m24: 3849, m36: 3599, m48: null, m60: null },
  { package: "HB WTTB 50/50", family: "WTTB", access: "PTP", nrc: 4783, m12: 6499, m24: 5999, m36: 5499, m48: null, m60: null },
  { package: "HB WTTB 100/100", family: "WTTB", access: "PTP", nrc: 4783, m12: 10049, m24: 9349, m36: 8399, m48: null, m60: null },
  { package: "HB WTTB 200/200", family: "WTTB", access: "PTP", nrc: 6956, m12: 15199, m24: 14199, m36: 13199, m48: null, m60: null },
  { package: "HB FTTB 20Mbps", family: "FTTB", access: "—", nrc: 2174, m12: 949, m24: 899, m36: 849, m48: 799, m60: 749 },
  { package: "HB FTTB 50Mbps", family: "FTTB", access: "—", nrc: 2174, m12: 1199, m24: 1049, m36: 999, m48: 899, m60: 849 },
  { package: "HB FTTB 100Mbps", family: "FTTB", access: "—", nrc: 2174, m12: 1699, m24: 1499, m36: 1399, m48: 1349, m60: 1299 },
  { package: "HB FTTB 200Mbps", family: "FTTB", access: "—", nrc: 2174, m12: 2599, m24: 2449, m36: 2349, m48: 2299, m60: 2249 },
  { package: "HB FTTB 500Mbps", family: "FTTB", access: "—", nrc: 2174, m12: 3399, m24: 3199, m36: 3099, m48: 3049, m60: 2999 },
  { package: "HB FTTB 1Gbps", family: "FTTB", access: "—", nrc: 2174, m12: 5099, m24: 4899, m36: 4799, m48: 4749, m60: 4699 },
];
