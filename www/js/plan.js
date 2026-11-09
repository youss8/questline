(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;
  const area = id => S().areas.find(a => a.id === id) || S().areas[S().areas.length - 1];

  function agendaView() {
    const t = E.today(), sel = E.ui.day || t, start = E.add(t, -1);
    const days = Array.from({ length: 7 }, (_, i) => E.add(start, i));
    const has = d => E.agenda(d).some(a => a.kind !== 'block');
    const ag = E.agenda(sel);
    const undated = S().tasks.filter(k => !k.done && !k.due).length;
    const overdue = S().tasks.filter(k => !k.done && k.due && k.due < t);
    return `<div class="days">${days.map(d => `<button class="${d === sel ? 'on' : ''} ${has(d) ? 'has' : ''}" data-a="pick-day" data-d="${d}">${E.fmtDate(d, { weekday: 'short' })}<b>${E.parse(d).getDate()}</b><i></i></button>`).join('')}</div>
      <div class="row" style="margin:12px 2px 0"><button class="pill" data-a="pick-date">${ic('calendar')} ${E.rel(sel)}</button>${sel !== t ? `<button class="pill ember" data-a="pick-day" data-d="${t}">Back to today</button>` : ''}</div>
      ${sel === t && overdue.length ? `<div class="sec"><h2 class="bad">Overdue</h2></div><div class="list">${overdue.map(taskRow).join('')}</div>` : ''}
      ${E.secH(E.rel(sel), 'Add', 'add-for-day', `data-d="${sel}"`)}
      <div class="list agenda">${ag.map(a => a.kind === 'task' ? taskRow(S().tasks.find(k => k.id === a.id)) : E.agendaRow(a)).join('') || `<p class="empty">${ic('calendar')}Nothing planned.</p>`}</div>
      ${undated ? `<button class="card" style="display:block;width:100%;text-align:left;margin-top:12px" data-a="seg" data-k="plan" data-v="tasks"><div class="row"><div class="ico" style="--c:var(--muted)">${ic('inbox')}</div><div class="grow"><div class="card-t">${undated} task${undated === 1 ? '' : 's'} without a date</div><div class="small muted">Give them a day so they happen</div></div>${ic('chevron-right', 'dim')}</div></button>` : ''}`;
  }
  E.A['pick-day'] = el => { E.ui.day = el.dataset.d; E.render(); };
  E.A['pick-date'] = () => E.sheet({ title: 'Go to a date', body: `<input type="date" id="pd" value="${E.ui.day || E.today()}">`, foot: `<button class="btn primary" data-a="pd-go">Go</button>` });
  E.A['pd-go'] = () => { const v = E.val('pd'); if (v) E.ui.day = v; E.close(true); E.render(); };
  E.A['add-for-day'] = el => E.sheet({ title: 'Add to ' + E.rel(el.dataset.d), body: `<div class="list">${E.item({ a: 'new-task', attrs: `data-d="${el.dataset.d}"`, icon: 'list-checks', t: 'Task', s: 'Something to do' })}${E.item({ a: 'new-event', attrs: `data-d="${el.dataset.d}"`, icon: 'calendar-check', c: 'var(--rose)', t: 'Date or event', s: 'Birthday, appointment, meeting…' })}</div>` });
  E.A['ag-open'] = el => { const k = el.dataset.kind, id = el.dataset.id; if (k === 'event') E.A['edit-event']({ dataset: { id } }); else if (k === 'sub') E.go('money'); else if (k === 'block') E.A['edit-block']({ dataset: { id } }); };

  // ---------- tasks ----------
  const taskRow = k => {
    if (!k) return '';
    const a = area(k.area), late = k.due && k.due < E.today() && !k.done;
    return `<div class="habit ${k.done ? 'done' : ''}"><button class="check ${k.done ? 'on' : ''}" data-a="task-done" data-id="${k.id}" style="width:36px;height:36px;border-radius:12px">${k.done ? ic('check') : ''}</button>
      <button class="grow tap" style="text-align:left" data-a="edit-task" data-id="${k.id}"><div class="t">${k.pri ? '<span class="ember">●</span> ' : ''}${esc(k.t)}</div><div class="s"><span style="color:${a.c}">${esc(a.name)}</span>${k.due ? ` · <span class="${late ? 'bad' : ''}">${E.rel(k.due)}</span>` : ''}${k.time ? ' · ' + E.time12(k.time) : ''}${k.repeat && k.repeat !== 'none' ? ' · repeats ' + k.repeat : ''}</div></button></div>`;
  };
  E.taskRow = taskRow;
  function tasksView() {
    const f = E.ui.area || 'all', open = S().tasks.filter(k => !k.done && (f === 'all' || k.area === f));
    open.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (b.pri || 0) - (a.pri || 0));
    const done = S().tasks.filter(k => k.done && (f === 'all' || k.area === f)).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 8);
    return `<div class="scrollx">${[['all', 'All']].concat(S().areas.map(a => [a.id, a.name])).map(([v, l]) => `<button class="chip ${v === f ? 'on' : ''}" data-a="area" data-v="${v}">${esc(l)} <span class="dim">${S().tasks.filter(k => !k.done && (v === 'all' || k.area === v)).length || ''}</span></button>`).join('')}</div>
      <div class="list" style="margin-top:14px">${open.map(taskRow).join('') || `<p class="empty">${ic('circle-check')}Nothing open here.</p>`}</div>
      <button class="btn ghost wide" style="margin-top:12px" data-a="new-task">${ic('plus')} New task</button>
      ${done.length ? E.secH('Done recently') + `<div class="list">${done.map(taskRow).join('')}</div>` : ''}`;
  }
  E.A.area = el => { E.ui.area = el.dataset.v; E.render(); };
  const taskForm = (k, d) => {
    k = k || {}; const ar = k.area || (E.ui.area && E.ui.area !== 'all' ? E.ui.area : 'personal');
    E.sheet({ title: k.id ? 'Edit task' : 'New task', body: `
      ${E.field('', `<input id="tk-t" value="${esc(k.t || '')}" placeholder="What needs doing?" autocomplete="off">`)}
      ${E.field('Area', E.chips('tk-a', S().areas.map(a => [a.id, a.name]), ar))}
      ${E.field('When', E.chips('tk-wq', [['', 'No date'], [E.today(), 'Today'], [E.add(E.today(), 1), 'Tomorrow'], ['pick', 'Pick a date']], k.due ? (k.due === E.today() ? E.today() : k.due === E.add(E.today(), 1) ? E.add(E.today(), 1) : 'pick') : (d || ''), { change: 'tk-when' }))}
      <div id="tk-dbox" style="${k.due && k.due !== E.today() && k.due !== E.add(E.today(), 1) ? '' : 'display:none'}">${E.field('Date', `<input type="date" id="tk-d" value="${k.due || d || E.today()}">`)}</div>
      <div class="grid2">${E.field('Time (optional)', `<input type="time" id="tk-h" value="${k.time || ''}">`)}${E.field('Repeats', `<select id="tk-r">${E.opts([['none', 'No'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']], k.repeat || 'none')}</select>`)}</div>
      <label class="row" style="margin:4px 4px 14px"><input type="checkbox" id="tk-p" ${k.pri ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--ember)"><span>Important</span></label>
      ${E.field('Notes', `<textarea id="tk-n" rows="2" placeholder="Optional">${esc(k.notes || '')}</textarea>`)}
      <p class="hint">Reminder 1 day before and 2 hours before (or that morning if there's no time).</p>`,
      foot: `${k.id ? `<button class="btn danger" data-a="del-task" data-id="${k.id}">Delete</button>` : '<button class="btn ghost" data-a="close">Cancel</button>'}<button class="btn primary" data-a="save-task" data-id="${k.id || ''}">Save</button>`, focus: k.id ? null : 'tk-t' });
    if (d && d !== E.today() && d !== E.add(E.today(), 1)) { const box = E.$('#tk-dbox'); if (box) box.style.display = ''; }
  };
  E.A['tk-when'] = b => { E.$('#tk-dbox').style.display = b.dataset.v === 'pick' ? '' : 'none'; };
  E.A['new-task'] = el => { E.close(true); taskForm(null, el && el.dataset && el.dataset.d); };
  E.A['edit-task'] = el => taskForm(S().tasks.find(k => k.id === el.dataset.id));
  E.A['save-task'] = el => {
    const t = E.val('tk-t'); if (!t) { E.toast('Write the task first'); return; }
    let k = S().tasks.find(x => x.id === el.dataset.id); if (!k) { k = { id: E.uid(), done: false, created: E.today() }; S().tasks.push(k); }
    const wq = E.val('tk-wq');
    Object.assign(k, { t, area: E.val('tk-a') || 'personal', due: wq === 'pick' ? E.val('tk-d') : (wq || null), time: E.val('tk-h') || null, repeat: E.val('tk-r'), pri: E.$('#tk-p').checked, notes: E.val('tk-n') });
    E.save(); E.close(true); E.toast(el.dataset.id ? 'Saved' : 'Task added'); E.render();
  };
  E.A['del-task'] = el => { const i = S().tasks.findIndex(k => k.id === el.dataset.id), k = S().tasks[i]; S().tasks.splice(i, 1); E.save(); E.close(true); E.render(); E.toast('Task deleted', () => S().tasks.splice(i, 0, k)); };
  E.A['task-done'] = el => {
    const k = S().tasks.find(x => x.id === el.dataset.id); if (!k) return;
    if (!k.done && k.repeat && k.repeat !== 'none' && k.due) { S().tasks.push({ ...k, id: E.uid(), done: true, doneAt: E.today(), repeat: 'none' }); k.due = E.nextOcc(k.due, k.repeat, E.add(k.due, 1)); E.toast(`Done. Next: ${E.rel(k.due)}`); }
    else { k.done = !k.done; k.doneAt = k.done ? E.today() : null; if (k.done) E.toast('Done ✓', () => { k.done = false; k.doneAt = null; }); }
    E.buzz(12); E.save(); E.render();
  };

  // ---------- important: dates + notes ----------
  function importantView() {
    const t = E.today();
    const up = S().events.map(e => ({ e, d: E.nextOcc(e.date, e.repeat, t) })).filter(o => o.d).sort((a, b) => a.d.localeCompare(b.d));
    const past = S().events.filter(e => !E.nextOcc(e.date, e.repeat, t));
    return `<p class="hint" style="margin-top:0">Everything you don't want to forget: birthdays, anniversaries, appointments, and notes like passwords hints, sizes, gift ideas.</p>
      ${E.secH('Dates', 'Add', 'new-event')}
      <div class="list">${up.map(({ e, d }) => { const k = E.evKind(e.kind), n = E.diff(d, t); return E.item({ a: 'edit-event', id: e.id, icon: k.icon, c: k.c, t: esc(e.title), s: `${E.fmtDate(d, { weekday: 'short', day: 'numeric', month: 'long' })}${e.time ? ' · ' + E.time12(e.time) : ''}${e.repeat === 'yearly' ? ' · every year' : e.repeat && e.repeat !== 'none' ? ' · ' + e.repeat : ''}`, r: n === 0 ? '<span class="ember">Today</span>' : n === 1 ? 'Tomorrow' : `${n}<small>days</small>` }); }).join('') || `<p class="empty">${ic('gift')}Add birthdays, your anniversary, your baby's milestones, appointments. You'll get a reminder the day before and 2 hours before.</p>`}</div>
      ${past.length ? `<details class="list" style="margin-top:10px"><summary class="item" style="list-style:none"><div class="grow muted">Past dates (${past.length})</div>${ic('chevron-down', 'dim')}</summary>${past.map(e => E.item({ a: 'edit-event', id: e.id, t: esc(e.title), s: E.fmtDate(e.date) })).join('')}</details>` : ''}
      ${E.secH('Notes', 'Add', 'new-note')}
      <div class="list">${S().notes.slice().sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.t - a.t).map(n => E.item({ a: 'edit-note', id: n.id, icon: n.pin ? 'bookmark' : 'notebook-pen', c: 'var(--sand)', t: esc(n.title || 'Note'), s: esc((n.body || '').slice(0, 80)) })).join('') || `<p class="empty">${ic('notebook-pen')}Keep anything important here.</p>`}</div>`;
  }
  const evForm = (e, d) => {
    e = e || {};
    E.sheet({ title: e.id ? 'Edit date' : 'New date', body: `
      ${E.field('', `<input id="ev-t" value="${esc(e.title || '')}" placeholder="e.g. Miryam's birthday" autocomplete="off">`)}
      ${E.field('Type', E.chips('ev-k', E.EVKINDS.map(k => [k.id, k.n, k.icon]), e.kind || 'other'))}
      <div class="grid2">${E.field('Date', `<input type="date" id="ev-d" value="${e.date || d || E.today()}">`)}${E.field('Time (optional)', `<input type="time" id="ev-h" value="${e.time || ''}">`)}</div>
      ${E.field('Repeats', E.chips('ev-r', [['none', 'Once'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Every year']], e.repeat || 'none'))}
      ${E.field('Note', `<input id="ev-n" value="${esc(e.note || '')}" placeholder="Gift idea, place, what to bring…">`)}
      <p class="hint">Reminders: 1 day before and 2 hours before.</p>`,
      foot: `${e.id ? `<button class="btn danger" data-a="del-event" data-id="${e.id}">Delete</button>` : '<button class="btn ghost" data-a="close">Cancel</button>'}<button class="btn primary" data-a="save-event" data-id="${e.id || ''}">Save</button>`, focus: e.id ? null : 'ev-t' });
  };
  E.A['new-event'] = el => { E.close(true); E.prepDone('dates'); evForm(null, el && el.dataset && el.dataset.d); };
  E.A['edit-event'] = el => evForm(S().events.find(e => e.id === el.dataset.id));
  E.A['save-event'] = el => {
    const title = E.val('ev-t'), date = E.val('ev-d'); if (!title || !date) { E.toast('Add a name and a date'); return; }
    let e = S().events.find(x => x.id === el.dataset.id); if (!e) { e = { id: E.uid() }; S().events.push(e); }
    Object.assign(e, { title, date, kind: E.val('ev-k') || 'other', time: E.val('ev-h') || null, repeat: E.val('ev-r') || 'none', note: E.val('ev-n') });
    E.save(); E.close(true); E.toast('Saved'); E.render(); if (E.calPush) E.calPush(e);
  };
  E.A['del-event'] = el => { const i = S().events.findIndex(e => e.id === el.dataset.id), e = S().events[i]; S().events.splice(i, 1); E.save(); E.close(true); E.render(); if (E.calRemove) E.calRemove(e.id); E.toast('Deleted', () => S().events.splice(i, 0, e)); };
  const noteForm = n => { n = n || {}; E.sheet({ title: n.id ? 'Note' : 'New note', full: true, body: `${E.field('', `<input id="nt-t" value="${esc(n.title || '')}" placeholder="Title">`)}${E.field('', `<textarea id="nt-b" rows="10" placeholder="Write anything…">${esc(n.body || '')}</textarea>`)}<label class="row" style="margin:4px"><input type="checkbox" id="nt-p" ${n.pin ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--ember)"><span>Pin to top</span></label>`, foot: `${n.id ? `<button class="btn danger" data-a="del-note" data-id="${n.id}">Delete</button>` : '<button class="btn ghost" data-a="close">Cancel</button>'}<button class="btn primary" data-a="save-note" data-id="${n.id || ''}">Save</button>`, focus: n.id ? null : 'nt-t' }); };
  E.A['new-note'] = () => { E.close(true); noteForm(); };
  E.A['edit-note'] = el => noteForm(S().notes.find(n => n.id === el.dataset.id));
  E.A['save-note'] = el => { const title = E.val('nt-t'), body = E.$('#nt-b').value; if (!title && !body.trim()) { E.close(); return; } let n = S().notes.find(x => x.id === el.dataset.id); if (!n) { n = { id: E.uid() }; S().notes.push(n); } Object.assign(n, { title, body, pin: E.$('#nt-p').checked, t: Date.now() }); E.save(); E.close(true); E.render(); };
  E.A['del-note'] = el => { const i = S().notes.findIndex(n => n.id === el.dataset.id), n = S().notes[i]; S().notes.splice(i, 1); E.save(); E.close(true); E.render(); E.toast('Note deleted', () => S().notes.splice(i, 0, n)); };

  // ---------- weekly schedule blocks ----------
  E.A['edit-block'] = el => {
    const b = S().schedule.find(x => x.id === el.dataset.id) || {};
    E.sheet({ title: b.id ? 'Weekly block' : 'New weekly block', body: `
      ${E.field('Name', `<input id="bl-t" value="${esc(b.title || '')}" placeholder="e.g. Gym, class, meeting">`)}
      ${E.field('Days', E.chips('bl-d', [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']], (b.days || []).join(','), { multi: true }))}
      <div class="grid2">${E.field('From', `<input type="time" id="bl-s" value="${b.start || '09:00'}">`)}${E.field('To', `<input type="time" id="bl-e" value="${b.end || '10:00'}">`)}</div>`,
      foot: `${b.id ? `<button class="btn danger" data-a="del-block" data-id="${b.id}">Delete</button>` : '<button class="btn ghost" data-a="close">Cancel</button>'}<button class="btn primary" data-a="save-block" data-id="${b.id || ''}">Save</button>` });
  };
  E.A['save-block'] = el => { const title = E.val('bl-t'), days = E.val('bl-d').split(',').filter(Boolean).map(Number); if (!title || !days.length) { E.toast('Add a name and days'); return; } let b = S().schedule.find(x => x.id === el.dataset.id); if (!b) { b = { id: E.uid(), icon: 'clock', c: 'var(--slate)' }; S().schedule.push(b); } Object.assign(b, { title, days, start: E.val('bl-s'), end: E.val('bl-e') }); E.save(); E.close(true); E.render(); };
  E.A['del-block'] = el => { S().schedule = S().schedule.filter(b => b.id !== el.dataset.id); E.save(); E.close(true); E.render(); };
  function weekView() {
    const D = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];
    return `<p class="hint" style="margin-top:0">Your fixed week. Habits and reminders work around it.</p><div class="list">${S().schedule.filter(b => !b.meal).map(b => E.item({ a: 'edit-block', id: b.id, icon: b.icon, c: b.c, t: esc(b.title), s: `${D.filter(d => b.days.includes(d[0])).map(d => d[1]).join(', ')} · ${E.time12(b.start)}–${E.time12(b.end)}`, chev: true })).join('')}</div>
      <button class="btn ghost wide" style="margin-top:12px" data-a="edit-block" data-id="">${ic('plus')} Add a weekly block</button>
      ${E.secH('Meal times')}<div class="list">${S().schedule.filter(b => b.meal).map(b => E.item({ a: 'edit-block', id: b.id, icon: b.icon, c: b.c, t: esc(b.title), s: E.time12(b.start), chev: true })).join('')}</div>`;
  }

  E.screens.plan = () => {
    const sub = E.subOf('plan', 'agenda');
    return E.hdr('Plan', 'Your days, tasks and everything important') + E.seg('plan', [['agenda', 'Days'], ['tasks', 'Tasks'], ['important', 'Important'], ['week', 'Week']], sub) + '<div class="spacer"></div>' +
      (sub === 'tasks' ? tasksView() : sub === 'important' ? importantView() : sub === 'week' ? weekView() : agendaView()) + (E.calCard && sub === 'agenda' ? E.calCard() : '');
  };
})(window.E);
