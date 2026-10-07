# Shared Database Notes

The CRM is prepared as the first system in a shared Xneelo MySQL database.
When Township Prospector is added later, keep shared identity separate from
project-specific records.

## Users

`users` is intentionally simple and can become the shared login table:

- `id`, stable string identifier used by CRM records.
- `email`, unique, lower-case.
- `password_hash`, nullable so invited users can exist before they claim an account.
- `role`, currently `admin` or `rep` for the CRM.

If another system needs different permissions, add a separate join table such
as `user_app_roles` instead of overloading the CRM `role` column.

Suggested future table:

```sql
CREATE TABLE user_app_roles (
  user_id VARCHAR(64) NOT NULL,
  app_key VARCHAR(80) NOT NULL,
  role_key VARCHAR(80) NOT NULL,
  PRIMARY KEY (user_id, app_key),
  CONSTRAINT fk_user_app_roles_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
```

## Cross-system links

Avoid hard links until both systems are confirmed. If Township Prospector sends
a prospect into the CRM later, add a mapping table instead of forcing either
system to change its own primary keys.

Suggested future table:

```sql
CREATE TABLE external_record_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_app VARCHAR(80) NOT NULL,
  source_record_id VARCHAR(120) NOT NULL,
  target_app VARCHAR(80) NOT NULL,
  target_record_id VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_external_record_link (source_app, source_record_id, target_app, target_record_id)
);
```
