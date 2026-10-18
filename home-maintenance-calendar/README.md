# Home Maintenance Calendar

Maintenance calendar and task list for an 1813 New England house. A month calendar is the main view; a task list sits beside it. 57 seeded items ranked safety, then water, then asset, then cosmetic, with licensed-pro and "To confirm" flags.

Static site: no build step, no server, no dependencies.

## Deploy on GitHub Pages

1. Create a repository (private is fine on a paid plan; Pages on a free plan needs a public repo) and push these files to `main`.
2. In the repo go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes on every push to `main`. The site lands at `https://<user>.github.io/<repo>/`.

Public repo note: the register includes house details (vendors, hazard-testing status, permit gaps). If you do not want that public, keep the repo private or trim `index.html` and `data/register.json` first.

## Using it

- Mark a task done: recurring tasks log the visit and move the next due date forward by their interval; one-time tasks are completed.
- Reschedule, add notes, and add your own tasks from the task list.
- **Progress is stored in the browser** (`localStorage`). **Back up progress** and **Restore backup** move it between devices, including the Google sync links.
- **Sync with Google** keeps a dedicated Google Calendar and Google Tasks list in step with the app, both directions. One-time setup in [docs/GOOGLE-SETUP.md](docs/GOOGLE-SETUP.md).
- **Home inventory tab:** appliances, HVAC, hot water, electrical, plumbing, envelope, smart home, site and equipment, with make, model, serial, install or manufacture date, expected life, warranty, vendor and last service. Each item shows its age against a typical life and flags replacement planning, links to its maintenance tasks, and lists open questions as "To confirm". Edit fields in place, add or remove items, and export a CSV for insurance or resale. Stored in the browser and included in the backup.
- **Export to Google Calendar (.ics)** is the no-setup alternative: a one-way download you import by hand.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The app (markup, styles, script, seed register) |
| `sync.js` | Google Calendar and Tasks sync engine |
| `inventory-data.js` | Seed inventory (about 47 items) from the home survey |
| `inventory.js` | Inventory logic (age, replacement status, CSV) and tab UI |
| `data/register.json` | The seed register as data |
| `docs/GOOGLE-SETUP.md` | One-time Google Cloud setup and sync rules |
| `tests/` | Sync tests against an in-memory Google mock |
| `.github/workflows/pages.yml` | Pages deployment |

## Tests

```
TZ=America/New_York node tests/sync.test.js
node tests/inventory.test.js
```

Needs only Node. The sync tests check the logic against a mock of the Calendar and Tasks APIs; they do not call Google. The inventory tests check the age and status maths, CSV output, and that every task an inventory item links to exists in the register and that `data/register.json` matches `index.html`.

## Editing the seed register

The register lives in the `BASE` array in `index.html`; `data/register.json` is a copy. Keep them in sync. Task `id` values are the keys for saved progress and for the Google links, so do not renumber them after you start using the app.

The seed inventory lives only in `inventory-data.js`. Edits made in the app are stored separately and layered on top, so updating the seed later does not overwrite what you entered. Item IDs (for example `HW01`) are the keys for those edits, so keep them stable.

## Not built yet

- Background sync. A static page only syncs when you press the button; a scheduled job would need a server-side credential.
- Completion history and service records committed to the repo.
