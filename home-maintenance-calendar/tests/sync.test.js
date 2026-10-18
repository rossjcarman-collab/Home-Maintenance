/* Run: TZ=America/New_York node tests/sync.test.js
 * Exercises sync.js against an in-memory Google mock, with a small in-memory model of the app's
 * markDone / reschedule behaviour. */
'use strict';
const assert = require('assert');
const HMSync = require('../sync.js');
const { createMockGoogle } = require('./mock-google.js');

const TODAY = '2026-10-18';
const tiers = { 1: 'Safety', 2: 'Water', 3: 'Asset', 4: 'Cosmetic' };

function makeApp() {
  const items = {
    S07: { id: 'S07', t: 1, c: 'Fire', i: 'Test CO and smoke alarms', s: 'Test CO + smoke alarms', e: 1, p: false, v: '', n: 'Monthly.', date: '2026-11-01', done: false },
    S01: { id: 'S01', t: 1, c: 'Combustion', i: 'Level 2 chimney inspection', s: 'Chimney inspection (L2)', e: 0, p: true, v: 'CSIA', n: '', date: '2026-11-15', done: false },
    W11: { id: 'W11', t: 2, c: 'Plumbing', i: 'Check water heater', s: 'Water heater check', e: 12, p: false, v: '', n: '', date: '2026-11-15', done: false },
    S02: { id: 'S02', t: 1, c: 'Combustion', i: 'Boiler flue sweep', s: 'Boiler flue sweep', e: 12, p: true, v: '', n: '', date: null, done: false },
  };
  const addMonths = (s, n) => { const [y, m, d] = s.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1 + n, 1)); const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate(); dt.setUTCDate(Math.min(d, last)); return dt.toISOString().slice(0, 10); };
  const app = {
    items, hist: [], state: {}, saves: 0,
    tasks: () => Object.values(items).map(x => Object.assign({}, x)),
    find: (id) => Object.assign({}, items[id]),
    applyDone(id, on) {
      const t = items[id]; on = on || TODAY;
      if (t.e > 0) { let next = addMonths(t.date, t.e), n = 0; while (next <= TODAY && n < 400) { next = addMonths(next, t.e); n++; } app.hist.push({ id, on, prev: t.date }); t.date = next; }
      else { app.hist.push({ id, on, prev: t.date }); t.done = true; }
    },
    applyDate(id, d) { items[id].date = d; },
    undo(id) { const h = app.hist.filter(x => x.id === id).pop(); items[id].date = h.prev; items[id].done = false; },
  };
  return app;
}

function engine(app, g) {
  return HMSync.create({
    getState: () => app.state, save: () => { app.saves++; },
    tasks: app.tasks, find: app.find, tierName: (t) => tiers[t],
    applyDone: app.applyDone, applyDate: app.applyDate,
    getToken: async () => 'tok', http: g.http, sleep: async () => {}, pace: 0,
  });
}

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('ok   ' + name); }
  catch (e) { console.log('FAIL ' + name + '\n     ' + (e.stack || e).split('\n').slice(0, 4).join('\n     ')); process.exitCode = 1; }
}

(async () => {
  await test('first sync creates calendar, list, events and tasks for dated items only', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    const r = await hm.sync();
    assert.strictEqual(r.errors.length, 0);
    assert.strictEqual(r.created, 6);                         // 3 events + 3 tasks; S02 has no date
    assert.strictEqual(Object.keys(g.cal().events).length, 3);
    assert.strictEqual(Object.keys(g.list().tasks).length, 3);
    const e = g.eventFor('S07');
    assert.strictEqual(e.start.date, '2026-11-01');
    assert.strictEqual(e.end.date, '2026-11-02');
    assert.deepStrictEqual(e.recurrence, ['RRULE:FREQ=MONTHLY;INTERVAL=1']);
    assert.strictEqual(e.summary, '[Safety] Test CO + smoke alarms');
    assert.deepStrictEqual(g.eventFor('S01').recurrence, []);
    assert.ok(g.eventFor('S07').reminders.overrides, 'safety item has a reminder');
    assert.strictEqual(g.taskFor('S07').due.slice(0, 10), '2026-11-01');
    assert.ok(app.state.calId && app.state.listId);
  });

  await test('second sync with no changes makes no writes', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync(); const w = g.writes;
    const r = await hm.sync();
    assert.strictEqual(g.writes, w);
    assert.deepStrictEqual([r.created, r.updated, r.removed, r.pulledDone, r.pulledDates], [0, 0, 0, 0, 0]);
  });

  await test('completing a recurring task in Google Tasks marks it done in the app and reopens the task', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    const t = g.taskFor('W11'); t.status = 'completed'; t.completed = '2026-10-17T15:00:00.000Z';
    const r = await hm.sync();
    assert.strictEqual(r.pulledDone, 1);
    assert.strictEqual(app.items.W11.date, '2027-11-15');
    assert.strictEqual(app.hist[0].on, '2026-10-17');
    assert.strictEqual(g.taskFor('W11').status, 'needsAction');
    assert.strictEqual(g.taskFor('W11').due.slice(0, 10), '2027-11-15');
    assert.strictEqual(g.eventFor('W11').start.date, '2027-11-15');
  });

  await test('completing a one-time task in Google marks it done and removes the calendar event', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    g.taskFor('S01').status = 'completed'; g.taskFor('S01').completed = '2026-10-18T12:00:00.000Z';
    await hm.sync();
    assert.strictEqual(app.items.S01.done, true);
    assert.strictEqual(g.eventFor('S01'), undefined);
    assert.strictEqual(g.taskFor('S01').status, 'completed');
    const w = g.writes; await hm.sync(); assert.strictEqual(g.writes, w, 'stable afterwards');
  });

  await test('moving the Calendar event reschedules the app item and the task', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    g.eventFor('S01').start = { date: '2026-12-02' }; g.eventFor('S01').end = { date: '2026-12-03' };
    const r = await hm.sync();
    assert.strictEqual(r.pulledDates, 1);
    assert.strictEqual(app.items.S01.date, '2026-12-02');
    assert.strictEqual(g.taskFor('S01').due.slice(0, 10), '2026-12-02');
  });

  await test('changing a Task due date reschedules the app item and the event', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    g.taskFor('W11').due = '2026-12-20T00:00:00.000Z';
    await hm.sync();
    assert.strictEqual(app.items.W11.date, '2026-12-20');
    assert.strictEqual(g.eventFor('W11').start.date, '2026-12-20');
  });

  await test('a local change wins over a Google change made since the last sync', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    g.eventFor('S01').start = { date: '2026-12-02' };
    app.items.S01.date = '2026-11-20';
    await hm.sync();
    assert.strictEqual(app.items.S01.date, '2026-11-20');
    assert.strictEqual(g.eventFor('S01').start.date, '2026-11-20');
    assert.strictEqual(g.taskFor('S01').due.slice(0, 10), '2026-11-20');
  });

  await test('marking done in the app advances Google; undo restores a one-time task', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    app.applyDone('S07'); await hm.sync();
    assert.strictEqual(g.eventFor('S07').start.date, '2026-12-01');   // monthly task advances one interval from its due date
    app.applyDone('S01'); await hm.sync();
    assert.strictEqual(g.eventFor('S01'), undefined);
    assert.strictEqual(g.taskFor('S01').status, 'completed');
    app.undo('S01'); await hm.sync();
    assert.ok(g.eventFor('S01'), 'event recreated');
    assert.strictEqual(g.taskFor('S01').status, 'needsAction');
  });

  await test('an event deleted in Google is not recreated until re-add', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    g.eventFor('S01').status = 'cancelled';
    const r = await hm.sync();
    assert.strictEqual(r.gone, 1);
    assert.strictEqual(g.eventFor('S01'), undefined);
    await hm.sync(); assert.strictEqual(g.eventFor('S01'), undefined);
    assert.strictEqual(hm.readd(), 1);
    await hm.sync();
    assert.ok(g.eventFor('S01'), 'recreated after re-add');
  });

  await test('removing a task from the app removes its Google event and task', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    delete app.items.S01;
    await hm.sync();
    assert.strictEqual(g.eventFor('S01'), undefined);
    assert.strictEqual(g.taskFor('S01'), undefined);
    assert.ok(!('S01' in app.state.map));
  });

  await test('losing local sync state adopts existing Google items instead of duplicating them', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    await hm.sync();
    const app2 = makeApp(); app2.state = { calId: app.state.calId, listId: app.state.listId };
    await engine(app2, g).sync();
    assert.strictEqual(Object.keys(g.cal().events).length, 3);
    assert.strictEqual(Object.keys(g.list().tasks).length, 3);
    const app3 = makeApp(); await engine(app3, g).sync();                    // no ids at all: finds by name
    assert.strictEqual(Object.keys(g.calendars).length, 1);
    assert.strictEqual(Object.keys(g.lists).length, 1);
    assert.strictEqual(Object.keys(g.cal().events).length, 3);
  });

  await test('rate-limit responses are retried', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    g.failNext.push({ match: /POST .*events/, status: 403, reason: 'rateLimitExceeded' });
    const r = await hm.sync();
    assert.strictEqual(r.errors.length, 0);
    assert.strictEqual(Object.keys(g.cal().events).length, 3);
  });

  await test('a 401 aborts the sync and clears the cached token', async () => {
    const g = createMockGoogle(), app = makeApp();
    let reset = 0;
    const getToken = async () => 'tok'; getToken.reset = () => { reset++; };
    const hm = HMSync.create({ getState: () => app.state, save() {}, tasks: app.tasks, find: app.find, tierName: (t) => tiers[t], applyDone: app.applyDone, applyDate: app.applyDate, getToken, http: g.http, sleep: async () => {}, pace: 0 });
    g.failNext.push({ match: /GET .*events/, status: 401 });
    await assert.rejects(() => hm.sync(), (e) => e.status === 401);
    assert.strictEqual(reset, 1);
  });

  await test('a failure on one item is reported and the rest still sync', async () => {
    const g = createMockGoogle(), app = makeApp(), hm = engine(app, g);
    g.failNext.push({ match: /POST .*\/lists\/[^/]+\/tasks$/, status: 400, reason: 'invalid' });
    const r = await hm.sync();
    assert.strictEqual(r.errors.length, 1);
    assert.strictEqual(Object.keys(g.cal().events).length, 3);
    await hm.sync();                                                   // the failed task is created next time
    assert.strictEqual(Object.keys(g.list().tasks).length, 3);
  });

  console.log(process.exitCode ? '\nFAILED' : '\nall ' + passed + ' passed');
})();
