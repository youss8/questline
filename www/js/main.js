(function (E) {
  'use strict';
  // bottom bar: Today · Plan · Health · + · Money · Grow
  const NAV = { today: ['sun', 'Today'], plan: ['calendar-days', 'Plan'], health: ['heart-pulse', 'Health'], money: ['wallet', 'Money'], grow: ['sprout', 'Grow'] };
  E.$$('#nav [data-tab]').forEach(b => { const [i, l] = NAV[b.dataset.tab]; b.innerHTML = `${E.ic(i)}<span>${l}</span>`; });
  E.$('#nav .add').innerHTML = E.ic('plus');
  E.applyTheme();
  E.rollSubs(); E.autoMoney(E.today());
  E.render(true);
  E.pushWidgets(); E.schedule(); E.pullTicks(); E.healthSync(true); E.pullCal();
  window.__E = E;
})(window.E);
