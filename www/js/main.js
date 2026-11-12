(function (E) {
  'use strict';
  // bottom bar: Today · Plan · Health · + · Money · Grow
  const NAV = { today: ['sun', 'Today'], health: ['heart-pulse', 'Health'], money: ['wallet', 'Money'], hub: ['layout-grid', 'All'] };
  E.$$('#nav [data-tab]').forEach(b => { const [i, l] = NAV[b.dataset.tab]; b.innerHTML = `${E.ic(i)}<span>${l}</span>`; });
  E.$('#nav .add').innerHTML = E.ic('plus');
  E.applyTheme();
  E.rollSubs(); E.autoMoney(E.today());
  E.focusResume();
  E.render(true);
  if (E.S.focusNow) E.A['focus-open']();
  setInterval(() => { if (document.visibilityState === 'visible' && E.ui.tab === 'today' && !E.$('.scrim') && !E.$('#focus')) E.render(); }, 60000);
  E.pushWidgets(); E.schedule(); E.pullTicks(); E.healthSync(true); E.pullCal();
  window.__E = E;
})(window.E);
