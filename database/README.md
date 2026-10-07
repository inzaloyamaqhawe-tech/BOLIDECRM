# Bolide CRM Database Readiness

This folder prepares the CRM for a hosted Xneelo MySQL database.

## Files

- `schema.sql`, creates the required CRM tables.
- `seed-from-browser.md`, explains how to export today's browser data and import it later.

## Xneelo setup steps

1. Create the MySQL database in Xneelo.
2. Open phpMyAdmin and import `schema.sql`.
3. Copy `api/config.example.php` to `api/config.php`.
4. Fill in the Xneelo database host, database name, username, password, and a strong API secret.
5. Upload the built frontend and the `api` folder together.
6. Visit `/api/health.php`. It should return JSON with `"ok": true`.

Do not commit or share the real `api/config.php` once credentials are added.
