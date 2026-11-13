/**
 * RENO's knowledge base. Every answer is written from ABCARINO's own published
 * content (About page, solutions, packages). Nothing here claims certifications,
 * partners, warranties, coverage areas or prices. Where a topic is not part of the
 * published offer, the answer says so and points to the team.
 *
 * To add a question: add an entry with a unique `id`, phrasings in both languages,
 * a few `keywords`, both answers and (optionally) `related` ids and an `action`.
 * `npm test` checks ids, cross-references and that every entry is bilingual.
 * Availability of each solution lives in the CMS, so answers link to the solution
 * page (which shows its current status) instead of stating it.
 */

export type RenoLocale = "en" | "ar";
type Bi = { en: string; ar: string };

export type RenoAction =
  | { type: "link"; href: string; label: Bi } // href without the locale prefix, e.g. "/solutions/websites"
  | { type: "whatsapp" }
  | { type: "contact" };

export type RenoCategoryId = "about" | "smart-home" | "building" | "av" | "networks" | "software" | "projects" | "meta";

export type RenoFaq = {
  id: string;
  category: RenoCategoryId;
  questions: { en: string[]; ar: string[] }; // first item is the display question
  keywords: string[];
  answers: Bi;
  related?: string[];
  action?: RenoAction;
  /** Hidden from suggestion chips and the FAQ page (small talk). */
  hidden?: boolean;
};

export const RENO_CATEGORIES: Array<{ id: Exclude<RenoCategoryId, "meta">; label: Bi }> = [
  { id: "about", label: { en: "About ABCARINO", ar: "عن عبقرينو" } },
  { id: "smart-home", label: { en: "Smart home", ar: "المنزل الذكي" } },
  { id: "building", label: { en: "Businesses & buildings", ar: "الشركات والمباني" } },
  { id: "av", label: { en: "Audio & video", ar: "الصوت والصورة" } },
  { id: "networks", label: { en: "Networks & security", ar: "الشبكات والأمان" } },
  { id: "software", label: { en: "Software & technology", ar: "البرمجيات والتقنية" } },
  { id: "projects", label: { en: "Projects & pricing", ar: "المشاريع والأسعار" } },
];

const solution = (slug: string, en: string, ar: string): RenoAction => ({ type: "link", href: `/solutions/${slug}`, label: { en, ar } });

export const RENO_FAQ: RenoFaq[] = [
  // ── About ────────────────────────────────────────────────────────────
  {
    id: "about",
    category: "about",
    questions: {
      ar: ["مين ABCARINO؟", "مين عبقرينو؟", "يعني إيه عبقرينو؟", "انتو مين؟", "إيه هي شركة عبقرينو؟"],
      en: ["Who is ABCARINO?", "What is ABCARINO?", "Who are you guys?", "Tell me about the company"],
    },
    keywords: ["abcarino", "عبقرينو", "الشركه", "company", "about"],
    answers: {
      ar: "عبقرينو شركة حلول تقنية وتكامل أنظمة. بنبدأ بالاستماع، ونفهم المكان والمشكلة، وبعدين نصمّم حل يجمع الأجهزة والبرمجيات والمتخصصين المناسبين. الشركة بيقودها فريق أساسي خلفيته في البرمجيات والأنظمة الذكية، ولكل مشروع بنستعين بالمتخصصين اللي محتاجهم، وبنفضل مسؤولين عن النتيجة من أول كلمة لحد التسليم.",
      en: "ABCARINO is a technology solutions and systems integration company. We listen first, understand the space and the problem, then design a solution that brings together the right hardware, software and specialists. A core team with backgrounds in software and smart systems leads every project, brings in the specialists it needs, and stays accountable from the first conversation to the handover.",
    },
    related: ["services", "contact", "integration"],
    action: { type: "link", href: "/about", label: { en: "About ABCARINO", ar: "عن عبقرينو" } },
  },
  {
    id: "services",
    category: "about",
    questions: {
      ar: ["إيه الخدمات اللي بتقدموها؟", "بتعملوا إيه؟", "خدماتكم إيه؟", "إيه الحلول اللي عندكم؟"],
      en: ["What services do you offer?", "What do you do?", "What solutions do you have?"],
    },
    keywords: ["خدمات", "خدمه", "حلول", "services", "solutions", "offer"],
    answers: {
      ar: "حلولنا متقسمة لخمس مجموعات: المعيشة الذكية (المنازل الذكية، الإضاءة الذكية، أتمتة المنزل، التحكم في المناخ، الأمان، الستائر، التحكم في الدخول)، والترفيه (السينما المنزلية، غرف الميديا والألعاب، الصوت متعدد الغرف)، والأعمال (المكاتب الذكية وغرف الاجتماعات)، وحلول متخصصة، والبرمجيات (المواقع، تطبيقات الويب والموبايل، والحلول التقنية المخصصة). بعضها متاح دلوقتي وبعضها قيد التجهيز، وصفحة الحلول بتوضح حالة كل حل.",
      en: "Our solutions fall into five groups: smart living (smart homes, smart lighting, home automation, climate control, security, curtains, access control), entertainment (home cinema, media and gaming rooms, multi-room audio), business (smart offices and meeting rooms), specialised solutions, and software (websites, web and mobile applications, custom technology solutions). Some are available now and some are in preparation; the Solutions page shows the current status of each.",
    },
    related: ["smart-home", "websites-apps", "quote"],
    action: { type: "link", href: "/solutions", label: { en: "All solutions", ar: "كل الحلول" } },
  },
  {
    id: "where",
    category: "about",
    questions: {
      ar: ["بتشتغلوا فين؟", "انتو فين؟", "عنوانكم إيه؟", "بتغطوا أنهي مناطق؟", "مكانكم فين؟"],
      en: ["Where do you work?", "Where are you located?", "Which areas do you cover?", "What is your address?"],
    },
    keywords: ["فين", "عنوان", "مكان", "منطقه", "مناطق", "محافظه", "where", "address", "location", "area", "cover"],
    answers: {
      ar: "مكان المشروع بيفرق في التخطيط، فالأفضل تبعت للفريق موقعك وهما يأكدولك إمكانية التنفيذ. العنوان ومواعيد العمل، لو متاحين، موجودين في صفحة التواصل.",
      en: "The project's location matters for planning, so the best step is to send the team your location and they will confirm what is possible. Our address and working hours, where published, are on the Contact page.",
    },
    related: ["contact", "site-visit"],
    action: { type: "contact" },
  },
  {
    id: "contact",
    category: "about",
    questions: {
      ar: ["إزاي أتواصل معاكم؟", "رقمكم كام؟", "عايز أكلم حد من الفريق", "إزاي أكلمكم؟", "واتساب"],
      en: ["How can I contact you?", "How do I reach the team?", "I want to talk to someone", "What's your WhatsApp?"],
    },
    keywords: ["تواصل", "واتساب", "ايميل", "اكلم", "فريق", "contact", "whatsapp", "email", "reach", "talk", "team", "human"],
    answers: {
      ar: "أسرع طريقة إنك تكلم الفريق على واتساب. وتقدر كمان تبعت طلبك من نموذج التواصل في صفحة التواصل، والفريق هيرد عليك.",
      en: "The quickest way is to message the team on WhatsApp. You can also send your request through the form on the Contact page and the team will get back to you.",
    },
    related: ["quote", "start-info"],
    action: { type: "whatsapp" },
  },

  // ── Smart home ───────────────────────────────────────────────────────
  {
    id: "smart-home",
    category: "smart-home",
    questions: {
      ar: ["يعني إيه Smart Home؟", "يعني إيه سمارت هوم؟", "هل بتعملوا منازل ذكية؟", "عايز أحول بيتي لبيت ذكي", "إيه هو المنزل الذكي؟"],
      en: ["What is a smart home?", "Do you install smart home systems?", "I want to make my home smart"],
    },
    keywords: ["smart home", "منزل ذكي", "بيت ذكي", "سمارت هوم", "ذكي", "automation", "اتمته"],
    answers: {
      ar: "المنزل الذكي مش مجموعة أجهزة؛ هو بيت بيفهم لحظات مهمة في يومك — الصحيان، الخروج، الرجوع، الاسترخاء، والنوم — ويتعامل معاها. بنبدأ بطريقة حياتك، وبعدين نختار التقنية: إضاءة ومشاهد تشتغل بلمسة أو بجدول أو بصوتك، وأتمتة يومية بسيطة، مع بقاء مفاتيح الحائط المألوفة.",
      en: "A smart home isn't a collection of gadgets. It's a home that understands a few important moments — waking up, leaving, coming back, relaxing, sleeping — and handles them for you. We start with how you live, then choose the technology: lighting and scenes triggered by a touch, a schedule or your voice, and simple everyday automation, while the familiar wall switches stay.",
    },
    related: ["lighting-app", "ac-curtains", "existing-home"],
    action: solution("smart-homes", "Smart Homes", "المنازل الذكية"),
  },
  {
    id: "lighting-app",
    category: "smart-home",
    questions: {
      ar: ["أقدر أتحكم في الإضاءة من الموبايل؟", "ينفع أتحكم في النور من التليفون؟", "الإضاءة الذكية بتشتغل إزاي؟"],
      en: ["Can I control the lights from my phone?", "How does smart lighting work?", "Can I control lighting by voice?"],
    },
    keywords: ["اضاءه", "موبايل", "تطبيق", "صوت", "lighting", "phone", "app", "voice"],
    answers: {
      ar: "أيوه. في حل الإضاءة الذكية بنجهّز التحكم بالتطبيق والصوت، ومفاتيح الحائط المألوفة بتفضل شغالة — التطبيق إضافة مش شرط. وكمان بنعمل مشاهد وجداول تخلي كل أوضة بالإحساس المناسب بلمسة واحدة.",
      en: "Yes. Our smart lighting includes app and voice control, and the familiar wall switches keep working — the app is an addition, not a requirement. We also set up scenes and schedules so each room feels right with one touch.",
    },
    related: ["smart-home", "existing-home"],
    action: solution("smart-lighting", "Smart Lighting", "الإضاءة الذكية"),
  },
  {
    id: "ac-curtains",
    category: "smart-home",
    questions: {
      ar: ["هل ممكن أتحكم في التكييف والستائر؟", "ينفع التكييف يبقى ذكي؟", "عندكم ستائر ذكية؟"],
      en: ["Can I control the AC and curtains?", "Do you do smart curtains?", "Can you automate air conditioning?"],
    },
    keywords: ["تكييف", "ستاير", "مناخ", "climate", "curtains", "blinds", "ac"],
    answers: {
      ar: "التحكم في المناخ (درجات حرارة مريحة لكل أوضة بطاقة مهدرة أقل) والستائر الذكية (ستائر بتمشي مع الشمس ومع مشاهدك) موجودين ضمن حلولنا. افتح صفحة كل حل عشان تعرف حالته الحالية وتفاصيله، أو كلّم الفريق عن بيتك.",
      en: "Climate control (comfortable temperatures room by room, with less energy wasted) and smart curtains (curtains and blinds that follow the sun and your scenes) are part of our solutions. Open each solution's page for its current status and details, or tell the team about your home.",
    },
    related: ["smart-home", "lighting-app"],
    action: solution("climate-control", "Climate Control", "التحكّم في المناخ"),
  },
  {
    id: "existing-home",
    category: "smart-home",
    questions: {
      ar: ["هل ينفع أركب النظام في بيت موجود بالفعل؟", "بيتي متشطب، ينفع أعمله ذكي؟", "لازم أكسر حيطان؟"],
      en: ["Can you install it in an existing home?", "My home is already finished — can it become smart?", "Do I need to rebuild anything?"],
    },
    keywords: ["موجود", "متشطب", "قديم", "تكسير", "existing", "finished", "retrofit", "already"],
    answers: {
      ar: "ده بيعتمد على المكان. مثلًا باقة أساسيات الإضاءة الذكية معمولة عشان تطوّر التحكم في الإضاءة في الأوض اللي تختارها. الفريق بيأكد إمكانية التنفيذ في بيتك تحديدًا بعد ما يعرف تفاصيله.",
      en: "It depends on the space. For example, our Smart Lighting Essentials package is designed to upgrade lighting control in the rooms you choose. The team confirms what's possible in your home once they know its details.",
    },
    related: ["start-info", "phases"],
    action: { type: "whatsapp" },
  },

  // ── Businesses & buildings ───────────────────────────────────────────
  {
    id: "home-vs-building",
    category: "building",
    questions: {
      ar: ["إيه الفرق بين Smart Home وBuilding Automation؟", "يعني إيه أتمتة المباني؟", "الفرق بين البيت الذكي والمبنى الذكي"],
      en: ["What's the difference between smart home and building automation?", "What is building automation?"],
    },
    keywords: ["building automation", "اتمته المباني", "مبني", "فرق", "difference", "building"],
    answers: {
      ar: "المنزل الذكي بيركّز على راحة الناس في البيت: الإضاءة والمشاهد والأتمتة اليومية. أتمتة المباني بتتعامل مع أنظمة المبنى ككل. ضمن حلولنا المنشورة للمساحات التجارية عندنا المكاتب الذكية وغرف الاجتماعات؛ ولو مشروعك مبنى كامل، الفريق يقدر يوضحلك إيه اللي ممكن نصمّمه ونكامله.",
      en: "A smart home focuses on everyday comfort at home: lighting, scenes and routines. Building automation deals with a building's systems as a whole. For commercial spaces our published solutions include smart offices and meeting rooms; if your project is a whole building, the team can tell you what we can design and integrate.",
    },
    related: ["businesses", "integration"],
    action: { type: "whatsapp" },
  },
  {
    id: "businesses",
    category: "building",
    questions: {
      ar: ["هل بتشتغلوا في المباني والشركات؟", "بتعملوا مكاتب ذكية؟", "عندكم حلول للشركات؟"],
      en: ["Do you work with companies and buildings?", "Do you do smart offices?", "Do you have business solutions?"],
    },
    keywords: ["شركه", "مكاتب", "مبني", "business", "office", "company", "commercial"],
    answers: {
      ar: "أيوه، ضمن حلولنا للأعمال: المكاتب الذكية (إضاءة وتكييف ودخول بإدارة بسيطة) وغرف الاجتماعات (شاشات وكاميرات وصوت بيشتغلوا ببساطة). وللشركات كمان بنعمل مواقع وتطبيقات ويب وموبايل. صفحة كل حل بتوضح حالته الحالية.",
      en: "Yes. Our business solutions include smart offices (lighting, climate and access, managed simply) and meeting rooms (displays, cameras and audio that just work). For businesses we also build websites and web and mobile applications. Each solution's page shows its current status.",
    },
    related: ["meeting-rooms", "websites-apps", "home-vs-building"],
    action: solution("smart-offices", "Smart Offices", "المكاتب الذكية"),
  },
  {
    id: "integration",
    category: "building",
    questions: {
      ar: ["هل ممكن دمج الأنظمة المختلفة؟", "ينفع الأنظمة كلها تشتغل مع بعض؟", "يعني إيه تكامل الأنظمة؟"],
      en: ["Can you integrate different systems?", "Can all my systems work together?", "What is systems integration?"],
    },
    keywords: ["دمج", "تكامل", "انظمه", "مع بعض", "integration", "integrate", "together", "systems"],
    answers: {
      ar: "تكامل الأنظمة هو أساس شغلنا: بنصمّم حل يجمع الأجهزة والبرمجيات المناسبة عشان تشتغل كنظام واحد بدل أجهزة منفصلة. إيه اللي ممكن يتدمج في مشروعك بيتحدد بعد ما نفهم الأنظمة الموجودة واحتياجك.",
      en: "Systems integration is at the core of what we do: we design a solution that brings the right hardware and software together so it works as one system rather than separate devices. What can be integrated in your project is decided once we understand your existing systems and needs.",
    },
    related: ["about", "start-info"],
    action: { type: "whatsapp" },
  },

  // ── Audio & video ────────────────────────────────────────────────────
  {
    id: "home-cinema",
    category: "av",
    questions: {
      ar: ["هل بتعملوا Home Cinema؟", "بتعملوا سينما منزلية؟", "عايز أوضة سينما في البيت"],
      en: ["Do you build home cinemas?", "Can you design a home theatre?"],
    },
    keywords: ["سينما", "home cinema", "هوم سينما", "theatre", "theater", "cinema"],
    answers: {
      ar: "السينما المنزلية من ضمن حلولنا: أوضة سينما مصمّمة حوالين الصورة والصوت والراحة. وعندنا كمان غرف الميديا اللي بتحوّل مساحة المعيشة لصورة وصوت مميزين وقت ما تحب. افتح الصفحة عشان تعرف الحالة الحالية والتفاصيل.",
      en: "Home cinema is one of our solutions: an immersive room designed around picture, sound and comfort. We also have media rooms, living spaces that switch into great picture and sound when you want. Open the page for the current status and details.",
    },
    related: ["surround", "meeting-rooms"],
    action: solution("home-cinema", "Home Cinema", "السينما المنزلية"),
  },
  {
    id: "surround",
    category: "av",
    questions: {
      ar: ["هل بتوفروا أنظمة الصوت المحيطي؟", "عندكم صوت في كل البيت؟", "ينفع الموسيقى تشتغل في كل الأوض؟"],
      en: ["Do you provide surround sound?", "Can music play in every room?", "Do you do multi-room audio?"],
    },
    keywords: ["صوت", "محيطي", "موسيقي", "surround", "audio", "music", "speakers", "multi room"],
    answers: {
      ar: "الصوت جزء أساسي من حلول السينما المنزلية وغرف الميديا، وعندنا كمان الصوت متعدد الغرف: موسيقى بتمشي معاك في البيت أوضة ورا أوضة. النظام المناسب بيتحدد حسب المساحة.",
      en: "Sound is central to our home cinema and media room solutions, and we also offer multi-room audio: music that follows you through the house, room by room. The right system depends on the space.",
    },
    related: ["home-cinema"],
    action: solution("multi-room-audio", "Multi-room Audio", "الصوت متعدد الغرف"),
  },
  {
    id: "meeting-rooms",
    category: "av",
    questions: {
      ar: ["هل بتجهزوا غرف الاجتماعات؟", "عايز أجهز قاعة اجتماعات", "بتعملوا أنظمة اجتماعات أونلاين؟"],
      en: ["Do you equip meeting rooms?", "Can you set up our conference room?"],
    },
    keywords: ["اجتماع", "قاعه", "مؤتمرات", "meeting", "conference", "boardroom"],
    answers: {
      ar: "غرف الاجتماعات من ضمن حلولنا للأعمال: اجتماعات تبدأ في معادها بشاشات وكاميرات وصوت بيشتغلوا ببساطة. افتح الصفحة عشان تعرف الحالة الحالية والتفاصيل.",
      en: "Meeting rooms are part of our business solutions: meetings that start on time, with displays, cameras and audio that just work. Open the page for the current status and details.",
    },
    related: ["businesses", "surround"],
    action: solution("meeting-rooms", "Meeting Rooms", "غرف الاجتماعات"),
  },

  // ── Networks & security ──────────────────────────────────────────────
  {
    id: "networks",
    category: "networks",
    questions: {
      ar: ["هل بتنفذوا الشبكات الداخلية؟", "بتعملوا شبكات واي فاي؟", "عندكم تمديدات شبكات؟"],
      en: ["Do you install internal networks?", "Do you do Wi-Fi and networking?"],
    },
    keywords: ["شبكه", "واي فاي", "انترنت", "تمديدات", "network", "wifi", "internet", "cabling"],
    answers: {
      ar: "الشبكات الداخلية مش موجودة كخدمة مستقلة في حلولنا المنشورة حاليًا. لو مشروعك محتاجها كجزء من نظام ذكي أو مكتب، اسأل الفريق يأكدلك اللي نقدر نقدّمه.",
      en: "Internal networks aren't listed as a separate service in our published solutions at the moment. If your project needs them as part of a smart system or an office, ask the team to confirm what we can provide.",
    },
    related: ["integration", "contact"],
    action: { type: "whatsapp" },
  },
  {
    id: "cameras",
    category: "networks",
    questions: {
      ar: ["هل بتوفروا كاميرات المراقبة؟", "عايز كاميرات للبيت", "عندكم أنظمة أمان؟"],
      en: ["Do you provide security cameras?", "Do you do CCTV?", "Do you have security systems?"],
    },
    keywords: ["كاميرا", "امان", "حمايه", "انذار", "security", "cctv", "camera", "alarm", "sensors"],
    answers: {
      ar: "الأمان الذكي من ضمن حلولنا: كاميرات وحساسات وتنبيهات تخليك مطمّن ومتابع من غير قلق. افتح الصفحة عشان تعرف الحالة الحالية والتفاصيل.",
      en: "Smart security is one of our solutions: cameras, sensors and alerts that keep you informed, not anxious. Open the page for the current status and details.",
    },
    related: ["access-intercom"],
    action: solution("smart-security", "Smart Security", "الأمان الذكي"),
  },
  {
    id: "access-intercom",
    category: "networks",
    questions: {
      ar: ["هل بتنفذوا Access Control وVideo Intercom؟", "عندكم أقفال ذكية؟", "بتعملوا أنظمة دخول؟", "عندكم انتركم؟"],
      en: ["Do you do access control and video intercom?", "Do you install smart locks?"],
    },
    keywords: ["دخول", "قفل", "اقفال", "انتركم", "access", "lock", "locks", "intercom", "entry"],
    answers: {
      ar: "التحكم في الدخول من ضمن حلولنا: أقفال ذكية وإدارة الدخول للبيوت والمباني الصغيرة. أما الإنتركم بالفيديو فمش مذكور تحديدًا في حلولنا المنشورة، فاسأل الفريق عنه.",
      en: "Access control is one of our solutions: smart locks and entry management for homes and small buildings. Video intercom isn't specifically listed in our published solutions, so please ask the team about it.",
    },
    related: ["cameras", "contact"],
    action: solution("access-control", "Access Control", "التحكّم في الدخول"),
  },

  // ── Software & technology ────────────────────────────────────────────
  {
    id: "websites-apps",
    category: "software",
    questions: {
      ar: ["هل بتصمموا مواقع وتطبيقات؟", "عايز موقع لشركتي", "بتعملوا ابلكيشن موبايل؟", "بتعملوا مواقع؟"],
      en: ["Do you design websites and apps?", "Can you build a website for my business?", "Do you build mobile apps?"],
    },
    keywords: ["موقع", "تطبيق", "ويب", "website", "app", "web", "mobile app", "design"],
    answers: {
      ar: "أيوه. بنعمل مواقع واضحة وسريعة على أي موبايل وثنائية اللغة بجد — عربي من اليمين للشمال معمول صح. وبنبني تطبيقات ويب وموبايل حوالين احتياج محدد لشغلك، بنطاق مدروس وبناء يدوم.",
      en: "Yes. We build websites that are clear, fast on any phone and properly bilingual — including right-to-left Arabic done correctly. We also build web and mobile applications around a specific business need, scoped carefully and built to last.",
    },
    related: ["systems", "consulting"],
    action: solution("websites", "Websites", "المواقع الإلكترونية"),
  },
  {
    id: "systems",
    category: "software",
    questions: {
      ar: ["هل بتطوروا أنظمة إدارية؟", "عايز سيستم لإدارة شغلي", "بتعملوا برامج مخصوصة؟"],
      en: ["Do you develop management systems?", "Can you build custom software for my business?"],
    },
    keywords: ["نظام", "سيستم", "برنامج", "اداره", "system", "software", "custom", "management"],
    answers: {
      ar: "لما الإكسيل أو البرنامج الجاهز ميبقاش مناسب، تطبيق مركّز ممكن يحل المشكلة. بنساعدك تحدد التطبيق لازم يعمل إيه، وبعدين نصمّمه ونبنيه للويب أو الموبايل أو الاتنين.",
      en: "When a spreadsheet or an off-the-shelf tool no longer fits, a focused application can. We help define what the application must do, then design and build it for the web, mobile or both.",
    },
    related: ["websites-apps", "consulting"],
    action: solution("web-and-mobile-applications", "Web & Mobile Applications", "تطبيقات الويب والجوال"),
  },
  {
    id: "consulting",
    category: "software",
    questions: {
      ar: ["هل بتقدموا استشارات تقنية؟", "عايز استشارة", "عندي مشكلة تقنية مش عارف حلها"],
      en: ["Do you offer technology consulting?", "I need advice on a tech problem", "Can I book a consultation?"],
    },
    keywords: ["استشاره", "نصيحه", "مشكله", "consultation", "consulting", "advice", "problem"],
    answers: {
      ar: "كل حل عندنا بيبدأ بنقاش عن مكانك أو مشكلتك. ولو مشكلتك مش داخلة في أي تصنيف، دي بالظبط فكرة الحلول التقنية المخصصة: احكيلنا وإحنا نصمّم الحل حواليها. تفاصيل الاستشارة نفسها الفريق بيوضحها لما تتواصل.",
      en: "Every solution starts with a conversation about your space or your problem. If your problem doesn't fit a category, that's exactly what our custom technology solutions are for: tell us and we'll design around it. The team will explain how consultations work when you get in touch.",
    },
    related: ["start-info", "contact"],
    action: solution("custom-technology-solutions", "Custom Technology Solutions", "حلول تقنية مخصّصة"),
  },

  // ── Projects & pricing ───────────────────────────────────────────────
  {
    id: "quote",
    category: "projects",
    questions: {
      ar: ["إزاي أطلب عرض سعر؟", "بكام؟", "الأسعار كام؟", "عايز أعرف التكلفة", "عرض سعر"],
      en: ["How do I request a quote?", "How much does it cost?", "What are your prices?"],
    },
    keywords: ["سعر", "عرض سعر", "تكلفه", "price", "quote", "cost", "budget"],
    answers: {
      ar: "ابعت تفاصيل طلبك على واتساب أو من نموذج التواصل. لما يكون للباقة سعر منشور هتلاقيه في صفحتها، وغير كده السعر بيتحدد حسب المساحة والمتطلبات بعد ما الفريق يفهم مشروعك.",
      en: "Send the details of your request on WhatsApp or through the contact form. Where a package has a published price you'll find it on its page; otherwise pricing depends on the space and requirements, once the team understands your project.",
    },
    related: ["start-info", "site-visit", "phases"],
    action: { type: "whatsapp" },
  },
  {
    id: "site-visit",
    category: "projects",
    questions: {
      ar: ["هل بتعملوا معاينة للموقع؟", "ممكن تيجوا تشوفوا المكان؟", "المعاينة إزاي؟"],
      en: ["Do you do site visits?", "Can you come and see the space?"],
    },
    keywords: ["معاينه", "زياره", "تيجوا", "visit", "survey", "inspection", "come"],
    answers: {
      ar: "المعاينة ومواعيدها بتتحدد مع الفريق حسب نوع المشروع ومكانه. ابعتلنا تفاصيل المكان ونرتب معاك الخطوة الجاية.",
      en: "Site visits and their timing are arranged with the team depending on the type of project and its location. Send us the details of the space and we'll arrange the next step with you.",
    },
    related: ["where", "start-info"],
    action: { type: "whatsapp" },
  },
  {
    id: "start-info",
    category: "projects",
    questions: {
      ar: ["إيه المعلومات المطلوبة عشان أبدأ مشروع؟", "أبدأ منين؟", "محتاجين مني إيه؟"],
      en: ["What information do you need to start a project?", "Where do I start?", "What should I prepare?"],
    },
    keywords: ["معلومات", "ابدا", "مشروع", "start", "information", "prepare", "begin", "project"],
    answers: {
      ar: "كل مشروع بيبدأ بأسئلة: مين بيستخدم المكان؟ إيه اللي مضايقك دلوقتي؟ وعايز إيه يبقى مختلف؟ وكمان مفيد تبعت: نوع المكان (بيت، مكتب...) ومساحته أو عدد الأوض، موقعه، صور أو رسومات لو موجودة، والوقت اللي في بالك.",
      en: "Every project starts with questions: who uses the space, what gets in the way today, and what should feel different? It also helps to send the type of place (home, office…), its size or number of rooms, its location, any photos or plans, and the timing you have in mind.",
    },
    related: ["quote", "site-visit"],
    action: { type: "whatsapp" },
  },
  {
    id: "phases",
    category: "projects",
    questions: {
      ar: ["هل ممكن تنفيذ مشروع على مراحل؟", "ينفع أبدأ بحاجة صغيرة؟", "ممكن أقسّم المشروع؟"],
      en: ["Can a project be done in phases?", "Can I start small?"],
    },
    keywords: ["مرحله", "مراحل", "تقسيم", "صغير", "phases", "stages", "start small", "step"],
    answers: {
      ar: "ده بيتحدد مع الفريق حسب طبيعة المشروع. ولو حابب تبدأ بحاجة صغيرة، باقة أساسيات الإضاءة الذكية معمولة كأبسط طريقة تحس بيها بفرق المنزل الذكي.",
      en: "That's agreed with the team depending on the project. If you'd like to start small, our Smart Lighting Essentials package is designed as the simplest way to feel the difference of a smart home.",
    },
    related: ["existing-home", "quote"],
    action: { type: "whatsapp" },
  },

  // ── Small talk (not shown as chips) ──────────────────────────────────
  {
    id: "reno",
    category: "meta",
    hidden: true,
    questions: {
      ar: ["مين رينو؟", "انت مين؟", "انت روبوت؟", "انت ذكاء اصطناعي؟"],
      en: ["Who are you?", "Who is RENO?", "Are you a robot?", "Are you an AI?"],
    },
    keywords: ["reno", "رينو", "روبوت", "robot", "ai", "ذكاء اصطناعي"],
    answers: {
      ar: "أنا رينو، جاي من سنة 2186 عشان أساعدك تلاقي إجابات عن عبقرينو. أنا مش ذكاء اصطناعي: إجاباتي جاية من قاعدة معلومات الشركة، ولو حاجة مش عندي هوصّلك بالفريق.",
      en: "I'm RENO, visiting from the year 2186 to help you find answers about ABCARINO. I'm not an AI: my answers come from the company's knowledge base, and if I don't know something I'll connect you with the team.",
    },
    related: ["about", "services"],
  },
  {
    id: "hello",
    category: "meta",
    hidden: true,
    questions: {
      ar: ["أهلا", "السلام عليكم", "هاي", "صباح الخير", "مساء الخير", "ازيك"],
      en: ["Hi", "Hello", "Hey", "Good morning", "Good evening"],
    },
    keywords: [],
    answers: {
      ar: "أهلًا بيك! اسألني عن خدمات عبقرينو أو اختار سؤال من الاقتراحات.",
      en: "Hey there! Ask me about ABCARINO's services or pick one of the suggested questions.",
    },
    related: ["services", "about"],
  },
  {
    id: "thanks",
    category: "meta",
    hidden: true,
    questions: {
      ar: ["شكرا", "متشكر", "تسلم", "ميرسي"],
      en: ["Thanks", "Thank you", "Thanks a lot"],
    },
    keywords: [],
    answers: {
      ar: "العفو! لو احتجت أي حاجة تانية أنا هنا… والشاي لسه سخن.",
      en: "Anytime! I'm right here if you need anything else… and the tea's still hot.",
    },
  },
];
