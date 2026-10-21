(function (Q) {
  'use strict';

  Q.levelFor = xp => { let L = 1; while (xp >= 50 * (L + 1) * L) L++; return L; };
  Q.lvlStart = L => 50 * L * (L - 1);
  Q.lvlNext = L => 50 * (L + 1) * L;

  Q.dayInfo = function (d) {
    const S = Q.S, mode = Q.mode();
    let dueXp = 0, doneXp = 0, done = 0, minis = 0, skipped = 0;
    const items = [];
    const plan = S.hero.onboarded && S.program.start && d >= S.program.start ? Q.planDay(d) : null;
    const flexSet = new Set(plan ? plan.flex : []);
    let flexN = 0;
    for (const q of S.quests) {
      if (!Q.scheduledOn(q, d)) continue;
      const v = Q.getLog(d, q.id), xp = Q.DIFF[q.diff].xp;
      const off = q.key === 'meals' && S.nutri && S.nutri.off[d];
      if (v === 's' || off) { skipped++; items.push({ q, v, skip: true, off, done: false, mini: false, xp, got: 0 }); continue; }
      const dn = Q.isDone(q, v, d), mini = !dn && v === 'm';
      const got = dn ? xp : mini ? Math.round(xp / 2) : 0;
      // no free time for it today: optional bonus, doesn't count against the opponent
      const flex = flexSet.has(q.id);
      if (flex && !dn && !mini) { flexN++; items.push({ q, v, flex: true, done: false, mini: false, xp, got: 0 }); continue; }
      dueXp += xp; doneXp += got;
      if (dn) done++; if (mini) minis++;
      items.push({ q, v, done: dn, mini, xp, got, skip: false, flex });
    }
    const total = items.length - skipped - flexN;
    const ci = S.checkins[d];
    const low = !!(ci && ci.energy <= 2);
    const thr = Math.max(50, (S.settings.threshold || mode.threshold) - (low ? 15 : 0));
    const hp = Math.ceil(dueXp * thr / 100);
    return {
      date: d, items, total, done, minis, skipped, dueXp, doneXp, hp, low, thr,
      defeated: total > 0 && doneXp >= hp,
      perfect: total > 0 && done === total, flexN,
      bonus: 0, penalty: 0, shielded: false, comeback: false, comebackWon: false
    };
  };

  Q.lootFor = function (d, streak, perfect, minRarity) {
    const r = Q.rng(Q.hash('l' + d + (minRarity || '')));
    const roll = r() * 100;
    const leg = 1 + Math.min(4, streak / 7), epic = 7 + Math.min(8, streak / 3), rare = 22 + (perfect ? 15 : 0);
    let rarity = 'common';
    if (roll < leg) rarity = 'legendary'; else if (roll < leg + epic) rarity = 'epic'; else if (roll < leg + epic + rare) rarity = 'rare';
    if (perfect && rarity === 'common') rarity = 'rare';
    if (minRarity === 'epic' && (rarity === 'common' || rarity === 'rare')) rarity = 'epic';
    const pool = Q.LOOT[rarity], it = pool[Math.floor(r() * pool.length)];
    return { date: d, rarity, icon: it.icon, name: it.name };
  };

  Q.game = function () {
    const today = Q.today();
    if (Q._g && Q._gv === Q._ver && Q._gd === today) return Q._g;
    const S = Q.S, mode = Q.mode();
    const statXp = { str: 0, vit: 0, wis: 0, foc: 0, dis: 0, wea: 0 };
    const add = (st, n) => { statXp[st] = (statXp[st] || 0) + n; };
    let xp = 0, run = 0, best = 0, defeated = 0, perfect = 0, questsDone = 0, penalty = 0;
    let shields = 0, shieldsUsed = 0, chain = 0, pendingComeback = false, comebacks = 0;
    const days = {}, loot = [], weeks = {};

    const start0 = [S.hero.created, S.program.start, ...Object.keys(S.logs), ...S.quests.map(q => q.since)].filter(Boolean).sort()[0] || today;
    const start = start0 > today ? today : start0;
    const pStart = S.program.start || start;

    for (let d = start; d <= today; d = Q.addDays(d, 1)) {
      const info = Q.dayInfo(d);
      days[d] = info;
      for (const it of info.items) if (it.got) { xp += it.got; add(it.q.stat, it.got); if (it.done) questsDone++; }
      let bonus = 0;
      if (info.defeated) {
        run++; best = Math.max(best, run); defeated++; chain++;
        if (chain % 7 === 0) shields = Math.min(mode.shields, shields + 1);
        bonus += Math.min(50, run * 5);
        if (pendingComeback) { bonus += 40; comebacks++; info.comebackWon = true; pendingComeback = false; }
        loot.push(Q.lootFor(d, run, info.perfect));
        const w = Math.floor(Q.diffDays(d, pStart) / 7);
        weeks[w] = (weeks[w] || 0) + 1;
      } else if (info.total > 0 && d < today) {
        if (shields > 0 && run > 0) { shields--; shieldsUsed++; info.shielded = true; chain = 0; }
        else {
          if (run > 0) pendingComeback = true;
          run = 0; chain = 0;
          if (mode.penalty) { info.penalty = Math.round(info.dueXp * mode.penalty); penalty += info.penalty; }
        }
      }
      if (d === today && pendingComeback && info.total > 0) info.comeback = true;
      if (info.perfect) bonus += Math.round(info.dueXp * 0.25);
      if (bonus) { xp += bonus; add('dis', bonus); }
      info.bonus = bonus;
    }

    // weekly bosses
    let weekBosses = 0;
    const weekLoot = [];
    for (const w of Object.keys(weeks)) if (weeks[w] >= mode.weekKills) {
      weekBosses++; xp += 100; add('str', 50); add('dis', 50);
      const wd = Q.addDays(pStart, +w * 7);
      weekLoot.push(Q.lootFor('w' + wd, 7, true, 'epic'));
    }
    const curWeek = Math.max(0, Math.floor(Q.diffDays(today, pStart) / 7));
    const week = {
      i: curWeek, kills: weeks[curWeek] || 0, need: mode.weekKills,
      boss: Q.GAUNTLETS[curWeek % Q.GAUNTLETS.length],
      end: Q.addDays(pStart, curWeek * 7 + 6)
    };
    week.defeated = week.kills >= week.need;

    let bonusN = 0;
    for (const d in S.bonus) if (S.bonus[d]) { const b = Q.bonusFor(d); xp += 25; add(b.stat, 25); bonusN++; }
    let ciN = 0; for (const d in S.checkins) { ciN++; xp += 5; add('dis', 5); }
    let brN = 0; for (const d in S.breath) if (S.breath[d]) { brN++; xp += 5; add('foc', 5); }
    const reviews = S.reviews.length; xp += reviews * 50; add('wis', reviews * 50);

    let sideDone = 0;
    for (const s of S.side) if (s.done) { const n = Q.DIFF[s.diff].side; xp += n; add(s.stat, n); sideDone++; }
    let earned = 0, entries = 0, htasks = 0, goalsHit = 0;
    for (const h of S.hustles) {
      const e = h.entries.reduce((a, x) => a + (+x.amount || 0), 0);
      earned += e; entries += h.entries.length; htasks += h.tasks.filter(x => x.done).length;
      if (h.goal > 0 && e >= h.goal) goalsHit++;
    }
    const hx = entries * 20 + htasks * 15 + goalsHit * 200; xp += hx; add('wea', hx);
    let focusN = 0; for (const k in S.focus) focusN += S.focus[k];
    xp += focusN * 15; add('foc', focusN * 15);
    let jN = 0; for (const k in S.journal) if ((S.journal[k] || '').trim().length >= 10) jN++;
    xp += jN * 10; add('wis', jN * 10);

    if (penalty) { xp = Math.max(0, xp - penalty); statXp.dis = Math.max(0, statXp.dis - penalty); }

    let questUps = 0;
    for (const q of S.quests) for (let i = 1; i < q.lv.length; i++) if (q.lv[i].l > q.lv[i - 1].l) questUps++;

    const level = Q.levelFor(xp), rank = Q.rankFor(level);
    const spent = S.purchases.reduce((a, p) => a + p.cost, 0);
    const coins = Math.max(0, Math.floor(xp / 4) - spent);
    const base = S.hero.base || { str: 10, vit: 10, wis: 10, foc: 10, dis: 10, wea: 10 };
    const score = {}, statLvl = {};
    for (const k of Q.STAT_ORDER) { score[k] = Math.round(base[k] + Math.sqrt(statXp[k]) * 1.5); statLvl[k] = 1 + Math.floor(Math.sqrt(statXp[k] / 10)); }
    const power = Math.round(Q.STAT_ORDER.reduce((a, k) => a + score[k], 0) / 6);
    const allLoot = loot.concat(weekLoot);
    const chestsOpened = Object.keys(S.chests).length;
    const ctx = {
      xp, level, best, cur: run, defeated, perfect, questsDone, sideDone, earned, weekBosses, comebacks, shieldsUsed,
      hustles: S.hustles.length, focus: focusN, journal: jN, legendary: allLoot.filter(l => l.rarity === 'legendary').length,
      purchases: S.purchases.length, programDay: Q.programDay(), cycles: S.program.cycles, questUps, reviews,
      checkins: ciN, bonus: bonusN, breath: brN, chests: chestsOpened,
      mealDays: Object.keys(S.nutri.days || {}).filter(d => Q.mealsDone(d) >= (S.nutri.meals || 3)).length, weighIns: S.weights.length
    };
    const ach = Q.ACH.filter(a => a.test(ctx)).map(a => a.id);
    Q._g = {
      xp, level, rank, lvlStart: Q.lvlStart(level), lvlNext: Q.lvlNext(level), statXp, statLvl, score, power, base,
      days, cur: run, best, defeated, perfect, loot: allLoot, dailyLoot: loot, coins, spent, ach, ctx, shields,
      maxShields: mode.shields, week, weekBosses, penalty
    };
    Q._gv = Q._ver; Q._gd = today;
    return Q._g;
  };

  Q.bonusFor = d => Q.BONUS[Q.hash('b' + d) % Q.BONUS.length];
})(window.Q);
