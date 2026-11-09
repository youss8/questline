(function (Q) {
  'use strict';
  // Two-way link with the phone's calendar (Google Calendar syncs it). Questline dates are written
  // to the calendar; your own calendar events are read back and shown in Dates and on Today.
  const { esc, ic } = Q;
  const PC = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PhoneCalendar;
  const X = () => Q.X();
  if (!X().cal) X().cal = { on: false };
  Q.ui.phoneEv = [];
  const RR = { weekly: 'FREQ=WEEKLY', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' };
  const startMs = e => { const d = Q.parse(e.date); if (e.time) { const m = Q.toMin(e.time); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d.getTime(); } return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };

  const push = async e => { const p = PC(); if (!p || !X().cal.on) return; try { await p.upsert({ key: 'ev:' + e.id, title: e.title, note: e.note || '', start: startMs(e), allDay: !e.time, rrule: RR[e.repeat] || '' }); } catch (err) { /* ignore */ } };
  const remove = async id => { const p = PC(); if (!p || !X().cal.on) return; try { await p.remove({ key: 'ev:' + id }); } catch (err) { /* ignore */ } };
  Q.pullPhoneEvents = async () => {
    const p = PC(); if (!p || !X().cal.on) return;
    try {
      const from = Q.parse(Q.today()).getTime(), r = await p.list({ from, to: from + 30 * 864e5 });
      Q.ui.phoneEv = (r.events || []).map(e => { const d = new Date(e.begin); return { title: e.title || '(no title)', date: e.allDay ? new Date(d.getTime() + d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : Q.ymd(d), time: e.allDay ? null : Q.pad(d.getHours()) + ':' + Q.pad(d.getMinutes()) }; });
      if (['life', 'today'].includes(Q.ui.tab)) Q.render();
    } catch (err) { /* ignore */ }
  };
  Q.calCard = () => {
    if (!PC()) return '';
    const on = X().cal.on, ev = Q.ui.phoneEv || [];
    if (!on) return `<section class="card" style="display:flex;gap:12px;align-items:center"><div class="dot" style="--dc:#38bdf8">${ic('calendar-days')}</div><div class="li-m" style="flex:1"><b>Connect Google Calendar</b><small class="muted">Through your phone's calendar. No internet needed in Questline.</small></div><button class="btn primary" data-act="cal-on">Connect</button></section>`;
    return `<div class="sec"><span>From your calendar</span><button class="chip" data-act="cal-off">Disconnect</button></div><section class="card">${ev.slice(0, 15).map(e => Q.li({ icon: 'calendar', color: '#38bdf8', title: esc(e.title), sub: `${Q.whenLabel(e.date)}${e.time ? ' · ' + e.time : ''}` })).join('') || '<p class="empty">No calendar events in the next 30 days.</p>'}</section>`;
  };
  Q.phoneToday = () => (Q.ui.phoneEv || []).filter(e => e.date === Q.today());
  Q.ACTS['cal-on'] = async () => {
    const p = PC(); if (!p) return;
    const r = await p.access().catch(() => ({ granted: false }));
    if (!r.granted) { Q.toast('Calendar permission was not given'); return; }
    X().cal.on = true; Q.save();
    for (const e of X().events) await push(e);
    await Q.pullPhoneEvents(); Q.toast('Calendar connected'); Q.render();
  };
  Q.ACTS['cal-off'] = () => { X().cal.on = false; Q.ui.phoneEv = []; Q.save(); Q.render(); };
  const save = Q.ACTS['ev-save'], del = Q.ACTS['ev-del'];
  Q.ACTS['ev-save'] = el => { const before = new Set(X().events.map(e => e.id)); save(el); const e = X().events.find(z => z.id === el.dataset.id) || X().events.find(z => !before.has(z.id)); if (e) push(e).then(Q.pullPhoneEvents); };
  Q.ACTS['ev-del'] = el => { const id = el.dataset.id; del(el); remove(id); };
  Q.initCalendar = () => {
    Q.pullPhoneEvents();
    const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (A) A.addListener('resume', () => Q.pullPhoneEvents());
  };
})(window.Q);
