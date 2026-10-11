export interface RiwaqWisdomItem {
  id: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  description: string;
  quote?: string;
  badge?: string;
  sectionId: 'major' | 'islamic' | 'western' | 'eastern';
  period?: string;
  keyConcepts?: string[];
  sampleChapterText?: string;
}

export interface PhilosophicalIssue {
  id: string;
  badge: string;
  origin: string;
  title: string;
  body: string;
  ref: string;
}

export interface ThoughtCurrentItem {
  id: string;
  badge: string;
  title: string;
  quote: string;
  philosophers: string;
  icon: string;
  linkText: string;
  categoryFilter?: string;
}

export interface RankedTreatiseItem {
  rank: string;
  title: string;
  authorAndTheme: string;
  id: string;
}

// 1. المبحث المحوري المميز (Spotlight)
export const SPOTLIGHT_WISDOM: RiwaqWisdomItem = {
  id: 'wisdom-meditations',
  title: 'تأملات في الفلسفة الأولى',
  author: 'رينيه ديكارت',
  category: 'الفكر الحديث والتنوير',
  badge: 'رواق الحكمة · المبحث المحوري',
  quote: '«إن الغاية القصوى من الفلسفة ليست معرفة ما قاله الآخرون، بل البحث عن حقيقة الوجود وكنه الفضيلة واليقين.»',
  description: 'استكشاف شامل للشك المنهجي، ولحظة تأسيس الذات العارفة، ومقارنة معرفية دقيقة بين العقلانية التنويرية وفيوضات الإشراق في حكمة المشرق الكبرى. تحقيق مخطوط مزود بشروح مقارنة نادرة.',
  coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb0EEqaPLkWYiRPAJLHgvEOt3DKd4afFnjaO-QIlpoAZnNeNRYNZjU6m6FA4NGsH2kGxmLhZTmN--63Ro7Hhe0BzYN7aIkP1TxKeRI08LCnyNARAVd5l-AryPCYAmcfrd5NAFDgMY61cZA41uoFditnY_YSXUprORdjw7xDZuiyE007RDdJwDms0vg8rwYNAgLRYYB6qiX2mJAyuo8QyihdIHM5HLZkTzK07CI4VDk1OnlDEWw6hLGRw',
  sectionId: 'major',
  period: 'عصر التنوير • القرن السابع عشر',
  keyConcepts: ['الشك المنهجي', 'الكوجيتو', 'ثنائية النفس والجسد', 'اليقين الرياضي'],
  sampleChapterText: 'لَقَدْ لَاحَظْتُ مُنْذُ سِنِينَ كَمْ كَانَ فِي صِبَايَ مِنْ آرَاءٍ بَاطِلَةٍ اعْتَبَرْتُهَا حَقَائِقَ ثَابِتَةً... سَأَفْتَرِضُ أَنَّ كُلَّ مَا تُخْبِرُنِي بِهِ حَوَاسِّي قَدْ يَكُونُ خُدْعَةً، حَتَّى أَصِلَ إِلَى صَخْرَةِ الحَقِيقَةِ الَّتِي لَا تَتَزَعْزَعُ.'
};

// 2. مختارات الحكمة الكبرى (الأصول الخالدة)
export const MAJOR_WISDOM_SELECTIONS: RiwaqWisdomItem[] = [
  {
    id: 'wisdom-art-of-war',
    title: 'فن الحرب والحكمة الشرقية',
    author: 'صن تزو',
    category: 'حكمة المشرق والتأمل',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRx6_Si1fhpF15_Euxq9weA39cd08Wq3FTGueDksl0dTFMhbS7_0YZqkBYX-z_965MHJSXmDuFDJ1j0i-Z7G0LRR2nachfNPdNt-61Nn4pPJzlsAICaKjF39D7dnLPVO9Ve_mSCGh4eR2YtNj36CeX4FjH68OwwpyWP65CmrYV-1dOOeSqnPvNQ20RGW0aLx37xjlXG9WuNF1FiSHUrOk3HV3ItLcBdxsCySuYBvj_AMX3SQt4p_4ezg',
    description: 'أقدم دراسة استراتيجية وفلسفية في تدبير الصراعات، تدعو إلى النصر دون قتال وفهم قوانين التوازن الطبيعي والانسجام مع مجرى الأشياء.',
    quote: '«القمة في المهارة ليست كسب مائة معركة، بل إخضاع العدو دون قتال.»',
    sectionId: 'major',
    period: 'الصين القديمة • القرن الخامس قبل الميلاد',
    keyConcepts: ['الاستراتيجية', 'التاو والانسجام', 'معرفة الذات والآخر']
  },
  {
    id: 'wisdom-plato-republic',
    title: 'جمهورية أفلاطون',
    author: 'أفلاطون',
    category: 'الفلسفة الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlcvamANNqOLPSOnzRglHDm6TM8vUOz4bIAUEemi1BohOjrjbre1kMBULoIWe6XoqPQgWNwiS4fv4-WPpil3REoYZgQCqhSzwAN4PMVdh5kwS9WKgSBPRno4Ngd91kEciyAHiRW07CFV1yVG9mcnqb-R9Uk65dhRRlxZlLmheTBLGQP1TF0uhn5ePYQanx1TnxBU0ZcfQ4h3w2G5sNAtQ49l2mymHe_LanFZokcrosWCpOQ5iZiABQEQ',
    description: 'محاورة سقراط الخالدة حول ماهية العدالة وتأسيس المدينة الفاضلة، وتمثيل الكهف الذي يرسم رحلة الوعي من قيود الظلال إلى ضياء الشمس.',
    quote: '«العدالة هي أن يؤدي كل جزء من النفس وظيفته الخاصة بانسجام تام.»',
    sectionId: 'major',
    period: 'أثينا الكلاسيكية • القرن الرابع قبل الميلاد',
    keyConcepts: ['العدالة', 'أسطورة الكهف', 'عالم المُثُل', 'الملك الفيلسوف']
  },
  {
    id: 'wisdom-nicomachean-ethics',
    title: 'الأخلاق إلى نيقوماخوس',
    author: 'أرسطو',
    category: 'الفلسفة الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy9cw7k927qcOVDHSsgttkml5IMbv5Z1yrvJAAWPfTlZIFJTQbDQW7Jnq7SJHm-pPuvisGXzCAlLJrAh9K3nYAaDDydymJlwtzu77vbayk_CAdJahRXI-lRHt9qw8kHXwt4EEw2ejVIWZLRb2ta-Y2Phx2OFux-0ut41iWLtWOXclEgR7BPuIovOevydpyoP4cdQbBAydpkw_C1k7fKe5cPAmrm6aoWd1QDPrChR8YqLO6gMteKRqk9A',
    description: 'دستور الأخلاق العملي الأرسطي، يبحث في مفهوم السعادة والفضيلة بصفتها وسطاً حكيماً بين رذيلتي الإفراط والتفريط.',
    quote: '«الفضيلة هي وسط بين إفراط وتفريط، يحدده العقل ويسلكه الإنسان الحكيم.»',
    sectionId: 'major',
    period: 'اليونان القديمة • القرن الرابع قبل الميلاد',
    keyConcepts: ['السعادة (اليودايمونيا)', 'الوسط الذهبي', 'الفضائل العملية', 'الصداقة']
  },
  {
    id: 'wisdom-directives-remarks',
    title: 'الإشارات والتنبيهات',
    author: 'ابن سينا (الشيخ الرئيس)',
    category: 'الفلسفة الإسلامية والإشراق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUMriONvGDH7xjiCYZDXXmGFTxWrHU6ddopgv4cUuRglSnbL8P7StgLmJyKpr0cQ0QzsojZc1hA-OYlhOqcF_JwOkTQFusLSwk23n3q_5sXIAA-o0h0gTsXJP77Y4-GBHL4vHprRwhBwJFOqEl3dsRlwLqVIDQtIaGfMMjCrr1XeFfKaw-fWpuDp9w5ihN056GPCf3aqyyYN05eW9k0j3e4U7eBIaTQurk749Mopc-RVCKOa5Tc3kK7Q',
    description: 'آخر مصنفات ابن سينا وأنضجها، يجمع بين برهانية المشائين وفيوضات مقامات العارفين في أسلوب إشاري بالغ العمق والإحكام.',
    quote: '«العارف يريد الحق لا لشيء غيره، ولا يؤثر شيئاً على عرفانه.»',
    sectionId: 'major',
    period: 'الحضارة الإسلامية • القرن الخامس الهجري',
    keyConcepts: ['المنطق الصوري', 'الميتافيزيقا', 'مقامات العارفين', 'برهان الصديقين']
  },
  {
    id: 'wisdom-critique-pure-reason',
    title: 'نقد العقل الخالص',
    author: 'إيمانويل كانط',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_6VrGriw1oP75n47EVmm3juCLKiUImFlYfZuwx8591RZojb1oHRHEaJoSEXxslSyACFEHiiM78Cc0Jkki1tjIUFOE-q89A6wkUuWUvz4ef-86MWAyhsx9sqnVcOaqAwx5RWTEffI8Q_f1EcTgWpkQmkjP_0jhshT2vSp_oDwTXDDGUwvAPVfZKgVX6FvRTBXuU2Wqmj4dbjK5_bqnALueAvhfRTf4TIwf17sC-OEhgOMiE3zkPDtygA',
    description: 'الثورة الكوبرنيكية في الفلسفة الحديثة، يرسم فيها كانط حدود المعرفة البشرية بين الظواهر القابلة للإدراك والشيء في ذاته.',
    quote: '«الأفكار دون حدوس فارغة، والحدوس دون مفاهيم عمياء.»',
    sectionId: 'major',
    period: 'ألمانيا • عصر التنوير (1781)',
    keyConcepts: ['المعرفة القبلية', 'الشيء في ذاته', 'الزمان والمكان كصورتين للحدس']
  },
  {
    id: 'wisdom-thus-spoke-zarathustra',
    title: 'وهكذا تكلم زرادشت',
    author: 'فريدريك نيتشه',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDauEogQs1-raSbnBDRvHAt7qU4VBqO4q9Qj5eBfzp60LOSw1qzNyEwalsXxtWjwtpZM1nYjndKCnusf08Ee1l9zQwW199ZP0V_vlZygTSair-XUitP_Fn-ekUdfB9-Ccrj2io1mLpGQ7YWR6aSNBZg2Wz0IAbXlrrtl-t6Yv7QV9UXMg-aRVduqDupFNrBh7l-vv3Z7eSPiRQB6_uZ8chFSMEbfSHWBve9VD2Xo-faF66qIg8IuCxCOw',
    description: 'تحفة شعرية فلسفية تبشر بالإنسان الأعلى وإرادة القوة والعود الأبدي، وتكسر الأصنام الأخلاقية الموروثة لتحرير روح المبدع.',
    quote: '«الإنسان حبل مشدود بين الحيوان والإنسان الأعلى، حبل فوق هوة سحيقة.»',
    sectionId: 'major',
    period: 'أواخر القرن التاسع عشر (1883)',
    keyConcepts: ['الإنسان الأعلى', 'العود الأبدي', 'إرادة القوة', 'تحول الروح']
  }
];

// 3. الفلسفة الإسلامية وحكمة الإشراق (النسق المشرقي والإشراقي)
export const ISLAMIC_ILLUMINATION_PHILOSOPHY: RiwaqWisdomItem[] = [
  {
    id: 'wisdom-fasl-al-maqal',
    title: 'كتاب فصل المقال',
    author: 'ابن رشد الأندلسي',
    category: 'الفلسفة الإسلامية والإشراق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQf_mVzoETscc_8QP9bS4vlDTgEVdTvtB6BIrd9rF71H00a3gieMbYTo2dozEMlhyeXHyl2nzpYXZOJmwM9YRPQsIYWx_GL-T5w_rIk4Ug1QLb3X5FHeVurjDtvkkNMDZWTvq7_Dfuv98jAcEirQe7mFzm6TtYweiHNS35DA5Y7aQZCeaAgzCq88sDxO8xpqPnHVbn8UL4Q2QOTBWI_EItgdBHKtiouho45fsLGjezuLPoIenRTsz8tw',
    description: 'دفاع ابن رشد البرهاني المجيد عن مشروعية الفلسفة ووفاقها الجوهري مع الشريعة، مؤكداً أن الحق لا يضاد الحق بل يوافقه ويشهد له.',
    quote: '«الحكمة هي الأخت الرضيعة للشريعة، والحق لا يضاد الحق بل يوافقه ويشهد له.»',
    sectionId: 'islamic',
    period: 'قرطبة الأندلس • القرن السادس الهجري',
    keyConcepts: ['التأويل البرهاني', 'وفاق العقل والنقل', 'مراتب المخاطبة']
  },
  {
    id: 'wisdom-tahafut-al-tahafut',
    title: 'تهافت التهافت',
    author: 'ابن رشد الأندلسي',
    category: 'الفلسفة الإسلامية والإشراق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAokE8qPu6Pq3AZKN05wHK5LvW-6uqAV95qhPn0m0_Snkvch9VXMJD70C9q910kNKFSPj4zQzPPVrT0FCXgo_yL1TLsyqji8tae8rDBrybON7bMyQamvehnNtfZwe2UnAIcZR-hNAY65_EQcjQE-bQ2JQxA19fq1HE8QB3JtORBme9vJOVbaSooNABpjhDrZ2tWMZgliwYEORqYGPu7N5G7WxUNTM7rCWnF_OpWm_wmGQ9c0vwn6pxH1w',
    description: 'المناظرة الكبرى التي انتصر فيها ابن رشد للعقل والسببية ضد تشكيكات الغزالي، مؤكداً أن إنكار السببية هو إنكار للعقل والمعرفة الإنسانية برمتها.',
    quote: '«إن القول بإبطال الأسباب هو إبطال للعقل ذاته؛ فالمعرفة هي معرفة الأشياء بعللها.»',
    sectionId: 'islamic',
    period: 'الأندلس • القرن السادس الهجري',
    keyConcepts: ['السببية الطبيعية', 'أزلية الكون', 'العقل الفعّال']
  },
  {
    id: 'wisdom-rasail-ikhwan-safa',
    title: 'رسائل إخوان الصفا',
    author: 'إخوان الصفا وخلان الوفا',
    category: 'الفلسفة الإسلامية والإشراق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZaCcK4YhkeEM4YP62KusKUVc7m5pBOG0GdHm1Z-w1vffmTpCqmAYKTZpQU-5AgTqnyuRyJi5CXuCZSDAxwljYt5lB-9bxNgstUQ0ATyRo3VWuQfzp4XA6AW3Wn0JFj_YPZ-5dfgInBO9wHEtUHj7Yd90IG7VA15yceah0YLldQUHBXz0837fncpUm_Taws_7KEFwyBUymTdMtPq9kdk-YSM5n-GjN7LWEn0PKruTPgPSGsIz8WV0odw',
    description: 'موسوعة فلسفية صوفية جامعة من البصرة، تدمج الرياضيات الفيثاغورسية والأفلاطونية المحدثة مع الروحانية الإسلامية في اثنتين وخمسين رسالة بديعة.',
    quote: '«صفاء النفس يكون بتطهيرها من دنس الجهالة وبلوغها مرتبة الحكمة الشاملة.»',
    sectionId: 'islamic',
    period: 'البصرة • القرن الرابع الهجري',
    keyConcepts: ['الفيثاغورسية الإشراقية', 'الموسيقى وتناغم الفلك', 'أخوة الأرواح']
  },
  {
    id: 'wisdom-hikmat-al-ishraq',
    title: 'حكمة الإشراق',
    author: 'شهاب الدين السهروردي المقتول',
    category: 'الفلسفة الإسلامية والإشراق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqNgCAx7Et3B677r-0TTLNdHT0dG0KiZaHjwRL42JYU77XxzW_er5zA27Y7OsbaoFkadjZmj5WVDvGAR0aXcENLSvNtJryi3Z_6D-I2D0wgBtc6Ik25EV6oSwnY6_I3ReNeaL97wdhdNqK5QNkNyXegZu6vIOEROfxktOgBz5LeTpAHmK9jMSqcl1UgG6yIIiZd0Js0WUFxyKJFAOi1sBky84nPHoNd8_tWIcAmxREzQUJ0AjDmTmQgw',
    description: 'تأسيس مدرسة الإشراق الفلسفية المستندة إلى أنوار الوجود، حيث تتدرج الموجودات في مراتب الإضاءة من نور الأنوار الأقدس إلى أدنى درجات الغسق.',
    quote: '«كل ما في الوجود إما نور محض أو غسق وظلمة، وأشرف المعارف هي المعاينة الذوقية.»',
    sectionId: 'islamic',
    period: 'حلب والشرق • القرن السادس الهجري',
    keyConcepts: ['نور الأنوار', 'المشاهدة الحضورية', 'عالم المثال']
  },
  {
    id: 'wisdom-asfar-arbaa',
    title: 'الأسفار الأربعة',
    author: 'صدر الدين الشيرازي (ملا صدرا)',
    category: 'الفلسفة الإسلامية والإشراق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4jFOyICIKsJOJJug0vDu0uDD7goBomSUO9T86dIVet_Xnzy0b5zS3IRGHCDCGoheipMVXAwO7R0snf3D4as7L8jezlV83BObKBMI9zZhgFZsoGM5_HM7wIO2McY5elwajTKhrZZk5ma7Sfec0vCAjHE562ZarSilob40zaIvbmyOZ8Ka30qQy_IkG1yCcA9amBVLPB_z6QZqvE8iWNHC_-WR2p-sr6YxAXf59jKWdfjpi2dSfmj9wRw',
    description: 'قمة الحكمة المتعالية؛ أربعة أسفار عقلية تبدأ من الخلق إلى الحق، ثم في الحق بالحق، ثم من الحق إلى الخلق، وأخيراً في الخلق بالحق مع إثبات أصالة الوجود والحركة الجوهرية.',
    quote: '«الوجود أصيل والماهية اعتبارية، والكون في صيرورة جوهرية مستمرة نحو الكمال.»',
    sectionId: 'islamic',
    period: 'أصفهان • القرن الحادي عشر الهجري',
    keyConcepts: ['أصالة الوجود', 'الحركة الجوهرية', 'اتحاد العاقل والمعقول']
  },
  {
    id: 'wisdom-tawq-al-hamama',
    title: 'طوق الحمامة',
    author: 'ابن حزم الأندلسي',
    category: 'الفلسفة الإسلامية والإشراق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_XE7IDs3Ll4IErLlnbwxe3COKnxvAz6uMXmSU6xG8KsJWKPT-C7E2oR-8UY90vzVzDzxo8UHMxQDAqDWvrOqxSVA-rnhMcWsN0jYHJMGkeuCBxTSRazfbJFDqACXiP25pbakMw126EVbd36-R8mdG41LGrj1PbQzO0SXkdoV8kLV0V0yiCtrw9Zr8VQC0vV--dyNIgwVF-b0l9QSBqOyxeI8Ww0VzdiJUvxvH_QSMdtgwGTysvf6eGw',
    description: 'أدق تحليل نفسي وفلسفي لعاطفة الحب والألفة الإنسانية في التراث العربي، يبحث في اتصال الأرواح في عالمها العلوي قبل حلولها بالأجساد.',
    quote: '«الحب اتصال بين أجزاء النفوس المقسومة في هذه الخليقة في أصل عنصرها الرفيع.»',
    sectionId: 'islamic',
    period: 'قرطبة وشاطبة • القرن الخامس الهجري',
    keyConcepts: ['اتصال الأرواح', 'الوفاء والعفة', 'الفراسة النفسية']
  }
];

// 4. كلاسيكيات الفكر الغربي وعصر التنوير (العقلانية والنقد النسقي)
export const WESTERN_ENLIGHTENMENT_CLASSICS: RiwaqWisdomItem[] = [
  {
    id: 'wisdom-discourse-method',
    title: 'مقال في المنهج',
    author: 'رينيه ديكارت',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGtYUpbaPqNYrkpY0hwMM-lo_vFvjI2nRQwhmqCID-JIO0HpHRNrjpQgsznkh7NYDuw-6E87oTzKcLMW8ao7U_Lj_1H8ZPo9NUks0oxNPpM3YE9O4foQFlCIVVpAV5Q-ozdhqDZA9uRa6rQzyEAd2JMMMaNEND2lGxU5_nJxhyCNAu3wOCFMH3MbEpKPPNF2m88tigcYeKh9AxnNfYGmOk5OmGIf83djefT0kzezJsV-RAUapjVD1RdQ',
    description: 'البيان التأسيسي للمنهج العقلي الحديث؛ أربع قواعد ذهبية لقيادة الفكر والتثبت من البداهة والوضوح في دراسة الطبيعة والذات.',
    quote: '«العقل أعدل الأشياء قسمة بين الناس؛ والغاية ليست امتلاكه بل إحسان استخدامه.»',
    sectionId: 'western',
    period: 'فرنسا وهولندا (1637)',
    keyConcepts: ['قواعد المنهج الأربع', 'البداهة والوضوح', 'التقسيم والتركيب']
  },
  {
    id: 'wisdom-social-contract',
    title: 'العقد الاجتماعي',
    author: 'جان جاك روسو',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQtTN9LYPxQYVU5UQLXkxAOTP5sWELSG7--tWnQ3hIWmM_tIZhZT1HfGg1Yx6stsMo4iFJEQ5cJsvZHS1uJnaJIHob_qmnR_Ql_Wh_BuSholDHNMoVBSdFigfGl0gFZ9RZv_lQjRQ3H97Yx6QoynoriZCXMEUeayJlHTspLq35T0_78PFZA9V1iHqXmVE6QfjCsBloxpUCaXUXq_JkH_OhKEOX57s7HK0c7aK9T0PPPLsCpo3mtvuhzA',
    description: 'الأطروحة السياسية التي مهدت للثورة الفرنسية؛ تنادي بأن السيادة للشعب عبر الإرادة العامة وأن خضوع الفرد للقانون العادل هو جوهر حريته.',
    quote: '«يولد الإنسان حراً، ولكنه مكبل بالأغلال في كل مكان.»',
    sectionId: 'western',
    period: 'جنيف وفرنسا (1762)',
    keyConcepts: ['الإرادة العامة', 'الحرية المدنية', 'سيادة الشعب']
  },
  {
    id: 'wisdom-theological-political-treatise',
    title: 'رسالة في اللاهوت والسياسة',
    author: 'باروخ سبينوزا',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpmU-wOqFwZpDtH_Im-2QrmChb42Pbp3OhQDK_mPoeQMKi-KixwUS0fMp-PNILupd4FVIQFvRY0kAGmN29vgIt2zHzUTdXAuxaE-31y17dJbCxIoz9YeBjRouvkUBoxXmmN0E669OlmuQzlAXOpBwpIyLwrlSL6togfy4y-IxDw8G4B4WJjqcRd1Wgl4EcQ77kX18EzdQvrsBAnz2tGEVubgDqebrIB4EukCbuamLHHP6MMnA_VqXnOw',
    description: 'عمل جريء دافع عن حرية التفلسف والتعبير وحياد الدولة السياسي، مقدماً نقداً تاريخياً ولغوياً صارماً للنصوص القديمة.',
    quote: '«غاية الدولة الحقيقية هي الحرية؛ وأن يعيش الناس بأمان وفق هدي العقل.»',
    sectionId: 'western',
    period: 'أمستردام (1670)',
    keyConcepts: ['حرية التفلسف', 'المحايثة ووحدة الوجود', 'العقلانية النقدية']
  },
  {
    id: 'wisdom-pensees',
    title: 'أفكار',
    author: 'بليز باسكال',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8hD6dgnYQbwjqXGaHPK85COOkROUMO_iTs9ntXtIYiwWYspYIbbVP4ZSPt0eXbqBiAi4anGsvNyrQfwD3FubZ0RfNX7M2bhCL57jevIvABBFDnEp50TctEyjVP6ZJrGzjT3adcRF5KkJ2JUXiJpzMPVF6xLzN-XtAZJvmvRak-m6X3xrvazVbZGQmZhKRHcMx34DkDOiOfZtsugorsoxB8mf89NJGqO5Rar22xfvdMvi_SkDpj1QKIQ',
    description: 'شذرات فلسفية وروحية مكثفة تكشف قلق الوجود الإنساني، وتقف عند مفارقة عظمة الإنسان وبؤسه في كون لا متناهٍ.',
    quote: '«الإنسان قصبة مفكرة، أضعف ما في الطبيعة، لكنه يدرك فناءه وذاك سر نبله.»',
    sectionId: 'western',
    period: 'باريس (1670)',
    keyConcepts: ['القصبة المفكرة', 'منطق القلب والحدس', 'رهان باسكال']
  },
  {
    id: 'wisdom-monadology',
    title: 'المونادولوجيا',
    author: 'غوتفريد فيلهلم لايبنتز',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBv8sDpBi-_Ki66ZFv-rQZOwW5swY8bYWAW5VKPnOJ4YaKZGeZawqnWVuUqhn-8phayrvdSEft-Nv8EYl11ONDxcyi3a33JC1I2wOsPWkGWbxSE5FCEdx7G6nsk9PVplOIlHbQizBKd9JnMTZLw9LM-bh8T4SQ7KWmwux32xJVA4QSfQKTi2P9RHHNDO17B07IhPn1795paP09xcLzwzy1F_K5MDdmFaZNyNM9O2uBYhxL33hwCzqoBWA',
    description: 'أطروحة ميتافيزيقية محكمة تفسر الكون بمرايا روحية بسيطة لا نوافذ لها تُدعى الجواهر الفردة (المونادات)، يحكمها تناغم أزلي مقرر.',
    quote: '«كل جوهر فرد هو مرآة حية دائمة تعكس الكون بأسره من وجهة نظرها الفريدة.»',
    sectionId: 'western',
    period: 'ألمانيا (1714)',
    keyConcepts: ['المونادات', 'التناغم المسبق', 'أفضل العوالم الممكنة']
  },
  {
    id: 'wisdom-principles-human-knowledge',
    title: 'مبادئ المعرفة الإنسانية',
    author: 'جورج بيركلي',
    category: 'الفكر الحديث والتنوير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPKnqktG4Gvm1clYvSzneY_FXoVW5NlzzZOcKQm4z2nCPgO9z8pQm55EU19Ku_3DuWMXznj3jpnB6a74X79WA7iSR6rAYtaxzlKP7zqq74TqC8FI1mWwvmIpxXadlYgKlHr1LEBAFRSGew04WkHaRDXKG_MsOL_Dpapjzy2x8g0Kj4EJZgIsu0d97kH9cbur1P897O79ZEhd4XO_55Qq-iHplzxzQsle1YmI6IbRmftLmh5LLmxeSzag',
    description: 'الأطروحة اللامادية الشهيرة التي تفترض أن وجود الأشياء يكمن في إدراكها أو كونها مُدرَكة، رداً على النزعة المادية والشكوكية الحسية.',
    quote: '«أن توجد يعني أن تُدرَك، أو أن تكون ذاتاً واعية قادرة على الإدراك.»',
    sectionId: 'western',
    period: 'إيرلندا (1710)',
    keyConcepts: ['اللامادية', 'الوجود والإدراك', 'نقد الأفكار المجردة']
  }
];

// 5. مدارس الحكمة الشرقية والتأمل (الروح والكون والسكينة)
export const EASTERN_WISDOM_SCHOOLS: RiwaqWisdomItem[] = [
  {
    id: 'wisdom-tao-te-ching',
    title: 'تاو تي كينغ',
    author: 'لاو تزو',
    category: 'حكمة المشرق والتأمل',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqCXDcDIa-Ds6ddTGKP4CFy8q-8-58akyn8e4MHZ3sc5QecnY46YmMMAPAINZlDUkm5tp00JOdT4o-tcNrssOvzSUfEVhoYjRm7p7nv3Hd7ZcLIdKN_x0hwhgLI_nZaO9e__U1TLNW7dVBTpNXcfNvnJyzdbdMPg5DnutO5JXGbxnh_XJ7rVyie3h86ISARzhSptMBWwmcY6mPDhXUW_r_LBQGroUhfYghqh8ZlkoKLIUZ1Pn1Mwj91w',
    description: 'كتاب الفضيلة والطريق الأعظم في التاوية؛ يعلم مبدأ "اللا فعل" (وو وي) والتوافق الرشيد مع مجرى الكون الشبيه بجريان الماء العذب.',
    quote: '«التاو الذي يمكن وصفه بالكلمات ليس هو التاو الأبدي السرمدي.»',
    sectionId: 'eastern',
    period: 'الصين القديمة • القرن السادس قبل الميلاد',
    keyConcepts: ['التاو', 'اللا فعل (وو وي)', 'تواضع الماء والسكينة']
  },
  {
    id: 'wisdom-upanishads',
    title: 'مختارات الأوبانيشاد',
    author: 'حكماء الفيدانتا في الهند القديمة',
    category: 'حكمة المشرق والتأمل',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHk_Sye6e1u7kk3vhsazt9apXyT5FftP_FJfyzgyUhaRCjbdHLDGFBKnWTPBKGyT_yeDJinxPAHlsE7peLZgD8hyvwRlix_t5sHMwFnpLzIePNiyFEln3xtkxmULHfc9vCpI8JWgW-GphCCja0lChSiCxjGlLeQZjqHe2u0FoIWglaRulksn3lEzzUoK0kS8KVjOiRIC72vyrcNPwhRnTWWWjofTFFa8kyOsWpF6G_NEnfwLJLPobkGg',
    description: 'الذروة الفلسفية للأدب الفيدي؛ حوارات عميقة حول الاتحاد الجوهري بين الذات الفردية (آتمان) والروح الكونية الكلية (براهمان).',
    quote: '«أنت هو ذلك؛ الذات العارفة الباطنة هي ذاتها سر الوجود الأكبر.»',
    sectionId: 'eastern',
    period: 'الهند القديمة • الألفية الأولى قبل الميلاد',
    keyConcepts: ['البراهمان والآتمان', 'المايا والوهم', 'الموكشا والتحرر']
  },
  {
    id: 'wisdom-bhagavad-gita',
    title: 'الأناشيد الإلهية',
    author: 'كريشنا وأرجونا (ملحمة المهابهاراتا)',
    category: 'حكمة المشرق والتأمل',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBzDADLUVIN6QJ6HE4TwaU6PlBYyQiiZoQufgLhO91i2OWMyB8wp4kLuXN7eU8BePy_vKkZPjww0bYRzkfo_p2xLMNCOjoDcUe5-EOANMnRr0_TJQo9Uhn_j1JtvGm-MtpisaneY4OJOK66VH7btsNdyZoumnj_BRfHUhgMv8z3dXuDbV2ODWyGQ4x7PGAVHw_pxkg-RfhvOTCRkqO6Pr1MCc69MTP-DzMXhL6Nn_F-Yf-pAdrEIBs7w',
    description: 'حوار فلسفي وروحي على مشارف معركة كوروكتشترا؛ يدعو إلى أداء الواجب المقدس دون تعلق بالثمار والنتائج (الكارما يوغا).',
    quote: '«لك الحق في الفعل فقط، لا في ثماره؛ لا تجعل ثمار العمل غايتك.»',
    sectionId: 'eastern',
    period: 'الهند القديمة',
    keyConcepts: ['الكارما يوغا', 'الواجب غير المشروط', 'طمأنينة الروح']
  },
  {
    id: 'wisdom-analects-confucius',
    title: 'المحاورات',
    author: 'كونفوشيوس وتلاميذه',
    category: 'حكمة المشرق والتأمل',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-rV62P7KCPO691W6Qsj6o6ypAcj5kp8L5lQ5RWbYKz8od4DcQibCL5Nhjdj--9x7rdVeKei_Z_SeVAr0UykswGtf_JcNnMG_qr2avdj24zeynFdzmspRFCuquzwupbN1QMWatapp1ilqRCdnPxvUPXjHcEuKulUJbuf3NzETdlMBchijFQizZ8Y-kh8z3hDywgCy-_c5es_F7FYJX7lF_Q-ObvsUywGcAwez9_1JV1yzq33FA8pC-tA',
    description: 'سجل حِكَم كونفوشيوس الأخلاقية والاجتماعية؛ ترسيخ قيم البر، الإنسانية (رين)، والاستقامة وتهذيب السلوك لبناء مجتمع متزن وفاضل.',
    quote: '«الرجل الفاضل يطلب من نفسه ما يطلبه، والرجل الصغير يطلبه من الآخرين.»',
    sectionId: 'eastern',
    period: 'الصين القديمة • عصر الدول المتحاربة',
    keyConcepts: ['الإنسانية (رين)', 'الطقوس والأدب (لي)', 'حكمة الحاكم الفاضل']
  },
  {
    id: 'wisdom-far-east-treatise',
    title: 'حكمة الشرق الأقصى',
    author: 'مختارات زن وحكماء الجبال',
    category: 'حكمة المشرق والتأمل',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9PqBnCRC-Hd2e1f2JSWg29tYsimGhlr8igWXRVDRMbtK2DsiLJbRcJRTnLHnhQ3JhQdal26MTHp1pJL0kU_yAHq0bHpGYG_sYG4BPJDpOusn8grybXMnwR8o8vh1AQjiDlNbVmC9MOYvd9bmKZXmEWn-KqxVeb7RdpDiG2F97fM1Q4M3LKcqAU8YNa6up-qCTNz0jdEy4QDW6gVSUVlsB_ugt403_r7-STRsnpgKdP8eJqfXpD5wS5g',
    description: 'دروس تأملية في البصيرة الصامتة وتطهير الذهن من الأوهام والارتباطات العابرة، وتذوق الحضور الخالص في اللحظة الراهنة.',
    quote: '«حين يصمت الذهن عن الجدال، تتحدث الأشياء بلغتها النقية الصادقة.»',
    sectionId: 'eastern',
    period: 'الشرق الأقصى القديم',
    keyConcepts: ['الزن واليقظة', 'الحضور في اللحظة', 'الفناء الإيجابي']
  },
  {
    id: 'wisdom-book-of-tea',
    title: 'كتاب الشاي',
    author: 'كاكوزو أوكاكورا',
    category: 'حكمة المشرق والتأمل',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuM0w7K9k94riPnswpy7YIZu4eySN54sspwx9Br5HEi7rrh4q2xPmmc73MfRah5z_WIWhTNf8TvCxSVr_P81RuokfBe5H5W9yr8maVppAgU-MCkxL-qywcholPTFi4rOZsbp5mLugTHZ_JAPWvYqgC4tLoH9Eli8Rp9euXjbnTdQiUiGE7CLCnDVJae5efqAwQzzEZRjTFHIKm_HJDwTCA9-xXJQCyb2uw-bmEUixXKo8tFBbTIF8vwQ',
    description: 'دراسة جمالية وفلسفية رفيعة تشرح كيف أصبحت طقوس الشاي ديانة للجمال ووسيلة لتأمل البساطة غير المكتملة والنقاء في عوالم الشرق.',
    quote: '«الشاي فن لإخفاء الجمال بحيث تكتشفه أنت بنفسك، وللإيحاء بما لا تجرؤ على البوح به.»',
    sectionId: 'eastern',
    period: 'اليابان الحديثة (1906)',
    keyConcepts: ['شاي زن', 'جماليات الوابي سابي', 'تناغم الفنون والحياة']
  }
];

// Master catalog combining all books
export const ALL_WISDOM_BOOKS: RiwaqWisdomItem[] = [
  SPOTLIGHT_WISDOM,
  ...MAJOR_WISDOM_SELECTIONS,
  ...ISLAMIC_ILLUMINATION_PHILOSOPHY,
  ...WESTERN_ENLIGHTENMENT_CLASSICS,
  ...EASTERN_WISDOM_SCHOOLS
];

// بوصلة التيارات والمدارس الفكرية
export const THOUGHT_CURRENTS: ThoughtCurrentItem[] = [
  {
    id: 'stoicism-ethics',
    badge: 'الرواقية والأخلاق',
    title: 'فن التحكم بالذات وسكينة الروح',
    quote: '«لا تشغل بالك بما هو خارج عن إرادتك، بل اجعل غايتك الفضيلة وطمأنينة العقل أمام تقلبات الدهر.»',
    philosophers: 'سينيكا · إبكتيتوس · ماركوس أوريليوس',
    icon: 'balance',
    linkText: 'مطالعة أطروحات الرواق',
    categoryFilter: 'علم الأخلاق والسياسة المدنية'
  },
  {
    id: 'existentialism-phenomenology',
    badge: 'الوجودية والظاهراتية',
    title: 'مسؤولية الحرية والبحث عن المعنى',
    quote: '«الوجود يسبق الماهية؛ الإنسان محكوم عليه بالحرية وهو الكائن الوحيد الذي يصنع حقيقته عبر أفعاله وقراراته.»',
    philosophers: 'سارتر · كيركغور · ألبير كامو',
    icon: 'psychology',
    linkText: 'استكشاف نصوص الوجود',
    categoryFilter: 'الفكر الحديث والتنوير'
  },
  {
    id: 'rationalism-idealism',
    badge: 'العقلانية والمثالية',
    title: 'بناء النسق الفكري وحدود المعرفة',
    quote: '«حدود مداركنا هي أفق عالمنا الفكري؛ العقل ليس وعاءً فارغاً بل هو الصانع المنهجي لتجربتنا الواعية.»',
    philosophers: 'ديكارت · كانط · هيغل',
    icon: 'lightbulb',
    linkText: 'مراجعة أنساق الفكر النظري',
    categoryFilter: 'الفكر الحديث والتنوير'
  }
];

// استحضار مسألة تأملية (خوارزمية الرواق الفكرية)
export const PHILOSOPHICAL_ISSUES: PhilosophicalIssue[] = [
  {
    id: 'issue-reason-intuition',
    badge: 'مسألة العقل والحدس',
    origin: 'الغزالي مقابل سبينوزا',
    title: '«هل يتوصل الإنسان إلى إدراك الماهيات بالبرهان الصوري أم بالنور الداخلي والمشاهدة؟»',
    body: 'تجادل المدرسة الإشراقية بأن البراهين المنطقية شروط ضرورية لكنها غير كافية لتحقيق اليقين، بينما تفترض العقلانية المنهجية أن كل حقيقة تنفلت من سلاسل القياس العقلي تظل في دائرة الظن والالتباس.',
    ref: 'مخطوط مرجعي: كتاب مشكاة الأنوار'
  },
  {
    id: 'issue-justice-freedom',
    badge: 'طبيعة العدالة والحرية',
    origin: 'أفلاطون مقابل روسو',
    title: '«هل الفضيلة غاية فردية للروح الواعية أم عقد اجتماعي لحماية الكيان المشترك؟»',
    body: 'يقدم أفلاطون في جمهوريته العدالة بصفتها انسجاماً باطنياً بين قوى النفس، في حين يرى مفكرو التنوير أن الحرية لا تُولد إلا حين يتنازل الأفراد عن إراداتهم المنفردة لصالح الإرادة العامة والعدل المدني.',
    ref: 'مخطوط مرجعي: كتاب العقد الاجتماعي ومحاورة جورجياس'
  },
  {
    id: 'issue-time-consciousness',
    badge: 'الزمان والخلود في الوعي',
    origin: 'أوغسطين مقابل برغسون',
    title: '«ما هو الزمان إذا لم يسألني أحد عنه، ولماذا يعجز العقل عن تفسير تدفق الحاضر؟»',
    body: 'يعتبر الزمان عند الفلاسفة الغيبيين امتداداً للنفس وتذكراً مستمراً للماضي وترقباً للآتي، بينما يقرر برغسون أن الديمومة الحقيقية لا تقاس بساعات الفضاء بل بالحدس الحي للوعي المتدفق.',
    ref: 'مخطوط مرجعي: اعترافات أوغسطين والتطور الخالق'
  },
  {
    id: 'issue-truth-language',
    badge: 'جوهر الحقيقة واللغة',
    origin: 'فتجنشتين مقابل الفارابي',
    title: '«هل حدود لغتي هي حدود عالمي، أم أن المعاني المتعالية تسبق الألفاظ وتفيض عليها؟»',
    body: 'يقيم المنطق التحليلي تطابقاً بين تركيب القضايا المنطقية وحقائق الواقع الممكنة، بينما ترى الميتافيزيقا المشرقية أن اللغة ليست إلا ظلاً للماهيات التي يستحيل حصرها في قوالب الإشارات اللفظية.',
    ref: 'مخطوط مرجعي: رسالة في المنطق وكتاب الألفاظ المستعملة'
  },
  {
    id: 'issue-evil-providence',
    badge: 'مشكلة الشر والعناية الإلهية',
    origin: 'ابن سينا مقابل لايبنتز',
    title: '«هل الشر عدمٌ خالص وعارض للخير الأعم، أم ضرورة بنيوية في أفضل العوالم الممكنة؟»',
    body: 'يقرر ابن سينا أن الشر نقص يعرض للممكنات بطبيعة اقترانها بالمادة ولا يقصد بالذات، بينما يبرهن لايبنتز على أن التناغم الكوني الأعظم يتطلب تضاداً يبرز جلال الصورة الإلهية الكاملة.',
    ref: 'مخطوط مرجعي: الشفاء (الإلهيات) والمونادولوجيا'
  }
];

// المباحث الأكثر تداولاً وتأملاً (Col 5)
export const TOP_CONTEMPLATED_TREATISES: RankedTreatiseItem[] = [
  {
    rank: '١',
    title: 'تأملات في الفلسفة الأولى',
    authorAndTheme: 'رينيه ديكارت · دراسة الشك واليقين',
    id: 'wisdom-meditations'
  },
  {
    rank: '٢',
    title: 'جمهورية أفلاطون: المدينة والعدالة',
    authorAndTheme: 'أفلاطون · حوارات سقراط ومثال الكهف',
    id: 'wisdom-plato-republic'
  },
  {
    rank: '٣',
    title: 'فصل المقال في ما بين الحكمة والشريعة',
    authorAndTheme: 'ابن رشد الأندلسي · وفاق العقل والنقل',
    id: 'wisdom-fasl-al-maqal'
  },
  {
    rank: '٤',
    title: 'في معنى الحياة وسؤال الوجود',
    authorAndTheme: 'مختارات الوجودية المعاصرة وتأملات العبث',
    id: 'wisdom-thus-spoke-zarathustra'
  },
  {
    rank: '٥',
    title: 'الأخلاق الهندسية',
    authorAndTheme: 'باروخ سبينوزا · برهان حرية الإنسان والعلة الأولى',
    id: 'wisdom-theological-political-treatise'
  }
];

// الفئات وفهارس الحكمة
export const WISDOM_CATEGORY_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'الفلسفة الإغريقية', label: 'الفلسفة الإغريقية' },
  { id: 'حكمة المشرق والتأمل', label: 'حكمة المشرق والتأمل' },
  { id: 'الفلسفة الإسلامية والإشراق', label: 'الفلسفة الإسلامية والإشراق' },
  { id: 'الفكر الحديث والتنوير', label: 'الفكر الحديث والتنوير' },
  { id: 'علم الأخلاق والسياسة المدنية', label: 'علم الأخلاق والسياسة المدنية' }
];
