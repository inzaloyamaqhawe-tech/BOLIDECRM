# Deal matching and reviewed merges — 21 October 2026

The common New Deal / deal editor now checks existing opportunities while a company, division, product or site is entered. Company, site and product comparisons ignore case, spaces and punctuation. Exact company matches with the same division and matching or missing product/location require review. Known different divisions, products or sites remain separate opportunities; similar company names are suggestions only.

The panel shows the existing owner, recorded creator (when known), stage, contact details, amounts and notes. Ownership is not a claim that someone is actively editing the record. Older/imported records retain an unknown creator.

Users can open the existing deal, review a merge, or create a separate opportunity with an explanation. Merging keeps existing conflicting values unless the user selects incoming values; missing values are initially selected for filling. A different primary contact is reviewed as a complete person, and an incoming different person is also retained in Contacts when the existing primary contact is kept. Notes are appended. No deal is automatically merged.

Merging saved deals moves their tasks, activities and attachments to the retained record, preserving task assignments and original history attribution. A database merge archive records the source, incoming draft, original target and selected fields; a visible activity records the incoming information. KYC verification provenance is retained when its documents/checklist are transferred. Existing KYC/signature/deadline gates continue to apply. This release does not add an undo-merge button.

Production checks are repeated inside a revision-locked MySQL transaction. Two simultaneous equivalent creates cannot silently create duplicates. If a record changes after review, the server rejects the stale decision and keeps the form open. Explicitly separated deals retain their explanation and reviewed matching IDs/versions. The existing snapshot endpoint also checks new or changed deal identities.

GitHub Pages implements the same interaction using browser storage. It does not read or write Xneelo data. Its preview merge archive stays in that browser.

## Database and deployment

Xneelo was backed up privately before applying the additive migration `database/20261021-deal-duplicates.sql`: two deal metadata columns and `deal_merge_history`. Existing leads were preserved. No old deals were merged or reclassified. The migration is already applied on the current database; do not import it again.

Upload the individual files in `UPLOAD-FILES-2026-10-21.txt` from `deploy-crm` into the existing `/crm/` directory, preserving subfolders. PHP helpers and endpoints must be uploaded before the new frontend; `index.html` goes last. Keep `api/config.php` unchanged. No ZIP was made. GitHub publication does not update the manually uploaded production frontend.

## Validation

- TypeScript compilation, production/Pages builds and PHP syntax checks.
- Browser tests: live existing details, blocked duplicate create, selected-field merge, preserved primary/additional contacts, distinct location/solution and persistence after refresh.
- Xneelo tests using temporary records only: normalized matching, explicit separate reason with current reviewed versions, concurrent saves through two PHP processes, stale source/target rejection, selected-value merge, notes, creator, contact, task assignee, activity attribution, actual attachment foreign keys, immutable source archive and KYC verifier/date preservation. Test records were removed individually; production records were not restored from an old snapshot.
- Existing contacts, deadlines, personal inbox, tasks, saved views, 5,000-deal picker and workflow checks.

The existing Railway `www` redirect requirement remains documented in `WWW-CRM-REDIRECT.md`. Invitation email delivery remains unchanged.
