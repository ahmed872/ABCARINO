/**
 * Starter content for ABCARINO.
 *
 * Deliberately honest: describes services and how they work — no invented
 * projects, clients, statistics, partners or prices. Everything here is
 * editable (or removable) from the admin panel.
 */
import type { LocalizedBlock, LocalizedText, OfferingStatus } from "../src/lib/db/schema";

type L = LocalizedText;
const l = (en: string, ar: string): L => ({ en, ar });
const b = (titleEn: string, titleAr: string, textEn: string, textAr: string): LocalizedBlock => ({
  titleEn,
  titleAr,
  textEn,
  textAr,
});

export const seedCategories = [
  {
    slug: "smart-living",
    nameEn: "Smart Living",
    nameAr: "المعيشة الذكية",
    descriptionEn: "Lighting, automation, climate and safety for homes.",
    descriptionAr: "الإضاءة والأتمتة والتكييف والأمان للمنازل.",
    visualKey: "living",
  },
  {
    slug: "entertainment",
    nameEn: "Entertainment",
    nameAr: "الترفيه",
    descriptionEn: "Cinema, media, gaming and audio experiences.",
    descriptionAr: "تجارب السينما والميديا والألعاب والصوت.",
    visualKey: "cinema",
  },
  {
    slug: "business",
    nameEn: "Business Spaces",
    nameAr: "مساحات الأعمال",
    descriptionEn: "Technology for offices, meeting rooms and commercial spaces.",
    descriptionAr: "التقنية للمكاتب وغرف الاجتماعات والمساحات التجارية.",
    visualKey: "office",
  },
  {
    slug: "specialized",
    nameEn: "Specialized",
    nameAr: "بيئات متخصصة",
    descriptionEn: "Simulators, worship spaces and custom environments.",
    descriptionAr: "المحاكيات ودور العبادة والبيئات المخصّصة.",
    visualKey: "simulator",
  },
  {
    slug: "software",
    nameEn: "Software",
    nameAr: "البرمجيات",
    descriptionEn: "Websites, applications and custom digital tools.",
    descriptionAr: "المواقع والتطبيقات والأدوات الرقمية المخصّصة.",
    visualKey: "software",
  },
];

export const seedArticleCategories = [
  { slug: "guides", nameEn: "Guides", nameAr: "أدلة", descriptionEn: "", descriptionAr: "", visualKey: "living" },
  { slug: "ideas", nameEn: "Ideas", nameAr: "أفكار", descriptionEn: "", descriptionAr: "", visualKey: "lighting" },
];

type SeedSolution = {
  slug: string;
  category: string;
  status: OfferingStatus;
  featured?: boolean;
  visualKey: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  descriptionEn: string;
  descriptionAr: string;
  benefits?: LocalizedBlock[];
  features?: L[];
};

export const seedSolutions: SeedSolution[] = [
  /* ── Smart Living ─────────────────────────────── available */
  {
    slug: "smart-homes",
    category: "smart-living",
    status: "available",
    featured: true,
    visualKey: "living",
    titleEn: "Smart Homes",
    titleAr: "المنازل الذكية",
    summaryEn: "A home that responds to your routine — lighting, scenes and everyday automation working as one system.",
    summaryAr: "منزل يستجيب لروتينك — إضاءة ومشاهد وأتمتة يومية تعمل كنظام واحد.",
    descriptionEn:
      "A smart home is not a collection of gadgets. It’s a home that understands a few important moments — waking up, leaving, coming back, relaxing, sleeping — and handles them for you.\n\nWe start with how your household actually lives, then design a system that is simple to use for everyone at home, from a wall switch to a phone. It can begin with one apartment floor and grow room by room on the same foundation.",
    descriptionAr:
      "المنزل الذكي ليس مجموعة من الأجهزة، بل منزل يفهم لحظات مهمة في يومك — الاستيقاظ والخروج والعودة والاسترخاء والنوم — ويتولّاها عنك.\n\nنبدأ بطريقة عيش أسرتك فعلًا، ثم نصمّم نظامًا سهل الاستخدام لكل من في المنزل، من مفتاح الحائط إلى الهاتف. ويمكن أن يبدأ بطابق واحد ثم ينمو غرفةً بعد غرفة على الأساس نفسه.",
    benefits: [
      b("Everyday comfort", "راحة يومية", "Scenes for the moments that matter, triggered by one touch, a schedule or your voice.", "مشاهد للحظات المهمة، تعمل بلمسة أو بجدول زمني أو بصوتك."),
      b("Simple for everyone", "بسيط للجميع", "Familiar wall controls stay; the app is an addition, not a requirement.", "تبقى مفاتيح الحائط المألوفة، ويأتي التطبيق كإضافة لا كشرط."),
      b("Ready to grow", "جاهز للنمو", "Add climate, curtains, audio or security later without starting again.", "أضف التكييف أو الستائر أو الصوت أو الأمان لاحقًا دون أن تبدأ من جديد."),
    ],
    features: [
      l("Needs assessment and system design", "تقييم الاحتياجات وتصميم النظام"),
      l("Lighting control and scenes", "التحكّم في الإضاءة والمشاهد"),
      l("Schedules and simple automations", "الجداول الزمنية والأتمتة البسيطة"),
      l("App and voice assistant setup", "إعداد التطبيق والمساعد الصوتي"),
      l("Family accounts and permissions", "حسابات أفراد الأسرة وصلاحياتهم"),
      l("Handover and walkthrough", "التسليم والشرح العملي"),
    ],
  },
  {
    slug: "smart-lighting",
    category: "smart-living",
    status: "available",
    featured: true,
    visualKey: "lighting",
    titleEn: "Smart Lighting",
    titleAr: "الإضاءة الذكية",
    summaryEn: "Lighting that sets the mood with one touch — dimming, scenes and schedules that make every room feel right.",
    summaryAr: "إضاءة تهيّئ الأجواء بلمسة واحدة — تعتيم ومشاهد وجداول تجعل كل غرفة كما تحب.",
    descriptionEn:
      "Light changes how a space feels more than anything else. Smart lighting lets each room move between bright and focused, warm and relaxed, or softly lit at night — without walking around flipping switches.\n\nWe design lighting control around your rooms and habits: which lights belong together, which scenes you’ll really use, and where a simple switch is still the best answer.",
    descriptionAr:
      "لا شيء يغيّر إحساس المكان مثل الضوء. تتيح لك الإضاءة الذكية أن تنتقل كل غرفة بين الإضاءة الساطعة للتركيز، والدافئة للاسترخاء، والخافتة ليلًا — دون أن تتنقّل بين المفاتيح.\n\nنصمّم التحكّم في الإضاءة حول غرفك وعاداتك: أي الأضواء تعمل معًا، وأي المشاهد ستستخدمها فعلًا، وأين يبقى المفتاح البسيط هو الحل الأفضل.",
    benefits: [
      b("The right light, instantly", "الضوء المناسب فورًا", "Scenes for dinner, reading, movies or cleaning — one touch each.", "مشاهد للعشاء والقراءة والأفلام والتنظيف — بلمسة واحدة لكلٍّ منها."),
      b("Softer nights", "ليالٍ أهدأ", "Gentle night lighting and paths instead of harsh overhead lights.", "إضاءة ليلية هادئة وممرات مضيئة بدل الأضواء العلوية الحادّة."),
      b("Less waste", "هدر أقل", "Schedules and sensors switch off what nobody is using.", "الجداول والحسّاسات تطفئ ما لا يستخدمه أحد."),
    ],
    features: [
      l("Smart switches and dimmers", "مفاتيح ذكية وأجهزة تعتيم"),
      l("Room scenes and mood presets", "مشاهد الغرف وأوضاع الأجواء"),
      l("Sunrise and sunset schedules", "جداول مرتبطة بالشروق والغروب"),
      l("Motion-based corridor and night lighting", "إضاءة الممرات الليلية بحسّاسات الحركة"),
      l("App, voice and wall control", "التحكّم بالتطبيق والصوت والحائط"),
    ],
  },
  {
    slug: "home-automation",
    category: "smart-living",
    status: "available",
    visualKey: "plan",
    titleEn: "Home Automation",
    titleAr: "أتمتة المنزل",
    summaryEn: "Everyday routines handled automatically — leaving, arriving and bedtime, without thinking about it.",
    summaryAr: "روتينك اليومي يُدار تلقائيًا — الخروج والعودة ووقت النوم، دون أن تفكّر فيه.",
    descriptionEn:
      "Automation turns repeated actions into moments that simply happen. When you leave, the house settles. When you arrive, it’s ready. At night, it quietly switches itself down.\n\nWe keep automations few, clear and reliable — the ones that remove real friction from your day.",
    descriptionAr:
      "تحوّل الأتمتة الأفعال المتكرّرة إلى لحظات تحدث وحدها. عندما تغادر يهدأ المنزل، وعندما تعود يكون جاهزًا، وفي الليل يُطفئ نفسه بهدوء.\n\nنحرص على أن تكون الأتمتة قليلة وواضحة وموثوقة — تلك التي تزيل عناءً حقيقيًا من يومك.",
    benefits: [
      b("Fewer small tasks", "مهام صغيرة أقل", "The house handles the repetitive switching for you.", "يتولّى المنزل التشغيل والإطفاء المتكرّر بدلًا منك."),
      b("Peace of mind", "راحة بال", "Check and control your home when you’re away.", "تابع منزلك وتحكّم فيه وأنت بعيد عنه."),
      b("Built on your routine", "مبنية على روتينك", "Automations follow how your household lives, not a template.", "تتبع الأتمتة طريقة عيش أسرتك، لا قالبًا جاهزًا."),
    ],
    features: [
      l("Leave, arrive and bedtime routines", "روتين الخروج والعودة والنوم"),
      l("Smart plugs for selected appliances", "مقابس ذكية لأجهزة مختارة"),
      l("Sensors for presence, doors and windows", "حسّاسات للحضور والأبواب والنوافذ"),
      l("Remote access and notifications", "التحكّم عن بُعد والتنبيهات"),
    ],
  },
  /* ── Smart Living ─────────────────────────────── coming soon */
  {
    slug: "climate-control",
    category: "smart-living",
    status: "coming_soon",
    visualKey: "plan",
    titleEn: "Climate Control",
    titleAr: "التحكّم في المناخ",
    summaryEn: "Comfortable temperatures room by room, with less energy wasted.",
    summaryAr: "درجات حرارة مريحة لكل غرفة، مع هدر أقل للطاقة.",
    descriptionEn: "Smart control of air conditioning by room and schedule, linked to the rest of the home.",
    descriptionAr: "تحكّم ذكي في التكييف حسب الغرفة والجدول الزمني، ومرتبط ببقية المنزل.",
    features: [l("Room-by-room control", "تحكّم لكل غرفة"), l("Schedules and away modes", "جداول وأوضاع الغياب")],
  },
  {
    slug: "smart-security",
    category: "smart-living",
    status: "coming_soon",
    visualKey: "plan",
    titleEn: "Smart Security",
    titleAr: "الأمان الذكي",
    summaryEn: "Cameras, sensors and alerts that keep you informed, not anxious.",
    summaryAr: "كاميرات وحسّاسات وتنبيهات تُبقيك مطمئنًا ومطّلعًا.",
    descriptionEn: "Security designed as part of the home: clear alerts, sensible cameras and simple control.",
    descriptionAr: "أمان مصمَّم كجزء من المنزل: تنبيهات واضحة وكاميرات مدروسة وتحكّم بسيط.",
    features: [l("Door and window sensors", "حسّاسات الأبواب والنوافذ"), l("Camera integration", "دمج الكاميرات")],
  },
  {
    slug: "smart-curtains",
    category: "smart-living",
    status: "coming_soon",
    visualKey: "lighting",
    titleEn: "Smart Curtains",
    titleAr: "الستائر الذكية",
    summaryEn: "Curtains and blinds that follow the sun and your scenes.",
    summaryAr: "ستائر تتبع الشمس ومشاهدك اليومية.",
    descriptionEn: "Motorised curtains and blinds connected to lighting scenes and schedules.",
    descriptionAr: "ستائر آلية مرتبطة بمشاهد الإضاءة والجداول الزمنية.",
  },
  {
    slug: "access-control",
    category: "smart-living",
    status: "coming_soon",
    visualKey: "plan",
    titleEn: "Access Control",
    titleAr: "التحكّم في الدخول",
    summaryEn: "Smart locks and entry management for homes and small buildings.",
    summaryAr: "أقفال ذكية وإدارة للدخول في المنازل والمباني الصغيرة.",
    descriptionEn: "Keyless entry, temporary access and entry logs, connected to your home system.",
    descriptionAr: "دخول دون مفاتيح وصلاحيات مؤقتة وسجلّ للدخول، مرتبط بنظام منزلك.",
  },
  /* ── Entertainment ─────────────────────────────── coming soon */
  {
    slug: "home-cinema",
    category: "entertainment",
    status: "coming_soon",
    visualKey: "cinema",
    titleEn: "Home Cinema",
    titleAr: "السينما المنزلية",
    summaryEn: "An immersive cinema room designed around picture, sound and comfort.",
    summaryAr: "غرفة سينما غامرة مصمّمة حول الصورة والصوت والراحة.",
    descriptionEn: "Dedicated cinema rooms planned for screen size, seating, acoustics and one-touch movie scenes.",
    descriptionAr: "غرف سينما مخصّصة مخطّطة لحجم الشاشة والمقاعد والصوتيات ومشهد الفيلم بلمسة واحدة.",
    features: [l("Screen and projection planning", "تخطيط الشاشة والعرض"), l("Surround sound design", "تصميم الصوت المحيطي")],
  },
  {
    slug: "media-rooms",
    category: "entertainment",
    status: "coming_soon",
    visualKey: "cinema",
    titleEn: "Media Rooms",
    titleAr: "غرف الميديا",
    summaryEn: "Living spaces that switch into great picture and sound when you want.",
    summaryAr: "مساحات معيشة تتحوّل إلى صورة وصوت مميّزين متى أردت.",
    descriptionEn: "A flexible room for TV, music and gaming, with audio-visual equipment that stays discreet.",
    descriptionAr: "غرفة مرنة للتلفاز والموسيقى والألعاب، بمعدّات صوت وصورة تبقى غير ظاهرة.",
  },
  {
    slug: "gaming-rooms",
    category: "entertainment",
    status: "coming_soon",
    visualKey: "gaming",
    titleEn: "Gaming Rooms",
    titleAr: "غرف الألعاب",
    summaryEn: "Focused setups with the right screens, lighting and sound for play.",
    summaryAr: "تجهيزات مركّزة بالشاشات والإضاءة والصوت المناسبة للّعب.",
    descriptionEn: "Gaming spaces planned around ergonomics, displays, acoustics and ambient lighting.",
    descriptionAr: "مساحات ألعاب مخطّطة حول الراحة الجسدية والشاشات والصوتيات والإضاءة المحيطة.",
  },
  {
    slug: "multi-room-audio",
    category: "entertainment",
    status: "coming_soon",
    visualKey: "audio",
    titleEn: "Multi-room Audio",
    titleAr: "الصوت متعدد الغرف",
    summaryEn: "Music that follows you through the house, room by room.",
    summaryAr: "موسيقى ترافقك في أرجاء المنزل، غرفةً بعد غرفة.",
    descriptionEn: "Discreet speakers and simple zone control across living spaces and outdoors.",
    descriptionAr: "سمّاعات غير ظاهرة وتحكّم بسيط في المناطق داخل المنزل وخارجه.",
  },
  /* ── Business ─────────────────────────────── coming soon */
  {
    slug: "smart-offices",
    category: "business",
    status: "coming_soon",
    visualKey: "office",
    titleEn: "Smart Offices",
    titleAr: "المكاتب الذكية",
    summaryEn: "Workspaces that are easier to run — lighting, climate and access, managed simply.",
    summaryAr: "مساحات عمل أسهل في الإدارة — إضاءة وتكييف ودخول بإدارة بسيطة.",
    descriptionEn: "Technology and automation for offices, shops and commercial spaces.",
    descriptionAr: "التقنية والأتمتة للمكاتب والمتاجر والمساحات التجارية.",
  },
  {
    slug: "meeting-rooms",
    category: "business",
    status: "coming_soon",
    visualKey: "office",
    titleEn: "Meeting Rooms",
    titleAr: "غرف الاجتماعات",
    summaryEn: "Meetings that start on time: displays, cameras and audio that just work.",
    summaryAr: "اجتماعات تبدأ في موعدها: شاشات وكاميرات وصوت تعمل ببساطة.",
    descriptionEn: "Conferencing, presentation and room booking designed for everyday reliability.",
    descriptionAr: "مؤتمرات مرئية وعروض وحجز للغرف، مصمّمة للموثوقية اليومية.",
  },
  /* ── Specialized ─────────────────────────────── coming soon */
  {
    slug: "sports-simulators",
    category: "specialized",
    status: "coming_soon",
    visualKey: "simulator",
    titleEn: "Sports Simulators",
    titleAr: "المحاكيات الرياضية",
    summaryEn: "Simulator bays for practice and entertainment at home or in venues.",
    summaryAr: "مساحات محاكاة للتدريب والترفيه في المنزل أو في الأماكن العامة.",
    descriptionEn: "Planning and integration of screens, projection, sensors and space for sports simulation.",
    descriptionAr: "تخطيط ودمج الشاشات والعرض والحسّاسات والمساحة للمحاكاة الرياضية.",
  },
  {
    slug: "worship-house-systems",
    category: "specialized",
    status: "coming_soon",
    visualKey: "worship",
    titleEn: "Worship House Systems",
    titleAr: "أنظمة دور العبادة",
    summaryEn: "Clear sound and calm, even lighting for places of worship.",
    summaryAr: "صوت واضح وإضاءة هادئة ومتوازنة لدور العبادة.",
    descriptionEn: "Sound reinforcement, lighting and simple control designed with respect for the space.",
    descriptionAr: "أنظمة صوت وإضاءة وتحكّم بسيط، مصمّمة باحترام لطبيعة المكان.",
  },
  /* ── Software ─────────────────────────────── available */
  {
    slug: "websites",
    category: "software",
    status: "available",
    featured: true,
    visualKey: "software",
    titleEn: "Websites",
    titleAr: "المواقع الإلكترونية",
    summaryEn: "Clear, fast and bilingual websites that present your business properly.",
    summaryAr: "مواقع واضحة وسريعة وثنائية اللغة تقدّم عملك كما يستحق.",
    descriptionEn:
      "A website is often the first conversation a customer has with you. We build websites that are clear about what you do, fast on any phone, and properly bilingual — including right-to-left Arabic done correctly.\n\nEach project is scoped around your goals, with content you can update yourself.",
    descriptionAr:
      "غالبًا ما يكون الموقع أول حديث بين العميل وعملك. نبني مواقع توضّح ما تقدّمه، وسريعة على أي هاتف، وثنائية اللغة بشكل صحيح — مع دعم كامل للعربية من اليمين إلى اليسار.\n\nيُحدَّد نطاق كل مشروع حول أهدافك، مع محتوى يمكنك تحديثه بنفسك.",
    benefits: [
      b("First impressions that work", "انطباع أول فعّال", "A clear message and a design that reflects the quality of your work.", "رسالة واضحة وتصميم يعكس جودة عملك."),
      b("Arabic and English, done right", "عربي وإنجليزي بإتقان", "Real right-to-left layouts, not mirrored afterthoughts.", "تخطيطات حقيقية من اليمين إلى اليسار، لا عكسًا متأخرًا للتصميم."),
      b("Yours to manage", "تديره بنفسك", "Update content without calling a developer.", "حدّث المحتوى دون الحاجة إلى مطوّر."),
    ],
    features: [
      l("Discovery and content structure", "الاستكشاف وهيكلة المحتوى"),
      l("Responsive, bilingual design", "تصميم متجاوب وثنائي اللغة"),
      l("Content management", "إدارة المحتوى"),
      l("SEO foundations and analytics", "أساسيات تحسين الظهور والتحليلات"),
    ],
  },
  {
    slug: "web-and-mobile-applications",
    category: "software",
    status: "available",
    visualKey: "software",
    titleEn: "Web & Mobile Applications",
    titleAr: "تطبيقات الويب والجوال",
    summaryEn: "Applications built around a specific business need — scoped carefully, built to last.",
    summaryAr: "تطبيقات تُبنى حول احتياج محدّد لعملك — بنطاق مدروس وبناء يدوم.",
    descriptionEn:
      "When a spreadsheet or an off-the-shelf tool no longer fits, a focused application can. We help define what the application must do, then design and build it for the web, mobile or both.\n\nWe discuss each request individually and agree on scope before any development begins.",
    descriptionAr:
      "عندما لا يعود جدول البيانات أو الأداة الجاهزة مناسبًا، قد يكون التطبيق المركّز هو الحل. نساعدك في تحديد ما يجب أن يفعله التطبيق، ثم نصمّمه ونبنيه للويب أو الجوال أو كليهما.\n\nنناقش كل طلب على حدة، ونتّفق على النطاق قبل بدء أي تطوير.",
    features: [
      l("Requirements and scoping", "تحليل المتطلبات وتحديد النطاق"),
      l("UX and interface design", "تصميم تجربة المستخدم والواجهات"),
      l("Web and mobile development", "تطوير الويب والجوال"),
      l("Testing, launch and support", "الاختبار والإطلاق والدعم"),
    ],
  },
  {
    slug: "custom-technology-solutions",
    category: "software",
    status: "available",
    visualKey: "software",
    titleEn: "Custom Technology Solutions",
    titleAr: "حلول تقنية مخصّصة",
    summaryEn: "Have a problem that doesn’t fit a category? Tell us — we’ll design around it.",
    summaryAr: "لديك مشكلة لا تناسب أي تصنيف؟ أخبرنا — وسنصمّم الحل حولها.",
    descriptionEn:
      "Some of the most useful solutions combine hardware and software in ways no catalogue offers: connecting devices to a dashboard, automating an operational task, or linking systems that don’t talk to each other.\n\nWe start by understanding the problem, then propose what is realistic, with a clear scope.",
    descriptionAr:
      "بعض أنفع الحلول تجمع بين الأجهزة والبرمجيات بطرق لا يقدّمها أي كتالوج: ربط أجهزة بلوحة تحكّم، أو أتمتة مهمة تشغيلية، أو ربط أنظمة لا تتواصل فيما بينها.\n\nنبدأ بفهم المشكلة، ثم نقترح ما هو واقعي وبنطاق واضح.",
    features: [
      l("Problem discovery workshop", "جلسة لفهم المشكلة"),
      l("Solution architecture", "تصميم بنية الحل"),
      l("Integration of devices and software", "دمج الأجهزة والبرمجيات"),
    ],
  },
];

type SeedPackage = {
  slug: string;
  category: string;
  status: OfferingStatus;
  featured?: boolean;
  visualKey: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  included: L[];
  optional?: L[];
  solutions: string[];
  pricingMode: "contact" | "coming_soon";
};

export const seedPackages: SeedPackage[] = [
  {
    slug: "smart-lighting-essentials",
    category: "smart-living",
    status: "available",
    featured: true,
    visualKey: "lighting",
    nameEn: "Smart Lighting Essentials",
    nameAr: "أساسيات الإضاءة الذكية",
    taglineEn: "Lighting that sets the mood with one touch.",
    taglineAr: "إضاءة تهيّئ الأجواء بلمسة واحدة.",
    descriptionEn:
      "The simplest way to feel the difference of a smart home. We upgrade lighting control in the rooms you choose, create the scenes you’ll actually use, and set up app and voice control for your household.",
    descriptionAr:
      "أبسط طريقة لتشعر بفرق المنزل الذكي. نطوّر التحكّم في الإضاءة في الغرف التي تختارها، وننشئ المشاهد التي ستستخدمها فعلًا، ونجهّز التحكّم بالتطبيق والصوت لأسرتك.",
    included: [
      l("Lighting assessment of selected rooms", "تقييم إضاءة الغرف المختارة"),
      l("Smart switches or dimmers", "مفاتيح ذكية أو أجهزة تعتيم"),
      l("Up to three scenes per room", "حتى ثلاثة مشاهد لكل غرفة"),
      l("App and voice control setup", "إعداد التحكّم بالتطبيق والصوت"),
      l("Handover session", "جلسة تسليم وشرح"),
    ],
    optional: [
      l("Motion sensors for corridors", "حسّاسات حركة للممرات"),
      l("LED strip and cove lighting", "شرائط LED وإضاءة مخفية"),
      l("Additional rooms", "غرف إضافية"),
    ],
    solutions: ["smart-lighting", "smart-homes"],
    pricingMode: "contact",
  },
  {
    slug: "smart-home-starter",
    category: "smart-living",
    status: "available",
    featured: true,
    visualKey: "living",
    nameEn: "Smart Home Starter",
    nameAr: "بداية المنزل الذكي",
    taglineEn: "Lighting and everyday routines for a home that feels effortless.",
    taglineAr: "إضاءة وروتين يومي لمنزل تشعر فيه بالسهولة.",
    descriptionEn:
      "A solid foundation for a smart home: lighting control in the main living areas, a few well-chosen automations for leaving, arriving and bedtime, and a system ready to grow room by room.",
    descriptionAr:
      "أساس متين لمنزل ذكي: تحكّم في إضاءة مناطق المعيشة الرئيسية، وأتمتة مختارة للخروج والعودة ووقت النوم، ونظام جاهز للنمو غرفةً بعد غرفة.",
    included: [
      l("Home assessment and system plan", "تقييم المنزل وخطة النظام"),
      l("Central smart hub", "وحدة تحكّم ذكية مركزية"),
      l("Lighting control for main areas", "تحكّم في إضاءة المناطق الرئيسية"),
      l("Leave, arrive and bedtime routines", "روتين الخروج والعودة والنوم"),
      l("Accounts for household members", "حسابات لأفراد الأسرة"),
    ],
    optional: [
      l("Door and window sensors", "حسّاسات الأبواب والنوافذ"),
      l("Smart plugs for appliances", "مقابس ذكية للأجهزة"),
      l("Preparation for curtain motors", "تجهيز لمحرّكات الستائر"),
    ],
    solutions: ["smart-homes", "home-automation", "smart-lighting"],
    pricingMode: "contact",
  },
  {
    slug: "business-website",
    category: "software",
    status: "available",
    visualKey: "software",
    nameEn: "Business Website",
    nameAr: "موقع الأعمال",
    taglineEn: "A clear, bilingual website you can manage yourself.",
    taglineAr: "موقع واضح وثنائي اللغة تديره بنفسك.",
    descriptionEn:
      "A professional website for your business in Arabic and English, designed around your message and your customers, with content you can update without a developer.",
    descriptionAr:
      "موقع احترافي لعملك بالعربية والإنجليزية، مصمَّم حول رسالتك وعملائك، مع محتوى يمكنك تحديثه دون الحاجة إلى مطوّر.",
    included: [
      l("Discovery and page structure", "الاستكشاف وهيكلة الصفحات"),
      l("Bilingual responsive design", "تصميم متجاوب ثنائي اللغة"),
      l("Content management", "إدارة المحتوى"),
      l("Contact and WhatsApp integration", "ربط نماذج التواصل وواتساب"),
      l("SEO foundations", "أساسيات تحسين الظهور"),
    ],
    optional: [l("Content writing", "كتابة المحتوى"), l("Additional languages", "لغات إضافية")],
    solutions: ["websites"],
    pricingMode: "contact",
  },
  {
    slug: "media-room",
    category: "entertainment",
    status: "coming_soon",
    visualKey: "cinema",
    nameEn: "Media Room",
    nameAr: "غرفة الميديا",
    taglineEn: "Great picture and sound in the room you already love.",
    taglineAr: "صورة وصوت مميّزان في الغرفة التي تحبها.",
    descriptionEn: "An audio-visual upgrade for a living or family room, with one-touch movie and music scenes.",
    descriptionAr: "ترقية للصوت والصورة في غرفة المعيشة أو العائلة، مع مشاهد للأفلام والموسيقى بلمسة واحدة.",
    included: [l("Display and sound planning", "تخطيط الشاشة والصوت"), l("Lighting scene for viewing", "مشهد إضاءة للمشاهدة")],
    solutions: ["media-rooms"],
    pricingMode: "coming_soon",
  },
  {
    slug: "home-cinema",
    category: "entertainment",
    status: "coming_soon",
    visualKey: "cinema",
    nameEn: "Home Cinema",
    nameAr: "السينما المنزلية",
    taglineEn: "A dedicated room for the full cinema experience.",
    taglineAr: "غرفة مخصّصة لتجربة سينما متكاملة.",
    descriptionEn: "Projection, surround sound, seating and lighting designed together for an immersive cinema room.",
    descriptionAr: "عرض وصوت محيطي ومقاعد وإضاءة مصمّمة معًا لغرفة سينما غامرة.",
    included: [l("Room and acoustic planning", "تخطيط الغرفة والصوتيات"), l("Projection and surround sound", "العرض والصوت المحيطي")],
    solutions: ["home-cinema"],
    pricingMode: "coming_soon",
  },
  {
    slug: "gaming-room",
    category: "entertainment",
    status: "coming_soon",
    visualKey: "gaming",
    nameEn: "Gaming Room",
    nameAr: "غرفة الألعاب",
    taglineEn: "Screens, sound and light tuned for play.",
    taglineAr: "شاشات وصوت وإضاءة مضبوطة للّعب.",
    descriptionEn: "A gaming setup planned around displays, ergonomics, acoustics and ambient lighting.",
    descriptionAr: "تجهيز للألعاب مخطّط حول الشاشات والراحة والصوتيات والإضاءة المحيطة.",
    included: [l("Display and desk planning", "تخطيط الشاشات والمكتب"), l("Ambient lighting scenes", "مشاهد إضاءة محيطة")],
    solutions: ["gaming-rooms"],
    pricingMode: "coming_soon",
  },
  {
    slug: "smart-office",
    category: "business",
    status: "coming_soon",
    visualKey: "office",
    nameEn: "Smart Office",
    nameAr: "المكتب الذكي",
    taglineEn: "Technology and automation for easier workspaces.",
    taglineAr: "التقنية والأتمتة لمساحات عمل أسهل.",
    descriptionEn: "Lighting, climate, meeting-room technology and access, designed for small and growing teams.",
    descriptionAr: "إضاءة وتكييف وتقنيات لغرف الاجتماعات والدخول، مصمّمة للفرق الصغيرة والنامية.",
    included: [l("Workspace assessment", "تقييم مساحة العمل"), l("Lighting and climate control", "التحكّم في الإضاءة والتكييف")],
    solutions: ["smart-offices", "meeting-rooms"],
    pricingMode: "coming_soon",
  },
];
