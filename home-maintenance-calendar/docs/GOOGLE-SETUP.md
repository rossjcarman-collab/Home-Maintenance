# Google Calendar and Tasks sync: one-time setup

The app syncs from your browser using Google sign-in. There is no server and no secret to store. You create a free OAuth client ID once, paste it into the app, and press **Sync with Google**.

Google renames its console screens from time to time, so treat the menu names below as approximate.

## 1. Create a Google Cloud project

1. Go to <https://console.cloud.google.com/> and sign in with the Google account whose Calendar and Tasks you want to use.
2. Create a new project, for example "Home Maintenance".

## 2. Turn on the two APIs

In **APIs & Services > Library**, enable:
- **Google Calendar API**
- **Google Tasks API**

## 3. Set up the consent screen

In **APIs & Services > OAuth consent screen** (also called **Google Auth Platform**):
1. User type: **External**.
2. App name: "Home Maintenance". Add your email as the support and developer contact.
3. Add these two scopes under **Data Access** / **Scopes**:
   - `https://www.googleapis.com/auth/calendar.app.created` (lets the app create and manage only its own calendar)
   - `https://www.googleapis.com/auth/tasks`
4. Under **Audience** / **Test users**, add your own Google address. Leave the app in **Testing**; there is no need to publish it.

In Testing mode Google shows "Google hasn't verified this app" the first time. Choose **Advanced**, then **Go to Home Maintenance (unsafe)**. It is your own project, so this is expected. Google may also ask you to approve again about once a week.

## 4. Create the client ID

In **APIs & Services > Credentials > Create credentials > OAuth client ID**:
1. Application type: **Web application**.
2. **Authorized JavaScript origins**: add the address the app is served from, with no path and no trailing slash:
   - `https://<your-github-user>.github.io`
   - optionally `http://localhost:8080` if you test locally
3. Leave redirect URIs empty.
4. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`).

## 5. Connect the app

1. Open the app, expand **Google setup**, paste the client ID, and press **Save client ID**.
2. Press **Sync with Google** and approve the sign-in. If the pop-up is blocked, allow pop-ups for the site and press Sync again.

The first sync creates a calendar and a task list, both named **Home Maintenance**, and adds every dated, open item.

## How it behaves

| In the app | In Google |
| --- | --- |
| Each dated task | One all-day event on the Home Maintenance calendar, repeating when the task repeats, plus one task in the Home Maintenance list due on the next date |
| Safety and water items | Event reminder at 9:00 the day before |
| Mark done (recurring) | Event and task move to the next due date; the task reopens |
| Mark done (one-time) | Event is removed; the task is marked completed |
| Complete a task in Google Tasks | The app marks the item done on that date, then moves it to the next date if it repeats |
| Move an event or change a task's due date | The app takes the new date |
| Delete an event or task in Google | The app does not re-add it. Use **Re-add items deleted in Google** to bring it back |
| Delete one of your own tasks in the app | Its event and task are removed from Google |

Rules for conflicts: if you changed an item in the app since the last sync, the app wins. Otherwise Google's change is pulled in. If both the event and the task were moved, the calendar wins.

## Limits worth knowing

- **Sync is manual.** A static page cannot run in the background. Press the button; it takes a few seconds.
- **Sync state is per browser.** It is included in **Back up progress**. On a new browser, restore a backup first. If you skip that, the app finds the existing calendar and list by name and re-links items by ID, but the app's dates win on that first sync.
- **Month-end repeats.** Google's monthly repeat skips months that lack the start day (a repeat from the 31st skips short months). Only matters for monthly or quarterly items starting on the 29th to 31st.
- **Alexa.** Alexa can read Google Calendar once the account is linked in the Alexa app; choose the Home Maintenance calendar there. I would not count on Alexa reading Google Tasks.
- **Only one-time items are closed in Tasks.** Completed one-time items stay in the task list as completed, which is your record in Google.
- **Edits in Google to titles or descriptions** are kept until you change that item in the app, then they are overwritten.
- **Revoking access.** Remove the app at <https://myaccount.google.com/permissions>. Deleting the Home Maintenance calendar and task list removes everything the app created.
