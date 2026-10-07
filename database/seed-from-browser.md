# Browser Data Migration

The CRM currently stores live working data in browser storage under `bolide-crm:v1:*`.
When the database credentials arrive, use the database tools in Settings to export a JSON snapshot, then import that JSON through the PHP API.

The important tables are:

- `users`, including invited users with an empty or null `password_hash`.
- `companies`
- `contacts`
- `deals`
- `activities`
- `tasks`
- `division_overrides`
- `stage_overrides`
- `attachments`, currently stored in IndexedDB per browser.

Recommended migration order:

1. Users
2. Companies
3. Contacts
4. Deals
5. Activities
6. Tasks
7. Reference overrides
8. Attachments
