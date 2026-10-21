(function (Q) {
  'use strict';
  const plugins = () => (window.Capacitor && window.Capacitor.Plugins) || {};
  const LN = () => plugins().LocalNotifications;
  Q.isNative = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());

  async function perm(ln, ask) {
    try {
      let p = await ln.checkPermissions();
      if (p.display !== 'granted' && ask) p = await ln.requestPermissions();
      return p.display === 'granted';
    } catch (e) { return false; }
  }
  Q.ensureNotifPermission = async () => { const ln = LN(); return ln ? perm(ln, true) : false; };

  const at = (d, hhmm) => { const x = Q.parse(d); const m = Q.toMin(hhmm); x.setHours(Math.floor(m / 60), m % 60, 0, 0); return x; };

  // Builds the next 7 days of reminders from current progress. Runs after every change (debounced),
  // so the evening warning disappears once today's monster is beaten, and finished quests don't nag.
  const atMin = (d, m) => { const x = Q.parse(d); x.setHours(0, 0, 0, 0); return new Date(x.getTime() + m * 60000); };

  // Builds the next 7 days of reminders from the day plans. Runs after every change (debounced), so finished
  // quests stop nagging and the evening warning disappears once today's opponent is beaten.
  Q.buildNotifications = () => {
    const S = Q.S, s = S.settings, now = Q._now(), out = [];
    if (!s.remindersOn || !S.hero.onboarded) return out;
    const g = Q.game(), t = Q.today();
    for (let i = 0; i < 7; i++) {
      const d = Q.addDays(t, i), base = 10000 + i * 100, plan = Q.planDay(d);
      const info = i === 0 ? g.days[t] : Q.dayInfo(d);
      const nq = plan.items.filter(x => x.kind === 'quest').length + plan.allday.length;
      if (nq) out.push({ id: base + 1, title: 'Your day is planned', body: `${nq} quests and ${Q.mealSlots().length} meals scheduled around your commitments.`, at: atMin(d, plan.start + 5) });
      if (nq && !(i === 0 && info && info.defeated)) {
        const left = i === 0 && info ? Math.max(0, info.hp - info.doneXp) : 0;
        out.push({ id: base + 2, title: 'Today\'s opponent is still standing', body: left ? `${left} resistance left. A few quests before midnight finishes it.` : 'Finish your quests before midnight to win the day.', at: at(d, s.evening) });
      }
      if (s.bedRemind) out.push({ id: base + 3, title: 'Lights out in 30 minutes', body: 'Screens down. Tomorrow starts tonight.', at: atMin(d, plan.end - 30) });
      let j = 0;
      for (const it of plan.items) {
        if (j > 60) break;
        if (it.kind === 'quest' && it.s != null && !it.anchor) {
          const q = it.q, v = Q.getLog(d, q.id);
          if (i === 0 && (Q.isDone(q, v, d) || v === 's')) continue;
          if (!(s.autoRemind || q.remind)) continue;
          const when = q.remind ? Q.toMin(q.remind) : it.s;
          out.push({ id: base + 10 + j++, title: Q.qName(q, d), body: `Scheduled ${Q.fmtTime(it.s)}–${Q.fmtTime(it.e)}. Short on time? ${q.mini || 'Do 2 minutes.'}`, at: atMin(d, when) });
        }
        if (it.kind === 'meal' && s.mealRemind && !it.meal.empty) {
          const mp = Q.mealPlan(d).meals.find(m => m.slot === it.meal.slot);
          if (!mp || mp.empty || (i === 0 && Q.mealLog(d)[mp.slot])) continue;
          out.push({ id: base + 10 + j++, title: `${mp.label}: ${mp.tpl.name}`, body: `${mp.k} kcal · ${mp.p} g protein. Open Fuel for portions.`, at: atMin(d, it.s) });
        }
      }
    }
    return out.filter(n => n.at > now);
  };

  let busy = false;
  Q.rescheduleNotifications = async () => {
    const ln = LN(); if (!ln || busy) return;
    busy = true;
    try {
      const pend = await ln.getPending();
      const old = (pend.notifications || []).filter(n => n.id !== 3);
      if (old.length) await ln.cancel({ notifications: old.map(n => ({ id: n.id })) });
      const list = Q.buildNotifications();
      if (list.length && await perm(ln, false)) {
        await ln.schedule({ notifications: list.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true } })) });
      }
    } catch (e) { console.warn('notifications', e); }
    busy = false;
  };

  Q.scheduleFocusNote = async endMs => {
    const ln = LN(); if (!ln) return;
    try {
      if (!(await perm(ln, true))) return;
      await ln.cancel({ notifications: [{ id: 3 }] });
      await ln.schedule({ notifications: [{ id: 3, title: '🎯 Focus session complete', body: 'Open Questline to claim your XP.', schedule: { at: new Date(endMs), allowWhileIdle: true } }] });
    } catch (e) { /* ignore */ }
  };
  Q.cancelFocusNote = async () => { const ln = LN(); if (ln) { try { await ln.cancel({ notifications: [{ id: 3 }] }); } catch (e) { /* ignore */ } } };

  Q.exportBackup = async () => {
    const json = JSON.stringify(Q.S, null, 2);
    const name = `questline-backup-${Q.today()}.json`;
    const P = plugins();
    if (P.Filesystem && P.Share) {
      try {
        const r = await P.Filesystem.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
        await P.Share.share({ title: 'Questline backup', url: r.uri, dialogTitle: 'Save your backup' });
        return true;
      } catch (e) {
        if (String((e && e.message) || e).toLowerCase().includes('cancel')) return false;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    return true;
  };
})(window.Q);
