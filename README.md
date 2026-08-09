# PCCP Roadmap — Week 1

HTML/JavaScript UI with a Node.js server. The server renders pccp_week1.html
and persists progress in Supabase.

## Run

    npm install
    node server.js

Open http://127.0.0.1:8000.

Do not open pccp_week1.html with file:// when editing progress. Both browsers
must open the server URL so the Supabase service-role key remains server-only.

## Persistence

- GET /api/database loads the checklist and current progress from Supabase.
- PUT /api/progress writes progress through the update_pccp_progress RPC.
- Writes are serialized by the Node.js server.
- The page checks for external changes every three seconds and when the tab
  becomes active.
- localStorage is only a display cache, not the source of truth.

Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before starting the
server. Run supabase_migration.sql once when provisioning a new database.

## Daily reminders

- The user selects a course start date, which is stored in Supabase progress.
- The schedule is fixed to one session per calendar day: the start date is
  Session 1, the following date is Session 2, and so on through Session 7.
- The app schedules the day's content reminder for 08:00 local device time.
- At 12:00 and 17:00, the app reminds again only when that day's fixed session
  is still incomplete.
- Browser notifications require the user to grant permission once. The in-page
  reminder remains available when permission is unavailable or blocked.
- Timers run while the page is open; returning to the tab after a reminder time
  triggers the missed reminder immediately.
