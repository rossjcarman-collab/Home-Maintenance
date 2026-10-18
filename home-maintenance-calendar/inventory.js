/* Home inventory: pure helpers (age, replacement status, CSV) and the tab UI.
 *
 * State is { edits: {id: {field: value}}, custom: {id: item}, removed: {id: true} } and is stored
 * by the host page. The seed items come from inventory-data.js; edits are layered on top, so
 * improving the seed data later never overwrites what the owner has entered. */
(function (root) {
  'use strict';

  var EDITABLE = ['name', 'qty', 'loc', 'make', 'model', 'serial', 'inst', 'dk', 'life', 'warr', 'vendor', 'svc', 'photo', 'notes'];
  var DEFAULT_NEED = ['make', 'model', 'inst'];
  var STATUS = {
    past: { label: 'Past expected life', rank: 0 },
    plan: { label: 'Plan replacement', rank: 1 },
    mid:  { label: 'Midlife', rank: 2 },
    ok:   { label: 'Good', rank: 3 },
    unk:  { label: 'Age unknown', rank: 4 }
  };

  /* ---------- pure helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function parseDate(s) {
    var m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(String(s || '').trim());
    if (!m) return null;
    var y = +m[1], mo = m[2] ? +m[2] : 0, d = m[3] ? +m[3] : 0;
    if (mo && (mo < 1 || mo > 12)) return null;
    if (d && (d < 1 || d > 31)) return null;
    return { y: y, m: mo, d: d };
  }
  /* A year alone counts as mid-year, a month alone as mid-month, so ages are not skewed either way. */
  function refMs(p) { return Date.UTC(p.y, (p.m || 7) - 1, p.d || (p.m ? 15 : 1)); }
  function todayMs(today) { var a = today.split('-').map(Number); return Date.UTC(a[0], a[1] - 1, a[2]); }
  function ageYears(inst, today) {
    var p = parseDate(inst);
    if (!p) return null;
    return Math.max(0, (todayMs(today) - refMs(p)) / (365.2425 * 864e5));
  }
  function status(item, today) {
    var age = ageYears(item.inst, today), life = Number(item.life);
    if (age == null || !life) return { key: 'unk', age: age, ratio: null };
    var r = age / life;
    return { key: r >= 1 ? 'past' : r >= 0.85 ? 'plan' : r >= 0.6 ? 'mid' : 'ok', age: age, ratio: r };
  }
  function missing(item) {
    var need = item.need || DEFAULT_NEED;
    return need.filter(function (f) { return !String(item[f] == null ? '' : item[f]).trim(); });
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(s) {
    var p = parseDate(s);
    if (!p) return '';
    return (p.m ? MONTHS[p.m - 1] + ' ' : '') + (p.d ? p.d + ', ' : '') + p.y;
  }
  function fmtInst(item) {
    var t = fmtDate(item.inst);
    return t ? (item.dk === 'm' ? 'Made ' : 'Installed ') + t : '';
  }
  function merge(seed, state) {
    state = state || {};
    var edits = state.edits || {}, removed = state.removed || {}, out = [];
    seed.forEach(function (b) {
      var it = Object.assign({}, b, edits[b.id] || {});
      it.removed = !!removed[b.id];
      it.confirmed = !!(edits[b.id] && edits[b.id].confirmed);
      out.push(it);
    });
    Object.keys(state.custom || {}).forEach(function (id) {
      var it = Object.assign({}, state.custom[id], edits[id] || {});
      it.removed = !!removed[id]; it.custom = true;
      it.confirmed = !!(edits[id] && edits[id].confirmed);
      out.push(it);
    });
    return out;
  }
  function needsAttention(item, st) {
    return st.key === 'past' || st.key === 'plan' || (!!item.flag && !item.confirmed) || missing(item).length > 0;
  }
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(items, today) {
    var head = ['Category', 'Item', 'Qty', 'Location', 'Make', 'Model', 'Serial', 'Date', 'Date type', 'Age (years)', 'Expected life (years)', 'Status', 'Warranty ends', 'Vendor', 'Last service', 'Linked tasks', 'Photo link', 'Notes', 'To confirm'];
    var rows = [head];
    items.filter(function (i) { return !i.removed; }).forEach(function (i) {
      var st = status(i, today);
      rows.push([i.cat, i.name, i.qty == null ? '' : i.qty, i.loc, i.make, i.model, i.serial, i.inst, i.inst ? (i.dk === 'm' ? 'Manufactured' : 'Installed') : '',
        st.age == null ? '' : st.age.toFixed(1), i.life == null ? '' : i.life, STATUS[st.key].label, i.warr, i.vendor, i.svc,
        (i.tasks || []).join(' '), i.photo, i.notes, (i.flag && !i.confirmed) ? i.flag : '']);
    });
    return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }
  function summarize(items, today) {
    var s = { items: 0, past: 0, plan: 0, confirm: 0, missing: 0 };
    items.forEach(function (i) {
      if (i.removed) return;
      var st = status(i, today);
      s.items++;
      if (st.key === 'past') s.past++;
      if (st.key === 'plan') s.plan++;
      if (i.flag && !i.confirmed) s.confirm++;
      if (missing(i).length) s.missing++;
    });
    return s;
  }

  /* ---------- UI ---------- */
  var LABELS = { make: 'Make', model: 'Model', serial: 'Serial number', inst: 'Date', dk: 'Date is', life: 'Expected life (years)', warr: 'Warranty ends', vendor: 'Installer or vendor', svc: 'Last service', photo: 'Label photo link', loc: 'Location', qty: 'Quantity', name: 'Name' };

  function create(cfg) {
    var data = cfg.data, el = cfg.el;
    var state = cfg.state || {};
    var F = { q: '', cat: '', attn: false };
    var open = null;
    var today = function () { return cfg.today(); };

    function items() { return merge(data.items, state); }
    function find(id) { return items().filter(function (i) { return i.id === id; })[0]; }
    function persist() { if (cfg.save) cfg.save(state); }
    function ensure() { state.edits = state.edits || {}; state.custom = state.custom || {}; state.removed = state.removed || {}; }

    function badges(it, st) {
      var b = '';
      if (st.key === 'past' || st.key === 'plan') b += '<span class="ibadge ' + st.key + '">' + STATUS[st.key].label + '</span>';
      if (it.flag && !it.confirmed) b += '<span class="ibadge confirm">To confirm</span>';
      var m = missing(it).length;
      if (m) b += '<span class="ibadge miss">' + m + ' detail' + (m > 1 ? 's' : '') + ' missing</span>';
      return b;
    }
    function gauge(it, st) {
      if (st.key === 'unk') return '<span class="gauge none">' + (it.life ? 'Age unknown' : 'No life estimate') + '</span>';
      var pct = Math.min(100, Math.round(st.ratio * 100));
      return '<span class="gauge ' + st.key + '" title="' + esc(STATUS[st.key].label) + '"><span class="gbar"><i style="width:' + pct + '%"></i></span><span class="gtxt">' + (st.age < 1 ? '<1' : Math.round(st.age)) + ' of ~' + it.life + ' yr</span></span>';
    }
    function summaryHtml(it) {
      var st = status(it, today());
      var spec = [it.make, it.model].filter(Boolean).join(' ');
      var sub = [spec || 'Make and model not recorded', it.loc, fmtInst(it)].filter(Boolean).join(' · ');
      var b = badges(it, st);
      return '<span class="iname">' + esc(it.name) + (it.qty > 1 ? ' <span class="iqty">×' + it.qty + '</span>' : '') + '</span>' +
        '<span class="igauge">' + gauge(it, st) + '</span>' +
        '<span class="isub">' + esc(sub) + '</span>' +
        (b ? '<span class="ibadges">' + b + '</span>' : '');
    }
    function field(it, f, type) {
      var id = 'f-' + it.id + '-' + f, v = it[f] == null ? '' : it[f];
      var ph = { inst: 'YYYY, YYYY-MM or YYYY-MM-DD', warr: 'YYYY-MM-DD', svc: 'YYYY-MM-DD', photo: 'https://' }[f] || '';
      if (f === 'dk') return '<label for="' + id + '">' + LABELS[f] + '<select id="' + id + '" data-f="dk"><option value="i"' + (v !== 'm' ? ' selected' : '') + '>Install date</option><option value="m"' + (v === 'm' ? ' selected' : '') + '>Manufacture date</option></select></label>';
      return '<label for="' + id + '">' + LABELS[f] + '<input id="' + id + '" data-f="' + f + '" type="' + (type || 'text') + '" value="' + esc(v) + '" placeholder="' + esc(ph) + '"' + (type === 'number' ? ' min="0" step="1" inputmode="numeric"' : '') + '></label>';
    }
    function detailHtml(it) {
      var h = '';
      if (it.flag && !it.confirmed) h += '<p class="iflag"><b>To confirm.</b> ' + esc(it.flag) + ' <button type="button" class="btn" data-act="confirm" data-id="' + it.id + '">Mark confirmed</button></p>';
      if (it.confirmed && it.flag) h += '<p class="iflag ok">Confirmed. <button type="button" class="btn" data-act="unconfirm" data-id="' + it.id + '">Reopen</button></p>';
      h += '<div class="iform">' +
        (it.custom ? field(it, 'name') : '') +
        field(it, 'qty', 'number') + field(it, 'loc') + field(it, 'make') + field(it, 'model') + field(it, 'serial') +
        field(it, 'inst') + field(it, 'dk') + field(it, 'life', 'number') + field(it, 'warr') + field(it, 'vendor') + field(it, 'svc') + field(it, 'photo') +
        '<label class="full" for="f-' + it.id + '-notes">Notes<textarea id="f-' + it.id + '-notes" data-f="notes" rows="2">' + esc(it.notes) + '</textarea></label>' +
        '</div>';
      var tl = (it.tasks || []).map(function (tid) {
        var t = cfg.getTask(tid);
        if (!t) return '';
        return '<button type="button" class="taskchip' + (t.late ? ' late' : '') + '" data-act="task" data-id="' + esc(tid) + '"><b>' + esc(tid) + '</b> ' + esc(t.s) + (t.date ? ' · ' + esc(fmtDate(t.date)) : '') + '</button>';
      }).join('');
      if (tl) h += '<div class="ilinks"><span class="ilabel">Maintenance tasks</span>' + tl + '</div>';
      h += '<div class="iactions"><button type="button" class="btn danger" data-act="remove" data-id="' + it.id + '">Remove from inventory</button></div>';
      return h;
    }
    function cardHtml(it) {
      var isOpen = open === it.id;
      return '<article class="inv' + (isOpen ? ' open' : '') + '" id="inv-' + it.id + '" data-id="' + it.id + '">' +
        '<button type="button" class="inv-sum" data-act="toggle" data-id="' + it.id + '" aria-expanded="' + isOpen + '">' + summaryHtml(it) + '</button>' +
        (isOpen ? '<div class="inv-det">' + detailHtml(it) + '</div>' : '') + '</article>';
    }
    function visible(it) {
      if (it.removed) return false;
      if (F.cat && it.cat !== F.cat) return false;
      var st = status(it, today());
      if (F.attn && !needsAttention(it, st)) return false;
      if (F.q) {
        var hay = [it.name, it.cat, it.make, it.model, it.serial, it.loc, it.vendor, it.notes, it.flag].join(' ').toLowerCase();
        if (hay.indexOf(F.q.toLowerCase()) < 0) return false;
      }
      return true;
    }
    function kpiHtml(all) {
      var s = summarize(all, today());
      function k(n, label, cls) { return '<span class="ik' + (cls ? ' ' + cls : '') + '"><b>' + n + '</b>' + label + '</span>'; }
      return k(s.items, 'items') + k(s.past, 'past expected life', s.past ? 'bad' : '') + k(s.plan, 'plan replacement', s.plan ? 'warn' : '') + k(s.confirm, 'to confirm') + k(s.missing, 'missing details');
    }
    function render() {
      var all = items(), shown = all.filter(visible);
      var removedN = all.filter(function (i) { return i.removed; }).length;
      var byCat = {};
      shown.forEach(function (i) { (byCat[i.cat] = byCat[i.cat] || []).push(i); });
      var cats = data.cats.concat(Object.keys(byCat).filter(function (c) { return data.cats.indexOf(c) < 0; }));
      var h = '<div class="ibar">' +
        '<div class="ikpis" id="ikpis">' + kpiHtml(all) + '</div>' +
        '<div class="ifilters">' +
        '<input type="search" id="iq" placeholder="Search name, make, model, serial, location" aria-label="Search inventory" value="' + esc(F.q) + '">' +
        '<select id="icat" aria-label="Category"><option value="">All categories</option>' + data.cats.map(function (c) { return '<option' + (F.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
        '<label for="iattn"><input type="checkbox" id="iattn"' + (F.attn ? ' checked' : '') + '> Needs attention</label>' +
        '<button type="button" class="btn" data-act="csv">Export CSV</button>' +
        '</div></div>';
      var any = false;
      cats.forEach(function (c) {
        if (!byCat[c]) return;
        any = true;
        h += '<section class="icat"><h2>' + esc(c) + ' <span>' + byCat[c].length + '</span></h2><div class="igrid">' + byCat[c].map(cardHtml).join('') + '</div></section>';
      });
      if (!any) h += '<p class="empty">No items match.</p>';
      h += '<details class="iadd"><summary>Add an item</summary><form id="iaddForm" class="iform">' +
        '<label class="full" for="aiName">Name<input id="aiName" required maxlength="80" placeholder="Chest freezer"></label>' +
        '<label for="aiCat">Category<select id="aiCat">' + data.cats.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
        '<label for="aiLoc">Location<input id="aiLoc" maxlength="80"></label>' +
        '<div class="full"><button type="submit" class="btn primary">Add to inventory</button></div></form></details>';
      if (data.absent && data.absent.length) {
        h += '<section class="iabsent"><h2>Confirmed not present</h2><ul>' + data.absent.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></section>';
      }
      if (removedN) h += '<p class="ihint"><button type="button" class="linkbtn" data-act="restore">Restore ' + removedN + ' removed item' + (removedN > 1 ? 's' : '') + '</button></p>';
      h += '<p class="ihint">Expected life values are typical planning ranges, not predictions. Edit them if your installer or manufacturer says otherwise. Age counts from the date shown; a year alone is treated as mid-year.</p>';
      var focus = document.activeElement && document.activeElement.id;
      el.innerHTML = h;
      if (focus === 'iq') { var q = document.getElementById('iq'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    }
    function refreshCard(id) {
      var it = find(id), card = document.getElementById('inv-' + id);
      if (!it || !card) return;
      card.querySelector('.inv-sum').innerHTML = summaryHtml(it);
      document.getElementById('ikpis').innerHTML = kpiHtml(items());
    }

    /* ---------- events ---------- */
    el.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-act]');
      if (!a) return;
      var act = a.getAttribute('data-act'), id = a.getAttribute('data-id');
      ensure();
      if (act === 'toggle') { open = open === id ? null : id; render(); if (open) { var c = document.getElementById('inv-' + id); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' }); } return; }
      if (act === 'confirm' || act === 'unconfirm') { state.edits[id] = Object.assign({}, state.edits[id], { confirmed: act === 'confirm' }); persist(); render(); return; }
      if (act === 'remove') { if (!cfg.confirm || cfg.confirm('Remove this item from the inventory? You can restore it later.')) { state.removed[id] = true; if (open === id) open = null; persist(); render(); } return; }
      if (act === 'restore') { state.removed = {}; persist(); render(); return; }
      if (act === 'task') { cfg.openTask(id); return; }
      if (act === 'csv') { cfg.download('home-inventory-' + today() + '.csv', 'text/csv', toCsv(items(), today())); return; }
    });
    el.addEventListener('change', function (ev) {
      var t = ev.target, f = t.getAttribute && t.getAttribute('data-f');
      if (f) {
        var card = t.closest('.inv'); if (!card) return;
        var id = card.getAttribute('data-id'), v = t.value.trim();
        if ((f === 'inst' || f === 'warr' || f === 'svc') && v && !parseDate(v)) { t.setCustomValidity('Use YYYY, YYYY-MM or YYYY-MM-DD'); t.reportValidity && t.reportValidity(); return; }
        t.setCustomValidity && t.setCustomValidity('');
        ensure();
        var base = find(id), custom = !!state.custom[id], val = v;
        if (f === 'qty' || f === 'life') val = v === '' ? null : Number(v);
        if (custom) state.custom[id][f] = val;
        else { state.edits[id] = state.edits[id] || {}; state.edits[id][f] = val; }
        persist(); refreshCard(id); return;
      }
      if (t.id === 'icat') { F.cat = t.value; render(); }
      else if (t.id === 'iattn') { F.attn = t.checked; render(); }
    });
    el.addEventListener('input', function (ev) { if (ev.target.id === 'iq') { F.q = ev.target.value.trim(); render(); } });
    el.addEventListener('submit', function (ev) {
      if (ev.target.id !== 'iaddForm') return;
      ev.preventDefault();
      var name = document.getElementById('aiName').value.trim();
      if (!name) return;
      ensure();
      var id = 'X' + Date.now().toString(36).toUpperCase();
      state.custom[id] = { id: id, cat: document.getElementById('aiCat').value, name: name, qty: 1, loc: document.getElementById('aiLoc').value.trim(), make: '', model: '', serial: '', inst: '', dk: 'i', life: null, warr: '', vendor: '', svc: '', photo: '', notes: '', flag: '', tasks: [], need: [] };
      open = id; F = { q: '', cat: '', attn: false };
      persist(); render();
      var c = document.getElementById('inv-' + id); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' });
    });

    return {
      render: render,
      getState: function () { return state; },
      setState: function (s) { state = s || {}; persist(); open = null; render(); },
      items: items,
      csv: function () { return toCsv(items(), today()); },
      focus: function (id) { open = id; F = { q: '', cat: '', attn: false }; render(); var c = document.getElementById('inv-' + id); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' }); }
    };
  }

  root.HMInventory = { create: create, parseDate: parseDate, ageYears: ageYears, status: status, missing: missing, merge: merge, toCsv: toCsv, summarize: summarize, fmtInst: fmtInst, needsAttention: needsAttention };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HMInventory;
})(typeof window !== 'undefined' ? window : globalThis);
