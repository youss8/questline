(function (Q) {
  'use strict';
  // ---------- German: A1 vocabulary decks (German | English) ----------
  const deck = (id, n, lvl, raw) => ({ id, n, lvl, cards: raw.trim().split('\n').map(l => { const [de, en] = l.split('|').map(s => s.trim()); return { id: id + ':' + de, de, en }; }) });
  Q.DE_DECKS = [
    deck('greet', 'Greetings & basics', 'A1.1', `
Hallo|Hello
Guten Morgen|Good morning
Guten Tag|Good day / hello
Guten Abend|Good evening
Gute Nacht|Good night
Tschüss|Bye
Auf Wiedersehen|Goodbye
Bis später|See you later
Danke|Thank you
Bitte|Please / you're welcome
Entschuldigung|Excuse me / sorry
Ja|Yes
Nein|No
Wie geht's?|How are you?
Mir geht es gut|I'm fine
Ich heiße …|My name is …
Woher kommst du?|Where are you from?
Ich komme aus Syrien|I come from Syria
Ich wohne in Aleppo|I live in Aleppo
Ich verstehe nicht|I don't understand
Können Sie das wiederholen?|Can you repeat that?
Sprechen Sie Englisch?|Do you speak English?
Wie bitte?|Pardon?`),
    deck('numbers', 'Numbers & time', 'A1.1', `
eins|one
zwei|two
drei|three
vier|four
fünf|five
sechs|six
sieben|seven
acht|eight
neun|nine
zehn|ten
elf|eleven
zwölf|twelve
zwanzig|twenty
dreißig|thirty
hundert|hundred
tausend|thousand
die Uhr|the clock / o'clock
Wie spät ist es?|What time is it?
halb drei|half past two (2:30)
Viertel nach vier|quarter past four
Viertel vor fünf|quarter to five
heute|today
morgen|tomorrow
gestern|yesterday
die Woche|the week
der Monat|the month
das Jahr|the year`),
    deck('days', 'Days & months', 'A1.1', `
Montag|Monday
Dienstag|Tuesday
Mittwoch|Wednesday
Donnerstag|Thursday
Freitag|Friday
Samstag|Saturday
Sonntag|Sunday
das Wochenende|the weekend
Januar|January
Februar|February
März|March
April|April
Mai|May
Juni|June
Juli|July
August|August
September|September
Oktober|October
November|November
Dezember|December
am Montag|on Monday
im Januar|in January`),
    deck('family', 'Family & people', 'A1.1', `
die Familie|the family
die Mutter|the mother
der Vater|the father
die Eltern|the parents
der Bruder|the brother
die Schwester|the sister
das Kind|the child
das Baby|the baby
der Sohn|the son
die Tochter|the daughter
die Freundin|the girlfriend / female friend
der Freund|the boyfriend / male friend
verheiratet|married
ledig|single
der Mann|the man / husband
die Frau|the woman / wife
alt|old
jung|young`),
    deck('verbs1', 'Core verbs I', 'A1.1', `
sein|to be
haben|to have
machen|to do / make
gehen|to go
kommen|to come
wohnen|to live (reside)
heißen|to be called
sprechen|to speak
lernen|to learn
arbeiten|to work
essen|to eat
trinken|to drink
schlafen|to sleep
spielen|to play
kaufen|to buy
brauchen|to need
möchten|would like
können|can / to be able to
müssen|must / have to
wollen|to want`),
    deck('food', 'Food & drink', 'A1.1', `
das Brot|the bread
das Wasser|the water
der Kaffee|the coffee
der Tee|the tea
die Milch|the milk
das Ei|the egg
der Käse|the cheese
das Fleisch|the meat
das Hähnchen|the chicken
der Reis|the rice
das Obst|the fruit
das Gemüse|the vegetables
der Apfel|the apple
die Banane|the banana
das Frühstück|the breakfast
das Mittagessen|the lunch
das Abendessen|the dinner
Ich habe Hunger|I'm hungry
Ich habe Durst|I'm thirsty
Die Rechnung, bitte|The bill, please
Was kostet das?|How much is it?
lecker|tasty`),
    deck('home', 'Home & daily life', 'A1.2', `
die Wohnung|the apartment
das Haus|the house
das Zimmer|the room
die Küche|the kitchen
das Bad|the bathroom
das Schlafzimmer|the bedroom
der Tisch|the table
der Stuhl|the chair
das Bett|the bed
aufstehen|to get up
duschen|to shower
frühstücken|to have breakfast
einkaufen|to go shopping
kochen|to cook
putzen|to clean
fernsehen|to watch TV
sich die Zähne putzen|to brush one's teeth
anrufen|to call (phone)
einschlafen|to fall asleep
der Alltag|everyday life`),
    deck('city', 'City & directions', 'A1.2', `
die Stadt|the city
die Straße|the street
der Bahnhof|the train station
die Haltestelle|the stop (bus/tram)
der Bus|the bus
die U-Bahn|the subway
das Auto|the car
der Flughafen|the airport
die Apotheke|the pharmacy
der Supermarkt|the supermarket
die Bank|the bank
links|left
rechts|right
geradeaus|straight ahead
Wo ist …?|Where is …?
Wie komme ich zum …?|How do I get to the …?
nah|near
weit|far
die Fahrkarte|the ticket
umsteigen|to change (trains)`),
    deck('work', 'Work & office', 'A1.2', `
die Arbeit|the work
der Beruf|the profession
die Firma|the company
das Büro|the office
der Kollege|the colleague (m)
die Kollegin|the colleague (f)
der Chef|the boss
die Besprechung|the meeting
der Termin|the appointment
die E-Mail|the email
der Computer|the computer
der Entwickler|the developer
die Software|the software
das Projekt|the project
die Aufgabe|the task
fertig|finished / ready
die Pause|the break
der Feierabend|end of the workday
Ich bin Softwareentwickler|I'm a software developer
Ich arbeite als Full-Stack-Entwickler|I work as a full-stack developer
der Lebenslauf|the CV
die Bewerbung|the job application
das Vorstellungsgespräch|the job interview`),
    deck('health', 'Body & health', 'A1.2', `
der Kopf|the head
der Rücken|the back
der Bauch|the stomach
das Bein|the leg
der Arm|the arm
das Knie|the knee
die Hand|the hand
der Fuß|the foot
krank|sick
gesund|healthy
der Arzt|the doctor
Ich habe Kopfschmerzen|I have a headache
Mir tut der Rücken weh|My back hurts
müde|tired
das Fitnessstudio|the gym
Sport machen|to do sport
laufen|to run / walk`),
    deck('adj', 'Adjectives & feelings', 'A1.2', `
gut|good
schlecht|bad
groß|big / tall
klein|small
neu|new
teuer|expensive
billig|cheap
schnell|fast
langsam|slow
schön|beautiful / nice
glücklich|happy
traurig|sad
nervös|nervous
froh|glad
wichtig|important
einfach|easy / simple
schwierig|difficult
interessant|interesting
langweilig|boring`),
    deck('verbs2', 'Core verbs II', 'A1.2', `
fahren|to drive / travel
nehmen|to take
geben|to give
sehen|to see
lesen|to read
schreiben|to write
hören|to hear / listen
fragen|to ask
antworten|to answer
helfen|to help
finden|to find
bleiben|to stay
beginnen|to begin
öffnen|to open
schließen|to close
warten|to wait
bezahlen|to pay
verstehen|to understand
vergessen|to forget
treffen|to meet`)
  ];
  Q.DE_GRAMMAR = [
    { t: 'Verb position', b: 'In a normal sentence the conjugated verb is always in position 2: "Heute <b>lerne</b> ich Deutsch." In yes/no questions it comes first: "<b>Lernst</b> du Deutsch?"' },
    { t: 'Present tense endings', b: 'ich lern<b>e</b>, du lern<b>st</b>, er/sie/es lern<b>t</b>, wir lern<b>en</b>, ihr lern<b>t</b>, sie/Sie lern<b>en</b>.' },
    { t: 'sein & haben', b: 'sein: bin, bist, ist, sind, seid, sind. haben: habe, hast, hat, haben, habt, haben.' },
    { t: 'Articles: der, die, das', b: 'Learn every noun with its article. Plural is always <b>die</b>. Tips: -ung, -heit, -keit → die; -chen → das; days, months → der.' },
    { t: 'ein / kein', b: 'ein (der/das), eine (die). Negate nouns with <b>kein/keine</b>: "Ich habe <b>kein</b> Auto." Negate verbs with <b>nicht</b>.' },
    { t: 'Accusative', b: 'The direct object changes only the masculine article: der → <b>den</b>, ein → <b>einen</b>. "Ich kaufe <b>den</b> Kaffee."' },
    { t: 'Modal verbs', b: 'Modal verb in position 2, main verb at the end: "Ich <b>muss</b> heute <b>arbeiten</b>." können, müssen, wollen, möchten, dürfen, sollen.' },
    { t: 'Separable verbs', b: 'Prefix goes to the end: aufstehen → "Ich <b>stehe</b> um 7 Uhr <b>auf</b>." Also: einkaufen, anrufen, fernsehen.' },
    { t: 'W-questions', b: 'W-word, then verb: Wer (who), Was (what), Wo (where), Woher (from where), Wohin (to where), Wann (when), Wie (how), Warum (why).' },
    { t: 'Time phrases', b: 'um + time (um 8 Uhr), am + day (am Montag), im + month (im Mai). Time before place: "Ich gehe <b>heute</b> <b>ins Büro</b>."' },
    { t: 'Perfekt (past)', b: 'haben/sein + participle at the end: "Ich <b>habe</b> Deutsch <b>gelernt</b>." Movement verbs use sein: "Ich <b>bin</b> nach Hause <b>gegangen</b>."' },
    { t: 'Possessives', b: 'mein, dein, sein (his), ihr (her), unser, euer, ihr/Ihr. Add -e for feminine/plural: meine Mutter, meine Eltern.' },
    { t: 'Dative basics', b: 'After mit, bei, nach, von, zu, aus: dem (der/das), der (die), den…n (plural). "Ich fahre <b>mit dem</b> Bus."' }
  ];
  Q.DE_PHRASES = [
    ['Ich lerne seit … Monaten Deutsch.', 'I have been learning German for … months.'],
    ['Könnten Sie bitte langsamer sprechen?', 'Could you please speak more slowly?'],
    ['Ich habe einen Termin um 10 Uhr.', 'I have an appointment at 10.'],
    ['Ich arbeite seit 2025 als Entwickler.', 'I have worked as a developer since 2025.'],
    ['Ich interessiere mich für Webentwicklung.', 'I am interested in web development.'],
    ['Wann passt es Ihnen?', 'When suits you?'],
    ['Ich freue mich auf das Gespräch.', 'I look forward to the conversation.'],
    ['Vielen Dank für Ihre Hilfe.', 'Thank you very much for your help.']
  ];

  // ---------- Career growth paths (for German work life) ----------
  Q.CAREER = [
    {
      id: 'cv', n: 'CV & applications', icon: 'clipboard-list', steps: [
        'German-style CV (Lebenslauf): photo optional, reverse chronological, 2 pages max',
        'Write a 3-line professional summary in English and German',
        'Add measurable results to each job (e.g. "cut page load by 40%")',
        'Create a Europass or LinkedIn profile that matches the CV',
        'Write a reusable cover letter (Anschreiben) template',
        'Collect references from Hope Center',
        'Translate & certify degree documents (Anabin H+ done ✓)',
        'Apply to 5 jobs on StepStone / LinkedIn / Make it in Germany',
        'Track every application in Life → Tasks'
      ]
    },
    {
      id: 'portfolio', n: 'Portfolio', icon: 'layers', steps: [
        'Pick your 3 strongest projects (HC Tracking, Paradox, XO Textiles…)',
        'Write a case study for each: problem, your role, stack, result',
        'Clean up GitHub: pinned repos, READMEs with screenshots',
        'Build a one-page portfolio site with Laravel or plain HTML',
        'Add live demos or screen recordings',
        'Ask one client for a testimonial',
        'Add the portfolio link to CV and LinkedIn'
      ]
    },
    {
      id: 'laravel', n: 'Laravel mastery', icon: 'brain-circuit', steps: [
        'Service container & dependency injection',
        'Queues, jobs and scheduled tasks',
        'Events, listeners and notifications',
        'Policies & gates for authorization',
        'Eloquent performance: eager loading, N+1, indexes',
        'API resources and Sanctum auth',
        'Livewire 3 deep dive: forms, lazy loading, testing',
        'Deploy with zero downtime (Forge/Envoyer or CI)',
        'Build a package and publish it'
      ]
    },
    {
      id: 'testing', n: 'Testing & quality', icon: 'badge-check', steps: [
        'Pest basics: feature vs unit tests',
        'Test a full CRUD with factories',
        'Mocking HTTP and queues',
        'Add tests to one real project (aim 60% coverage)',
        'Static analysis with Larastan level 5+',
        'Code style: Pint in CI',
        'GitHub Actions: tests on every push'
      ]
    },
    {
      id: 'frontend', n: 'Modern frontend', icon: 'palette', steps: [
        'TypeScript fundamentals',
        'Vue 3 or React: components, state, routing',
        'Inertia.js with Laravel',
        'Tailwind design systems and accessibility (WCAG)',
        'Web performance: Core Web Vitals',
        'Build one SPA project for the portfolio'
      ]
    },
    {
      id: 'system', n: 'System design & DevOps', icon: 'orbit', steps: [
        'HTTP, caching and CDNs',
        'Database design, normalization, indexing',
        'Redis for cache and queues',
        'Docker: containerize a Laravel app',
        'CI/CD pipeline from scratch',
        'Basic AWS or Hetzner deployment',
        'Design a URL shortener / chat system on paper'
      ]
    },
    {
      id: 'interview', n: 'Interview prep (Germany)', icon: 'handshake', steps: [
        'Prepare your 60-second "tell me about yourself" in English',
        'The same in simple German',
        'STAR stories: 5 projects with Situation, Task, Action, Result',
        'Practise 20 common technical questions (PHP, Laravel, SQL, JS)',
        'One live-coding mock interview per week',
        'Learn German salary ranges for your level',
        'Know the visa route: EU Blue Card / Opportunity Card basics'
      ]
    },
    {
      id: 'worklife', n: 'German work culture', icon: 'globe', steps: [
        'Punctuality and calendar culture (Termine)',
        'Direct feedback: how Germans give and take it',
        'Sie vs du at work',
        'Writing formal emails in German (Sehr geehrte…, Mit freundlichen Grüßen)',
        'Meeting vocabulary: Besprechung, Protokoll, Frist',
        'Work contracts: Probezeit, Kündigungsfrist, Urlaub',
        'Health insurance, tax classes, and payslip basics'
      ]
    }
  ];

  // ---------- extra quotes by category ----------
  Q.QUOTE_CATS = ['Discipline', 'Focus', 'Health', 'Career', 'Learning', 'Faith', 'Mindset', 'Money'];
  Q.QUOTES2 = [
    ['Discipline', 'Discipline is choosing between what you want now and what you want most.'],
    ['Discipline', 'Motivation gets you started. Systems keep you going.'],
    ['Discipline', 'Do it tired. Do it bored. Do it anyway.'],
    ['Discipline', 'The streak is not the goal. The person the streak builds is.'],
    ['Discipline', 'Never miss twice.'],
    ['Focus', 'One tab. One task. One timer.'],
    ['Focus', 'What would this look like if it were easy?'],
    ['Focus', 'Start with the smallest version of the hardest thing.'],
    ['Focus', 'Clarity comes from action, not thought.'],
    ['Health', 'Your body keeps score of every day you show up for it.'],
    ['Health', 'Eat like you love yourself. Move like you respect yourself.'],
    ['Health', 'Sitting is the problem. Movement is the medicine.'],
    ['Health', 'Sleep is the cheapest performance enhancer.'],
    ['Career', 'Become so good they cannot ignore you.'],
    ['Career', 'Ship small, ship often, learn every time.'],
    ['Career', 'Your portfolio speaks before you do.'],
    ['Career', 'The best time to prepare for the job you want is today.'],
    ['Learning', 'A language is learned one word a day, not one hundred on Sunday.'],
    ['Learning', 'Confusion is the feeling of learning.'],
    ['Learning', 'Teach it to understand it.'],
    ['Faith', 'Do your best, and trust God with the rest.'],
    ['Faith', 'Be still, and know.'],
    ['Faith', 'Hope is a discipline.'],
    ['Mindset', 'You are not behind. You are on your own path.'],
    ['Mindset', 'Small wins, stacked daily, beat big plans made yearly.'],
    ['Mindset', 'Feelings are visitors. Let them come and go.'],
    ['Mindset', 'Progress, not perfection.'],
    ['Money', 'Track every coin and you will find where your freedom leaks.'],
    ['Money', 'Pay yourself first.'],
    ['Money', 'Wealth is what you do not spend.']
  ];
  // mood → category for the quote of the day
  Q.MOOD_CAT = { 1: 'Faith', 2: 'Mindset', 3: 'Focus', 4: 'Discipline', 5: 'Career' };
})(window.Q);
