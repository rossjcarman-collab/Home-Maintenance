# Home Maintenance Calendar

Maintenance calendar and task list for an 1813 New England house. A month calendar is the main view; a task list sits beside it. 54 seeded items ranked safety, then water, then asset, then cosmetic, with licensed-pro and "To confirm" flags.

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
- **Export to Google Calendar (.ics)** is the no-setup alternative: a one-way download you import by hand.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The app (markup, styles, script, seed register) |
| `sync.js` | Google Calendar and Tasks sync engine |
| `data/register.json` | The seed register as data |
| `docs/GOOGLE-SETUP.md` | One-time Google Cloud setup and sync rules |
| `tests/` | Sync tests against an in-memory Google mock |
| `.github/workflows/pages.yml` | Pages deployment |

## Tests

```
TZ=America/New_York node tests/sync.test.js
```

Needs only Node. The tests check the sync logic against a mock of the Calendar and Tasks APIs. They do not call Google.

## Editing the seed register

The register lives in the `BASE` array in `index.html`; `data/register.json` is a copy. Keep them in sync. Task `id` values are the keys for saved progress and for the Google links, so do not renumber them after you start using the app.

## Not built yet

- Background sync. A static page only syncs when you press the button; a scheduled job would need a server-side credential.
- Completion history and service records committed to the repo.
