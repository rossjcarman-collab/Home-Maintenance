/* Two-way sync between the Home Maintenance app and Google Calendar + Google Tasks.
 *
 * Runs in the browser. Sign-in uses Google Identity Services (token flow), so there is no
 * server and no secret: the OAuth client ID is public and the access token stays in memory.
 *
 * Calendar: a dedicated "Home Maintenance" calendar (scope calendar.app.created, so the app can
 *   only touch calendars it created). One all-day event per task, repeating where the task repeats.
 * Tasks: a dedicated "Home Maintenance" task list with one task per item, due on the next date.
 *
 * Identity: events carry extendedProperties.private.hmId, tasks carry "[HM:<id>]" in their notes.
 * Per-item sync state (last synced date, status, body hashes) lives in the app's sync state.
 *
 * Conflict rules: if the app changed an item since the last sync, the app wins. Otherwise a change
 * in Google is pulled in: a completed Google Task marks the item done in the app; a moved Calendar
 * event or Task changes the due date (Calendar wins if both moved).
 */
(function (root) {
  'use strict';

  var CAL = 'https://www.googleapis.com/calendar/v3';
  var TSK = 'https://tasks.googleapis.com/tasks/v1';
  var SCOPES = 'https://www.googleapis.com/auth/calendar.app.created https://www.googleapis.com/auth/tasks';
  var NAME = 'Home Maintenance';
  var COLORS = { 1: '11', 2: '9', 3: '5', 4: '8' };   // tomato, blueberry, banana, graphite

  var p2 = function (n) { return String(n).padStart(2, '0'); };
  function toYmd(iso) { var d = new Date(iso); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function nextDay(s) {
    var a = s.split('-').map(Number), d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + 1));
    return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate());
  }
  function hash(o) {
    var s = JSON.stringify(o), h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return String(h);
  }
  var enc = encodeURIComponent;

  /* ---------- Google sign-in (browser only) ---------- */
  function loadGis() {
    return new Promise(function (resolve, reject) {
      if (root.google && root.google.accounts && root.google.accounts.oauth2) return resolve();
      var s = root.document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Could not load Google sign-in. Check your connection or content blocker.')); };
      root.document.head.appendChild(s);
    });
  }
  function tokenProvider(getClientId) {
    var tok = null, exp = 0;
    function get() {
      if (tok && Date.now() < exp - 60000) return Promise.resolve(tok);
      return loadGis().then(function () {
        return new Promise(function (resolve, reject) {
          var client = root.google.accounts.oauth2.initTokenClient({
            client_id: getClientId(),
            scope: SCOPES,
            callback: function (r) {
              if (r.error) return reject(new Error(r.error_description || r.error));
              tok = r.access_token; exp = Date.now() + Number(r.expires_in || 3600) * 1000;
              resolve(tok);
            },
            error_callback: function (e) { reject(new Error('Sign-in was cancelled or blocked (' + ((e && (e.type || e.message)) || 'unknown') + ').')); }
          });
          client.requestAccessToken({ prompt: '' });
        });
      });
    }
    get.reset = function () { tok = null; exp = 0; };
    return get;
  }
  function preload() { return loadGis().catch(function () {}); }

  /* ---------- engine ---------- */
  function create(cfg) {
    var http = cfg.http || function (u, o) { return root.fetch(u, o); };
    var sleep = cfg.sleep || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var pace = cfg.pace == null ? 120 : cfg.pace;
    var tierName = cfg.tierName || String;

    async function call(method, url, body) {
      for (var a = 0; ; a++) {
        var token = await cfg.getToken();
        if (method !== 'GET' && pace) await sleep(pace);
        var res = await http(url, {
          method: method,
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body)
        });
        var txt = res.status === 204 ? '' : await res.text();
        var data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
        if (res.ok) return data;
        var e0 = data && data.error, reason = (e0 && e0.errors && e0.errors[0] && e0.errors[0].reason) || '';
        var transient = res.status === 429 || res.status >= 500 || (res.status === 403 && /rate|quota/i.test(reason));
        if (transient && a < 4) { await sleep(600 * Math.pow(2, a)); continue; }
        if (res.status === 401 && cfg.getToken.reset) cfg.getToken.reset();
        var err = new Error((e0 && e0.message) || ('Google returned HTTP ' + res.status));
        err.status = res.status;
        throw err;
      }
    }
    async function del(url) {
      try { await call('DELETE', url); } catch (e) { if (e.status !== 404 && e.status !== 410) throw e; }
    }
    async function listAll(url) {
      var out = [], tok = null;
      do {
        var d = await call('GET', url + (tok ? '&pageToken=' + enc(tok) : ''));
        out = out.concat((d && d.items) || []);
        tok = d && d.nextPageToken;
      } while (tok);
      return out;
    }

    /* ----- bodies ----- */
    function title(t) { return '[' + tierName(t.t) + '] ' + (t.s || t.i); }
    function describe(t) {
      var a = [t.i];
      if (t.v) a.push('Vendor: ' + t.v);
      if (t.p) a.push('Licensed professional required');
      if (t.n) a.push(t.n);
      if (t.note) a.push('My notes: ' + t.note);
      return a.join('\n\n');
    }
    function eventBody(t) {
      var b = {
        summary: title(t), description: describe(t),
        start: { date: t.date }, end: { date: nextDay(t.date) },
        transparency: 'transparent', colorId: COLORS[t.t] || '8',
        extendedProperties: { private: { hmId: t.id } },
        reminders: t.t <= 2 ? { useDefault: false, overrides: [{ method: 'popup', minutes: 900 }] } : { useDefault: true }
      };
      b.recurrence = t.e > 0 ? ['RRULE:FREQ=MONTHLY;INTERVAL=' + t.e] : [];
      return b;
    }
    function taskBody(t) {
      return { title: title(t), notes: describe(t) + '\n\n[HM:' + t.id + ']', due: t.date + 'T00:00:00.000Z', status: 'needsAction', completed: null };
    }
    var sig = function (t) { return t.done ? 'done' : (t.date || ''); };

    /* ----- containers ----- */
    async function ensureCalendar(st) {
      if (st.calId) return;
      try {
        var cals = await listAll(CAL + '/users/me/calendarList?maxResults=250');
        var f = cals.filter(function (c) { return c.summary === NAME && c.accessRole === 'owner'; })[0];
        if (f) st.calId = f.id;
      } catch (e) { if (e.status === 401) throw e; }
      if (!st.calId) {
        var c = await call('POST', CAL + '/calendars', { summary: NAME, description: 'Managed by the Home Maintenance app.', timeZone: cfg.timeZone || undefined });
        st.calId = c.id;
      }
      cfg.save();
    }
    async function ensureList(st) {
      if (st.listId) return;
      var lists = await listAll(TSK + '/users/@me/lists?maxResults=100');
      var f = lists.filter(function (l) { return l.title === NAME; })[0];
      if (f) st.listId = f.id;
      else st.listId = (await call('POST', TSK + '/users/@me/lists', { title: NAME })).id;
      cfg.save();
    }

    /* ----- sync ----- */
    async function sync() {
      var st = cfg.getState();
      st.map = st.map || {};
      var r = { created: 0, updated: 0, removed: 0, pulledDone: 0, pulledDates: 0, gone: 0, errors: [] };

      await cfg.getToken();
      await ensureCalendar(st);
      await ensureList(st);

      var evUrl = function (id) { return CAL + '/calendars/' + enc(st.calId) + '/events' + (id ? '/' + enc(id) : ''); };
      var tkUrl = function (id) { return TSK + '/lists/' + enc(st.listId) + '/tasks' + (id ? '/' + enc(id) : ''); };

      var evs, tks;
      try { evs = await listAll(evUrl() + '?maxResults=250&showDeleted=true&singleEvents=false'); }
      catch (e) { if (e.status !== 404) throw e; st.calId = null; st.map = {}; await ensureCalendar(st); evs = await listAll(evUrl() + '?maxResults=250&showDeleted=true&singleEvents=false'); }
      try { tks = await listAll(tkUrl() + '?maxResults=100&showCompleted=true&showHidden=true'); }
      catch (e) { if (e.status !== 404) throw e; st.listId = null; st.map = {}; await ensureList(st); tks = await listAll(tkUrl() + '?maxResults=100&showCompleted=true&showHidden=true'); }

      var EV = {}, TK = {};
      evs.forEach(function (e) {
        var id = e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private.hmId;
        if (id && e.status !== 'cancelled' && !EV[id]) EV[id] = e;
      });
      tks.forEach(function (t) {
        var m = /\[HM:([A-Za-z0-9]+)\]/.exec(t.notes || '');
        if (m && !t.deleted && !TK[m[1]]) TK[m[1]] = t;
      });

      async function one(id) {
        var m = st.map[id], E = EV[id], T = TK[id], L = cfg.find(id);

        // Items the person deleted in Google stay deleted until "re-add" is used.
        if (m) {
          if (m.ev && !E) { m.ev = null; m.evGone = true; r.gone++; }
          if (m.tk && !T) { m.tk = null; m.tkGone = true; r.gone++; }
        }

        // Pull, but only when the app has not changed the item since the last sync.
        if (m && sig(L) === m.sig) {
          if (!L.done && T && T.status === 'completed' && m.tkStatus !== 'completed') {
            cfg.applyDone(id, T.completed ? toYmd(T.completed) : undefined);
            r.pulledDone++;
          } else {
            var eD = E && E.start && E.start.date;
            var tD = T && T.status !== 'completed' && T.due && T.due.slice(0, 10);
            var nd = (eD && eD !== m.date) ? eD : ((tD && tD !== m.date) ? tD : null);
            if (nd) { cfg.applyDate(id, nd); r.pulledDates++; }
          }
          L = cfg.find(id);
        }

        var mm = m || {};
        var next = { sig: sig(L), date: L.date || null, ev: null, tk: null, tkStatus: null, eh: null, th: null, evGone: false, tkGone: false };

        if (L.done || !L.date) {
          // Nothing should be on the calendar. Completed one-time tasks stay in Tasks as completed.
          if (E) { await del(evUrl(E.id)); r.removed++; }
          if (L.done) {
            if (T) {
              if (T.status !== 'completed') { await call('PATCH', tkUrl(T.id), { status: 'completed' }); r.updated++; }
              next.tk = T.id; next.tkStatus = 'completed';
            }
          } else if (T) { await del(tkUrl(T.id)); r.removed++; }
          st.map[id] = next;
          return;
        }

        var eb = eventBody(L), tb = taskBody(L);
        next.eh = hash(eb); next.th = hash(tb);

        if (!E) {
          if (!mm.evGone) { next.ev = (await call('POST', evUrl(), eb)).id; r.created++; }
          else next.evGone = true;
        } else {
          next.ev = E.id;
          if (!m || mm.eh !== next.eh || (E.start && E.start.date) !== L.date) { await call('PUT', evUrl(E.id), eb); r.updated++; }
        }

        if (!T) {
          if (!mm.tkGone) { next.tk = (await call('POST', tkUrl(), { title: tb.title, notes: tb.notes, due: tb.due })).id; r.created++; }
          else next.tkGone = true;
        } else {
          next.tk = T.id;
          if (!m || mm.th !== next.th || T.status !== 'needsAction' || (T.due || '').slice(0, 10) !== L.date) { await call('PATCH', tkUrl(T.id), tb); r.updated++; }
        }
        next.tkStatus = 'needsAction';
        st.map[id] = next;
      }

      var all = cfg.tasks(), local = {};
      for (var i = 0; i < all.length; i++) {
        local[all[i].id] = true;
        try { await one(all[i].id); }
        catch (e) { if (e.status === 401) throw e; r.errors.push(all[i].id + ': ' + e.message); }
      }

      // Tasks removed from the app (custom ones) are removed from Google if this app created them.
      var ids = Object.keys(st.map);
      for (var j = 0; j < ids.length; j++) {
        var id = ids[j];
        if (local[id]) continue;
        try {
          if (EV[id]) { await del(evUrl(EV[id].id)); r.removed++; }
          if (TK[id]) { await del(tkUrl(TK[id].id)); r.removed++; }
          delete st.map[id];
        } catch (e) { if (e.status === 401) throw e; r.errors.push(id + ': ' + e.message); }
      }

      st.last = new Date().toISOString();
      cfg.save();
      return r;
    }

    function readd() {
      var st = cfg.getState(), n = 0;
      Object.keys(st.map || {}).forEach(function (id) {
        var m = st.map[id];
        if (m.evGone || m.tkGone) { m.evGone = false; m.tkGone = false; n++; }
      });
      cfg.save();
      return n;
    }

    return { sync: sync, readd: readd };
  }

  root.HMSync = { create: create, tokenProvider: tokenProvider, preload: preload, SCOPES: SCOPES };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HMSync;
})(typeof window !== 'undefined' ? window : globalThis);
