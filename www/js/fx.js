(function (Q) {
  'use strict';
  const { $, esc } = Q;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- particles (soft sparks) ----------
  let cv = null, cx = null, parts = [], raf = 0;
  function ensure() {
    if (cv) return;
    cv = document.createElement('canvas'); cv.id = 'fx';
    document.body.appendChild(cv); cx = cv.getContext('2d');
    const rs = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
    rs(); addEventListener('resize', rs);
  }
  function loop() {
    cx.clearRect(0, 0, cv.width, cv.height);
    const k = devicePixelRatio;
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.vy += p.g; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.life--;
      const a = Math.min(1, p.life / 25);
      cx.globalAlpha = a;
      cx.fillStyle = p.c;
      cx.beginPath();
      if (p.shape === 'rect') { cx.save(); cx.translate(p.x * k, p.y * k); cx.rotate(p.rot += p.vr); cx.fillRect(-p.s * k, -p.s * k * 0.4, p.s * 2 * k, p.s * 0.8 * k); cx.restore(); }
      else { cx.arc(p.x * k, p.y * k, p.s * k, 0, Math.PI * 2); cx.fill(); }
    }
    cx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
  const GOLD = ['#f0d394', '#d4af6a', '#fff3d6', '#c4954a'];
  Q.burst = (x, y, opts) => {
    if (reduced()) return;
    ensure();
    const o = Object.assign({ n: 16, colors: GOLD, speed: 3.6, size: 2.2, g: 0.08, life: 45 }, opts);
    for (let i = 0; i < o.n; i++) {
      const a = Math.random() * Math.PI * 2, v = o.speed * (0.35 + Math.random());
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - o.speed * 0.4, g: o.g, s: o.size * (0.6 + Math.random() * 0.8), c: o.colors[i % o.colors.length], life: o.life + Math.random() * 20 });
    }
    if (!raf) raf = requestAnimationFrame(loop);
  };
  Q.burstAt = (el, opts) => { if (!el) return; const r = el.getBoundingClientRect(); Q.burst(r.left + r.width / 2, r.top + r.height / 2, opts); };
  Q.confetti = () => {
    if (reduced()) return;
    ensure();
    for (let i = 0; i < 70; i++) parts.push({ shape: 'rect', x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.3, vx: (Math.random() - 0.5) * 1.6, vy: 1.5 + Math.random() * 2.5, g: 0.03, s: 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, c: GOLD[i % 4], life: 160 + Math.random() * 60 });
    if (!raf) raf = requestAnimationFrame(loop);
  };

  Q.floatText = (el, text, cls) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'floaty ' + (cls || '');
    f.textContent = text;
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  };
  Q.shake = (el, cls) => { if (!el) return; el.classList.remove(cls || 'shake'); void el.offsetWidth; el.classList.add(cls || 'shake'); };

  // ---------- toasts / banners ----------
  let tt, bt;
  Q.toast = msg => {
    const el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2600);
  };
  Q.banner = (msg, icon) => {
    const el = $('#banner'); if (!el) return;
    el.innerHTML = `<span class="bn-ic">${Q.ic(icon || 'award')}</span><div><small>Achievement unlocked</small><b>${esc(msg)}</b></div>`;
    el.classList.add('show');
    clearTimeout(bt); bt = setTimeout(() => el.classList.remove('show'), 3400);
  };

  let combo = 0, comboT = 0;
  Q.comboHit = () => {
    const now = Date.now();
    combo = now - comboT < 9000 ? combo + 1 : 1; comboT = now;
    if (combo >= 2) {
      let el = $('#combo');
      if (!el) { el = document.createElement('div'); el.id = 'combo'; document.body.appendChild(el); }
      el.innerHTML = `<small>Streak combo</small>×${combo}`;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      Q.sfx('combo', combo);
    }
  };

  // ---------- sheets ----------
  Q.sheet = (html, opts) => {
    Q.closeSheet();
    const el = document.createElement('div');
    el.className = 'scrim' + (opts && opts.full ? ' full' : '');
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    if (!(opts && opts.lock)) el.addEventListener('click', e => { if (e.target === el) Q.closeSheet(); });
    document.body.appendChild(el);
    return el.firstElementChild;
  };
  Q.closeSheet = () => { document.querySelectorAll('.scrim').forEach(n => n.remove()); };
  Q.confirm = (title, msg, okLabel, cb, danger) => {
    Q._confirmCb = cb;
    Q.sheet(`<h3>${esc(title)}</h3><p class="muted">${esc(msg)}</p>
      <div class="actions"><button class="btn ghost" data-act="sheet-close">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-act="confirm-yes">${esc(okLabel)}</button></div>`);
  };

  // ---------- overlays ----------
  Q.queue = [];
  Q.overlay = item => {
    const el = document.createElement('div');
    el.className = 'ovl ' + (item.cls || '');
    el.innerHTML = `<div class="ovl-in">${item.html}${item.noBtn ? '' : `<button class="btn primary wide big" data-act="ovl-close">${esc(item.btn || 'Continue')}</button>`}</div>`;
    document.body.appendChild(el);
    if (item.sfx) Q.sfx(item.sfx);
    if (item.confetti) setTimeout(Q.confetti, 200);
    Q.buzz([20, 40, 60]);
    if (item.after) item.after(el);
  };
  Q.showQueue = items => { Q.queue.push(...items); if (!document.querySelector('.ovl')) Q.nextOverlay(); };
  Q.nextOverlay = () => { const n = Q.queue.shift(); if (n) Q.overlay(n); };
  Q.closeOverlay = () => { const o = document.querySelector('.ovl'); if (o) o.remove(); Q.nextOverlay(); };

  // ---------- emblem: level ring + rank insignia ----------
  Q.insignia = (rank, size) => {
    const c = rank.color, n = rank.chev || 1, st = rank.star || 0;
    let paths = '';
    const top = 44 - (n - 1) * 5 + (st ? 6 : 0);
    for (let i = 0; i < n; i++) { const y = top + i * 10; paths += `<path d="M30 ${y} L50 ${y + 9} L70 ${y}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`; }
    const star = (cx, cy, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return `<path d="${d}Z" fill="${c}"/>`; };
    const sy = top - 13;
    if (st === 1) paths += star(50, sy, 7);
    if (st === 2) paths += star(41, sy, 6) + star(59, sy, 6);
    if (st === 3) paths += star(36, sy + 2, 5.5) + star(50, sy - 2, 7) + star(64, sy + 2, 5.5);
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${paths}</svg>`;
  };
  Q.emblem = (g, size, cls) => {
    size = size || 56;
    const p = Math.max(0.02, Math.min(1, (g.xp - g.lvlStart) / (g.lvlNext - g.lvlStart)));
    const r = 44, C = 2 * Math.PI * r;
    return `<div class="emblem ${cls || ''}" style="width:${size}px;height:${size}px;--rc:${g.rank.color}">
      <svg viewBox="0 0 100 100" class="em-ring"><defs><linearGradient id="emg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d394"/><stop offset="1" stop-color="#b8893f"/></linearGradient></defs>
        <circle cx="50" cy="50" r="${r}" class="em-track"/><circle cx="50" cy="50" r="${r}" class="em-prog" stroke="url(#emg)" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}"/></svg>
      <div class="em-core">${Q.insignia(g.rank, Math.round(size * 0.62))}</div></div>`;
  };

  Q.oppIcon = (m, cls, pctLeft) => {
    const r = 46, C = 2 * Math.PI * r, p = pctLeft == null ? 1 : pctLeft / 100;
    return `<div class="opp ${cls || ''}"><svg viewBox="0 0 100 100" class="opp-ring"><circle cx="50" cy="50" r="${r}" class="opp-track"/><circle cx="50" cy="50" r="${r}" class="opp-hp" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}"/></svg><div class="opp-core">${Q.ic(m.icon)}</div></div>`;
  };

  Q.levelOverlay = (g, rankUp) => ({
    cls: 'lvl' + (rankUp ? ' rankup' : ''), sfx: 'level', confetti: true,
    html: `<div class="ovl-kicker">${rankUp ? 'Rank up' : 'Level up'}</div>
      <div class="ovl-stage"><div class="rays"></div>${Q.emblem(g, 150, 'big')}</div>
      <div class="ovl-num" data-count="${g.level}">${g.level}</div>
      ${rankUp ? `<p>You are now <b style="color:${g.rank.color}">${g.rank.name}</b>, rank ${g.rank.r}. New insignia unlocked.</p>` : `<p>Next rank at level ${(Q.RANKS[g.rank.i + 1] || { from: '—' }).from}.</p>`}`,
    after: el => countUp(el.querySelector('.ovl-num'), Math.max(1, g.level - 1), g.level)
  });
  function countUp(el, from, to) { if (!el) return; let v = from; el.textContent = v; const t = setInterval(() => { v++; el.textContent = v; if (v >= to) clearInterval(t); }, 120); }

  Q.bossOverlay = (info, g) => {
    const m = Q.monsterFor(info.date);
    return {
      cls: 'win', sfx: 'defeat',
      html: `<div class="ovl-kicker">Day won</div>
        <div class="ovl-stage">${Q.oppIcon(m, 'big defeated', 0)}</div>
        <h2>${esc(m.name)} defeated</h2>
        <div class="ovl-chips">${info.perfect ? '<span class="chip gold">Flawless +25%</span>' : ''}${info.comebackWon ? '<span class="chip gold">Comeback +40</span>' : ''}${info.bonus ? `<span class="chip">+${info.bonus} bonus XP</span>` : ''}<span class="chip">Streak ${g.cur}</span></div>
        <p class="muted">A reward drop is waiting on your Today screen.</p>`
    };
  };
  Q.weekBossOverlay = g => ({
    cls: 'win', sfx: 'defeat', confetti: true,
    html: `<div class="ovl-kicker">Weekly gauntlet cleared</div><div class="ovl-stage">${Q.oppIcon(g.week.boss, 'big defeated', 0)}</div>
      <h2>${esc(g.week.boss.name)}</h2><p class="muted">+100 XP and a guaranteed epic artifact.</p>`
  });
})(window.Q);
