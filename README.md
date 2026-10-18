# Home Maintenance Calendar

Maintenance calendar and task list for an 1813 New England house. A month calendar is the main view; a task list sits beside it. 53 seeded items ranked safety, then water, then asset, then cosmetic, with licensed-pro and "To confirm" flags.

Single static page. No build step, no dependencies, no server.

## Deploy on GitHub Pages

1. Create a repository (private is fine on a paid plan; Pages on a free plan needs a public repo) and push these files to `main`.
2. In the repo go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes on every push to `main`. The site lands at `https://<user>.github.io/<repo>/`.

Public repo note: the register includes house details (vendors, hazard-testing status, permit gaps). If you do not want that public, keep the repo private or trim `index.html` and `data/register.json` first.

## Using it

- Mark a task done: recurring tasks log the visit and move the next due date forward by their interval; one-time tasks are completed.
- Reschedule, add notes, and add your own tasks from the task list.
- **Progress is stored in the browser** (`localStorage`). Use **Back up progress** and **Restore backup** to move it between devices.
- **Export to Google Calendar (.ics)** downloads all dated, open tasks as all-day events with repeat rules. In Google Calendar use Settings > Import & export > Import. Safety and water items include a reminder at 9:00 the day before. Events carry stable IDs, so re-importing an updated export should update rather than duplicate, but check the first re-import. Alexa can then read these through the linked Google account.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The whole app (markup, styles, script, seed register) |
| `data/register.json` | The seed register as data, for a future Calendar/Tasks sync |
| `.github/workflows/pages.yml` | Pages deployment |

## Editing the seed register

The register lives in the `BASE` array in `index.html`; `data/register.json` is a copy. Keep them in sync, or treat the JSON as source and regenerate the array. Task `id` values are the keys for saved progress, so do not renumber them after you start using the app.

## Not built yet

Two-way sync to Google Calendar and Google Tasks, and completion history committed to the repo. Both need an authenticated service, which a static page cannot do on its own.
