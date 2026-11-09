(function (Q) {
  'use strict';
  // ---------- extra foods (per 100 g; unit = household portion in grams) ----------
  Object.assign(Q.FOODS, {
    shawarma: { n: 'Chicken shawarma sandwich', k: 230, p: 13, c: 22, f: 10, unit: [250, 'sandwich', 'sandwiches'], cat: 'Syrian dishes' },
    falafel: { n: 'Falafel', k: 333, p: 13, c: 32, f: 18, unit: [17, 'piece', 'pieces'], cat: 'Syrian dishes' },
    falafelsand: { n: 'Falafel sandwich', k: 250, p: 8, c: 33, f: 10, unit: [200, 'sandwich', 'sandwiches'], cat: 'Syrian dishes' },
    kibbeh: { n: 'Kibbeh (fried)', k: 270, p: 12, c: 22, f: 15, unit: [60, 'piece', 'pieces'], cat: 'Syrian dishes' },
    kibbehbake: { n: 'Kibbeh bil saniyeh (baked)', k: 220, p: 13, c: 20, f: 10, cat: 'Syrian dishes' },
    mjaddara: { n: 'Mujaddara (lentils & bulgur/rice)', k: 165, p: 6.5, c: 25, f: 4.5, cat: 'Syrian dishes' },
    tabbouleh: { n: 'Tabbouleh', k: 120, p: 2, c: 10, f: 8.5, cat: 'Syrian dishes' },
    fattoush: { n: 'Fattoush', k: 110, p: 2, c: 11, f: 6.5, cat: 'Syrian dishes' },
    fatteh: { n: 'Fatteh (hummus fatteh)', k: 190, p: 7, c: 20, f: 9, cat: 'Syrian dishes' },
    mutabbal: { n: 'Mutabbal / baba ghanoush', k: 130, p: 3, c: 8, f: 10, cat: 'Syrian dishes' },
    muhammara: { n: 'Muhammara', k: 290, p: 6, c: 15, f: 23, cat: 'Syrian dishes' },
    yabraq: { n: 'Yabraq (stuffed vine leaves)', k: 165, p: 4, c: 22, f: 7, unit: [25, 'roll', 'rolls'], cat: 'Syrian dishes' },
    mahshi: { n: 'Mahshi kousa (stuffed zucchini)', k: 120, p: 5, c: 13, f: 5, cat: 'Syrian dishes' },
    kabsa: { n: 'Chicken & rice (kabsa style)', k: 175, p: 11, c: 20, f: 5.5, cat: 'Syrian dishes' },
    shishtawook: { n: 'Shish tawook (grilled chicken)', k: 165, p: 25, c: 2, f: 6.5, unit: [30, 'cube', 'cubes'], cat: 'Syrian dishes' },
    kebab: { n: 'Kebab (grilled minced meat)', k: 260, p: 18, c: 3, f: 20, unit: [70, 'skewer', 'skewers'], cat: 'Syrian dishes' },
    manakish: { n: "Manakish za'atar", k: 300, p: 7, c: 38, f: 13, unit: [120, 'piece', 'pieces'], cat: 'Bakery' },
    manakishcheese: { n: 'Manakish cheese', k: 310, p: 12, c: 33, f: 14, unit: [130, 'piece', 'pieces'], cat: 'Bakery' },
    fatayer: { n: 'Fatayer spinach', k: 250, p: 6, c: 32, f: 11, unit: [60, 'piece', 'pieces'], cat: 'Bakery' },
    kaak: { n: 'Kaak (sesame bread ring)', k: 380, p: 11, c: 62, f: 9, unit: [90, 'ring', 'rings'], cat: 'Bakery' },
    croissant: { n: 'Croissant', k: 406, p: 8, c: 45, f: 21, unit: [60, 'croissant', 'croissants'], cat: 'Bakery' },
    toast: { n: 'Toast bread', k: 265, p: 9, c: 49, f: 3.2, unit: [28, 'slice', 'slices'], cat: 'Bakery' },
    knafeh: { n: 'Knafeh', k: 340, p: 7, c: 40, f: 17, cat: 'Sweets' },
    baklava: { n: 'Baklava', k: 430, p: 7, c: 47, f: 24, unit: [25, 'piece', 'pieces'], cat: 'Sweets' },
    halawa: { n: 'Halawa (tahini halva)', k: 520, p: 12, c: 55, f: 29, cat: 'Sweets' },
    maamoul: { n: "Ma'amoul", k: 440, p: 6, c: 58, f: 20, unit: [35, 'piece', 'pieces'], cat: 'Sweets' },
    chocolate: { n: 'Milk chocolate', k: 535, p: 7.5, c: 59, f: 30, unit: [10, 'square', 'squares'], cat: 'Sweets' },
    biscuits: { n: 'Biscuits', k: 480, p: 6, c: 68, f: 20, unit: [8, 'biscuit', 'biscuits'], cat: 'Sweets' },
    chips: { n: 'Potato chips', k: 536, p: 7, c: 53, f: 34, cat: 'Snacks' },
    popcorn: { n: 'Popcorn (plain)', k: 387, p: 13, c: 78, f: 4.5, cat: 'Snacks' },
    pistachio: { n: 'Pistachios', k: 560, p: 20, c: 28, f: 45, cat: 'Snacks' },
    sunflower: { n: 'Sunflower seeds (bizr)', k: 584, p: 21, c: 20, f: 51, cat: 'Snacks' },
    tahini: { n: 'Tahini', k: 595, p: 17, c: 21, f: 54, unit: [15, 'tbsp', 'tbsp'], cat: 'Pantry' },
    zaatar: { n: "Za'atar mix with oil", k: 400, p: 6, c: 18, f: 35, unit: [15, 'tbsp', 'tbsp'], cat: 'Pantry' },
    butter: { n: 'Butter', k: 717, p: 0.9, c: 0.1, f: 81, unit: [10, 'tsp', 'tsp'], cat: 'Pantry' },
    sugar: { n: 'Sugar', k: 387, p: 0, c: 100, f: 0, unit: [5, 'tsp', 'tsp'], cat: 'Pantry' },
    jam: { n: 'Jam', k: 250, p: 0.4, c: 62, f: 0.1, unit: [20, 'tbsp', 'tbsp'], cat: 'Pantry' },
    cheddar: { n: 'Cheddar / yellow cheese', k: 403, p: 25, c: 1.3, f: 33, unit: [20, 'slice', 'slices'], cat: 'Dairy & eggs' },
    kashkaval: { n: 'Kashkaval cheese', k: 360, p: 25, c: 2, f: 28, cat: 'Dairy & eggs' },
    akkawi: { n: 'Akkawi cheese', k: 300, p: 20, c: 2, f: 23, cat: 'Dairy & eggs' },
    ayran: { n: 'Ayran (yogurt drink)', k: 38, p: 1.7, c: 2.7, f: 2, unit: [250, 'glass', 'glasses'], cat: 'Drinks' },
    whey: { n: 'Whey protein', k: 400, p: 78, c: 8, f: 6, unit: [30, 'scoop', 'scoops'], cat: 'Dairy & eggs' },
    salmon: { n: 'Salmon', k: 208, p: 20, c: 0, f: 13, cat: 'Meat' },
    sardine: { n: 'Sardines (canned)', k: 208, p: 25, c: 0, f: 11, cat: 'Meat' },
    liver: { n: 'Chicken liver', k: 167, p: 24, c: 1, f: 6.5, cat: 'Meat' },
    lamb: { n: 'Lamb', k: 280, p: 18, c: 0, f: 23, cat: 'Meat' },
    mortadella: { n: 'Mortadella / luncheon', k: 300, p: 14, c: 3, f: 26, unit: [20, 'slice', 'slices'], cat: 'Meat' },
    freekeh: { n: 'Freekeh (cooked)', k: 120, p: 4.5, c: 23, f: 1, cat: 'Grains' },
    corn: { n: 'Corn', k: 96, p: 3.4, c: 21, f: 1.5, cat: 'Vegetables' },
    peas: { n: 'Peas', k: 81, p: 5.4, c: 14, f: 0.4, cat: 'Vegetables' },
    greenbeans: { n: 'Green beans', k: 31, p: 1.8, c: 7, f: 0.2, cat: 'Vegetables' },
    okra: { n: 'Okra (bamyeh) stew', k: 90, p: 5, c: 8, f: 4.5, cat: 'Syrian dishes' },
    molokhia: { n: 'Molokhia with chicken', k: 85, p: 8, c: 4, f: 4, cat: 'Syrian dishes' },
    lentilsoup: { n: 'Lentil soup (shorbat adas)', k: 70, p: 4, c: 10, f: 1.5, unit: [250, 'bowl', 'bowls'], cat: 'Syrian dishes' },
    grapes: { n: 'Grapes', k: 69, p: 0.7, c: 18, f: 0.2, cat: 'Fruit' },
    watermelon: { n: 'Watermelon', k: 30, p: 0.6, c: 7.6, f: 0.2, cat: 'Fruit' },
    pomegranate: { n: 'Pomegranate', k: 83, p: 1.7, c: 19, f: 1.2, cat: 'Fruit' },
    figs: { n: 'Figs', k: 74, p: 0.8, c: 19, f: 0.3, unit: [50, 'fig', 'figs'], cat: 'Fruit' },
    strawberry: { n: 'Strawberries', k: 32, p: 0.7, c: 7.7, f: 0.3, cat: 'Fruit' },
    mango: { n: 'Mango', k: 60, p: 0.8, c: 15, f: 0.4, cat: 'Fruit' },
    juice: { n: 'Orange juice', k: 45, p: 0.7, c: 10, f: 0.2, unit: [250, 'glass', 'glasses'], cat: 'Drinks' },
    cola: { n: 'Cola', k: 42, p: 0, c: 10.6, f: 0, unit: [330, 'can', 'cans'], cat: 'Drinks' },
    teasugar: { n: 'Tea with 2 tsp sugar', k: 16, p: 0, c: 4, f: 0, unit: [250, 'cup', 'cups'], cat: 'Drinks' },
    coffeeturk: { n: 'Arabic/Turkish coffee, no sugar', k: 2, p: 0.1, c: 0, f: 0, unit: [60, 'cup', 'cups'], cat: 'Drinks' },
    nescafe: { n: '3-in-1 instant coffee', k: 400, p: 3, c: 70, f: 12, unit: [18, 'sachet', 'sachets'], cat: 'Drinks' },
    mate: { n: 'Mate (no sugar)', k: 2, p: 0, c: 0.3, f: 0, unit: [250, 'cup', 'cups'], cat: 'Drinks' }
  });

  // ---------- exercises ----------
  // m = muscle group, eq = home|gym|both, t = 'reps'|'time'
  Q.EX = {
    pushup: { n: 'Push-ups', m: 'Chest', eq: 'home', inc: 1 },
    inclinepu: { n: 'Incline push-ups (hands on table)', m: 'Chest', eq: 'home', inc: 1 },
    pike: { n: 'Pike push-ups', m: 'Shoulders', eq: 'home', inc: 1 },
    dips: { n: 'Chair dips', m: 'Triceps', eq: 'home', inc: 1 },
    squat: { n: 'Bodyweight squats', m: 'Legs', eq: 'home', inc: 2 },
    splitsq: { n: 'Bulgarian split squats', m: 'Legs', eq: 'home', inc: 1 },
    lunge: { n: 'Reverse lunges', m: 'Legs', eq: 'home', inc: 1 },
    glute: { n: 'Glute bridges', m: 'Glutes', eq: 'home', inc: 2 },
    rowtowel: { n: 'Table / towel rows', m: 'Back', eq: 'home', inc: 1 },
    superman: { n: 'Superman holds', m: 'Lower back', eq: 'home', t: 'time', inc: 5 },
    plank: { n: 'Plank', m: 'Core', eq: 'home', t: 'time', inc: 5 },
    deadbug: { n: 'Dead bugs', m: 'Core', eq: 'home', inc: 2 },
    sideplank: { n: 'Side plank (each side)', m: 'Core', eq: 'home', t: 'time', inc: 5 },
    calf: { n: 'Calf raises', m: 'Calves', eq: 'home', inc: 2 },
    burpee: { n: 'Burpees', m: 'Conditioning', eq: 'home', inc: 1 },
    bench: { n: 'Bench press', m: 'Chest', eq: 'gym', w: true, inc: 2.5 },
    incdb: { n: 'Incline dumbbell press', m: 'Chest', eq: 'gym', w: true, inc: 2 },
    ohp: { n: 'Overhead press', m: 'Shoulders', eq: 'gym', w: true, inc: 2.5 },
    lateral: { n: 'Lateral raises', m: 'Shoulders', eq: 'gym', w: true, inc: 1 },
    pulldown: { n: 'Lat pulldown', m: 'Back', eq: 'gym', w: true, inc: 2.5 },
    pullup: { n: 'Pull-ups / assisted', m: 'Back', eq: 'gym', inc: 1 },
    cablerow: { n: 'Seated cable row', m: 'Back', eq: 'gym', w: true, inc: 2.5 },
    dbrow: { n: 'One-arm dumbbell row', m: 'Back', eq: 'gym', w: true, inc: 2 },
    facepull: { n: 'Face pulls', m: 'Upper back', eq: 'gym', w: true, inc: 2.5 },
    gobletsq: { n: 'Goblet squat', m: 'Legs', eq: 'gym', w: true, inc: 2 },
    legpress: { n: 'Leg press', m: 'Legs', eq: 'gym', w: true, inc: 5 },
    rdl: { n: 'Romanian deadlift', m: 'Hamstrings', eq: 'gym', w: true, inc: 2.5 },
    legcurl: { n: 'Leg curl', m: 'Hamstrings', eq: 'gym', w: true, inc: 2.5 },
    curl: { n: 'Dumbbell curls', m: 'Biceps', eq: 'gym', w: true, inc: 1 },
    pushdown: { n: 'Triceps pushdown', m: 'Triceps', eq: 'gym', w: true, inc: 2.5 },
    hipthrust: { n: 'Hip thrust', m: 'Glutes', eq: 'gym', w: true, inc: 5 },
    cablecrunch: { n: 'Cable crunch', m: 'Core', eq: 'gym', w: true, inc: 2.5 }
  };
  // [exercise, sets, repMin, repMax]
  Q.PROGRAMS = {
    home: {
      name: 'Home strength (no equipment)', note: 'Full body, 3–4 days a week. Hit the top of the rep range on every set, then the app moves you to a harder version or more reps.',
      days: [
        { n: 'Full body A', ex: [['inclinepu', 3, 8, 15], ['squat', 3, 12, 20], ['rowtowel', 3, 8, 12], ['glute', 3, 12, 20], ['plank', 3, 30, 60], ['deadbug', 2, 8, 12]] },
        { n: 'Full body B', ex: [['pushup', 3, 6, 12], ['splitsq', 3, 8, 12], ['superman', 3, 20, 40], ['pike', 3, 6, 10], ['sideplank', 2, 20, 45], ['calf', 2, 15, 25]] },
        { n: 'Full body C', ex: [['pushup', 3, 6, 12], ['lunge', 3, 8, 12], ['rowtowel', 3, 8, 12], ['dips', 3, 8, 15], ['glute', 3, 12, 20], ['burpee', 2, 6, 10]] }
      ]
    },
    gym: {
      name: 'Gym upper/lower (4 days)', note: 'Each muscle twice a week. Desk-job friendly: lots of upper-back and glute work for posture.',
      days: [
        { n: 'Upper A', ex: [['bench', 3, 6, 10], ['cablerow', 3, 8, 12], ['ohp', 3, 6, 10], ['pulldown', 3, 8, 12], ['lateral', 2, 12, 15], ['facepull', 2, 12, 15]] },
        { n: 'Lower A', ex: [['gobletsq', 3, 8, 12], ['rdl', 3, 8, 10], ['legpress', 2, 10, 15], ['legcurl', 2, 10, 15], ['calf', 3, 12, 20], ['plank', 3, 30, 60]] },
        { n: 'Upper B', ex: [['incdb', 3, 8, 12], ['dbrow', 3, 8, 12], ['pullup', 3, 5, 10], ['lateral', 3, 12, 15], ['curl', 2, 10, 12], ['pushdown', 2, 10, 12]] },
        { n: 'Lower B', ex: [['hipthrust', 3, 8, 12], ['splitsq', 3, 8, 12], ['legcurl', 3, 10, 15], ['superman', 2, 20, 40], ['cablecrunch', 3, 10, 15], ['sideplank', 2, 20, 45]] }
      ]
    }
  };

  // ---------- mobility (desk job: lower back, upper back, hips, knees) ----------
  // [name, seconds, cue]
  Q.MOBILITY = {
    reset: {
      n: 'Desk reset', mins: 8, d: 'Every workday. Undo the sitting.', lv: [
        ['Chin tucks', 40, 'Slide your head straight back, double chin, hold 2 s each.'],
        ['Thoracic extension over chair', 45, 'Hands behind head, arch your upper back over the chair back.'],
        ['Doorway chest stretch', 45, 'Forearm on the frame, step through until you feel the chest open.'],
        ['Cat-cow', 45, 'On all fours, slowly round then arch the whole spine.'],
        ['Kneeling hip flexor stretch · left', 40, 'Squeeze the back glute, tuck the pelvis, lean forward slightly.'],
        ['Kneeling hip flexor stretch · right', 40, 'Same on the other side.'],
        ['Glute bridge', 45, 'Drive through heels, pause 2 s at the top.'],
        ['Standing hamstring hinge', 40, 'Soft knees, push hips back, flat back.'],
        ['Wall angels', 45, 'Back flat on the wall, slide arms up and down slowly.']
      ]
    },
    full: {
      n: 'Full body mobility', mins: 22, d: 'Twice a week. Builds strength in range over time.', lv: [
        ['Cat-cow', 60, 'Move one vertebra at a time.'],
        ['Thread the needle · left', 45, 'Reach under and rotate the upper back.'],
        ['Thread the needle · right', 45, 'Other side.'],
        ['Bird dog', 60, 'Opposite arm and leg, hips level, slow.'],
        ['90/90 hip switches', 60, 'Sit tall, rotate both knees side to side.'],
        ['Pigeon stretch · left', 50, 'Square hips, breathe into the glute.'],
        ['Pigeon stretch · right', 50, 'Other side.'],
        ['Couch stretch · left', 45, 'Back knee against the wall, squeeze glute.'],
        ['Couch stretch · right', 45, 'Other side.'],
        ['Deep squat hold', 60, 'Hold a table if needed, chest up, knees over toes.'],
        ['Spanish squat / wall sit', 45, 'Knee-friendly: shins vertical, push through heels.'],
        ['Terminal knee extension', 45, 'Straighten the knee fully, squeeze the thigh.'],
        ['Jefferson curl (no weight)', 45, 'Roll down slowly from the head, roll back up.'],
        ["Child's pose with side reach", 60, 'Walk hands left then right, long breaths.'],
        ['Supine twist · left', 40, 'Knees to one side, shoulders on the floor.'],
        ['Supine twist · right', 40, 'Other side.'],
        ['Dead hang or wall lat stretch', 40, 'Decompress the spine and open the lats.'],
        ['Box breathing', 60, '4 s in, 4 hold, 4 out, 4 hold.']
      ]
    },
    back: {
      n: 'Back pain relief', mins: 10, d: 'On days your lower back is tight.', lv: [
        ['Knees to chest', 60, 'Gently rock side to side.'],
        ['Pelvic tilts', 45, 'Flatten then arch the lower back on the floor.'],
        ['Cat-cow', 60, 'Small, pain-free range.'],
        ['Bird dog', 60, 'Slow and controlled.'],
        ["Child's pose", 60, 'Long exhale into the lower back.'],
        ['McGill curl-up', 45, 'Hands under lower back, one knee bent, lift head and shoulders slightly.'],
        ['Side plank on knees', 45, 'Switch sides halfway.'],
        ['Supine twist', 60, 'Switch sides halfway.']
      ]
    },
    knees: {
      n: 'Knee & hip strength', mins: 12, d: 'Stronger knees for stairs and squats.', lv: [
        ['Terminal knee extension · left', 40, 'Fully straighten and squeeze.'],
        ['Terminal knee extension · right', 40, 'Other side.'],
        ['Spanish squat / wall sit', 45, 'Shins vertical.'],
        ['Step-downs · left', 45, 'Slow lowering from a step, knee tracks over toes.'],
        ['Step-downs · right', 45, 'Other side.'],
        ['Side-lying leg raises · left', 40, 'Toes forward, lift with the hip.'],
        ['Side-lying leg raises · right', 40, 'Other side.'],
        ['Glute bridge march', 45, 'Hips stay level.'],
        ['Tibialis raises', 40, 'Back on the wall, lift toes.'],
        ['Calf raises', 45, 'Full range, slow down.'],
        ['Deep squat hold', 45, 'Hold support, breathe.']
      ]
    }
  };
})(window.Q);
