# Questline v3

A personal operating system for habits, training and nutrition, run as a game. 100% offline: everything is stored on the phone.

## Install on Android

You need **Node 22+** and **Android Studio**.

```bash
npm install
npx cap sync android
npx cap open android
```

In Android Studio, press **Run** with your phone plugged in (USB debugging on), or use **Build > Build APK(s)** and copy the APK to your phone.

To use it without building anything, open `questline-preview.html` in any browser, on your phone or PC. It's a single file with fonts and icons embedded, and it works with no internet. Reminders and haptics only work in the Android app.

## What it does

**Setup (about 4 minutes)**
- Name, goals, and 8 habit questions.
- **Your week:** wake and sleep time for each day, plus fixed commitments (work, classes, commute, family, faith, other). You can copy one day to the weekdays, the weekend, or every day.
- **Training:** sessions per week and your preferred time. Training days are picked from your most open days.
- **Body and goal:** sex, age, height, weight and activity, then a goal (lose, maintain, gain), a pace, and meals per day.
- **Foods you don't eat or can't get.** Recipes are built only from the rest.
- **Difficulty:** Steady, Standard or Hardcore.
- **Report:** attribute scores, your two focus areas, calorie and protein targets, and your daily quests.
- Your "why", then a hold-to-commit pledge.

**Today**
- A timeline of your day. Commitments, meals and quests are placed into your real free time, with a 10-minute buffer after each commitment, no training in the last 90 minutes before sleep, and nothing timed in the last 30.
- On packed days, quests that don't fit become **optional**. They never count against you, and still earn XP if you do them.
- **Daily opponent:** each quest you finish lowers its resistance. Beat it to win the day, extend your streak and get a reward drop.
- Daily check-in. Low energy makes the opponent 15% weaker.
- Comeback days, weekly gauntlet, bonus quest, and suggestions to level a quest up or ease it.

**Plan**
- **Week:** a strip for each day showing commitments, quests and meals, with free time per day. Tap a day for its full plan. Edit the schedule and everything re-plans.
- **66-day journey:** 4 phases (Foundation, Build, Forge, Mastery) that raise your targets automatically, a calendar, quest levels and a weekly review.

**Fuel**
- Calories and macros come from your body stats (Mifflin-St Jeor equation), activity and pace. Protein is set from a reference weight so it stays sensible at higher body fat. Targets update every time you log your weight.
- An exact meal plan every day, with ingredients in grams, macros, a method and cooking time. Over 40 recipes built around food available locally. Every recipe is used before any repeats, and no day repeats its main protein.
- Mark a meal as eaten (this updates your meal quest), swap it, or mark it off-plan. You can also mark a whole day as off-plan (birthday, wedding, travel).
- Weekly grocery list with exact totals.
- Weight log with a trend chart.
- A 12-chapter nutrition guide.

**Quests:** side quests (a quest board plus your own) and side hustles (income log, goals, steps).

**You:** level-ring emblem with rank insignia (Recruit to Legend), power score, attribute radar, 43 achievements, artifacts, focus timer, box breathing, journal, reward shop, settings and backup.

**Reminders (Android, offline):** built from your day plan. You get each quest at its scheduled time (skipped once it's done), meals with portions, a lights-out countdown, and an evening check only if the day isn't won yet.

## Code map

| What | File |
| --- | --- |
| Day planner (free windows, meal times, training days) | `www/js/schedule.js` |
| Calories, macros, portion solver, rotation, grocery list, guide | `www/js/nutrition.js` |
| Food database and recipes | `www/js/foods.js` |
| Quest catalog, opponents, artifacts, achievements | `www/js/content.js` |
| Assessment, program generator, phases, adaptive levels | `www/js/program.js` |
| XP, streaks, shields, opponents (all derived from logs) | `www/js/game.js` |
| Screens / sheets / setup | `www/js/views.js`, `sheets.js`, `onboarding.js` |
| Effects, emblem, overlays | `www/js/fx.js` |
| Icons (Lucide, ISC license) | `www/js/icons.js` |

After editing anything in `www/`, run `npx cap sync android` and rebuild.

## Notes

- Nutrition numbers are estimates and general guidance, not medical advice.
- Data lives only on the phone. Use **You > Settings > Export** now and then.
- Fonts: Inter and Barlow Condensed (SIL Open Font License), bundled offline.
