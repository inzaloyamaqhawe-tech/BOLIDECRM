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
