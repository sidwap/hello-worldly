# Persistent server data

## Goal
Keep admin users, login sessions, connected Telegram accounts, folders, share links, upload history, and branding intact across PM2 restarts, code updates, and redeployments.

## Changes
- Add a configurable `DATA_DIR` and move production state to a sibling directory outside the replaceable application checkout.
- Automatically copy an existing legacy `data/` directory into the persistent location on the first upgraded start, so current accounts and links are retained when the old database is still present.
- Persist the generated signing secret inside the persistent data directory, while continuing to honor an explicitly configured `SECRET`. This keeps sessions and password-protected share access stable after deployment.
- Point the included PM2 configuration at the persistent directory and keep logs there as well.
- Update the environment template and deployment documentation with upgrade, backup, restore, and redeploy-safe instructions.

## Technical details
- SQLite remains the source of truth; no database migration or change to existing routes is required.
- The persisted SQLite database already contains users, Telegram `StringSession` values, folders, shares, sessions, API keys, multipart metadata, and upload history.
- Existing public share IDs remain unchanged because the current database is copied rather than recreated.
- A deployment that has already deleted the old database cannot reconstruct past share IDs or Telegram sessions; the fix prevents future loss and preserves current data when `data/tgdrive.sqlite` is still available.

## Validation
- Verify a legacy database is migrated to the configured directory.
- Restart the app and confirm the same database and signing secret are reused.
- Run focused configuration/database checks and confirm startup succeeds.
