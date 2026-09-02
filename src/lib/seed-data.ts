import type { Company, Deal, Division, Stage, User, WholesalePackage } from "../types";

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
  { key: "lead", label: "Lead", probability: 10 },
  { key: "qualified", label: "Qualified", probability: 30 },
  { key: "quote", label: "Quote", probability: 50 },
  { key: "negotiation", label: "Negotiation", probability: 75 },
  { key: "won", label: "Won", probability: 100 },
  { key: "lost", label: "Lost", probability: 0 },
];

export const SEED_USERS: User[] = [
  { id: "u-khudusela", name: "Khudusela Pitje", email: "khudu.pitje@newgx.co.za", passwordHash: "", role: "admin" },
  { id: "u-ravani", name: "Ravani Reddi", email: "ravani@newgx.co.za", passwordHash: "", role: "rep" },
  { id: "u-suhail", name: "Suhail Asvat", email: "suhail@airnergize.co.za", passwordHash: "", role: "rep" },
  { id: "u-langelihle", name: "Langelihle Ngidi", email: "langa@bolide.co.za", passwordHash: "", role: "admin" },
  { id: "u-gianna", name: "Gianna de Figueiredo", email: "gianna@bolide.co.za", passwordHash: "", role: "rep" },
];

export const SEED_COMPANIES: Company[] = [
  { id: "c-aj", name: "AJ Properties", industry: "Property & Security", status: "Prospect", divisions: ["secure"], createdAt: "2026-02-01" },
  { id: "c-alt", name: "ALT Capital Partners", industry: "Property & Security", status: "Prospect", divisions: ["secure", "energy", "water"], createdAt: "2026-02-01" },
  { id: "c-bp", name: "BP", industry: "Fuel retail", status: "Prospect", divisions: ["connect"], createdAt: "2026-02-01" },
  { id: "c-bpkew", name: "BP Kew", industry: "Fuel retail", status: "Prospect", divisions: ["energy"], createdAt: "2026-02-01" },
  { id: "c-liz", name: "Lizhakandila", industry: "Retail & Fuel", status: "Prospect", divisions: ["secure"], createdAt: "2026-02-01" },
  { id: "c-newgx", name: "NewGx", industry: "Waste Management", status: "Prospect", divisions: ["secure"], createdAt: "2026-02-01" },
  { id: "c-sasol", name: "Sasol", industry: "Fuel retail", status: "Prospect", divisions: ["connect"], createdAt: "2026-02-01" },
];

const now = new Date().toISOString();

export const SEED_DEALS: Deal[] = [
  // Lead — Bolide Connect (sites TBC)
  { id: "d-1", title: "Sasol — Connectivity (sites TBC)", companyId: "c-sasol", division: "connect", productLine: "Herotel Business", stage: "lead", onceOff: 0, mrr: 0, ownerId: "u-langelihle", createdAt: now, updatedAt: now },
  { id: "d-2", title: "BP — Connectivity (sites TBC)", companyId: "c-bp", division: "connect", productLine: "Herotel Business", stage: "lead", onceOff: 0, mrr: 0, ownerId: "u-langelihle", createdAt: now, updatedAt: now },
  { id: "d-3", title: "AJ Properties — Connectivity (site TBC)", companyId: "c-aj", division: "connect", productLine: "Herotel Business", stage: "lead", onceOff: 0, mrr: 0, ownerId: "u-langelihle", createdAt: now, updatedAt: now },
  { id: "d-4", title: "NewGx — Connectivity (site TBC)", companyId: "c-newgx", division: "connect", productLine: "Herotel Business", stage: "lead", onceOff: 0, mrr: 0, ownerId: "u-ravani", createdAt: now, updatedAt: now },

  // Quote — Secure
  { id: "d-5", title: "Lizhakandila — Molepo Mall", companyId: "c-liz", site: "Molepo Mall", division: "secure", stage: "quote", onceOff: 1586524, mrr: 20150, ownerId: "u-suhail", closeDate: "2026-02-26", secureDetails: { camerasInstalled: 81, camerasMonitored: 23 }, createdAt: now, updatedAt: now },
  { id: "d-6", title: "AJ — Inanda (Ikhwani)", companyId: "c-aj", site: "Inanda (Ikhwani)", division: "secure", stage: "quote", onceOff: 197351, mrr: 18600, ownerId: "u-suhail", closeDate: "2026-05-13", secureDetails: { camerasInstalled: 20, camerasMonitored: 20 }, createdAt: now, updatedAt: now },
  { id: "d-7", title: "AJ — Kingsburgh", companyId: "c-aj", site: "Kingsburgh", division: "secure", stage: "quote", onceOff: 298022, mrr: 18500, ownerId: "u-suhail", secureDetails: { camerasInstalled: 20, camerasMonitored: 20 }, createdAt: now, updatedAt: now },
  { id: "d-8", title: "ALT — Erica Square", companyId: "c-alt", site: "Erica Square", division: "secure", stage: "quote", onceOff: 405584, mrr: 18500, ownerId: "u-gianna", secureDetails: { camerasInstalled: 22, camerasMonitored: 22 }, createdAt: now, updatedAt: now },
  { id: "d-9", title: "Lizhakandila — Engen Tsakane", companyId: "c-liz", site: "Engen Tsakane", division: "secure", stage: "quote", onceOff: 33892, mrr: 9870, ownerId: "u-suhail", secureDetails: { camerasInstalled: 8, camerasMonitored: 8 }, createdAt: now, updatedAt: now },
  { id: "d-10", title: "NewGx — Skipwaste", companyId: "c-newgx", site: "Skipwaste", division: "secure", stage: "quote", onceOff: 407768, mrr: 18600, ownerId: "u-ravani", secureDetails: { camerasInstalled: 20, camerasMonitored: 20 }, createdAt: now, updatedAt: now },

  // Quote — Energy
  { id: "d-11", title: "ALT — Piet Retief Shopping Centre", companyId: "c-alt", site: "Piet Retief Shopping Centre", division: "energy", segment: "Commercial", productLine: "Hybrid Solar + BESS", stage: "quote", onceOff: 13300000, mrr: 0, ownerId: "u-gianna", energyDetails: { solarKwp: 695, bessKwh: 800, ratePerKwh: 1.91 }, createdAt: now, updatedAt: now },
  { id: "d-12", title: "ALT — Ganyesa", companyId: "c-alt", site: "Ganyesa", division: "energy", segment: "Commercial", productLine: "Hybrid Solar + BESS", stage: "quote", onceOff: 3030000, mrr: 0, ownerId: "u-gianna", energyDetails: { solarKwp: 250, bessKwh: 300, ratePerKwh: 1.59 }, createdAt: now, updatedAt: now },
  { id: "d-13", title: "ALT — Ekuphumleni (Kenton)", companyId: "c-alt", site: "Ekuphumleni (Kenton)", division: "energy", segment: "Commercial", productLine: "Hybrid Solar + BESS", stage: "quote", onceOff: 4230000, mrr: 0, ownerId: "u-gianna", energyDetails: { solarKwp: 150, bessKwh: 360, ratePerKwh: 1.68 }, createdAt: now, updatedAt: now },
  { id: "d-14", title: "BP Kew (forecourt)", companyId: "c-bpkew", site: "BP Kew", division: "energy", segment: "Forecourt", productLine: "Solar PV", stage: "quote", onceOff: 640000, mrr: 0, ownerId: "u-khudusela", energyDetails: { solarKwp: 36, ratePerKwh: 2.42 }, createdAt: now, updatedAt: now },

  // Quote — Water
  { id: "d-15", title: "ALT — Erica Square (Water Treatment Plant)", companyId: "c-alt", site: "Erica Square", division: "water", stage: "quote", onceOff: 1100000, mrr: 0, ownerId: "u-khudusela", createdAt: now, updatedAt: now },

  // Quote — extra to round out pipeline
  { id: "d-16", title: "AJ — Berea", companyId: "c-aj", site: "Berea", division: "secure", stage: "quote", onceOff: 224000, mrr: 0, ownerId: "u-suhail", secureDetails: { camerasInstalled: 16, camerasMonitored: 16 }, createdAt: now, updatedAt: now },
];

/** Herotel Business wholesale catalogue — cost prices Bolide pays, ZAR excl. VAT.
 * NRC = once-off, MRC = per month. */
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
