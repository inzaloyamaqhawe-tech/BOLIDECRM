# Bolide CRM upload

The xneelo database is already created and populated: 10 tables, 36 leads, 36 companies, 1 named contact and 7 existing users. Do not re-import the schema or initialization files.

1. Open your website's public web directory in the xneelo File Manager or FTP client.
2. Create the `crm` folder alongside the main website's index file.
3. Upload **the files in `deploy-crm` individually** into that folder. Put asset files in `crm/assets` and API files in `crm/api`. Do not create another `deploy-crm` or `crm` folder inside it. Do not create a ZIP without explicit confirmation.
4. Include hidden files: `.htaccess`, `api/.htaccess` and `api/.user.ini`.
5. Enable PHP 8.2 or later with PDO MySQL support for this folder. The supplied `api/config.php` is already configured for your database. Keep this configuration file private.
6. Visit `https://bolide.co.za/crm/api/health.php`; it should show `{"ok":true,"database":"connected"}`.
7. Open **https://bolide.co.za/crm/**. Choose **Create account**, enter **langelihle@bolide.co.za**, your name and a new CRM password. Your existing invitation grants administrator access. The database password is separate from your CRM sign-in password.
8. Check the dashboard, Pipeline, and a direct page such as `/crm/pipeline`. Marking a lead Lost must require a reason. Make a change, wait for **All changes saved**, and verify it from another signed-in browser.

Expected structure:

```
crm/
  index.html
  .htaccess
  assets/
  bolide-logo.jpg
  bolide-mark.jpg
  api/
    .htaccess
    .user.ini
    auth.php
    state.php
    session.php
    db.php
    health.php
    import-functions.php
    config.php
```

Do not upload `src`, `node_modules`, `database`, test scripts, or the entire `app` folder.

The proposal deadline is seven Monday–Friday working days after receipt, with the receipt day counted as day zero. Public holidays are currently not excluded. You can set the receipt date when creating or editing a lead. Existing proposal stages are treated as already sent.

Monthly cards show leads received this month and leads currently in stages entered this month, using Johannesburg dates. Counts are actual database records; example numbers were not added as fictitious leads.

The app refreshes shared data every 30 seconds. If two people save against the same data revision, the later save is rejected to preserve the earlier change. The user receives a message and can export unsaved changes in Settings before reloading.

Inviting someone in Settings creates their account invitation record; no invitation email is sent automatically. Share the CRM link with them so they can register using their invited address.

The existing pipeline is copied from the project's seed data. Any additional records saved only in an older browser are not accessible from these project files; use Settings → Download database snapshot in that browser to preserve those records.


## Diagnosed hosting redirect on 7 October 2026

The apex domain resolves to xneelo, but its existing root redirect sends `/crm` to `https://www.bolide.co.zacrm` (missing the slash). The www domain points to Railway, which returns 404 for `/crm`.

The fix belongs in the website root redirect configuration above the `crm` folder, rather than in the CRM frontend. Exclude `/crm` and all `/crm/` paths from that redirect. If the redirect is a RewriteRule, place this condition immediately before that redirect rule:

```apache
RewriteCond %{REQUEST_URI} !^/crm(?:/|$) [NC]
```

Ensure the redirect destination includes a slash before its captured path, for example `https://www.bolide.co.za/$1`. Review the complete root `.htaccess` before applying this, because `Redirect` directives or hosting-panel redirects need a different adjustment. Keep the existing `crm/.htaccess` in place.


## Sign-in requires HTTPS

Upload the updated `deploy-crm/.htaccess` to `crm/.htaccess`. It redirects HTTP CRM requests to HTTPS, which is required for secure session cookies. Use `https://bolide.co.za/crm/` for sign-in. Keep the existing account and password. No frontend rebuild or other upload is needed for this fix.


## Contact details update ? 13 October 2026

The deal form now saves contact names, cell/phone numbers and optional email addresses directly to Contacts and links them to the deal. No SQL migration or database reset is needed. Upload the latest `deploy-crm/index.html`, `deploy-crm/faviconbolide.png` and all files from `deploy-crm/assets` to the matching website folders. Keep the existing private API configuration and HTTPS/redirect settings. The GitHub preview continues to save in the browser; xneelo shares contacts through MySQL after the frontend files are uploaded and HTTPS is working.


## Tracker replacement and scrolling update ? 14 October 2026

The previous 42 database leads have been replaced directly by 36 workbook leads. Existing user accounts are preserved. A private backup was saved locally before replacement. The database already has the new `lead_tracker_json` metadata column; do not clear or re-import it again.

Upload the latest individual files from `deploy-crm`: `index.html` to `crm/index.html`, `faviconbolide.png` to `crm/faviconbolide.png`, every file inside `assets` to `crm/assets`, and `api/import-functions.php` to `crm/api/import-functions.php`. Preserve `api/config.php`, `crm/.htaccess` and the main website redirect configuration. No ZIP is needed.

GitHub preview accounts and sessions remain intact, while the old preview leads, companies, contacts, activities, tasks and attachments are replaced once at first load of the new dataset. Later edits are preserved. Refresh any older open tab to load the update.

Status mapping: a proposal date means Preliminary Proposal; Pending Send or In progress means Qualify/KYC Onboarding; the explicitly Closed/No client commitment entry is Lost. Approved/Declined in the approval column refers to modelling and is retained as source metadata without implying a signed proposal. Dates in the contract-signature column are not treated as confirmed signatures.

19 leads have no enquiry received date, so their deadlines remain unavailable until an actual date is entered. CAPEX stays in Financing; the workbook does not provide sales contract values or MRR. The security leads are kept under Secure and the remaining solar/PPA leads under Energy.
