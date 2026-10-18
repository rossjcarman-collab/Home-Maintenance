/* Run: node tests/inventory.test.js
 * Checks the inventory helpers and the integrity of the seed data against the maintenance register. */
'use strict';
const assert = require('assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const Inv = require('../inventory.js');
const DATA = require('../inventory-data.js');

const root = path.join(__dirname, '..');
const TODAY = '2026-10-18';
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); }
  catch (e) { console.log('FAIL ' + name + '\n     ' + (e.stack || e).split('\n').slice(0, 3).join('\n     ')); process.exitCode = 1; }
}
const item = (id) => DATA.items.find(i => i.id === id);

test('parseDate accepts YYYY, YYYY-MM, YYYY-MM-DD and rejects junk', () => {
  assert.deepStrictEqual(Inv.parseDate('2002-05'), { y: 2002, m: 5, d: 0 });
  assert.deepStrictEqual(Inv.parseDate('2026'), { y: 2026, m: 0, d: 0 });
  assert.deepStrictEqual(Inv.parseDate('2026-11-15'), { y: 2026, m: 11, d: 15 });
  ['', 'May 2002', '2002-13', '2002-05-32', '02-05', null, undefined].forEach(v => assert.strictEqual(Inv.parseDate(v), null, String(v)));
});

test('age: a year alone counts as mid-year; never negative', () => {
  assert.ok(Math.abs(Inv.ageYears('2026', TODAY) - 0.3) < 0.1);
  assert.strictEqual(Inv.ageYears('2030', TODAY), 0);
  assert.strictEqual(Inv.ageYears('', TODAY), null);
});

test('water heater (May 2002, ~25 yr life) is flagged plan replacement', () => {
  const st = Inv.status(item('HW01'), TODAY);
  assert.strictEqual(st.key, 'plan');
  assert.ok(st.age > 24 && st.age < 24.6, 'age ' + st.age);
});

test('1997 microwave and 2008 ovens are past expected life; 2023 range and 2026 AC are fine', () => {
  assert.strictEqual(Inv.status(item('KT03'), TODAY).key, 'past');
  assert.strictEqual(Inv.status(item('KT01'), TODAY).key, 'past');
  assert.strictEqual(Inv.status(item('KT02'), TODAY).key, 'ok');
  assert.strictEqual(Inv.status(item('CL01'), TODAY).key, 'ok');
});

test('older attic AC (about 2000, 15 yr) is past expected life', () => {
  assert.strictEqual(Inv.status(item('CL02'), TODAY).key, 'past');
});

test('items with no date or no life estimate are age unknown, not flagged', () => {
  assert.strictEqual(Inv.status(item('LD01'), TODAY).key, 'unk');
  assert.strictEqual(Inv.status(item('EV02'), TODAY).key, 'unk');
});

test('missing details follow each item\'s own list', () => {
  assert.deepStrictEqual(Inv.missing(item('HT01')), ['make', 'model', 'inst']);
  assert.deepStrictEqual(Inv.missing(item('KT01')), ['serial']);
  assert.deepStrictEqual(Inv.missing(item('CH01')), []);
});

test('merge layers edits over seed data without changing the seed', () => {
  const before = JSON.stringify(DATA.items);
  const m = Inv.merge(DATA.items, { edits: { HT01: { make: 'Weil-McLain', confirmed: true } }, removed: { HT02: true }, custom: { X1: { id: 'X1', cat: 'Laundry', name: 'Chest freezer', need: [] } } });
  assert.strictEqual(m.find(i => i.id === 'HT01').make, 'Weil-McLain');
  assert.strictEqual(m.find(i => i.id === 'HT01').confirmed, true);
  assert.strictEqual(m.find(i => i.id === 'HT02').removed, true);
  assert.strictEqual(m.find(i => i.id === 'X1').custom, true);
  assert.strictEqual(JSON.stringify(DATA.items), before);
});

test('summary counts exclude removed items and confirmed flags', () => {
  const all = Inv.merge(DATA.items, { edits: { HT01: { confirmed: true } }, removed: { KT05: true } });
  const s = Inv.summarize(all, TODAY);
  const base = Inv.summarize(Inv.merge(DATA.items, {}), TODAY);
  assert.strictEqual(s.items, base.items - 1);
  assert.ok(s.confirm < base.confirm);
  assert.ok(s.past >= 3 && s.plan >= 1);
});

test('CSV quotes commas, quotes and newlines, and omits removed items', () => {
  const csv = Inv.toCsv([
    { id: 'A', cat: 'Test', name: 'Say "hi", ok', qty: 2, loc: '', make: '', model: '', serial: '', inst: '2020', dk: 'i', life: 10, notes: 'line1\nline2', tasks: ['S01', 'S02'] },
    { id: 'B', cat: 'Test', name: 'Gone', removed: true },
  ], TODAY);
  assert.ok(csv.includes('"Say ""hi"", ok"'));
  assert.ok(csv.includes('"line1\nline2"'));
  assert.ok(csv.includes('S01 S02'));
  assert.ok(!csv.includes('Gone'));
  assert.strictEqual(csv.split('\r\n')[0].split(',').length, 19);
});

test('seed data: unique IDs, valid categories, valid dates, sane lives', () => {
  const ids = new Set();
  DATA.items.forEach(i => {
    assert.ok(!ids.has(i.id), 'duplicate ' + i.id); ids.add(i.id);
    assert.ok(DATA.cats.includes(i.cat), i.id + ' category ' + i.cat);
    assert.ok(i.name, i.id + ' name');
    if (i.inst) assert.ok(Inv.parseDate(i.inst), i.id + ' date ' + i.inst);
    if (i.life != null) assert.ok(i.life > 0 && i.life <= 100, i.id + ' life');
    assert.ok(['i', 'm'].includes(i.dk), i.id + ' dk');
    assert.ok(Array.isArray(i.tasks), i.id + ' tasks');
  });
  assert.ok(DATA.items.length >= 45, 'items ' + DATA.items.length);
});

test('every linked task ID exists in the register, and index.html matches data/register.json', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const js = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  const arr = /var BASE = (\[[\s\S]*?\n  \]);/.exec(js)[1];
  const base = JSON.parse(JSON.stringify(vm.runInNewContext(arr)));   // normalise across the VM realm
  const json = JSON.parse(fs.readFileSync(path.join(root, 'data/register.json'), 'utf8')).tasks;
  assert.deepStrictEqual(base.map(t => t.id), json.map(t => t.id), 'register.json is out of sync with index.html');
  assert.deepStrictEqual(base, json, 'register.json content differs from index.html');
  const known = new Set(base.map(t => t.id));
  DATA.items.forEach(i => i.tasks.forEach(t => assert.ok(known.has(t), i.id + ' links to missing task ' + t)));
});

test('facts the owner gave are recorded exactly', () => {
  assert.strictEqual(item('HW01').model, 'TF 115');
  assert.strictEqual(item('HW01').inst, '2002-05');
  assert.strictEqual(item('KT01').model, 'CPS130R'); assert.strictEqual(item('KT01').qty, 2);
  assert.strictEqual(item('KT02').model, 'RVEC3456BSB00'); assert.strictEqual(item('KT02').inst, '2023');
  assert.strictEqual(item('KT03').model, 'JEB1050WV 001'); assert.strictEqual(item('KT03').inst, '1997-07');
  assert.strictEqual(item('KT04').model, 'DD24DCTW6V2'); assert.strictEqual(item('KT04').serial, 'DAX766186'); assert.strictEqual(item('KT04').qty, 2);
  assert.strictEqual(item('HT05').model, 'BVA20 ECM'); assert.strictEqual(item('HT05').qty, 3); assert.strictEqual(item('HT05').inst, '2022');
  assert.ok(/double-drawer/.test(item('KT04').notes), 'dishwashers are two double-drawer units');
  assert.strictEqual(item('HT05').inst, '2022'); assert.strictEqual(item('HT06').inst, '2022');
  assert.ok(DATA.absent.includes('Chest freezer'));
  assert.strictEqual(item('EL03').qty, 2);
  assert.strictEqual(item('GA01').qty, 2);
  assert.strictEqual(item('EV05').notes, 'Aluminum.');
});

console.log(process.exitCode ? '\nFAILED' : '\nall ' + passed + ' passed');
