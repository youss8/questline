window.Q = window.Q || {};
(function (Q) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  Q.pad = pad;
  Q.ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  Q.parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  Q.addDays = (s, n) => { const d = Q.parse(s); d.setDate(d.getDate() + n); return Q.ymd(d); };
  Q.diffDays = (a, b) => Math.round((Q.parse(a) - Q.parse(b)) / 864e5);
  Q._now = () => new Date();
  Q.today = () => Q.ymd(Q._now());
  Q.dow = s => Q.parse(s).getDay(); // 0 = Sunday
  Q.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Q.$ = (s, el) => (el || document).querySelector(s);
  Q.$$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  Q.uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  Q.fmt = n => Number.isInteger(n) ? n.toLocaleString('en-US') : String(Math.round(n * 10) / 10);
  Q.money = (n, c) => `${c == null ? '$' : c}${Math.round(n).toLocaleString('en-US')}`;
  Q.clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  Q.val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  Q.hash = str => { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  Q.rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  Q.pct = (a, b) => b > 0 ? Math.max(0, Math.min(100, Math.round(a / b * 100))) : 0;
  // "HH:MM" <-> minutes since midnight (times after midnight wrap, e.g. 00:30 = 1470 when "late")
  Q.toMin = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
  Q.fromMin = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
  Q.niceDate = (d, o) => Q.parse(d).toLocaleDateString('en-GB', o || { weekday: 'short', day: 'numeric', month: 'short' });
})(window.Q);
