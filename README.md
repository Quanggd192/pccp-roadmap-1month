# PCCP Roadmap — Week 1

Static HTML/JavaScript UI with a small Node.js server that persists checklist
progress to pccp_database.json.

## Run

    node server.js

Open http://127.0.0.1:8000.

Do not open pccp_week1.html directly when editing progress. Browsers cannot
write to a local JSON file from a file:// page, so persistence controls are
disabled when the database API is unavailable.

## Persistence

- GET /api/database loads the checklist and current progress.
- PUT /api/progress writes progress to pccp_database.json.
- The page checks for external changes every three seconds and when the tab
  becomes active.
- localStorage is only a local cache, not the source of truth.

Cross-browser sync works when both browsers open the same running server.
A static host such as GitHub Pages cannot write back to the JSON file; public
deployment requires a writable backend or database.
