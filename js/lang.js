// ===== پلاتفۆرمی پەروەردەیی ئەلند - Language System =====
// Supports: Arabic (ar) | Kurdish Sorani (ku) | Kurdish Badini (ba)

const translations = {
  ar: {
    dir: "rtl",
    lang: "ar",
    fontFamily: "'Cairo', sans-serif",
    nav_home: "الرئيسية",
    nav_subjects: "الأقسام",
    nav_about: "عن المنصة",
    hero_name: "ألند",
    hero_subtitle: "منصة ألند التعليمية",
    hero_desc: "في منصة ألند، لا نقدّم مجرد محتوى تعليمي… بل نصنع فرصة، ونبني مستقبلًا. نحن هنا لنكسر كل الحواجز التي تعيق الطالب، ونحوّل الفوضى التعليمية إلى طريق واضح نحو النجاح.",
    hero_btn: "ابدأ الآن",
    stat_subjects: "مادة دراسية",
    stat_resources: "مصدر تعليمي",
    stat_free: "مجاناً بالكامل",
    sec_subjects: "الأقسام الدراسية",
    sec_subjects_sub: "اختر المادة التي تريد دراستها",
    curr_badini_title: "صف 9",
    curr_badini_desc: "منهاج كردي باديني",
    curr_arabic_title: "صف 9",
    curr_arabic_desc: "المنهاج العربي",
    btn_back_curriculum: "← العودة لاختيار المنهاج",
    subj_science: "العلوم",
    subj_math: "الرياضيات",
    subj_kurdish: "اللغة الكوردية",
    subj_arabic: "اللغة العربية",
    subj_social: "الاجتماعيات",
    subj_islam: "التربية الإسلامية",
    subj_english: "اللغة الإنجليزية",
    subj_average: "المعدلات",
    subj_science_desc: "كتب، شروحات، وزاريات",
    subj_math_desc: "كتب، شروحات، وزاريات",
    subj_kurdish_desc: "كتب، شروحات، وزاريات",
    subj_arabic_desc: "كتب، شروحات، وزاريات",
    subj_social_desc: "كتب، شروحات، وزاريات",
    subj_islam_desc: "كتب، أسئلة، وزاريات",
    subj_english_desc: "كتب، شروحات، وزاريات",
    subj_average_desc: "حساب المعدل التراكمي",
    sec_about: "عن المنصة",
    about_title: "منصة ألند التعليمية",
    about_vision_title: "رؤيتنا",
    about_p1: "أن تكون منصة ألند الشرارة التي تُشعل نهضة تعليمية حقيقية في المجتمع الكوردي، وأن تصبح الوجهة الأولى بلا منازع لكل طالب يبحث عن التميز والمعرفة.",
    about_p2: "نسعى لبناء جيل قوي، واعٍ، ومبدع، لا يكتفي بالتعلم بل يقود التغيير، ويرتقي بمجتمعه ليقف في مصاف أعظم شعوب العالم.",
    about_p3: "نوفّر محتوى دراسيًا قويًا، مبسطًا، وموثوقًا يشمل الشروحات، الملازم، والأسئلة الوزارية — مجانًا، لأننا نؤمن أن العلم حق للجميع، لا امتياز للبعض.",
    about_p4: "نخلق تجربة تعليمية تفاعلية حقيقية، نكون فيها قريبين من الطالب، نفهمه، وندعمه خطوة بخطوة. ونعمل بكل فخر على تعزيز هويتنا وثقافتنا الكوردية، لنصنع جيلًا لا يحمل العلم فقط، بل يحمل رسالته أيضًا.",
    about_p5: "يدًا بيد مع المعلمين والمنظمات، نعمل لنضمن أن لا يُحرم أي طالب من فرصة التعلم، لأننا نؤمن أن كل طالب قادر… إذا وجد من يؤمن به.",
    // about_abbr: "اختصار المنصة: PPAlend (Platforma Perwerdehiyê ya Alend)",
    footer_rights: "جميع الحقوق محفوظة",
    btn_books: "📘 الكتاب الشامل",
    btn_wazariyat: "📝 الوزاريات",
    btn_teachers: "👨‍🏫 ملازم الأساتذة",
    btn_explanations: "🎥 الشروحات",
    btn_questions: "❓ أسئلة وزارية",
    btn_back: "→ العودة للأقسام",
    coming_soon: "قريباً",
    coming_soon_desc: "نعمل على توفير هذا المحتوى في أقرب وقت",
    page_books: "الكتاب الشامل",
    page_wazariyat: "الوزاريات",
    page_teachers: "ملازم الأساتذة",
    page_explanations: "الشروحات",
    page_questions: "الأسئلة الوزارية",
    subj_page_science: "قسم العلوم",
    subj_page_math: "قسم الرياضيات",
    subj_page_kurdish: "قسم اللغة الكوردية",
    subj_page_arabic: "قسم اللغة العربية",
    subj_page_social: "قسم الاجتماعيات",
    subj_page_islam: "قسم التربية الإسلامية",
    subj_page_english: "قسم اللغة الإنجليزية",
    subj_page_average: "المعدلات",
  },

  ku: {
    dir: "rtl",
    lang: "ku",
    fontFamily: "'Noto Naskh Arabic', 'Cairo', sans-serif",
    nav_home: "سەرەکی",
    nav_subjects: "بەشەکان",
    nav_about: "دەربارەی پلاتفۆرم",
    hero_name: "ئەلند",
    hero_subtitle: "پلاتفۆرمی پەروەردەیی ئەلند",
    hero_desc: "لە پلاتفۆرمی ئەلند، ئێمە تەنها ناوەڕۆکی پەروەردەیی دابین ناکەین... دەرفەت دروست دەکەین و داهاتوویەک بنیات دەنێین. ئێمە لێرەین بۆ ئەوەی هەموو ئەو بەربەستانە بشکێنین کە ڕێگری لە خوێندکار دەکەن و ئاژاوەی پەروەردەیی بگۆڕین بۆ ڕێگایەکی ڕوون بۆ سەرکەوتن.",
    hero_btn: "دەستت پێ بکە",
    stat_subjects: "بابەتی خوێندن",
    stat_resources: "سەرچاوەی خوێندن",
    stat_free: "بەتەواوی خۆڕایی",
    sec_subjects: "بەشەکانی خوێندن",
    sec_subjects_sub: "بابەتەکە هەڵبژێرە",
    curr_badini_title: "بۆلا 9",
    curr_badini_desc: "منهاجی کوردی بادینی",
    curr_arabic_title: "بۆلا 9",
    curr_arabic_desc: "منهاجی عەرەبی",
    btn_back_curriculum: "← گەڕانەوە بۆ هەڵبژاردنی منهاج",
    subj_science: "زانست",
    subj_math: "بیرکاری",
    subj_kurdish: "زمانی کوردی",
    subj_arabic: "زمانی عەرەبی",
    subj_social: "کۆمەڵایەتی",
    subj_islam: "پەروەردەی ئیسلامی",
    subj_english: "زمانی ئینگلیزی",
    subj_average: "تێکڕای نمرە",
    subj_science_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_math_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_kurdish_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_arabic_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_social_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_islam_desc: "کتێب، پرسیار، وەزارەتی",
    subj_english_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_average_desc: "ژمارەکردنی تێکڕای نمرە",
    sec_about: "دەربارەی پلاتفۆرم",
    about_title: "پلاتفۆرمی پەروەردەیی ئەلند",
    about_vision_title: "بینینمان",
    about_p1: "پلاتفۆرمی ئەلند بەرقەکەی بێت کە ڕستاخێزی پەروەردەیی ڕاستەقینە لە کۆمەڵگای کوردی پێیبکاتەوە، و بێت یەکەم مەودا بۆ هەر خوێندکارێک کە بەدوای تایبەتمەندی و زانیاری دەگەڕێت.",
    about_p2: "ئەمانەی دەمانەوێت: بنیاتنانی نەسلێکی بەهێز، ئاگادار و داهێنەر کە تەنها فێربوون ناخرێتە ژوورەوە بەڵکوو گۆڕانکاری ڕابەرایەتی دەکات و کۆمەڵگاکەی بەرز دەکاتەوە بۆ ئەوەی لەگەڵ گەورەترین گەلەکانی جیهاندا بوەستێت.",
    about_p3: "ناوەڕۆکی خوێندنی بەهێز، سادەکراو و متمانەپێکراو دابین دەکەین کە شروحەکان، ملازمەکان و پرسیارە وەزارەتییەکانی تێدایە — خۆڕایانە، چونکە باوەڕمان ئەوەیە زانست مافی هەموو کەسەکەیە نەک پرۆگرامی هەندێک کەس.",
    about_p4: "ئەزموونی پەروەردەیی تەواو کارلێکی ڕاستەقینە دروست دەکەین، کە تێیدا نزیک بین لە خوێندکار، تێیدەگەین و هەنگاو بەهەنگاو پشتگیریی دەکەین. و بە هەموو شانازییەک کار دەکەین بۆ بەهێزکردنی ناسنامە و کولتووری کوردیمان.",
    about_p5: "دەست بەدەست مامۆستایان و ڕێکخراوەکان، کار دەکەین بۆ ئەوەی دڵنیا بین کە هیچ خوێندکارێک لە دەرفەتی فێربوون بێبەش نابێت، چونکە باوەڕمان ئەوەیە هەر خوێندکارێک توانای ئەوەی هەیە... ئەگەر کەسێکی بیباوەڕی بدۆزێتەوە.",
    // about_abbr: "کورتکردنەوەی پلاتفۆرم: PPAlend (Platforma Perwerdehiyê ya Alend)",
    footer_rights: "هەموو مافەکان پارێزراون",
    btn_books: "📘 کتێبی گشتگیر",
    btn_wazariyat: "📝 وەزارەتییەکان",
    btn_teachers: "👨‍🏫 ملازمی مامۆستایان",
    btn_explanations: "🎥 ڕوونکردنەوەکان",
    btn_questions: "❓ پرسیارە وەزارەتییەکان",
    btn_back: "→ گەڕانەوە بۆ بەشەکان",
    coming_soon: "بەم زووانە",
    coming_soon_desc: "کار دەکەین بۆ دابینکردنی ئەم ناوەرۆکە لە زووترین کاتدا",
    page_books: "کتێبی گشتگیر",
    page_wazariyat: "وەزارەتییەکان",
    page_teachers: "ملازمی مامۆستایان",
    page_explanations: "ڕوونکردنەوەکان",
    page_questions: "پرسیارە وەزارەتییەکان",
    subj_page_science: "بەشی زانست",
    subj_page_math: "بەشی بیرکاری",
    subj_page_kurdish: "بەشی زمانی کوردی",
    subj_page_arabic: "بەشی زمانی عەرەبی",
    subj_page_social: "بەشی کۆمەڵایەتی",
    subj_page_islam: "بەشی پەروەردەی ئیسلامی",
    subj_page_english: "بەشی زمانی ئینگلیزی",
    subj_page_average: "تێکڕای نمرە",
  },

  ba: {
    dir: "rtl",
    lang: "ku",
    fontFamily: "'Noto Naskh Arabic', 'Cairo', sans-serif",
    nav_home: "سەرەتا",
    nav_subjects: "بەشەکان",
    nav_about: "دەربارەی پلاتفۆرم",
    hero_name: "ئەلند",
    hero_subtitle: "پلاتفۆرمی پەروەردەیی ئەلەند",
    hero_desc: "لە پلاتفۆرمی ئەلەند، ئێمە تەنها ناوەرۆکی پەروەردەیی دانادەین... دەرفەت دروست دەکەین و داهاتوویەک ئاوەدان دەکەین. ئێمە لینەوە بۆ ئەوەی هەموو ئەو بەربەستانە بشکێنین کە ڕێگری لە قوتابی دەکەن و ئاژاوەی پەروەردەیی بگوهەرین بۆ ڕێگایەکی ڕوون بۆ سەرکەوتن.",
    hero_btn: "دەست پێبکە",
    stat_subjects: "بابەتی خوێندن",
    stat_resources: "سەرچاوەی خوێندن",
    stat_free: "بە تەواوی خۆڕایی",
    sec_subjects: "بەشەکانی خوێندن",
    sec_subjects_sub: "بابەتەکە هەڵبژێرە",
    curr_badini_title: "بۆلا 9",
    curr_badini_desc: "منهاجی کوردی بادینی",
    curr_arabic_title: "صف 9",
    curr_arabic_desc: "منهاجی عەرەبی",
    btn_back_curriculum: "← گەڕانەوە بۆ هەڵبژاردنی منهاج",
    subj_science: "زانست",
    subj_math: "بیرکاری",
    subj_kurdish: "زمانی کوردی",
    subj_arabic: "زمانی عەرەبی",
    subj_social: "کۆمەڵایەتی",
    subj_islam: "پەروەردەی ئیسلامی",
    subj_english: "زمانی ئینگلیزی",
    subj_average: "تێکڕای نمرە",
    subj_science_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_math_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_kurdish_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_arabic_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_social_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_islam_desc: "کتێب، پرسیار، وەزارەتی",
    subj_english_desc: "کتێب، ڕوونکردنەوە، وەزارەتی",
    subj_average_desc: "ژمارەکردنی تێکڕای نمرە",
    sec_about: "دەربارەی پلاتفۆرم",
    about_title: "پلاتفۆرمی پەروەردەیی ئەلەند",
    about_vision_title: "بینینمان",
    about_p1: "پلاتفۆرمی ئەلەند بەرقەکەی بێت کە ڕستاخێزی پەروەردەیی لە کۆمەڵگای کوردی پێیبکاتەوە، و بێت یەکەم شوێنی هەڵبژاردن بۆ هەر قوتابیەک کە بەدوای تایبەتمەندی و زانیاری دەگەڕێت.",
    about_p2: "ئەمانەی دەمانەوێت: بنیاتنانی نەسلێکی بەهێز، ئاگادار و داهێنەر کە تەنها فێربوون ناخرێتە ژوورەوە بەڵکوو گۆڕانکاری ئەنجام دەدات و کۆمەڵگاکەی بەرز دەکاتەوە.",
    about_p3: "ناوەرۆکی خوێندنی بەهێز، سادەکراو و متمانەپێکراو دادەنێین کە ڕوونکردنەوەکان، ملازمەکان و پرسیارە وەزارەتییەکانی تێدایە — خۆڕایانە، چونکە باوەڕمان ئەوەیە زانست مافی هەموو کەسە.",
    about_p4: "ئەزموونی پەروەردەیی کارلێکی ڕاستەقینە دروست دەکەین، کە تێیدا نزیک بین لە قوتابی، تێیدەگەین و هەنگاو بەهەنگاو پشتگیریی دەکەین. و بە هەموو شانازییەک کار دەکەین بۆ بەهێزکردنی ناسنامە و کولتووری کوردیمان.",
    about_p5: "دەست بەدەست مامۆستایان و ڕێکخراوەکان، کار دەکەین بۆ ئەوەی دڵنیا بین کە هیچ قوتابیەک لە دەرفەتی فێربوون بێبەش نابێت، چونکە باوەڕمان ئەوەیە هەر قوتابیەک توانای ئەوەی هەیە... ئەگەر کەسێکی بیباوەڕیدا بدۆزێت.",
    // about_abbr: "کورتکردنەوەی پلاتفۆرم: PPAlend (Platforma Perwerdehiyê ya Alend)",
    footer_rights: "هەموو مافەکان پارێزراون",
    btn_books: "📘 کتێبی گشتگیر",
    btn_wazariyat: "📝 وەزارەتییەکان",
    btn_teachers: "👨‍🏫 ملازمی مامۆستایان",
    btn_explanations: "🎥 ڕوونکردنەوەکان",
    btn_questions: "❓ پرسیارە وەزارەتییەکان",
    btn_back: "→ گەڕانەوە بۆ بەشەکان",
    coming_soon: "بەم زووانەوە",
    coming_soon_desc: "کار دەکەین بۆ دانانی ئەم ناوەرۆکە لە زووترین کاتدا",
    page_books: "کتێبی گشتگیر",
    page_wazariyat: "وەزارەتییەکان",
    page_teachers: "ملازمی مامۆستایان",
    page_explanations: "ڕوونکردنەوەکان",
    page_questions: "پرسیارە وەزارەتییەکان",
    subj_page_science: "بەشی زانست",
    subj_page_math: "بەشی بیرکاری",
    subj_page_kurdish: "بەشی زمانی کوردی",
    subj_page_arabic: "بەشی زمانی عەرەبی",
    subj_page_social: "بەشی کۆمەڵایەتی",
    subj_page_islam: "بەشی پەروەردەی ئیسلامی",
    subj_page_english: "بەشی زمانی ئینگلیزی",
    subj_page_average: "تێکڕای نمرە",
  }
};

// ===== Language Manager =====
const VALID_LANGS = ['ar', 'ku', 'ba'];

const LangManager = {
  current: VALID_LANGS.includes(localStorage.getItem('alend_lang')) ? localStorage.getItem('alend_lang') : 'ku',

  get(key) {
    return translations[this.current][key] || translations['ku'][key] || key;
  },

  set(lang) {
    this.current = VALID_LANGS.includes(lang) ? lang : 'ku';
    localStorage.setItem('alend_lang', this.current);
    this.apply();
  },

  apply() {
    if (!VALID_LANGS.includes(this.current) || !translations[this.current]) {
      this.current = 'ku';
      localStorage.setItem('alend_lang', 'ku');
    }

    const t = translations[this.current];
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
    document.body.style.fontFamily = t.fontFamily;

    document.querySelectorAll('[data-lang]').forEach(el => {
      const key = el.getAttribute('data-lang');
      const val = this.get(key);
      if (val) el.textContent = val;
    });

    document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
      const key = el.getAttribute('data-lang-placeholder');
      el.placeholder = this.get(key);
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.lang === this.current) btn.classList.add('active');
    });
  },

  init() {
    if (!VALID_LANGS.includes(this.current)) {
      this.current = 'ku';
      localStorage.setItem('alend_lang', 'ku');
    }
    this.apply();
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => this.set(btn.dataset.lang));
    });
  }
};
