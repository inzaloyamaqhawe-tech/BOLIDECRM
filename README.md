# Bolide CRM

CRM for the Bolide Group, built with React, TypeScript and Vite, with a PHP/MySQL backend for xneelo.

## Two deployments

- **GitHub Pages preview:** https://inzaloyamaqhawe-tech.github.io/BOLIDECRM/ ? builds use `/BOLIDECRM/`. Sign-in, pipeline data and changes are stored in the current browser. This preview does not connect to the production database. The preview now starts from the updated Lead Tracker workbook; its dataset is reset once when this version first loads, while accounts and sessions are retained.
- **xneelo production:** https://bolide.co.za/crm/ ? builds use `/crm/`. Invited accounts, PHP sessions and shared MySQL records are used. HTTPS with a valid certificate is required. Certificate renewal was pending with xneelo Support on 7 October 2026.

`main` contains source code. `gh-pages` contains the built static preview. Source changes alone do not update the preview; publish a new `/BOLIDECRM/` build to `gh-pages`.

## Latest changes

- Corrected deal actions: automatically derived from stage, never assigned to the logged-in developer; task assignments are explicit and independent.
- Personal header inbox beside New deal: unread badge, persistent read/unread state, missed reminders and recipient isolation, backed by MySQL.
- Live search for every deal picker (tasks and report history), matching title, company and site with a bounded result list; checked with 5,000 deals.

- 16 October: assigned tasks, personal desktop reminders, recurring follow-ups, stage-based next actions independent of assigned tasks, holiday-aware deadlines/escalation, document-backed KYC, signed-proposal confirmation, combined filters and personal saved views, and attributed field history under Reports.
- Xneelo's database was backed up and migrated without replacing existing leads or accounts. See [the current upload instructions](UPDATE-2026-10-16.md).
- Desktop notifications need valid HTTPS, browser permission and an open/minimised CRM tab. Closed-browser push is not configured.

- The 14 October tracker import replaces the prior pipeline with 36 leads from 37 workbook rows, consolidating duplicate Sasol Raceway entries. Stages: 21 Qualify/KYC, 14 Preliminary Proposal, 1 Lost. Approval means modelling approval and does not imply Negotiation or Won. Full source rows are preserved in each lead's metadata and notes.
- Deals scroll within the table; table headings and search/filter controls remain visible.

- The deal form captures contact name, cell/phone and optional email. Saving creates or updates the company contact and links it to the deal. Existing contacts can be selected by name; contacts from other companies are kept separate.

- Monthly dashboard cards show total leads received and counts for each current stage entered that month, using Johannesburg dates.
- Stages: Lead Received, Qualify/KYC Onboarding, Preliminary Proposal, Final Proposal, Negotiation, Won (Final Proposal Signed), Lost.
- Hover or focus on dashboard stage titles or pipeline headings to read their definitions.
- A lost reason is compulsory for edits, drag-and-drop and bulk changes, and is validated by the PHP API and database.
- Proposal deadlines are seven Monday?Friday days after the lead received date; the receipt day is day zero. South African public holidays and observed Mondays are excluded.
- Proposal cards show working days remaining, due today, overdue, or proposal sent.
- Langelihle's invited email is `langelihle@bolide.co.za`.
- Production includes server-side password hashing, secure session cookies, CSRF protection, shared attachments and save status.
- Revision checks reject conflicting saves. Shared records refresh every 30 seconds when no save or lead dialog is active.
- Settings can download a backup snapshot of records and attachments.

## Develop and verify

```sh
npm ci
npm run dev
npm run lint
node test-deadline.cjs
node test-contacts.cjs
```

Build on PowerShell:

```powershell
# Production frontend
$env:BASE_PATH='/crm/'
npm run build

# GitHub Pages preview in a separate output folder
$env:BASE_PATH='/BOLIDECRM/'
npm run build -- --outDir .pages-build
```

On bash, prefix each build with `BASE_PATH=/crm/` or `BASE_PATH=/BOLIDECRM/`.

The PHP/database integration check in `test_hosted.py` requires a local, private `api/config.php`, PyMySQL, and a PHP executable. It temporarily inserts a verification account and records, then removes them. It is a manual database check, not a public preview test; adjust its local PHP path before using it.

## Production setup

See [UPLOAD-INSTRUCTIONS.md](UPLOAD-INSTRUCTIONS.md) for individual file uploads, root redirect exceptions, and HTTPS requirements. The existing production database was populated with 36 leads, 36 companies, 1 named contact and 7 existing users. Do not reinitialize that database.

For a new installation, import `database/schema.sql` into an empty MySQL/MariaDB database, then copy `api/config.example.php` to `api/config.php` and set credentials privately. PHP 8.2+ with PDO MySQL and Apache rewrite support is required.

After building with `/crm/`, `python package_crm.py` prepares the individual upload folder if a private configuration file is present. It never creates a ZIP. Upload the folder's contents into the website's `crm` folder, including hidden files, without adding an extra directory level.

Do not commit `api/config.php`, environment files, upload folders, ZIP archives, database exports or local migration scripts. GitHub Pages must never receive the PHP folder or production database configuration.

## Limitations

GitHub Pages authentication is only a browser-local preview; its accounts are separate from production. Invitations create account records but do not send email. Reports' MRR trend remains a synthetic chart, not a historical time series. Public holidays are not yet excluded from proposal deadlines. Production is ready for secure access only after the hosting certificate is valid.
