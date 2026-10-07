# Bolide CRM

CRM for the Bolide Group, built with React, TypeScript and Vite, with a PHP/MySQL backend for xneelo.

## Two deployments

- **GitHub Pages preview:** https://inzaloyamaqhawe-tech.github.io/BOLIDECRM/ ? builds use `/BOLIDECRM/`. Sign-in, pipeline data and changes are stored in the current browser. This preview does not connect to the production database. The existing preview pipeline remains available for reviewing the interface.
- **xneelo production:** https://bolide.co.za/crm/ ? builds use `/crm/`. Invited accounts, PHP sessions and shared MySQL records are used. HTTPS with a valid certificate is required. Certificate renewal was pending with xneelo Support on 7 October 2026.

`main` contains source code. `gh-pages` contains the built static preview. Source changes alone do not update the preview; publish a new `/BOLIDECRM/` build to `gh-pages`.

## Latest changes

- Monthly dashboard cards show total leads received and counts for each current stage entered that month, using Johannesburg dates.
- Stages: Lead Received, Qualify/KYC Onboarding, Preliminary Proposal, Final Proposal, Negotiation, Won (Final Proposal Signed), Lost.
- Hover or focus on dashboard stage titles or pipeline headings to read their definitions.
- A lost reason is compulsory for edits, drag-and-drop and bulk changes, and is validated by the PHP API and database.
- Proposal deadlines are seven Monday?Friday days after the lead received date; the receipt day is day zero. Public holidays are currently counted as working days.
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

See [UPLOAD-INSTRUCTIONS.md](UPLOAD-INSTRUCTIONS.md) for individual file uploads, root redirect exceptions, and HTTPS requirements. The existing production database was populated with 42 leads, 16 companies and 7 invited users. Do not reinitialize that database.

For a new installation, import `database/schema.sql` into an empty MySQL/MariaDB database, then copy `api/config.example.php` to `api/config.php` and set credentials privately. PHP 8.2+ with PDO MySQL and Apache rewrite support is required.

After building with `/crm/`, `python package_crm.py` prepares the individual upload folder if a private configuration file is present. It never creates a ZIP. Upload the folder's contents into the website's `crm` folder, including hidden files, without adding an extra directory level.

Do not commit `api/config.php`, environment files, upload folders, ZIP archives, database exports or local migration scripts. GitHub Pages must never receive the PHP folder or production database configuration.

## Limitations

GitHub Pages authentication is only a browser-local preview; its accounts are separate from production. Invitations create account records but do not send email. Reports' MRR trend remains a synthetic chart, not a historical time series. Public holidays are not yet excluded from proposal deadlines. Production is ready for secure access only after the hosting certificate is valid.
