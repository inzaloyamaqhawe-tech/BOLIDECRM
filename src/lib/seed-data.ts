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
  { id: "u-herman", name: "Herman Ras", email: "herman@bolide.co.za", passwordHash: "", role: "rep" },
  { id: "u-welcome", name: "Welcome Nyathi", email: "welcome@bolide.co.za", passwordHash: "", role: "rep" },
];

export const SEED_COMPANIES: Company[] = [
  { id: "c-aj", name: "AJ Properties", industry: "Property & Security", status: "Prospect", divisions: ["secure"], createdAt: "2026-02-01" },
  { id: "c-alt", name: "ALT Capital Partners", industry: "Property & Security", status: "Prospect", divisions: ["secure", "energy", "water"], createdAt: "2026-02-01" },
  { id: "c-bp", name: "BP", industry: "Fuel retail", status: "Prospect", divisions: ["connect"], createdAt: "2026-02-01" },
  { id: "c-bpkew", name: "BP Kew", industry: "Fuel retail", status: "Prospect", divisions: ["energy"], createdAt: "2026-02-01" },
  { id: "c-liz", name: "Lizhakandila", industry: "Retail & Fuel", status: "Prospect", divisions: ["secure"], createdAt: "2026-02-01" },
  { id: "c-newgx", name: "NewGx", industry: "Waste Management", status: "Prospect", divisions: ["secure"], createdAt: "2026-02-01" },
  { id: "c-sasol", name: "Sasol", industry: "Fuel retail", status: "Prospect", divisions: ["connect", "energy"], createdAt: "2026-02-01" },
  // Energy prospects from the client's own "Lead Tracker v1.xlsx" (Sep 2026) — see SEED_DEALS below.
  { id: "c-founder-hill-crescent", name: "Founder Hill Crescent", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-villa-carla-complex", name: "Villa Carla Complex", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-232-sir-lowrie", name: "232 Sir Lowrie", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-orient-islamic-school", name: "Orient Islamic School", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-dante-alighieri-society", name: "Dante Alighieri Society", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-supahot", name: "Supahot", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-soethe-inval", name: "Soethe Inval", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-170-grosvenor", name: "170 Grosvenor", industry: "Energy prospect", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
  { id: "c-pic", name: "PIC", industry: "Property & Investment", status: "Prospect", divisions: ["energy"], createdAt: "2026-09-15" },
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

  // Energy — real pipeline from the client's own "Lead Tracker v1.xlsx" (Sep 2026),
  // replacing the earlier placeholder Energy deals. Stage is inferred from the
  // sheet's Approved/Proposal Sent columns (Declined/"Closed..." -> lost,
  // Approved -> negotiation, proposal sent with a date -> quote, "Pending Send"
  // -> qualified, otherwise lead); Owner is the sheet's Assigned Engineer.
  { id: "d-e1", title: "Founder Hill Crescent", companyId: "c-founder-hill-crescent", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 0, mrr: 0, ownerId: "u-welcome", notes: "Lead originator: Matt Koller · Lead maturity: Medium · Source/partner: Fungi", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e2", title: "Sasol — Sasol Chiawelo", companyId: "c-sasol", site: "Sasol Chiawelo", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 0, mrr: 0, ownerId: "u-welcome", notes: "Lead originator: Welcome Nyathi · Lead maturity: Medium", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e3", title: "Sasol — Sasol La Belle", companyId: "c-sasol", site: "Sasol La Belle", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 0, mrr: 0, ownerId: "u-welcome", notes: "Lead originator: Khudu Pitje · Lead maturity: Medium", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e4", title: "Sasol — Sasol King Shaka", companyId: "c-sasol", site: "Sasol King Shaka", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 0, mrr: 0, ownerId: "u-welcome", notes: "Lead originator: Khudu Pitje · Lead maturity: Medium", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e5", title: "Villa Carla Complex", companyId: "c-villa-carla-complex", division: "energy", segment: "Commercial", productLine: "Solar", stage: "lost", onceOff: 0, mrr: 0, ownerId: "u-herman", notes: "Lead originator: Welcome Nyathi · Lead maturity: Low · Source/partner: Fungi", lostReason: "Closed No client commitment (Herman)", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e6", title: "Sasol — Sasol Raceway", companyId: "c-sasol", site: "Sasol Raceway", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 2180329, mrr: 0, ownerId: "u-welcome", closeDate: "2026-10-31", notes: "Lead originator: Khudu Pitje · Lead maturity: Medium", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-10-31", operationsStartDate: "2027-01-31", capexPpa: 1472891, capexRental: 707438, ppaIrr: 20.0, rentalIrr: 20.01 }, createdAt: now, updatedAt: now },
  { id: "d-e7", title: "232 Sir Lowrie", companyId: "c-232-sir-lowrie", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 0, mrr: 0, ownerId: "u-welcome", notes: "Lead originator: Matt Koller · Lead maturity: Medium · Source/partner: Fungi", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e8", title: "Orient Islamic School", companyId: "c-orient-islamic-school", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 3657407, mrr: 0, ownerId: "u-herman", closeDate: "2026-09-30", notes: "Lead originator: Suhail Asvat · Lead maturity: Medium · Source/partner: Business Development", financingDetails: { bankModelStatus: "Modelled", operationsStartDate: "2026-09-30", capexPpa: 2345429, capexRental: 1311978, ppaIrr: 20.02, rentalIrr: 20.19 }, createdAt: now, updatedAt: now },
  { id: "d-e9", title: "Dante Alighieri Society", companyId: "c-dante-alighieri-society", division: "energy", segment: "Commercial", productLine: "Solar", stage: "lost", onceOff: 0, mrr: 0, ownerId: "u-herman", notes: "Lead originator: Kgomotso Moloantoa · Lead maturity: Medium · Source/partner: Business Development", lostReason: "Declined during financing/credit review", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e10", title: "Supahot", companyId: "c-supahot", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 17010759, mrr: 0, ownerId: "u-herman", closeDate: "2026-06-30", notes: "Lead originator: Suhail Asvat · Lead maturity: Medium · Source/partner: Business Development", financingDetails: { bankModelStatus: "Not Modelled", operationsStartDate: "2026-06-30", capexPpa: 17010759, ppaIrr: 19.0 }, createdAt: now, updatedAt: now },
  { id: "d-e11", title: "Soethe Inval", companyId: "c-soethe-inval", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 0, mrr: 0, ownerId: "u-herman", notes: "Lead originator: Khudu Pitje · Lead maturity: Medium · Source/partner: Business Development", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e12", title: "Sasol — Sasol Sebenzile", companyId: "c-sasol", site: "Sasol Sebenzile", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 1662030, mrr: 0, ownerId: "u-welcome", closeDate: "2026-09-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-09-30", operationsStartDate: "2026-11-30", capexPpa: 1090878, capexRental: 571152, ppaIrr: 19.04, rentalIrr: 19.33 }, createdAt: now, updatedAt: now },
  { id: "d-e13", title: "Sasol — BP Kew", companyId: "c-sasol", site: "BP Kew", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 1541526, mrr: 0, ownerId: "u-welcome", closeDate: "2026-09-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-09-30", operationsStartDate: "2026-11-30", capexPpa: 1022434, capexRental: 519092, ppaIrr: 21.19, rentalIrr: 20.92 }, createdAt: now, updatedAt: now },
  { id: "d-e14", title: "170 Grosvenor", companyId: "c-170-grosvenor", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 0, mrr: 0, ownerId: "u-welcome", notes: "Lead originator: Welcome Nyathi · Lead maturity: Medium · Source/partner: Business Development", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e15", title: "Sasol — Astron Klipspruit", companyId: "c-sasol", site: "Astron Klipspruit", division: "energy", segment: "Commercial", productLine: "Solar", stage: "lead", onceOff: 791621, mrr: 0, ownerId: "u-welcome", closeDate: "2026-09-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-09-30", operationsStartDate: "2026-11-30", capexPpa: 791621, ppaIrr: 0 }, createdAt: now, updatedAt: now },
  { id: "d-e16", title: "PIC — Central City", companyId: "c-pic", site: "Central City", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 25000, mrr: 0, ownerId: "u-herman", closeDate: "2026-11-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-30", operationsStartDate: "2027-02-28", capexPpa: 25000, ppaIrr: 24.66, rentalIrr: 0 }, createdAt: now, updatedAt: now },
  { id: "d-e17", title: "PIC — BCX", companyId: "c-pic", site: "BCX", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 0, mrr: 0, ownerId: "u-herman", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e18", title: "PIC — Woodmead SARS", companyId: "c-pic", site: "Woodmead SARS", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 25000, mrr: 0, ownerId: "u-herman", closeDate: "2026-11-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-30", operationsStartDate: "2027-02-28", capexPpa: 25000, ppaIrr: 20.33, rentalIrr: 26.08 }, createdAt: now, updatedAt: now },
  { id: "d-e19", title: "PIC — Palm Grove", companyId: "c-pic", site: "Palm Grove", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 25000, mrr: 0, ownerId: "u-herman", closeDate: "2026-11-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-30", operationsStartDate: "2027-03-31", capexPpa: 25000, ppaIrr: 21.21, rentalIrr: 23.44 }, createdAt: now, updatedAt: now },
  { id: "d-e20", title: "PIC — Garankuwa", companyId: "c-pic", site: "Garankuwa", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 10212718, mrr: 0, ownerId: "u-herman", closeDate: "2026-11-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-30", operationsStartDate: "2027-02-28", capexPpa: 10212718, ppaIrr: 24.25, rentalIrr: 23.91 }, createdAt: now, updatedAt: now },
  { id: "d-e21", title: "PIC — Melvern", companyId: "c-pic", site: "Melvern", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 25000, mrr: 0, ownerId: "u-herman", closeDate: "2026-11-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-30", operationsStartDate: "2027-03-31", capexPpa: 25000, ppaIrr: 19.85, rentalIrr: 26.08 }, createdAt: now, updatedAt: now },
  { id: "d-e22", title: "PIC — Kasteel Park", companyId: "c-pic", site: "Kasteel Park", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 4166195, mrr: 0, ownerId: "u-herman", closeDate: "2026-11-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-30", operationsStartDate: "2027-03-31", capexPpa: 4166195, ppaIrr: 23.81, rentalIrr: 23.44 }, createdAt: now, updatedAt: now },
  { id: "d-e23", title: "ALT — Amsterdam", companyId: "c-alt", site: "Amsterdam", division: "energy", segment: "Commercial", productLine: "Solar", stage: "negotiation", onceOff: 25000, mrr: 0, ownerId: "u-welcome", closeDate: "2026-06-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-06-30", operationsStartDate: "2026-08-31", capexPpa: 25000, ppaIrr: 24.43, rentalIrr: 25.05 }, createdAt: now, updatedAt: now },
  { id: "d-e24", title: "ALT — Piet Retief", companyId: "c-alt", site: "Piet Retief", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 12179751, mrr: 0, ownerId: "u-welcome", closeDate: "2026-11-01", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-01", operationsStartDate: "2026-12-01", capexPpa: 8452987, capexRental: 3726764, ppaIrr: 22.02, rentalIrr: 30.14 }, createdAt: now, updatedAt: now },
  { id: "d-e25", title: "ALT — Ekhuphumleni", companyId: "c-alt", site: "Ekhuphumleni", division: "energy", segment: "Commercial", productLine: "Solar", stage: "quote", onceOff: 4226250, mrr: 0, ownerId: "u-welcome", closeDate: "2026-06-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-06-30", operationsStartDate: "2026-07-31", capexPpa: 1601250, capexRental: 2625000, ppaIrr: 21.98, rentalIrr: 22.0 }, createdAt: now, updatedAt: now },
  { id: "d-e26", title: "ALT — Ngqamakwe", companyId: "c-alt", site: "Ngqamakwe", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 10024063, mrr: 0, ownerId: "u-herman", closeDate: "2026-11-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-30", operationsStartDate: "2026-12-31", capexPpa: 6016129, capexRental: 4007934, ppaIrr: 22.32, rentalIrr: 21.62 }, createdAt: now, updatedAt: now },
  { id: "d-e27", title: "ALT — Arcon Park", companyId: "c-alt", site: "Arcon Park", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 0, mrr: 0, ownerId: "u-welcome", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Not Modelled" }, createdAt: now, updatedAt: now },
  { id: "d-e28", title: "ALT — Welkom", companyId: "c-alt", site: "Welkom", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 6069128, mrr: 0, ownerId: "u-welcome", closeDate: "2026-03-31", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-03-31", operationsStartDate: "2026-05-31", capexPpa: 4874462, capexRental: 1194666, rentalIrr: 18.11 }, createdAt: now, updatedAt: now },
  { id: "d-e29", title: "ALT — Harrismith", companyId: "c-alt", site: "Harrismith", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 0, mrr: 0, ownerId: "u-welcome", closeDate: "2026-11-01", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-11-01", operationsStartDate: "2026-12-01", ppaIrr: 23.0 }, createdAt: now, updatedAt: now },
  { id: "d-e30", title: "ALT — Inanda", companyId: "c-alt", site: "Inanda", division: "energy", segment: "Commercial", productLine: "Solar", stage: "qualified", onceOff: 3255210, mrr: 0, ownerId: "u-welcome", closeDate: "2026-09-30", notes: "Lead originator: Khudu Pitje · Lead maturity: High", financingDetails: { bankModelStatus: "Modelled", contractSignatureDate: "2026-09-30", operationsStartDate: "2026-12-31", capexPpa: 3255210, ppaIrr: 20.12 }, createdAt: now, updatedAt: now },

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
