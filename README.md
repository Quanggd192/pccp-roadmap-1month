# PCCP Roadmap — Week 1

HTML/JavaScript UI with a zero-dependency Node.js server. The server renders
pccp_week1.html and persists progress directly to pccp_database.json.

## Run

    node server.js

Open http://127.0.0.1:8000.

Do not open pccp_week1.html with file:// when editing progress. Both browsers
must open the same server URL so they read and write the same database file.

## Persistence

- GET /api/database loads the checklist and current progress.
- PUT /api/progress writes progress directly to pccp_database.json.
- Writes are serialized and use a temporary file plus rename.
- The page checks for external changes every three seconds and when the tab
  becomes active.
- localStorage is only a display cache, not the source of truth.

No npm install or third-party dependency is required.
