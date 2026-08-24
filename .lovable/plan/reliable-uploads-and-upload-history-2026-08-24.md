# Reliable uploads and upload history

## What will change
- Replace the misleading two-stage/eased percentage with continuous byte-based progress, so the UI no longer appears frozen at 63% during the Telegram transfer.
- Increase Telegram transfer throughput using a safe multi-worker upload setting.
- Persist upload jobs and their latest state in SQLite instead of process memory, scoped to the signed-in user/account.
- Restore active and completed uploads after refresh or server restart, with terminal status and errors retained as upload history.
- Add an **Uploads** item to the left sidebar and a dedicated page showing active, queued, completed, failed, and cancelled transfers.
- Keep the existing compact upload dock, synchronized with the Uploads page.

## Reliability and security
- Validate job ownership on progress and status endpoints so one user cannot inspect another user's upload.
- Keep the existing SSE stream, with polling as a fallback when mobile networks or proxies interrupt it.
- Record completion/failure on the server so a browser transport error cannot incorrectly overwrite a successful upload.
- Prune older upload-history rows to keep storage bounded.

## Technical details
- Extend the existing SQLite schema/statements for persisted upload jobs.
- Update upload routes to create and update job records throughout receiving, Telegram sending, completion, and failure.
- Update the client queue serialization/restoration and add the Uploads view renderer.
- Add focused styling for the responsive history page and verify upload API behavior plus desktop/mobile rendering.
