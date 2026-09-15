# Bolide CRM

Internal pipeline/deals CRM for the Bolide Group (Energy, Secure, Connect, Water, SaaS
divisions), rebuilt from the earlier Lovable prototype with the two review rounds'
feedback folded in. React + TypeScript + Vite, no backend required to run it.

```
npm install
npm run dev
```

Sign-up is restricted to `@bolide.co.za`, `@airnergize.co.za` and `@newgx.co.za`
addresses (matches the reference app's Settings → Access list).

## What changed from the reviewed version

- **"Add New Deal" now works.** The button opens a real modal (`DealModal`)
  that creates a deal and drops it straight into the Pipeline/Deals lists.
- **Pipeline cards are clickable, not just draggable.** Clicking a card opens
  the same detail modal used from the Deals table — customer, site, product
  line, pricing, division-specific fields (cameras/solar/etc.) — so a quote
  can be reviewed before it's dragged into Negotiation.
- **Search is live/predictive.** `GlobalSearch` filters deals, companies and
  contacts on every keystroke instead of waiting for a full term.
- **Owner filter is a searchable dropdown** (`OwnerFilterDropdown`), default
  "Everyone", instead of one button per teammate — stays usable as the team
  grows past five people.
- **Confirm password on sign-up**, with a live match/mismatch indicator,
  so a typo doesn't silently lock someone out of the account they just made.
- **Bolide branding**: the real Bolide Tanzania wordmark (shared asset with
  the Shopfront) is used in the sidebar, top bar and auth screens, and the
  brand gradient/colour tokens match the Shopfront's `--gradient-brand`
  exactly (see `src/index.css`).
- **Settings is now real reference data**, not placeholders: the five
  divisions and their product lines, the Herotel Business wholesale
  catalogue (cost prices Bolide pays), pipeline stage probabilities, and the
  actual team list all come from `src/lib/seed-data.ts`.

## Fourth round — scalable lists (search + pagination everywhere)

- **Tasks' "linked deal" picker is now a searchable dropdown**
  (`DealPickerDropdown`), not a native `<select>` — a plain option list of
  every deal stops being usable once there are hundreds/thousands of them
  (the client's own Lead Tracker is already close to that), and a native
  select can render itself *above* the trigger depending on scroll position.
  This one always opens downward and filters as you type.
- **Contacts now has live search** (name, email, role, company) — it had
  none before, unlike Deals which already searched deal/site/company.
- **Deals and Contacts both paginate**, default 25 rows, adjustable to
  10/50/100 (`src/components/Pagination.tsx`) — rendering every row
  unpaginated was fine at seed-data scale but won't be once real pipeline
  data accumulates.

## Third round — delete function, Product Line dropdown, financing fields

- **Delete is no longer admin-gated.** Client feedback (email, Sep 2026) was
  that they couldn't delete from Pipeline — the earlier admin-only
  restriction was our own scope call, not something they'd asked for. Any
  logged-in user can now delete a deal, from the modal, a one-click icon on
  a Pipeline card, or a row/bulk action on the Deals table.
- **Product Line is a fixed dropdown**: Water, Security, Solar, Fibre — no
  longer free text against a division's suggested list. An existing deal
  whose value doesn't match one of the four (e.g. seed data's "Hybrid Solar
  + BESS") shows as a "(legacy)" option rather than disappearing.
- **Primary contact is now a plain typed name** (`Deal.primaryContactName`),
  not a dropdown requiring a full Contact record (with an email) to exist
  first — client just wants to type who they're dealing with.
- **New Financing fields on Energy deals**, matching the client's own Lead
  Tracker spreadsheet columns: Bank Model Status (Modelled/Not Modelled),
  Contract Signature Date, Operations Start Date, Capex – PPA, Capex –
  Rental, PPA IRR, Rental IRR. Shown alongside the existing Energy-specific
  fields when a deal's division is Energy.
- **Herman Ras and Welcome Nyathi added as owners** (Engineering team,
  matching their existing spreadsheet's "Assigned Engineer" column). Because
  `SEED_USERS` only seeds a brand-new/empty store, `store.ts` now also runs
  a small one-time migration on every load that back-fills any seed user
  missing from an *existing* saved user list — otherwise a team member added
  here later would never show up for someone already using the CRM.

## Second round — deal workflow, admin/rep roles, and polish

- **Notes & activity feed on a deal** — a deal modal now has a live notes
  thread (`logActivity`, previously built but never wired to any UI) plus
  every stage change, edit, and duplication logs itself automatically. A
  project-wide version of the same feed lives under Settings → Activity log.
- **Lost-reason capture** — moving a deal to Lost (from the modal *or* by
  dragging it on the Pipeline board) now requires a short reason before it's
  accepted, instead of the deal just quietly disappearing from view.
- **Duplicate deal** — clones a deal (fresh id, reset to Lead) for a
  near-identical site under the same or a different client.
- **File attachments** — quotes/contracts attach directly to a deal, stored
  in IndexedDB (`src/lib/attachments.ts`) rather than `localStorage`, since a
  scanned PDF would blow through localStorage's ~5-10MB quota fast.
- **Bulk actions on the Deals table** — select rows, bulk-change stage or
  owner, export just the selection to CSV.
- **Company detail page** (`/companies/:id`) — a company's full deal list,
  contacts, and company-level activity, instead of cards-only with no
  drill-down.
- **Duplicate-company protection** — typing a company name close to (but not
  exactly matching) an existing one now surfaces a "Did you mean…?" nudge
  before it creates a near-duplicate record; a "Merge duplicates" tool on the
  Companies page folds an accidental duplicate's deals/contacts back into one.
- **A deal's primary contact** is now a real field (`Deal.primaryContactId`),
  not just "someone at that company."
- **Divisions, product lines, and pipeline stages are editable** from
  Settings (admins only) — a small persisted override layer on top of the
  seed data, so the existing division/stage *keys* (wired into colours,
  Kanban columns, dashboard buckets) stay stable while their labels,
  descriptions, product lines, and win probabilities can change.
- **Admin/rep roles** — a first pass at permissions. Deleting a deal and
  editing Settings reference data are admin-only; this is enforced in the UI
  only (there's no backend yet to enforce it server-side — see Known
  limitations).
- **Reports**: date-range filter (all-time/month/quarter/year) and an
  "Export PDF" button (`window.print()` with print-specific CSS — no new
  dependency for something the browser already does).
- **Tasks & follow-ups** (`/tasks`) — reminders optionally linked to a deal,
  with overdue ones flagged distinctly. Dashboard surfaces overdue follow-ups
  and upcoming ones, and close-dates that have quietly passed are flagged
  the same way under "Closing soon."
- **Undo on delete** — deleting a deal no longer uses a plain `confirm()`
  dialog; it's removed immediately with a toast offering "Undo" for a few
  seconds (`src/lib/toast.tsx`), restoring the exact same record if clicked.
- **Mobile-responsive layout** — the sidebar becomes a slide-over drawer
  below the `lg` breakpoint instead of a fixed 256px column with nowhere to
  go on a phone.

## Architecture — written for the Shopfront integration

The previous review couldn't see the source, which made it hard to plan how
quote requests from the Shopfront would eventually reach the CRM. That's the
main thing this rebuild optimises for:

- **`src/types.ts`** is the single source of truth for every shape (`Deal`,
  `Company`, `Contact`, `User`, `Activity`, the Herotel `WholesalePackage`
  catalogue). These are written to look like a real backend schema, not
  view-model props — a `Deal` has the same fields whether it came from a
  salesperson typing it in or, later, from a Shopfront quote request.
- **`src/lib/store.ts`** is a small repository layer: `getDeals()`,
  `createDeal()`, `updateDeal()`, `moveDealStage()`, etc. Every page reads
  and writes through these functions — nothing touches `localStorage`
  directly outside this one file. Data currently lives in
  `localStorage` under `bolide-crm:v1:*` keys, seeded from
  `src/lib/seed-data.ts` on first run.
- **Why this matters for integration**: when the Shopfront is ready to hand
  off quote requests, `store.ts` is the *only* file that needs to change —
  swap each function's body for a real API/Supabase call against the same
  `Deal`/`Company`/`Contact` shapes, and every page keeps working unmodified.
  A Shopfront quote request maps directly onto `createDeal()` +
  `createCompany()`/`createContact()` as already defined: customer info →
  `Company`/`Contact`, requested products/quantities → `Deal.productLine` +
  `notes` (or a `lineItems[]` array added to `Deal` if per-line pricing is
  needed), stage starts at `"lead"` or `"quote"`.
- **`src/lib/auth.tsx`** is similarly isolated — sign-up/login/session both
  go through this one module. It currently hashes passwords client-side
  (SHA-256) and stores the session in `localStorage`, which is fine for an
  internal tool behind existing network/device trust but is **not** meant to
  survive being put on the open internet as-is — swapping in real auth
  (Supabase Auth, Azure AD, etc.) touches only this file.

## Known limitations (same spirit as the previous review's "Known limitations")

- No real backend yet — this is an intentional first step; see
  "Architecture" above for exactly where a backend plugs in.
- MRR trend on Reports is a synthetic ramp ending at today's real total MRR
  (there's no historical time-series to chart yet without a backend).
- Contacts starts empty, same as the reviewed version — a working "Add
  contact" flow now exists so it doesn't have to stay that way.
- "Invite teammate" creates a placeholder account (shown as "Invited" under
  Settings → Access) that the invited person claims by signing up with that
  same email — there's no real email delivery without a backend to send from.
- Admin/rep permissions are UI-only right now — anyone comfortable editing
  their own browser's `localStorage` could bypass them. Fine for an internal
  tool among a trusted small team; not a substitute for real server-side
  auth once this is opened up further.
- Attachments live in each browser's own IndexedDB, so a file attached on
  one device isn't visible from another until there's a real backend to
  store it centrally — same underlying limitation as the rest of the data.
