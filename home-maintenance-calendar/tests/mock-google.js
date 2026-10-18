/* In-memory stand-in for the slices of the Google Calendar and Tasks REST APIs that sync.js uses. */
'use strict';

function createMockGoogle() {
  const g = {
    calendars: {},   // id -> { id, summary, accessRole, events: {} }
    lists: {},       // id -> { id, title, tasks: {} }
    writes: 0,
    log: [],
    failNext: [],    // [{ match: RegExp, status, reason }]
  };
  let seq = 1;
  const nid = (p) => p + (seq++);

  function reply(status, body) {
    const text = body === undefined ? '' : JSON.stringify(body);
    return { ok: status >= 200 && status < 300, status, text: async () => text };
  }
  const err = (status, message, reason) => reply(status, { error: { code: status, message, errors: [{ reason: reason || 'error' }] } });

  g.http = async function (url, opts) {
    const method = (opts && opts.method) || 'GET';
    const body = opts && opts.body ? JSON.parse(opts.body) : undefined;
    g.log.push(method + ' ' + url.replace('https://www.googleapis.com', '').replace('https://tasks.googleapis.com', ''));
    if (!/^Bearer \S+/.test((opts.headers || {}).Authorization || '')) return err(401, 'no token');
    for (let i = 0; i < g.failNext.length; i++) {
      if (g.failNext[i].match.test(method + ' ' + url)) { const f = g.failNext.splice(i, 1)[0]; return err(f.status, 'forced', f.reason); }
    }
    if (method !== 'GET') g.writes++;
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname);
    let m;

    if (path === '/calendar/v3/users/me/calendarList') {
      return reply(200, { items: Object.values(g.calendars).map(c => ({ id: c.id, summary: c.summary, accessRole: c.accessRole })) });
    }
    if (path === '/calendar/v3/calendars' && method === 'POST') {
      const id = nid('cal') + '@group.calendar.google.com';
      g.calendars[id] = { id, summary: body.summary, accessRole: 'owner', events: {} };
      return reply(200, { id, summary: body.summary });
    }
    if ((m = path.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/))) {
      const cal = g.calendars[m[1]];
      if (!cal) return err(404, 'Not Found');
      if (!m[2] && method === 'GET') {
        const showDeleted = u.searchParams.get('showDeleted') === 'true';
        return reply(200, { items: Object.values(cal.events).filter(e => showDeleted || e.status !== 'cancelled') });
      }
      if (!m[2] && method === 'POST') {
        const id = nid('ev');
        cal.events[id] = Object.assign({}, body, { id, status: 'confirmed' });
        return reply(200, cal.events[id]);
      }
      const ev = cal.events[m[2]];
      if (!ev || ev.status === 'cancelled') return err(404, 'Not Found');
      if (method === 'PUT') { cal.events[m[2]] = Object.assign({}, body, { id: m[2], status: 'confirmed' }); return reply(200, cal.events[m[2]]); }
      if (method === 'DELETE') { ev.status = 'cancelled'; return reply(204); }
    }
    if (path === '/tasks/v1/users/@me/lists') {
      if (method === 'GET') return reply(200, { items: Object.values(g.lists).map(l => ({ id: l.id, title: l.title })) });
      if (method === 'POST') { const id = nid('list'); g.lists[id] = { id, title: body.title, tasks: {} }; return reply(200, { id, title: body.title }); }
    }
    if ((m = path.match(/^\/tasks\/v1\/lists\/([^/]+)\/tasks(?:\/([^/]+))?$/))) {
      const list = g.lists[m[1]];
      if (!list) return err(404, 'Not Found');
      if (!m[2] && method === 'GET') {
        const showCompleted = u.searchParams.get('showCompleted') === 'true';
        return reply(200, { items: Object.values(list.tasks).filter(t => showCompleted || t.status !== 'completed') });
      }
      if (!m[2] && method === 'POST') {
        const id = nid('tk');
        list.tasks[id] = Object.assign({ status: 'needsAction' }, body, { id });
        return reply(200, list.tasks[id]);
      }
      const t = list.tasks[m[2]];
      if (!t) return err(404, 'Not Found');
      if (method === 'PATCH') {
        Object.keys(body).forEach(k => { if (body[k] === null) delete t[k]; else t[k] = body[k]; });
        if (body.status === 'completed' && !t.completed) t.completed = new Date().toISOString();
        return reply(200, t);
      }
      if (method === 'DELETE') { delete list.tasks[m[2]]; return reply(204); }
    }
    return err(400, 'mock: unhandled ' + method + ' ' + path);
  };

  // helpers for tests acting as the person in Google
  g.cal = () => Object.values(g.calendars)[0];
  g.list = () => Object.values(g.lists)[0];
  g.eventFor = (hmId) => Object.values(g.cal().events).find(e => e.status !== 'cancelled' && e.extendedProperties.private.hmId === hmId);
  g.taskFor = (hmId) => Object.values(g.list().tasks).find(t => (t.notes || '').includes('[HM:' + hmId + ']'));
  return g;
}

module.exports = { createMockGoogle };
