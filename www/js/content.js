(function (Q) {
  'use strict';

  Q.STATS = {
    str: { name: 'Strength', short: 'STR', icon: 'dumbbell', color: '#e8765f' },
    vit: { name: 'Vitality', short: 'VIT', icon: 'heart-pulse', color: '#4cc38a' },
    wis: { name: 'Wisdom', short: 'WIS', icon: 'brain', color: '#5aa9e6' },
    foc: { name: 'Focus', short: 'FOC', icon: 'crosshair', color: '#9b8afb' },
    dis: { name: 'Discipline', short: 'DIS', icon: 'shield', color: '#e0a458' },
    wea: { name: 'Wealth', short: 'WEA', icon: 'coins', color: '#d6bb63' }
  };
  Q.STAT_ORDER = ['str', 'vit', 'wis', 'foc', 'dis', 'wea'];

  Q.DIFF = {
    1: { name: 'Easy', xp: 10, side: 30, color: '#4cc38a' },
    2: { name: 'Medium', xp: 20, side: 60, color: '#d6bb63' },
    3: { name: 'Hard', xp: 30, side: 100, color: '#e8765f' }
  };

  Q.MODES = {
    easy: { name: 'Steady', icon: 'sprout', desc: 'Gentle ramp. Up to 5 streak shields, 2 skips a day, no penalties.', threshold: 70, shields: 5, skips: 2, penalty: 0, weekKills: 4, count: 5, boost: 0 },
    normal: { name: 'Standard', icon: 'swords', desc: 'Balanced pressure. Up to 3 shields, 1 skip a day.', threshold: 80, shields: 3, skips: 1, penalty: 0, weekKills: 5, count: 7, boost: 0 },
    hard: { name: 'Hardcore', icon: 'skull', desc: 'No skips, 1 shield, missed days cost XP, tougher starting targets.', threshold: 90, shields: 1, skips: 0, penalty: 0.5, weekKills: 6, count: 9, boost: 1 }
  };

  Q.RANKS = [
    { r: 'I', from: 1, name: 'Recruit', color: '#8b93a7', chev: 1 },
    { r: 'II', from: 5, name: 'Operator', color: '#6aa6d8', chev: 2 },
    { r: 'III', from: 10, name: 'Specialist', color: '#4fc1b0', chev: 3 },
    { r: 'IV', from: 15, name: 'Veteran', color: '#a48bf2', chev: 3, star: 1 },
    { r: 'V', from: 22, name: 'Elite', color: '#e0a458', chev: 3, star: 2 },
    { r: 'VI', from: 30, name: 'Legend', color: '#f1d27a', chev: 3, star: 3 }
  ];
  Q.rankFor = l => { let i = 0; Q.RANKS.forEach((x, j) => { if (l >= x.from) i = j; }); return { ...Q.RANKS[i], i }; };

  Q.PHASES = [
    { n: 1, name: 'Foundation', from: 1, to: 14, desc: 'Small wins every day. Prove you show up.' },
    { n: 2, name: 'Build', from: 15, to: 35, desc: 'Targets rise. Momentum compounds.' },
    { n: 3, name: 'Forge', from: 36, to: 56, desc: 'Harder standards. This is where habits harden.' },
    { n: 4, name: 'Mastery', from: 57, to: 66, desc: 'Finish strong. Become the person who does this.' }
  ];
  Q.PROGRAM_DAYS = 66;

  // when: wake | morning | afternoon | evening | bed | anytime | allday
  // dur(tierValue) -> minutes needed in a free window
  Q.CATALOG = {
    water: { name: 'Drink {n} glasses of water', icon: 'glass-water', stat: 'vit', diff: 1, type: 'count', unit: 'glasses', tiers: [6, 8, 10, 12], when: 'allday', mini: 'Drink one glass right now' },
    sleep: { name: 'Lights out by {n}', icon: 'moon', stat: 'vit', diff: 2, type: 'check', tiers: ['00:30', '00:00', '23:30', '23:00'], when: 'bed', mini: 'Phone out of the bedroom 15 minutes before bed' },
    wake: { name: 'Up by {n}', icon: 'sunrise', stat: 'dis', diff: 2, type: 'check', tiers: ['08:00', '07:30', '07:00', '06:30'], when: 'wake', mini: 'Out of bed on the first alarm' },
    move: { name: 'Walk {n} minutes', icon: 'footprints', stat: 'str', diff: 2, type: 'check', tiers: [15, 20, 30, 45], when: 'anytime', dur: 'n', mini: 'Walk for 5 minutes' },
    workout: { name: 'Training session · {n} min', icon: 'dumbbell', stat: 'str', diff: 3, type: 'check', tiers: [30, 45, 60, 75], when: 'workout', dur: 'n', perWeek: true, mini: '15 push-ups and 20 squats' },
    steps: { name: 'Walk {n} steps', icon: 'activity', stat: 'str', diff: 2, type: 'count', unit: 'steps', tiers: [6000, 8000, 10000, 12000], step: 1000, when: 'allday', mini: 'One 10-minute walk' },
    read: { name: 'Read {n} pages', icon: 'book-open', stat: 'wis', diff: 1, type: 'count', unit: 'pages', tiers: [5, 10, 15, 20], when: 'evening', dur: 'n2', mini: 'Read one page' },
    learn: { name: 'Study a skill · {n} min', icon: 'graduation-cap', stat: 'wis', diff: 2, type: 'check', tiers: [15, 20, 30, 45], when: 'anytime', dur: 'n', mini: 'One short lesson or 10 flashcards' },
    deep: { name: 'Deep work · {n} min', icon: 'target', stat: 'foc', diff: 2, type: 'check', tiers: [25, 45, 60, 90], when: 'morning', dur: 'n', mini: 'One 10-minute sprint, phone in another room' },
    meditate: { name: 'Meditate · {n} min', icon: 'wind', stat: 'foc', diff: 1, type: 'check', tiers: [3, 5, 10, 15], when: 'morning', dur: 'n', mini: 'Five slow breaths' },
    nophoneam: { name: 'No phone for the first {n} min', icon: 'phone-off', stat: 'dis', diff: 3, type: 'check', tiers: [15, 30, 45, 60], when: 'wake', mini: 'No phone until you are out of bed' },
    screen: { name: 'Screen time under {n}h', icon: 'smartphone', stat: 'dis', diff: 3, type: 'check', tiers: [5, 4, 3, 2], when: 'allday', mini: 'Move one time-wasting app off your home screen' },
    bed: { name: 'Make your bed', icon: 'bed-double', stat: 'dis', diff: 1, type: 'check', tiers: [0], when: 'wake', dur: 3, mini: 'Pull the blanket straight' },
    cold: { name: 'Cold shower · {n}s', icon: 'snowflake', stat: 'dis', diff: 3, type: 'check', tiers: [30, 60, 90, 120], when: 'morning', dur: 10, mini: 'Cold water on your face for 30 seconds' },
    nojunk: { name: 'No fast food or chips', icon: 'salad', stat: 'vit', diff: 2, type: 'check', tiers: [0], when: 'allday', mini: 'Swap one snack for fruit' },
    meals: { name: 'Eat your {n} planned meals', icon: 'utensils', stat: 'vit', diff: 2, type: 'count', unit: 'meals', tiers: [3], when: 'allday', auto: 'meals', mini: 'Eat one planned meal' },
    hustle: { name: 'Side hustle · {n} min', icon: 'briefcase', stat: 'wea', diff: 2, type: 'check', tiers: [30, 45, 60, 90], when: 'evening', dur: 'n', mini: 'Write down the next tiny step' },
    money: { name: 'Log today\'s spending', icon: 'receipt', stat: 'wea', diff: 1, type: 'check', tiers: [0], when: 'bed', dur: 5, mini: 'Note your biggest purchase' },
    gratitude: { name: 'Write {n} wins from today', icon: 'notebook-pen', stat: 'wis', diff: 1, type: 'check', tiers: [1, 3, 3, 5], when: 'bed', dur: 5, mini: 'Say one win out loud' },
    sun: { name: 'Morning daylight · {n} min', icon: 'sun', stat: 'vit', diff: 1, type: 'check', tiers: [5, 10, 10, 15], when: 'morning', dur: 'n', mini: 'Stand by an open window for a minute' },
    tidy: { name: 'Reset your space · {n} min', icon: 'sparkles', stat: 'dis', diff: 1, type: 'check', tiers: [5, 10, 15, 15], when: 'evening', dur: 'n', mini: 'Put away three things' },
    nosugar: { name: 'No sugary drinks or sweets', icon: 'candy-off', stat: 'vit', diff: 2, type: 'check', tiers: [0], when: 'allday', mini: 'Skip sugar in one drink' }
  };

  Q.ICON_CHOICES = ['star', 'target', 'dumbbell', 'book-open', 'brain', 'glass-water', 'moon', 'sun', 'footprints', 'bike', 'heart-pulse', 'wind', 'briefcase', 'laptop', 'languages', 'graduation-cap', 'pen-line', 'guitar', 'palette', 'music', 'pill', 'salad', 'utensils', 'coffee', 'house', 'users', 'phone', 'landmark', 'church', 'leaf', 'sparkles', 'flame', 'shield', 'coins', 'rocket', 'mountain'];

  // ---------- onboarding ----------
  Q.GOALS = [
    { v: 'fit', icon: 'dumbbell', l: 'Lose fat, get strong' },
    { v: 'sleep', icon: 'moon', l: 'Fix my sleep' },
    { v: 'focus', icon: 'target', l: 'Focus and execute' },
    { v: 'learn', icon: 'graduation-cap', l: 'Learn and grow' },
    { v: 'money', icon: 'coins', l: 'Make more money' },
    { v: 'phone', icon: 'phone-off', l: 'Use my phone less' },
    { v: 'discipline', icon: 'shield', l: 'Build discipline' },
    { v: 'calm', icon: 'wind', l: 'Feel calmer' }
  ];
  Q.QUESTIONS = [
    { k: 'screen', q: 'Daily screen time on your phone?', o: ['Under 2 hours', '2 – 4 hours', '4 – 6 hours', '6 – 8 hours', 'More than 8 hours'] },
    { k: 'phoneam', q: 'When do you first check your phone?', o: ['The second I wake up', 'Within 15 minutes', 'Within an hour', 'Later than that'] },
    { k: 'exercise', q: 'How often do you train right now?', o: ['Almost never', '1 – 2 times a week', '3 – 4 times a week', '5+ times a week'] },
    { k: 'water', q: 'How much water do you drink a day?', o: ['Under 1 liter', '1 – 2 liters', '2 – 3 liters', 'More than 3 liters'] },
    { k: 'read', q: 'How often do you read?', o: ['Never', 'Once in a while', 'A few times a week', 'Every day'] },
    { k: 'focus', q: 'How long can you focus without checking your phone?', o: ['Under 10 minutes', '10 – 30 minutes', '30 – 60 minutes', 'Over an hour'] },
    { k: 'stress', q: 'How often do you feel stressed or overwhelmed?', o: ['Most days', 'Sometimes', 'Rarely'] },
    { k: 'hustle', q: 'Do you have a side hustle?', o: ['Yes, I\'m working on one', 'I want to start one', 'Not interested'] }
  ];
  Q.BLOCK_TYPES = {
    work: { name: 'Work', icon: 'briefcase', color: '#5aa9e6' },
    study: { name: 'Class / study', icon: 'graduation-cap', color: '#9b8afb' },
    commute: { name: 'Commute', icon: 'car', color: '#8b93a7' },
    family: { name: 'Family / social', icon: 'users', color: '#4cc38a' },
    faith: { name: 'Faith / community', icon: 'landmark', color: '#d6bb63' },
    other: { name: 'Other', icon: 'calendar', color: '#e8765f' }
  };
  Q.DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  Q.DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  Q.WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

  Q.SIDE_TEMPLATES = [
    { name: 'Declutter one drawer', icon: 'sparkles', stat: 'dis', diff: 1 },
    { name: 'Call an old friend', icon: 'phone', stat: 'wis', diff: 1 },
    { name: 'Write a thank-you message', icon: 'mail', stat: 'wis', diff: 1 },
    { name: 'Explore somewhere new', icon: 'compass', stat: 'vit', diff: 1 },
    { name: 'Cook a new high-protein recipe', icon: 'chef-hat', stat: 'vit', diff: 2 },
    { name: 'Meal prep for 3 days', icon: 'cooking-pot', stat: 'vit', diff: 2 },
    { name: 'Walk 15,000 steps in a day', icon: 'footprints', stat: 'str', diff: 2 },
    { name: 'Pitch one potential client', icon: 'handshake', stat: 'wea', diff: 2 },
    { name: 'Plan next week on paper', icon: 'clipboard-list', stat: 'foc', diff: 1 },
    { name: 'Digital detox: 4 hours', icon: 'phone-off', stat: 'foc', diff: 3 },
    { name: 'Finish a book', icon: 'book-marked', stat: 'wis', diff: 3 },
    { name: 'Hike or long walk outdoors', icon: 'mountain', stat: 'str', diff: 3 },
    { name: 'Ship a small project', icon: 'rocket', stat: 'wea', diff: 3 }
  ];

  Q.BONUS = [
    { name: '30 squats right now', icon: 'dumbbell', stat: 'str' },
    { name: 'Send a genuine compliment', icon: 'mail', stat: 'wis' },
    { name: 'Clear your desk', icon: 'sparkles', stat: 'dis' },
    { name: '10-minute walk outside', icon: 'footprints', stat: 'vit' },
    { name: 'Read one article in your field', icon: 'book-open', stat: 'wis' },
    { name: 'One 25-minute focus sprint', icon: 'timer', stat: 'foc' },
    { name: 'Plank for 60 seconds', icon: 'activity', stat: 'str' },
    { name: 'Drink a full glass of water now', icon: 'glass-water', stat: 'vit' },
    { name: 'Unsubscribe from 5 emails', icon: 'mail', stat: 'foc' },
    { name: 'Learn 10 new words', icon: 'languages', stat: 'wis' },
    { name: 'Write tomorrow\'s top 3 tasks', icon: 'list-checks', stat: 'foc' },
    { name: 'No social media until 18:00', icon: 'ban', stat: 'dis' },
    { name: 'Stretch for 5 minutes', icon: 'person-standing', stat: 'vit' },
    { name: 'Note one money-making idea', icon: 'lightbulb', stat: 'wea' },
    { name: 'Take the stairs all day', icon: 'trending-up', stat: 'str' },
    { name: 'Cold water on your face, 30 seconds', icon: 'snowflake', stat: 'dis' }
  ];

  Q.HUSTLE_IDEAS = [
    { name: 'Freelance projects', icon: 'laptop', tasks: ['Polish your portfolio', 'List 3 services you can sell', 'Pitch 5 prospects', 'Land the first paid project'] },
    { name: 'Digital product', icon: 'package', tasks: ['Pick a product idea', 'Build version one', 'Write the sales page', 'Get the first 10 people to see it'] },
    { name: 'Tutoring / coaching', icon: 'graduation-cap', tasks: ['Choose your subject', 'Set your price', 'Find your first client'] },
    { name: 'Content channel', icon: 'video', tasks: ['Pick a niche', 'Publish 10 pieces', 'Reach 100 followers'] },
    { name: 'Resale', icon: 'store', tasks: ['Find 3 items to flip', 'Photograph and list them', 'Track profit'] },
    { name: 'Custom', icon: 'rocket', tasks: [] }
  ];

  Q.DEFAULT_REWARDS = [
    { name: 'Gaming session', icon: 'gamepad-2', cost: 100 },
    { name: 'Off-plan meal', icon: 'pizza', cost: 250 },
    { name: 'Movie night', icon: 'popcorn', cost: 200 },
    { name: 'Lazy morning', icon: 'bed', cost: 300 },
    { name: 'Buy something you want', icon: 'gift', cost: 700 }
  ];

  Q.QUOTES = [
    { c: 'Confidence', t: 'You don\'t need to feel ready. You need to start the first small thing.' },
    { c: 'Confidence', t: 'Proof beats pep talks. Collect evidence by doing the work.' },
    { c: 'Confidence', t: 'Act like the man you\'re becoming has already decided.' },
    { c: 'Confidence', t: 'Every completed quest is a vote for who you are.' },
    { c: 'Strength', t: 'Strong is tired plus one more rep.' },
    { c: 'Strength', t: 'Comfort never built anything worth carrying.' },
    { c: 'Strength', t: 'The hard days are the ones that count double.' },
    { c: 'Strength', t: 'You\'re not starting over. You\'re starting with experience.' },
    { c: 'Discipline', t: 'Do it even when the mood shows up late.' },
    { c: 'Discipline', t: 'Small promises kept add up to a character.' },
    { c: 'Discipline', t: 'Motivation starts the engine. Routine drives the car.' },
    { c: 'Discipline', t: 'Never miss twice. One slip is an accident; two is a new habit.' },
    { c: 'Discipline', t: 'The mini version still counts. Showing up is the skill.' },
    { c: 'Wisdom', t: 'What you do every day matters more than what you do once in a while.' },
    { c: 'Wisdom', t: 'Ten quiet pages beat two hours of scrolling.' },
    { c: 'Wisdom', t: 'Rest is part of the plan. Quitting isn\'t.' },
    { c: 'Wisdom', t: 'You can\'t out-train a fork. Win the kitchen first.' },
    { c: 'Focus', t: 'One tab. One task. One timer.' },
    { c: 'Focus', t: 'Attention is the one currency you can\'t earn back.' },
    { c: 'Focus', t: 'The phone can wait. The goal can\'t.' },
    { c: 'Focus', t: 'Deep work today is freedom later.' }
  ];
  Q.quoteFor = d => Q.QUOTES[Q.hash('q' + d) % Q.QUOTES.length];

  Q.OPPONENTS = [
    { name: 'Procrastination', icon: 'hourglass', line: 'Wants you to start "later".' },
    { name: 'Doomscrolling', icon: 'smartphone', line: 'Feeds on idle thumbs.' },
    { name: 'The Snooze Button', icon: 'alarm-clock', line: 'Steals your mornings ten minutes at a time.' },
    { name: 'The Comfort Zone', icon: 'sofa', line: 'Soft, warm, and going nowhere.' },
    { name: 'Distraction', icon: 'bell', line: 'One notification at a time.' },
    { name: 'Junk Food', icon: 'pizza', line: 'Cheap now, expensive later.' },
    { name: 'Late Nights', icon: 'cloud-moon', line: 'Borrows energy from tomorrow.' },
    { name: 'Self-Doubt', icon: 'ghost', line: 'Quiet, persuasive, wrong.' },
    { name: 'Overthinking', icon: 'brain-circuit', line: 'Plans forever, ships never.' },
    { name: 'Excuses', icon: 'ban', line: 'Always has a good reason.' },
    { name: 'Sugar Cravings', icon: 'candy-off', line: 'Loud for 10 minutes, then gone.' },
    { name: 'Inertia', icon: 'mountain-snow', line: 'A body at rest stays at rest.' }
  ];
  Q.GAUNTLETS = [
    { name: 'The Old You', icon: 'skull' },
    { name: 'Burnout', icon: 'flame-kindling' },
    { name: 'Chaos', icon: 'orbit' },
    { name: 'Mediocrity', icon: 'ghost' },
    { name: 'The Plateau', icon: 'mountain' }
  ];
  Q.monsterFor = d => Q.OPPONENTS[Q.hash('m' + d) % Q.OPPONENTS.length];

  Q.LOOT = {
    common: [{ icon: 'coins', name: 'Iron Token' }, { icon: 'compass', name: 'Field Compass' }, { icon: 'book', name: 'Leather Journal' }, { icon: 'key', name: 'Brass Key' }, { icon: 'shield', name: 'Training Shield' }],
    rare: [{ icon: 'sword', name: 'Tempered Blade' }, { icon: 'eye', name: 'Focus Lens' }, { icon: 'medal', name: 'Runner\'s Medal' }, { icon: 'feather', name: 'Quill of Clarity' }],
    epic: [{ icon: 'gem', name: 'Obsidian Gem' }, { icon: 'crown', name: 'Circlet of Discipline' }, { icon: 'orbit', name: 'Orb of Insight' }, { icon: 'wand-sparkles', name: 'Wand of Momentum' }],
    legendary: [{ icon: 'flame', name: 'Heart of the Dragon' }, { icon: 'star', name: 'Star of Resolve' }, { icon: 'trophy', name: 'Crown of the Relentless' }]
  };
  Q.RARITY_ORDER = ['legendary', 'epic', 'rare', 'common'];

  Q.ACH = [
    { id: 'first', icon: 'check', name: 'First Step', desc: 'Complete your first quest', test: c => c.questsDone >= 1 },
    { id: 'b1', icon: 'swords', name: 'First Victory', desc: 'Defeat your first daily opponent', test: c => c.defeated >= 1 },
    { id: 'b10', icon: 'swords', name: 'Ten Down', desc: 'Defeat 10 opponents', test: c => c.defeated >= 10 },
    { id: 'b50', icon: 'swords', name: 'Relentless', desc: 'Defeat 50 opponents', test: c => c.defeated >= 50 },
    { id: 'w1', icon: 'castle', name: 'Gauntlet Cleared', desc: 'Clear a weekly gauntlet', test: c => c.weekBosses >= 1 },
    { id: 'w5', icon: 'castle', name: 'Warlord', desc: 'Clear 5 weekly gauntlets', test: c => c.weekBosses >= 5 },
    { id: 's3', icon: 'flame', name: 'Warming Up', desc: '3-day streak', test: c => c.best >= 3 },
    { id: 's7', icon: 'flame', name: 'One Week Strong', desc: '7-day streak', test: c => c.best >= 7 },
    { id: 's21', icon: 'flame', name: 'Habit Forming', desc: '21-day streak', test: c => c.best >= 21 },
    { id: 's66', icon: 'infinity', name: 'Habit Forged', desc: '66-day streak', test: c => c.best >= 66 },
    { id: 's100', icon: 'crown', name: 'Centurion', desc: '100-day streak', test: c => c.best >= 100 },
    { id: 'p1', icon: 'sparkles', name: 'Flawless', desc: 'Complete every quest in a day', test: c => c.perfect >= 1 },
    { id: 'p10', icon: 'gem', name: 'Precision', desc: '10 flawless days', test: c => c.perfect >= 10 },
    { id: 'phoenix', icon: 'refresh-cw', name: 'Comeback', desc: 'Win the day after a miss', test: c => c.comebacks >= 1 },
    { id: 'shield', icon: 'shield-check', name: 'Shielded', desc: 'A shield protected your streak', test: c => c.shieldsUsed >= 1 },
    { id: 'ph2', icon: 'layers', name: 'Foundation Laid', desc: 'Reach phase 2', test: c => c.programDay >= 15 },
    { id: 'ph3', icon: 'hammer', name: 'Into the Forge', desc: 'Reach phase 3', test: c => c.programDay >= 36 },
    { id: 'ph4', icon: 'mountain', name: 'Mastery', desc: 'Reach the final phase', test: c => c.programDay >= 57 },
    { id: 'done66', icon: 'trophy', name: 'Reforged', desc: 'Finish a 66-day program', test: c => c.cycles >= 1 },
    { id: 'lvl5', icon: 'award', name: 'Operator', desc: 'Reach level 5', test: c => c.level >= 5 },
    { id: 'lvl10', icon: 'award', name: 'Specialist', desc: 'Reach level 10', test: c => c.level >= 10 },
    { id: 'lvl15', icon: 'award', name: 'Veteran', desc: 'Reach level 15', test: c => c.level >= 15 },
    { id: 'lvl22', icon: 'award', name: 'Elite', desc: 'Reach level 22', test: c => c.level >= 22 },
    { id: 'lvl30', icon: 'crown', name: 'Legend', desc: 'Reach level 30', test: c => c.level >= 30 },
    { id: 'up1', icon: 'trending-up', name: 'Level Up', desc: 'Level up a quest', test: c => c.questUps >= 1 },
    { id: 'rev1', icon: 'scroll-text', name: 'Reflective', desc: 'Complete a weekly review', test: c => c.reviews >= 1 },
    { id: 'rev4', icon: 'map', name: 'Strategist', desc: 'Complete 4 weekly reviews', test: c => c.reviews >= 4 },
    { id: 'ci7', icon: 'gauge', name: 'Self-Aware', desc: 'Check in on 7 days', test: c => c.checkins >= 7 },
    { id: 'meal7', icon: 'utensils', name: 'Fueled', desc: 'Hit your meal plan on 7 days', test: c => c.mealDays >= 7 },
    { id: 'meal30', icon: 'chef-hat', name: 'Kitchen Discipline', desc: 'Hit your meal plan on 30 days', test: c => c.mealDays >= 30 },
    { id: 'wt5', icon: 'scale', name: 'Tracking', desc: 'Log your weight 5 times', test: c => c.weighIns >= 5 },
    { id: 'bq5', icon: 'dice-5', name: 'Opportunist', desc: 'Finish 5 bonus quests', test: c => c.bonus >= 5 },
    { id: 'sq1', icon: 'scroll', name: 'Side Venture', desc: 'Finish a side quest', test: c => c.sideDone >= 1 },
    { id: 'sq10', icon: 'compass', name: 'Questmaster', desc: 'Finish 10 side quests', test: c => c.sideDone >= 10 },
    { id: 'h1', icon: 'briefcase', name: 'Open for Business', desc: 'Start a side hustle', test: c => c.hustles >= 1 },
    { id: 'e1', icon: 'coins', name: 'First Earnings', desc: 'Log your first income', test: c => c.earned > 0 },
    { id: 'e1000', icon: 'landmark', name: 'Money Maker', desc: 'Earn 1,000 in total', test: c => c.earned >= 1000 },
    { id: 'f10', icon: 'timer', name: 'Deep Diver', desc: 'Finish 10 focus sessions', test: c => c.focus >= 10 },
    { id: 'br7', icon: 'wind', name: 'Composed', desc: 'Breathe on 7 days', test: c => c.breath >= 7 },
    { id: 'j7', icon: 'notebook-pen', name: 'Chronicler', desc: 'Write 7 journal entries', test: c => c.journal >= 7 },
    { id: 'chest10', icon: 'package', name: 'Collector', desc: 'Open 10 reward drops', test: c => c.chests >= 10 },
    { id: 'lg', icon: 'star', name: 'Legendary Find', desc: 'Find a legendary artifact', test: c => c.legendary >= 1 },
    { id: 'buy', icon: 'gift', name: 'Earned It', desc: 'Redeem your first reward', test: c => c.purchases >= 1 }
  ];
})(window.Q);
