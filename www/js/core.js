(function (E) {
  'use strict';
  // ---------- dates ----------
  const pad = n => String(n).padStart(2, '0');
  E.pad = pad;
  E.ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  E.parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  E.now = () => new Date();
  E.today = () => E.ymd(E.now());
  E.add = (s, n) => { const d = E.parse(s); d.setDate(d.getDate() + n); return E.ymd(d); };
  E.diff = (a, b) => Math.round((E.parse(a) - E.parse(b)) / 864e5);
  E.dow = s => E.parse(s).getDay();
  E.isWeekend = s => { const w = E.dow(s); return w === 0 || w === 6; };
  E.min = hm => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + (m || 0); };
  E.hm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
  E.nowMin = () => { const n = E.now(); return n.getHours() * 60 + n.getMinutes(); };
  E.fmtDate = (s, o) => E.parse(s).toLocaleDateString('en-GB', o || { weekday: 'short', day: 'numeric', month: 'short' });
  E.rel = s => { const n = E.diff(s, E.today()); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 1 && n < 7 ? E.fmtDate(s, { weekday: 'long' }) : E.fmtDate(s, { weekday: 'short', day: 'numeric', month: 'short' }); };
  E.time12 = hm => { if (!hm) return ''; const m = E.min(hm), h = Math.floor(m / 60) % 24; return `${h % 12 || 12}:${pad(m % 60)} ${h < 12 ? 'am' : 'pm'}`; };

  // ---------- strings & numbers ----------
  E.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  E.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  E.n = (v, d) => { const x = Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0); return x.toLocaleString('en-US'); };
  E.pct = (a, b) => b > 0 ? Math.max(0, Math.min(100, Math.round(a / b * 100))) : 0;
  E.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  E.hash = s => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  E.$ = (s, el) => (el || document).querySelector(s);
  E.$$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  E.val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  E.num = id => { const v = parseFloat(String(E.val(id)).replace(/,/g, '')); return isNaN(v) ? 0 : v; };

  // ---------- storage ----------
  const KEY = 'ember.v1';
  E.load = () => { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* fresh */ } return null; };
  E.S = E.load();
  E.ver = 0;
  let saveT = null;
  E.save = () => {
    E.ver++;
    try { localStorage.setItem(KEY, JSON.stringify(E.S)); } catch (e) { E.toast('Could not save. Export a backup.'); }
    clearTimeout(saveT); saveT = setTimeout(() => { if (E.afterSave) E.afterSave(); }, 700);
  };
  E.replace = d => { E.S = d; E.migrate(); E.save(); E.render(true); };
  E.KEY = KEY;

  // ---------- UI state ----------
  E.ui = { tab: 'today', sub: {}, day: null, scroll: {} };
  E.A = {}; // actions

  // ---------- render ----------
  E.screens = {};
  E.render = (fresh) => {
    const v = E.$('#app'), t = E.ui.tab;
    const y = window.scrollY;
    const html = (E.screens[t] || E.screens.today)();
    v.innerHTML = `<div class="${fresh ? 'screen' : ''}">${html}</div>`;
    const grp = ['plan', 'grow', 'health', 'money'].includes(t) ? 'hub' : t; E.$$('#nav [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === grp));
    if (!fresh) window.scrollTo(0, y);
    if (E.afterRender) E.afterRender();
  };
  E.go = (tab, sub) => {
    E.ui.scroll[E.ui.tab] = window.scrollY;
    E.ui.tab = tab; if (sub) E.ui.sub[tab] = sub;
    E.render(true); window.scrollTo(0, 0);
  };
  E.subOf = (tab, def) => E.ui.sub[tab] || def;

  // ---------- sheets ----------
  // A sheet has a header, a scrolling body and a fixed footer, so buttons stay above the keyboard.
  E.sheet = (o) => {
    E.close(true);
    const el = document.createElement('div');
    el.className = 'scrim' + (o.full ? ' full' : '');
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>
      <div class="sheet-h"><h3>${o.title || ''}</h3><button class="x" data-a="close" aria-label="Close">${E.ic('x')}</button></div>
      <div class="sheet-b">${o.body || ''}</div>${o.foot ? `<div class="sheet-f">${o.foot}</div>` : ''}</div>`;
    el.addEventListener('click', ev => { if (ev.target === el) E.close(); });
    document.body.appendChild(el);
    if (o.onOpen) o.onOpen(el);
    if (o.focus) setTimeout(() => { const f = document.getElementById(o.focus); if (f) f.focus(); }, 280);
    E.ui.sheet = o.id || 'sheet';
    return el;
  };
  E.close = (quiet) => { E.$$('.scrim').forEach(n => n.remove()); E.ui.sheet = null; if (!quiet && E.onClose) { const f = E.onClose; E.onClose = null; f(); } };
  E.A.close = () => E.close();
  E.confirm = (title, msg, ok, cb, danger) => E.sheet({ title, body: `<p class="muted">${msg}</p>`, foot: `<button class="btn ghost" data-a="close">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-a="confirm-ok">${ok}</button>`, onOpen: () => { E._ok = cb; } });
  E.A['confirm-ok'] = () => { const f = E._ok; E._ok = null; E.close(true); if (f) f(); };

  // ---------- toast with optional undo ----------
  let tT = null;
  E.toast = (msg, undo) => {
    const t = E.$('#toast');
    t.innerHTML = E.esc(msg) + (undo ? '<button data-a="undo">Undo</button>' : '');
    E._undo = undo || null;
    t.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => { t.classList.remove('show'); E._undo = null; }, undo ? 4500 : 2400);
  };
  E.A.undo = () => { const f = E._undo; E._undo = null; E.$('#toast').classList.remove('show'); if (f) { f(); E.save(); E.render(); } };

  // ---------- haptics ----------
  E.buzz = (ms) => { try { const H = window.Capacitor && window.Capacitor.Plugins.Haptics; if (H) H.impact({ style: ms > 20 ? 'MEDIUM' : 'LIGHT' }); else if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) { /* ignore */ } };

  // ---------- keyboard: keep focused fields visible, hide the nav ----------
  const vv = window.visualViewport;
  let fullH = window.innerHeight;
  const onVV = () => {
    const h = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty('--vh', h + 'px');
    if (h > fullH) fullH = h;
    document.body.classList.toggle('kb', h < fullH * 0.78);
  };
  if (vv) vv.addEventListener('resize', onVV); window.addEventListener('resize', onVV); onVV();
  document.addEventListener('focusin', e => {
    if (!e.target.matches('input, textarea, select')) return;
    setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
  });

  // ---------- events ----------
  document.addEventListener('click', e => {
    const tab = e.target.closest('#nav [data-tab]');
    if (tab) { E.buzz(8); if (E.ui.tab === tab.dataset.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } E.go(tab.dataset.tab); return; }
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const f = E.A[el.dataset.a];
    if (f) { e.preventDefault(); f(el, e); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('input') && e.target.dataset.enter) { const f = E.A[e.target.dataset.enter]; if (f) { e.preventDefault(); f(e.target); } }
  });
  // generic chip pickers: <div class="chips" data-pick="id"> with buttons data-v
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pick] > [data-v]'); if (!b) return;
    const box = b.parentElement, multi = box.dataset.multi;
    if (multi) b.classList.toggle('on'); else box.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b));
    const inp = document.getElementById(box.dataset.pick);
    if (inp) inp.value = multi ? E.$$('.on', box).map(x => x.dataset.v).join(',') : b.dataset.v;
    if (box.dataset.change && E.A[box.dataset.change]) E.A[box.dataset.change](b);
  });

  // ---------- small view helpers ----------
  E.item = o => `<${o.a ? 'button' : 'div'} class="item ${o.cls || ''}" ${o.a ? `data-a="${o.a}"` : ''} ${o.id != null ? `data-id="${E.esc(o.id)}"` : ''} ${o.attrs || ''}>
    ${o.icon ? `<div class="ico ${o.sm ? 'sm' : ''}" style="--c:${o.c || 'var(--ember)'}">${E.ic(o.icon)}</div>` : ''}
    <div class="grow"><div class="t">${o.t}</div>${o.s ? `<div class="s">${o.s}</div>` : ''}</div>
    ${o.r != null ? `<div class="r">${o.r}</div>` : ''}${o.chev ? E.ic('chevron-right', 'dim') : ''}</${o.a ? 'button' : 'div'}>`;
  E.field = (label, inner, hint) => `<div class="field">${label ? `<label>${label}</label>` : ''}${inner}${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  E.opts = (list, cur) => list.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${E.esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${E.esc(l)}</option>`; }).join('');
  E.chips = (id, list, cur, o) => { o = o || {}; const set = new Set(String(cur == null ? '' : cur).split(',')); return `<input type="hidden" id="${id}" value="${E.esc(cur == null ? '' : cur)}"><div class="chips ${o.cls || ''}" data-pick="${id}" ${o.multi ? 'data-multi="1"' : ''} ${o.change ? `data-change="${o.change}"` : ''}>${list.map(x => { const [v, l, icn] = Array.isArray(x) ? x : [x, x]; return `<button type="button" class="chip ${set.has(String(v)) ? 'on' : ''}" data-v="${E.esc(v)}">${icn ? E.ic(icn) : ''}${E.esc(l)}</button>`; }).join('')}</div>`; };
  E.seg = (key, list, cur, a) => `<div class="seg">${list.map(([v, l]) => `<button class="${v === cur ? 'on' : ''}" data-a="${a || 'seg'}" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
  E.A.seg = el => { E.ui.sub[el.dataset.k] = el.dataset.v; E.render(); };
  E.hdr = (title, sub, right) => `<header class="hdr"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${right || ''}</header>`;
  E.secH = (t, link, a, attrs) => `<div class="sec"><h2>${t}</h2>${link ? `<button class="link" data-a="${a}" ${attrs || ''}>${link}</button>` : ''}</div>`;
  E.bar = (p, c) => `<div class="bar"><i style="width:${E.clamp(p, 0, 100)}%;${c ? `--c:${c}` : ''}"></i></div>`;
  E.ring = (p, o) => {
    o = o || {}; const sz = o.size || 120, sw = o.stroke || 10, r = (sz - sw) / 2, C = 2 * Math.PI * r, v = E.clamp(p, 0, 1);
    return `<div class="ring" style="width:${sz}px;height:${sz}px"><svg width="${sz}" height="${sz}"><circle cx="${sz / 2}" cy="${sz / 2}" r="${r}" fill="none" stroke="var(--card2)" stroke-width="${sw}"/>
      <circle cx="${sz / 2}" cy="${sz / 2}" r="${r}" fill="none" stroke="${o.c || 'var(--ember)'}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - v)).toFixed(1)}" style="transition:stroke-dashoffset .5s ease"/></svg>
      <div class="v">${o.label != null ? `<b style="font-size:${o.fs || Math.round(sz * .22)}px">${o.label}</b>` : ''}${o.sub ? `<small>${o.sub}</small>` : ''}</div></div>`;
  };
  E.spark = (vals, o) => {
    o = o || {}; if (vals.length < 2) return `<p class="empty" style="padding:14px">${o.empty || 'Two entries and the trend appears here.'}</p>`;
    const w = 320, h = o.h || 90, mn = Math.min(...vals, o.min != null ? o.min : Infinity), mx = Math.max(...vals), rg = mx - mn || 1;
    const pts = vals.map((v, i) => [i / (vals.length - 1) * w, 6 + (1 - (v - mn) / rg) * (h - 12)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px"><path d="${d} L${w} ${h} L0 ${h}Z" fill="var(--ember-bg)"/><path d="${d}" fill="none" stroke="var(--ember)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  };
})(window.E = window.E || {});
