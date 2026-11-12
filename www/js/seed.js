(function (E) {
  'use strict';
  // Everything Youssef told us, pre-loaded so the app opens ready to use. No setup screens.
  const H = (id, name, icon, o) => ({ id, name, icon, type: 'check', target: 1, days: [0, 1, 2, 3, 4, 5, 6], ...o });
  E.seedHabits = () => [
    H('wake', 'Get up on time', 'sunrise', { time: 'wake', min: 'Out of bed on the first alarm', why: 'A fixed wake time is the anchor for everything else.' }),
    H('nophone', 'No phone for 30 min after waking', 'phone-off', { time: 'wake+5', min: 'No phone until you are out of bed' }),
    H('teeth', 'Brush teeth', 'brush', { type: 'count', target: 2, unit: 'times', time: 'all', min: 'One minute is enough tonight', step: 1 }),
    H('water', 'Drink water', 'glass-water', { type: 'count', target: 8, unit: 'glasses', time: 'all', min: 'One glass right now', step: 1 }),
    H('mobility', 'Mobility for back, hips & knees', 'person-standing', { time: '17:15', dur: 10, min: '2 minutes: cat-cow and a hip stretch', open: 'mobility' }),
    H('steps', 'Walk', 'footprints', { type: 'count', target: 8000, unit: 'steps', time: 'all', min: 'One 10-minute walk', step: 1000, auto: 'steps' }),
    H('workout', 'Home workout', 'dumbbell', { days: [1, 4, 6], time: '20:00', dur: 35, min: '15 push-ups and 20 squats', open: 'workout' }),
    H('career', 'Career learning', 'rocket', { days: [0, 1, 5, 6], time: '20:45', dur: 20, min: 'Read one page of docs', open: 'courses' }),
    H('german', 'German practice', 'languages', { days: [1, 3, 5, 6], time: '21:45', dur: 15, min: '10 flashcards', open: 'german' }),
    H('read', 'Read', 'book-open', { type: 'count', target: 10, unit: 'pages', time: 'all', min: 'Read one page', step: 1, open: 'books' }),
    H('money', 'Log expenses', 'receipt', { time: 'all', min: 'Log your biggest spend', auto: 'money', open: 'money' }),
    H('sleep', 'Lights out on time', 'moon-star', { time: 'sleep', min: 'Phone out of the bedroom 15 minutes before' })
  ];
  E.seed = () => ({
    v: 2, focus: [], focusNow: null, plan: {}, at: {},
    profile: { name: 'Youssef', age: 23, height: 176, sex: 'male', goalKg: 90, start: E.today(), activity: 1.4,
      wake: { wd: '07:30', we: '10:00' }, sleep: { wd: '00:30', we: '01:00' } },
    settings: { theme: 'system', reminders: false, evening: '22:30', welcomed: false, prep: {} },
    habits: E.seedHabits(), logs: {}, mood: {},
    food: { diary: {}, myFoods: [], saved: [], recipes: [], prep: [], exclude: ['hummus', 'lentils', 'foul', 'bulgur', 'freekeh', 'tahini', 'mjaddara', 'fatteh', 'lentilsoup', 'okra', 'zucchini', 'mahshi', 'salmon', 'sardine', 'tuna', 'oats', 'whitecheese'] },
    weights: [{ d: '2026-11-09', kg: 105 }], measures: [],
    train: { logs: [], next: 0 }, mob: { logs: [] },
    schedule: [
      { id: 'work', title: 'Work · Hope Center', icon: 'briefcase', days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', c: 'var(--slate)' },
      { id: 'de', title: 'German class', icon: 'languages', days: [0, 2, 4], start: '17:30', end: '19:30', c: 'var(--plum)' },
      { id: 'fb', title: 'Formation B session', icon: 'compass', days: [3], start: '19:30', end: '21:30', c: 'var(--sage)' },
      { id: 'bf', title: 'Breakfast', icon: 'coffee', days: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '08:20', c: 'var(--sand)', meal: 1 },
      { id: 'ln', title: 'Lunch', icon: 'utensils', days: [0, 1, 2, 3, 4, 5, 6], start: '14:00', end: '14:30', c: 'var(--sand)', meal: 1 },
      { id: 'dn', title: 'Dinner', icon: 'soup', days: [0, 1, 2, 3, 4, 5, 6], start: '21:00', end: '21:30', c: 'var(--sand)', meal: 1 }
    ],
    areas: [
      { id: 'hope', name: 'Hope Center', icon: 'landmark', c: 'var(--slate)' },
      { id: 'paradox', name: 'Paradox Agency', icon: 'laptop', c: 'var(--plum)' },
      { id: 'xo', name: 'XO Textiles', icon: 'shirt', c: 'var(--sand)' },
      { id: 'scouts', name: 'Scouts · Formation B', icon: 'compass', c: 'var(--sage)' },
      { id: 'cv', name: 'CV', icon: 'notebook-pen', c: 'var(--ember)' },
      { id: 'portfolio', name: 'Portfolio', icon: 'layers', c: 'var(--rose)' },
      { id: 'personal', name: 'Personal', icon: 'house', c: 'var(--muted)' }
    ],
    tasks: [], events: [], notes: [],
    money: { tx: [], budgets: {}, salary: null, subs: [], rate: 13000, show: 'USD' },
    de: { srs: {}, course: { name: 'A1.1', left: 4, next: 'A1.2' }, lessons: [], seen: 0 },
    courses: [], books: [], career: { done: {} }, journal: {}, qfav: [],
    health: { on: false, steps: {}, sleep: {}, rhr: null, last: 0 }, cal: { on: false }
  });
  E.migrate = () => {
    const f = E.seed();
    for (const k in f) if (E.S[k] == null) E.S[k] = f[k];
    for (const k of ['profile', 'settings', 'food', 'money', 'de', 'health', 'cal', 'train', 'mob']) E.S[k] = { ...f[k], ...E.S[k] };
    if ((E.S.v || 1) < 2) {
      // version 2: counters live in the "anytime" strip, and an unused Day 1 in the past moves to today
      for (const h of E.S.habits) if (['teeth', 'read', 'money'].includes(h.id)) h.time = 'all';
      if (!Object.keys(E.S.logs).length && E.S.profile.start < E.today()) E.S.profile.start = E.today();
      E.S.v = 2;
    }
  };
  if (!E.S) { E.S = E.seed(); E.save(); } else E.migrate();

  // ---------- career roadmaps (DevOps, software engineering, cloud architecture, Germany) ----------
  E.ROADMAPS = [
    { id: 'devops', n: 'DevOps engineer', icon: 'server', c: 'var(--slate)', steps: [
      'Linux command line: files, permissions, processes, systemd', 'Bash scripting: write 3 useful scripts for your own work', 'Networking basics: DNS, HTTP/S, TCP/IP, ports, TLS',
      'Git deeply: branching, rebase, pull-request workflow', 'Docker: containerise a Laravel app with Compose', 'CI/CD: GitHub Actions pipeline with tests, build and deploy',
      'Nginx and reverse proxies; zero-downtime deploys', 'Infrastructure as code with Terraform', 'Kubernetes basics: pods, deployments, services, ingress',
      'Monitoring and logs: Prometheus, Grafana, Loki', 'Configuration management with Ansible', 'Security basics: secrets, least privilege, image scanning',
      'Project: deploy a real app end to end with CI/CD and monitoring', 'Certification goal: CKA or AWS SysOps (pick one)'] },
    { id: 'swe', n: 'Software engineering', icon: 'git-branch', c: 'var(--ember)', steps: [
      'Clean code and naming; refactor one old project', 'SOLID and design patterns used in Laravel', 'Automated testing with Pest: unit and feature tests',
      'Data structures and algorithms: 2 problems a week', 'SQL depth: indexes, query plans, transactions', 'API design: REST conventions, versioning, auth with Sanctum',
      'Queues, events and jobs in Laravel', 'Caching with Redis', 'Frontend depth: TypeScript and Vue or React with Inertia',
      'System design basics: scaling reads, writes and caches', 'Code review: give and receive reviews on GitHub', 'Project: one polished portfolio app with tests and docs'] },
    { id: 'cloud', n: 'Cloud solutions architect', icon: 'cloud', c: 'var(--sage)', steps: [
      'Cloud concepts: regions, availability zones, shared responsibility', 'AWS core: IAM, EC2, S3, VPC', 'Databases in the cloud: RDS, DynamoDB, backups',
      'Serverless: Lambda, API Gateway, queues', 'Networking: VPC design, subnets, load balancers, CDN', 'Well-Architected Framework: the six pillars',
      'Cost control and budgets', 'High availability and disaster recovery patterns', 'Certification: AWS Cloud Practitioner',
      'Certification: AWS Solutions Architect Associate', 'Project: design and deploy a 3-tier app with diagrams'] },
    { id: 'germany', n: 'Ready for Germany', icon: 'map-pin', c: 'var(--plum)', steps: [
      'German-style CV (Lebenslauf), 2 pages, results in numbers', 'Cover letter (Anschreiben) template in English and German', 'LinkedIn profile matching the CV, set to open to work',
      'Portfolio: 3 case studies (HC Tracking, Paradox, XO Textiles)', 'GitHub cleanup: pinned repos, READMEs with screenshots', 'Collect references from Hope Center',
      'Learn the visa routes: EU Blue Card and Opportunity Card', 'Know salary ranges for your level and city', 'Prepare "tell me about yourself" in English and simple German',
      'STAR stories for 5 projects', 'Apply to 5 jobs a week and track them in Plan'] }
  ];

  // ---------- motivational quotes (forward-moving) ----------
  E.QUOTES = [
    'Small steps every day add up to a different life.', 'You do not rise to your goals. You fall to your systems.', 'Discipline is remembering what you want.',
    'The days you don\'t feel like it are the days that count.', 'Never miss twice.', 'Do the small version. Today it is enough.',
    'Start before you feel ready.', 'Progress, not perfection.', 'One more step than yesterday.', 'Future you is built by what you do tonight.',
    'Consistency beats intensity.', 'Be the man you would want your child to copy.', 'Hard choices now, easy life later.',
    'Win the morning, win the day.', 'Every rep is a vote for who you are becoming.', 'You are not behind. You are on your way.',
    'Done is better than perfect.', 'Motivation fades. Habits stay.', 'Keep the promise you made to yourself.', 'Clarity comes from action.',
    'The fire grows from small sticks, added daily.', 'Show up. That is the whole secret.', 'Tired is fine. Quitting is not.',
    'What you do every day matters more than what you do once in a while.', 'Make it so easy you cannot say no.', 'Today is a good day to keep going.',
    'Your future self is watching. Make him proud.', 'Calm, steady, every day.', 'Little by little, a little becomes a lot.', 'Begin again, as many times as it takes.'
  ];
  E.quoteOf = d => E.QUOTES[E.hash('q' + d) % E.QUOTES.length];
})(window.E);
