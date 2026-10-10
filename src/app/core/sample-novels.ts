export interface RawChapterData {
  title: string;
  chapterIndex: number;
  content: string;
}

export interface RawNovelData {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  authorCover?: string;
  authorBio?: string;
  translator?: string;
  translatorAvatar?: string;
  translatorCover?: string;
  translatorBio?: string;
  category: string;
  description: string;
  coverGradient: string;
  coverImage: string;
  riwaqId: string;
  riwaqName: string;
  accentColor: string;
  rating?: number;
  ratingCount?: number;
  views?: string;
  badge?: string;
  section: string;
  chapters: RawChapterData[];
}

export const SANCTUARIES_DATA = [
  {
    id: 'riwaq-al-riwayat',
    name: 'رواق الروايات',
    subtitle: 'قرمزي داكن وفحم',
    badge: 'البوابة الأولى',
    tagColor: 'primary',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhuTKbcv3DDAOmL6x29mLQ2E1h9qzTJKxRh98CGBL9S0cxLlLuJknlnmELv1BPuHrchLgYYIMGXlZT0ABzb3XJlu2hQwgtLMtzDTZkjXxBpsEiX0FYkTeb5AW-SRybvbJJ3No4Fgu2qeBISTjBt2zLuH1y02Rx_p5NIK6jn26omWouHTS1QvKYyotcUyRin1LgymXW1zs6qqewN8jK-onh2SvHVl71JxjyZAO7frkv3HPXYvzzhsE1GA',
    btnBgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhuTKbcv3DDAOmL6x29mLQ2E1h9qzTJKxRh98CGBL9S0cxLlLuJknlnmELv1BPuHrchLgYYIMGXlZT0ABzb3XJlu2hQwgtLMtzDTZkjXxBpsEiX0FYkTeb5AW-SRybvbJJ3No4Fgu2qeBISTjBt2zLuH1y02Rx_p5NIK6jn26omWouHTS1QvKYyotcUyRin1LgymXW1zs6qqewN8jK-onh2SvHVl71JxjyZAO7frkv3HPXYvzzhsE1GA',
    btnGradient: 'from-[#881337]/90 via-[#400014]/80 to-[#131315]/90',
    btnBorder: 'border-[#ffb2bd]/35 hover:border-[#ffb2bd]/80',
    btnTextColor: 'text-[#ffd9dd]',
    lore: 'ليل درامي وتوتر مسرحي يستحضر هيبة السرد الإنساني وصراع الأقدار وشجون النفس الحائرة بين النور والعتمة.',
    quote: '«في دهاليز الخيال تتشكل حيوات لم نعشها، ونختبر مصائر لا تنتهي قبل أن يرتد إلينا طرفنا.»',
    accent: '#ffb2bd',
    btnBg: 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary',
    actionText: 'ادخل رواق الروايات',
  },
  {
    id: 'riwaq-al-malahim',
    name: 'رواق الملاحم',
    subtitle: 'برونز وأزرق ليلي',
    badge: 'البوابة الثانية',
    tagColor: 'secondary',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDdhqc3I7gyCxIu2Zf6NduqtEQWE1etB38c8EY_J5-jMQnJzDzO7BzGMLFnZ-ip1NSUgMVOtisScbGQ04qYkzwsa4oUZAepemoPxUtRtxf--Hw1D_nfAs66nAU594mLUjgimne6Eu7yc8tb7j1tyfypiO__DtAoXpnMunN8H6i-XKxc6SSzeMHV8n6U3gmywovVLqniRnBxeJYF91Q96eWB3_7GXVrBtXjdMsG5K89sX25PBklhmHihw',
    btnBgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDdhqc3I7gyCxIu2Zf6NduqtEQWE1etB38c8EY_J5-jMQnJzDzO7BzGMLFnZ-ip1NSUgMVOtisScbGQ04qYkzwsa4oUZAepemoPxUtRtxf--Hw1D_nfAs66nAU594mLUjgimne6Eu7yc8tb7j1tyfypiO__DtAoXpnMunN8H6i-XKxc6SSzeMHV8n6U3gmywovVLqniRnBxeJYF91Q96eWB3_7GXVrBtXjdMsG5K89sX25PBklhmHihw',
    btnGradient: 'from-[#af8d11]/85 via-[#3c2f00]/80 to-[#131315]/90',
    btnBorder: 'border-[#e9c349]/40 hover:border-[#e9c349]/80',
    btnTextColor: 'text-[#ffe088]',
    lore: 'سماء أسطورية تحتضن بطولات الأولين، صهيل الجيوش القديمة، وألواح الطين المنقوشة بأسماء مَن قهروا الزمان.',
    quote: '«هو الذي رأى كل شيء فبلغت به الحكمة أقاصي الأرض، وعاد يروي ما كان قبل الطوفان العظيم.»',
    accent: '#e9c349',
    btnBg: 'bg-secondary-container text-on-secondary hover:bg-secondary hover:text-on-secondary-fixed',
    actionText: 'ادخل رواق الملاحم',
  },
  {
    id: 'riwaq-al-hikma',
    name: 'رواق الحكمة',
    subtitle: 'عاجي نقي وفحم',
    badge: 'البوابة الثالثة',
    tagColor: 'on-surface',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7PEOsDpl6CigcOGZqFJrjcbmFDm5aJTDYga2fShxU90T-jtawAhiDhsb2osDZbThxifuqEbWPKj1tkwNsLoxsDn8f0gIoMR58u_rwLgAC4Q1EOh7DHtPKQV7CsIGwKEyq6oeQG3-KWIJjTa5R4GXkZx82xgwa9xxliRhcDi84w5mA7wA6lQkQu4hcE0xZ5Ve8YTUR-K2jDl1uKqlrIh_N0Z8Ru8Guw6fN136LM9yKeXvm7lAGaMYVsw',
    btnBgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7PEOsDpl6CigcOGZqFJrjcbmFDm5aJTDYga2fShxU90T-jtawAhiDhsb2osDZbThxifuqEbWPKj1tkwNsLoxsDn8f0gIoMR58u_rwLgAC4Q1EOh7DHtPKQV7CsIGwKEyq6oeQG3-KWIJjTa5R4GXkZx82xgwa9xxliRhcDi84w5mA7wA6lQkQu4hcE0xZ5Ve8YTUR-K2jDl1uKqlrIh_N0Z8Ru8Guw6fN136LM9yKeXvm7lAGaMYVsw',
    btnGradient: 'from-[#39393b]/85 via-[#201f22]/80 to-[#131315]/90',
    btnBorder: 'border-white/25 hover:border-white/70',
    btnTextColor: 'text-white',
    lore: 'فضاء تأملي مشرق بسكينة العقل والمنطق؛ أمهات الفلسفة والتساؤل الوجودي في تجرد تام عن زيف الحواس.',
    quote: '«ليست الغاية المعرفة بما قاله الآخرون، بل البحث عن حقيقة الوجود وحرية البصيرة الكامنة فينا.»',
    accent: '#e5e1e4',
    btnBg: 'bg-surface-container-high text-on-surface hover:bg-inverse-surface hover:text-inverse-on-surface',
    actionText: 'ادخل رواق الحكمة',
  },
  {
    id: 'riwaq-al-turath',
    name: 'رواق التراث',
    subtitle: 'زمردي ونحاس أثري',
    badge: 'البوابة الرابعة',
    tagColor: 'tertiary',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCethOeRiCH5aVUzklgBRZoRvhplRvmSGpKr23Sj5gX6tZ8dXHbVCbLOyQYfnA71A-zCiHvrJeU3eiHSbIh7FlL8T_U_s6S4IaFEZqAflkN4w-NqJhj7lYjHuMEwuu3beZLq7LDccfe6O1t-5QRTxk96boY3xN03MYN6354XH8tn2wtSLV85rItgMouRY04HcxUzj2PLY49hlYVjfSRPfzn058OiUliDOsdy89WjrLWpsYLAz4LZZaTaQ',
    btnBgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCethOeRiCH5aVUzklgBRZoRvhplRvmSGpKr23Sj5gX6tZ8dXHbVCbLOyQYfnA71A-zCiHvrJeU3eiHSbIh7FlL8T_U_s6S4IaFEZqAflkN4w-NqJhj7lYjHuMEwuu3beZLq7LDccfe6O1t-5QRTxk96boY3xN03MYN6354XH8tn2wtSLV85rItgMouRY04HcxUzj2PLY49hlYVjfSRPfzn058OiUliDOsdy89WjrLWpsYLAz4LZZaTaQ',
    btnGradient: 'from-[#005039]/85 via-[#002115]/80 to-[#131315]/90',
    btnBorder: 'border-[#7bd8b1]/35 hover:border-[#7bd8b1]/80',
    btnTextColor: 'text-[#97f5cc]',
    lore: 'مهابة خزائن المخطوطات النادرة، عيون الشعر العربي، ونفائس المصنفات الأندلسية والمشرقية المحفوظة بعناية.',
    quote: '«جمع بين الهزل والجد، وظاهره أدب وباطنه حكمة، كنزٌ تتوارثه العصور دون أن ينضب بهاؤه.»',
    accent: '#7bd8b1',
    btnBg: 'bg-tertiary-container text-on-tertiary-container hover:bg-tertiary hover:text-on-tertiary',
    actionText: 'ادخل رواق التراث',
  },
];

export const SAMPLE_NOVELS: RawNovelData[] = [
  // 1. رواق الروايات
  {
    id: 'novel-obsidian-labyrinth',
    title: 'متاهة السج',
    author: 'أديب الأروقة',
    authorBio: 'كاتب وروائي يستلهم من متاهات النفس البشرية وعوالم الظلال حبكات غامرة.',
    category: 'رواية سيكولوجية غامضة',
    riwaqId: 'riwaq-al-riwayat',
    riwaqName: 'رواق الروايات',
    coverGradient: 'from-rose-950 via-stone-900 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClEpwsOHB6J9NY6vqIZ76GZZvpQppiB8yR60TMuJqm3PNazgJYTYDicH9U8oekTetWdhyxKcDMt3cc6EaBQcg8e7Bp6mNpJtJQCmBu88962tyM46wA8cQMaVOPGE3a_qs8YOF-zr60HbLTFNuV4lAgCJGf5f1kFHzXMHohAn4v4BeWzS5ro6vO2OIJ44zu1PDhB36zryUy8g18NA3vmOMiydlzaEHIdeu0TJtD1vmt8vn4ZuugVPRZ4w',
    accentColor: '#ffb2bd',
    rating: 4.9,
    ratingCount: 3120,
    views: '185K',
    badge: 'سفر القرمزي',
    section: 'riwaq-al-riwayat',
    description: 'في دهاليز قصر قديم مهجور، يجد باحث مخطوطات نفسه محاصراً بين جدران عاكسة تعيد سرد ذكريات لم يعشها، حيث يرقد الحرف ليعاود النهوض حياً في ضمير القارئ.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'الفصل الأول: الباب الموصد بالحبر الأسود',
        content: `كَانَتِ الخُطُوَاتُ تَرِنُّ فِي مَمَرِّ السَّجِّ كَأَنَّهَا صَدَى دَقَّاتِ قَلْبٍ مُحْتَضَرٍ.
وَقَفَ البَاحِثُ أَمَامَ الجِدَارِ الرُّخَامِيِّ، وَقَدْ أَمْسَكَ بِمِصْبَاحِهِ الصَّغِيرِ الَّذِي يَلْفِظُ شُعَاعَهُ الأَخِيرَ نَحْوَ نُقُوشٍ غَائِرَةٍ لَمْ تَرَ الشَّمْسَ مُنْذُ قُرُونٍ.

«لَيْسَتِ الرِّوَايَةُ مَهْرَبًا مِنَ الوَاقِعِ»، تَرَدَّدَ الصَّوْتُ فِي خَلَدِهِ، «بَلْ هِيَ النَّافِذَةُ الوَحِيدَةُ الَّتِي نُطِلُّ مِنْهَا عَلَى أَعْمَاقِنَا المَوْؤُودَةِ».
كَانَ الحِبْرُ عَلَى الوَرَقِ لَا يَزَالُ يَفُوحُ بِرَائِحَةِ المِسْكِ وَالبَرَكِ، وَكَأَنَّ اليَدَ الَّتِي خَطَّتْ هَذِهِ الكَلِمَاتِ انْسَحَبَتْ لِتَوِّهَا مِنَ الغُرْفَةِ.

مَدَّ يَدَهُ لِيَمَسَّ الحَرْفَ المَنْقُوشَ: كَانَ بَارِدًا كَالثَّلْجِ، لَكِنَّهُ سُرْعَانَ مَا انْبَعَثَتْ مِنْهُ حَرَارَةٌ غَامِضَةٌ تَسْرِي فِي أَنَامِلِهِ. هُنَا بَدَأَتِ المَتَاهَةُ تُفْصِحُ عَنْ أَسْرَارِهَا، حَيْثُ لَا فَرْقَ بَيْنَ القَارِئِ وَالكِتَابِ، وَلَا حَدَّ يَفْصِلُ بَيْنَ الخَيَالِ وَالحَقِيقَةِ.`
      },
      {
        chapterIndex: 2,
        title: 'الفصل الثاني: مرآة الذاكرة الغائرة',
        content: `انْشَقَّ الجِدَارُ رُوَيْدًا رُوَيْدًا، لِيَكْشِفَ عَنْ رِوَاقٍ طَوِيلٍ تَتَرَاصُّ عَلَى جَانِبَيْهِ مَرَايَا مُحَاطَةٌ بِإِطَارَاتٍ قَرْمَزِيَّةٍ دَاكِنَةٍ.
لَمْ تَكُنِ المَرَايَا تَعْكِسُ وَجْهَهُ، بَلْ كَانَتْ تَعْرِضُ وُجُوهَ شَخْصِيَّاتٍ رِوَائِيَّةٍ مَرَّتْ عَلَيْهِ فِي مَطَالَعَاتِ صِبَاهُ: هُنَا فَارِسٌ يَنْظُرُ بِأَسًى نَحْوَ قَلْعَةٍ مُحْتَرِقَةٍ، وَهُنَاكَ سَيِّدَةٌ تَنْتَظِرُ رِسَالَةً لَنْ تَصِلَ أَبَدًا.

كُلُّ خَطْوَةٍ فِي هَذَا الرِّوَاقِ كَانَتْ تُعِيدُ تَرْتِيبَ المَشَاعِرِ. لَقَدْ أَدْرَكَ أَنَّ الكَلِمَةَ أَقْوَى مِنَ المَوْتِ، وَأَنَّ الأَرْوَاحَ الَّتِي تَسْكُنُ بَيْنَ السُّطُورِ هِيَ أَبْقَى مِنْ أَجْسَادِ مَنْ سَطَّرُوهَا.`
      }
    ]
  },
  {
    id: 'novel-the-thief-and-dogs',
    title: 'اللص والكلاب',
    author: 'نجيب محفوظ',
    authorBio: 'أديب نوبل العربي، رائد الرواية العربية الحديثة وصاحب التحف الخالدة في أدب الحارة والوجود.',
    category: 'رواية وجودية درامية',
    riwaqId: 'riwaq-al-riwayat',
    riwaqName: 'رواق الروايات',
    coverGradient: 'from-rose-900 via-stone-900 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDluJETcKo-a7UA3Uo2btZS90gHz7O4w-8I-Qbj-CGsp6zOh0YuFW9nO_DncHT9fOHYuOBYPZ9-wC25RcrYkA3cdvt4s1FbAF1esiu2mLLImM1YwQch-VEDbg-_7o-5BAeS8SuHCihgDqWtIM-Ugm8rBZyq44o0QED27xbLSoRQjNZ1GJYiEhYjX6GbWQocsYOKpJtTb7YXGQsKDSRVVf1jalFbUxyDGyh4X2yhuXqNOIdv2dCHR56rFQ',
    accentColor: '#ff93a6',
    rating: 4.95,
    ratingCount: 5200,
    views: '320K',
    badge: 'درة محفوظ',
    section: 'riwaq-al-riwayat',
    description: 'ملحمة سعيد مهران وصراعه المأساوي مع الخيانة والضياع؛ رواية التحليل النفسي والرمزية العميقة التي تجسد ذروة الفن السردي العربي الحديث.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'الفصل الأول: الخروج إلى شمس الظهيرة الحارقة',
        content: `مَرَّةً أُخْرَى يَتَنَفَّسُ نَسِيمَ الحُرِّيَّةِ، وَلَكِنْ أَيُّ حُرِّيَّةٍ؟
كَانَ الجَوُّ خَانِقًا، وَالقَيْظُ لَا يُطَاقُ، وَالغُبَارُ يَعْلَقُ بِالحُلْقِ كَأَنَّهُ حَسَرَاتُ السِّنِينَ المَاضِيَةِ فِي سِجْنِ طُرَة.

خَرَجَ سَعِيدُ مِهْرَانَ إِلَى الدُّنْيَا كَمَا يَخْرُجُ المَيِّتُ مِنْ قَبْرِهِ؛ كَانَ يَتَطَلَّعُ إِلَى الطَّرِيقِ بِمِشْيَةٍ وَاثِقَةٍ مَمْزُوجَةٍ بِحِقْدٍ دَفِينٍ.
«الخِيَانَةُ تَغْسِلُهَا الدِّمَاءُ، وَالغَدْرُ لَا يُكَفِّرُ عَنْهُ إِلَّا القِصَاصُ».
لَكِنَّ الأَيَّامَ لَيْسَتْ كَمَا كَانَتْ، وَالقَاهِرَةُ ارْتَدَتْ ثَوْبًا لَا يَعْرِفُهُ، حَتَّى الأَصْدِقَاءُ تَبَدَّلُوا وَصَارُوا سَادَةً فِي قُصُورٍ لَا مَكَانَ فِيهَا لِلْفُقَرَاءِ المَنْسِيِّينَ.`
      }
    ]
  },
  {
    id: 'novel-memory-fragments',
    title: 'شظايا الذاكرة',
    author: 'حيدر حيدر',
    authorBio: 'روائي سوري من رواد السرد العربي المعاصر، امتازت كتاباته بالغنائية الجارحة والغوص الفلسفي.',
    category: 'رواية فكرية وتأملية',
    riwaqId: 'riwaq-al-riwayat',
    riwaqName: 'رواق الروايات',
    coverGradient: 'from-rose-950 via-stone-900 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA13qP9qH844nkhgkIlcxV3lc1Uf4Ht32kd0EiFf2vfSWoo6AzeFWVHq0oU3-1CKRrqdVv50bz_REg3u_guoHc2dfjdWyKXeSk8I6mRXBT15C2YNgfEKvpe4ZbG8N8sLUS1al6ZI8gxgm1prMU3ZD9u5lGfeXfZLZkmZY7Ymm8QxXUmKMZbROdn49AaJbT6NkXrm2F18E8XJ1fpa_oZR7q_5-FRPRe670-Ws06mguY9_LpbWW87Pk1vxw',
    accentColor: '#ffb2bd',
    rating: 4.88,
    ratingCount: 1940,
    views: '140K',
    badge: 'سرد تأملي',
    section: 'riwaq-al-riwayat',
    description: 'تأملات حزينة ومكثفة في المنفى والوطن واسترجاع الأزمنة الضائعة؛ مرآة تتشظى لتجمع شتات الروح الحائرة بين الهجرة والانتماء.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'الفصل الأول: رماد الأزمنة ورياح الشتاء',
        content: `فِي لَيَالِي المَنْفَى الشَّاتِيَةِ، يَبْدُو الوَقْتُ كَخَيْطٍ رَفِيعٍ يَكَادُ يَنْقَطِعُ تَحْتَ وَطْأَةِ الصَّمْتِ.
تَتَدَافَعُ الذِّكْرَيَاتُ مِثْلَ أَمْوَاجِ بَحْرٍ هَائِجٍ يَرْتَطِمُ بِصُخُورِ الشَّاطِئِ المَهْجُورِ.
كُلُّ وَجْهٍ غَابَ كَانَ يَتْرُكُ خَلْفَهُ شَظِيَّةً فِي جِدَارِ الرُّوحِ، وَكُلُّ مَدِينَةٍ عَبَرْنَاهَا أَخَذَتْ مِنَّا شَيْئًا وَلَمْ تُعِدْهُ أَبَدًا.`
      }
    ]
  },

  // 2. رواق الملاحم
  {
    id: 'novel-gilgamesh',
    title: 'جلجامش',
    author: 'ألواح بابل وسومر',
    authorBio: 'أقدم نص ملحمي عرفته البشرية، نُقش بالمسمارية على ألواح الطين في بلاد ما بين النهرين.',
    category: 'ملحمة الخلود الكبرى',
    riwaqId: 'riwaq-al-malahim',
    riwaqName: 'رواق الملاحم',
    coverGradient: 'from-amber-950 via-stone-900 to-indigo-950',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
    accentColor: '#e9c349',
    rating: 4.98,
    ratingCount: 6800,
    views: '450K',
    badge: 'تاج الملاحم',
    section: 'riwaq-al-malahim',
    description: 'رحلة ملك أوروك العظيم في البحث عن سر الخلود وفجيعته بفقدان صديقه إنكيدو؛ سفر الأسئلة الأزلية التي تواجه الإنسان أمام حتمية الفناء.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'اللوح الأول: هو الذي رأى كل شيء',
        content: `هُوَ الَّذِي رَأَى كُلَّ شَيْءٍ فَبَلَغَتْ بِهِ الحِكْمَةُ أَقَاصِي الأَرْضِ،
عَرَفَ الأَسْرَارَ، وَكَشَفَ المَكْنُونَ، وَجَاءَ بِأَنْبَاءِ مَا كَانَ قَبْلَ الطُّوفَانِ العَظِيمِ.
سَارَ فِي طَرِيقٍ بَعِيدٍ وَنَصَبَ وَتَعِبَ، ثُمَّ نَقَشَ عَلَى لَوْحٍ مِنَ الحَجَرِ جَمِيعَ مَتَاعِبِهِ.
بَنَى أَسْوَارَ أُورُوكَ المَنِيعَةَ، وَشَيَّدَ هَيْكَلَ إِيَانَّا المُقَدَّسَ،
انْظُرُوا إِلَى سُورِهَا كَيْفَ يَلْمَعُ كَالنُّحَاسِ، وَتَسَلَّقُوا دَرَجَاتِهِ الصَّلْدَةَ الَّتِي لَا يُدَانِيهَا بِنَاءٌ!`
      },
      {
        chapterIndex: 2,
        title: 'اللوح الثاني: لقاء إنكيدو وتحدي الوحش خومبابا',
        content: `تَقَابَلَ الجَبَّارَانِ عِنْدَ بَوَّابَةِ المَدِينَةِ، وَاصْطَدَمَا كَثَوْرَيْنِ هَائِجَيْنِ تَهْتَزُّ لِوَقْعِهِمَا جُدْرَانُ السَّاحَاتِ.
لَكِنَّ الصِّرَاعَ انْقَلَبَ إِلَى أُخُوَّةٍ لَمْ تَعْرِفِ الأَرْضُ لَهَا مَثِيلًا.
قَالَ جِلْجَامِشُ لِإِنْكِيدُو: «هَيَّا بِنَا إِلَى غَابَةِ الأَرْزِ، لِنَقْطَعَ أَشْجَارَهَا وَنَقْضِيَ عَلَى الشَّرِّ، فَيَظَلَّ اسْمُنَا خَالِدًا مَا بَقِيَ الزَّمَانُ».`
      }
    ]
  },
  {
    id: 'novel-iliad',
    title: 'الإلياذة',
    author: 'هوميروس',
    authorBio: 'شاعر الإغريق الأكبر، منشئ الملاحم البطولية التي أرست قواعد الشعر الأوروبي القديم.',
    category: 'ملحمة يونانية بطولية',
    riwaqId: 'riwaq-al-malahim',
    riwaqName: 'رواق الملاحم',
    coverGradient: 'from-amber-950 via-stone-900 to-indigo-950',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_eWH_vnKjkYnn6XabpS4W11Vahzp-NBfKHif24pATSicq5IuWuBouWSpSYIfVuKlktkscHojwVyWPpui1oH5R2rkaEhTjiylYVuEHFmDGGKDwAohOpzIzbqokdNcSTkE173lzKVwJoCrPCRmCTf16OChO13EyhGdY1wjgx7uos6zzpXxNxmGpcFTKTAnASnjMsoCFkkT_VxWzNlTkL_WJToJ8GwIoEjojPIVRL7Cx_4f6eLg22QsPLw',
    accentColor: '#ffe088',
    rating: 4.91,
    ratingCount: 4200,
    views: '290K',
    badge: 'أسطورة طروادة',
    section: 'riwaq-al-malahim',
    description: 'غضب آخيل وحصار طروادة وصراع الأبطال والآلهة فوق سهول الأناضول؛ النشيد الخالد للبطولة والشرف والتراجيديا الإنسانية.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'النشيد الأول: غضب آخيل بن بيليوس',
        content: `أَنْشِدِي يَا رَبَّةَ الشِّعْرِ غَضَبَ آخِيلَ بْنِ بِيليُوسَ،
ذَاكَ الغَضَبَ المَشْؤُومَ الَّذِي جَلَبَ عَلَى الآخِيِّينَ وَيْلَاتٍ لَا تُحْصَى،
وَأَهْبَطَ إِلَى مَمْلَكَةِ هَادِيسَ نُفُوسًا كَثِيرَةً مِنْ أَبْطَالٍ بَوَاسِلَ،
وَجَعَلَ أَجْسَادَهُمْ غَنِيمَةً لِلْكِلَابِ وَجَوَارِحِ الطَّيْرِ، حَتَّى تَمَّتْ مَشِيئَةُ زِيُوسَ العَظِيمِ!`
      }
    ]
  },
  {
    id: 'novel-shahnameh',
    title: 'الشاهنامة',
    author: 'أبو القاسم الفردوسي',
    authorBio: 'حكيم طوس وشاعر الفرس الأكبر الذي نظم مأثرة الملوك على مدى ثلاثين عاماً.',
    category: 'ملحمة الملوك والأبطال',
    riwaqId: 'riwaq-al-malahim',
    riwaqName: 'رواق الملاحم',
    coverGradient: 'from-amber-950 via-stone-900 to-indigo-950',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMcfQadJaQZBmK4_QLfMcHGTkIjH0eDnJZ4NhrJ5T44Ihr4Hetsgqyw9uU7SmGWwbV9hFdGzGKUmjIkel4RhGQu8-t4TSi_BYFClqNEuvpXhlsOfrunWEabsTy1aqozBcMF-D_RpreNJn28IGheRLN-XwsanBWuJlKtG9Ddk9v-wdWQFnH6q4ZH86rZYzRsWu7RGqKzbLljbCwD9m50kpHVvhlRoXEtVyFzgZpyvG2ajxIRncqQaCvDA',
    accentColor: '#e9c349',
    rating: 4.89,
    ratingCount: 3100,
    views: '210K',
    badge: 'ديوان الشرق',
    section: 'riwaq-al-malahim',
    description: 'أساطير رستم وسهراب، ملوك العدل والجور، وصراع النور والظلمة في ملحمة شرقية باذخة البنيان والبيان.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'الباب الأول: مطلع القصيد ونشأة الملك كيومرث',
        content: `بِاسْمِ إِلَهِ الرُّوحِ وَالعَقْلِ، الَّذِي لَا يَسْتَطِيعُ الفِكْرُ أَنْ يَسْمُوَ فَوْقَهُ،
رَبِّ الاسْمِ وَالمَكَانِ، وَوَاهِبِ الرِّزْقِ وَالأَمَانِ.
تَقُولُ الرِّوَايَةُ إِنَّ كَيُومَرْثَ كَانَ أَوَّلَ مَلِكٍ جَلَسَ عَلَى عَرْشِ الجِبَالِ،
فَأَلِفَتْهُ الوُحُوشُ وَأَطَاعَتْهُ الطُّيُورُ لِعَدْلِهِ وَصَفَاءِ سَرِيرَتِهِ.`
      }
    ]
  },

  // 3. رواق الحكمة
  {
    id: 'novel-descartes-meditations',
    title: 'تأملات ديكارت',
    author: 'رينيه ديكارت',
    authorBio: 'فيلسوف ورياضي فرنسي، أب الفلسفة الحديثة وصاحب مبدأ الكوجيتو الفلسفي الشهير.',
    category: 'فلسفة أولى ونظرية المعرفة',
    riwaqId: 'riwaq-al-hikma',
    riwaqName: 'رواق الحكمة',
    coverGradient: 'from-stone-900 via-stone-800 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlObAY1V0YiRJzi3hEpKouXv7LTGIVkWNmk5s6p68odrgmlGgbxvkELywFI2o2CstqmnYYtrz8xirRoit3YDJ5sNqht5Z26ni0P6_n59Mxr6CUtIxD7vhUdPpOvyo_1HJFZXURHb7ZbED86WD8bqFCfjkmQF90wStHv90oNgleQcF-5TjznXsx0u3hFRY37ntd7WWf7uNPb0gzem45dCzY8zcL7Aiso33xJuQGxeuXAIQoLjHkcBVJ1g',
    accentColor: '#e5e1e4',
    rating: 4.96,
    ratingCount: 3800,
    views: '260K',
    badge: 'نور العقل',
    section: 'riwaq-al-hikma',
    description: 'تأملات في الفلسفة الأولى تفكك قيود الشك المنهجي وتؤسس لليقين العقلي؛ رحلة فكرية خالصة في تجرد تام عن زيف الحواس.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'التأمل الأول: في الأشياء التي يمكن أن توضع موضع الشك',
        content: `لَقَدْ لَاحَظْتُ مُنْذُ سِنِينَ كَمْ كَانَ فِي صِبَايَ مِنْ آرَاءٍ بَاطِلَةٍ اعْتَبَرْتُهَا حَقَائِقَ ثَابِتَةً،
وَكَمْ هِيَ هَشَّةٌ تِلْكَ المَبَانِي الَّتِي أَقَمْتُهَا فَوْقَ تِلْكَ الأُسُسِ المَشْكُوكِ فِيهَا.
لِذَلِكَ رَأَيْتُ أَنَّهُ لَا بُدَّ لِي مَرَّةً فِي حَيَاتِي مِنْ هَدْمِ كُلِّ شَيْءٍ تَمَامًا، وَالبَدْءِ مِنْ جَدِيدٍ مِنْ أُسُسٍ بَدِيهِيَّةٍ لَا يَتَطَرَّقُ إِلَيْهَا الشَّكُّ.

سَأَفْتَرِضُ إِذَنْ أَنَّ كُلَّ مَا تُخْبِرُنِي بِهِ حَوَاسِّي قَدْ يَكُونُ خُدْعَةً،
حَتَّى أَصِلَ إِلَى صَخْرَةِ الحَقِيقَةِ الَّتِي لَا تَتَزَعْزَعُ: «أَنَا أُفَكِّرُ، إِذَنْ أَنَا مَوْجُودٌ».`
      }
    ]
  },
  {
    id: 'novel-republic',
    title: 'الجمهورية',
    author: 'أفلاطون',
    authorBio: 'فيلسوف أثينا الكلاسيكي، مؤسس الأكاديمية وصاحب المحاورات الفلسفية الخالدة.',
    category: 'فلسفة سياسية وأخلاقية',
    riwaqId: 'riwaq-al-hikma',
    riwaqName: 'رواق الحكمة',
    coverGradient: 'from-stone-900 via-stone-800 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlLmkgGjhWO5idqyTixzxUnWi0G5jOIryeYp0ShtqVRmnHfH0UcvCarS2j5V9XVEQa5C546m3-iBBEkh0crrCrMOpOHuJ6e68pqegLgpoj8aiCcVVoq0JxNzzydWaC7YZMyMFeLmgrqPi2NLnfSnXYvnjSADjPBG4QXOE_sf94qPQzu3h_u5bKbwePfNUWzQ5EeqZzcIyTcBU37BI82bJf0wBKBBt3O3FwsO0r2qQDKcfJgJWb63Sfew',
    accentColor: '#e5e1e4',
    rating: 4.94,
    ratingCount: 5100,
    views: '380K',
    badge: 'أسطورة الكهف',
    section: 'riwaq-al-hikma',
    description: 'محاورة سقراط حول ماهية العدالة وبناء المدينة الفاضلة، متضمنة تمثيل الكهف الشهير الذي يشرح تدرج الوعي الإنساني من ظلال الوهم إلى شمس الحقيقة.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'الكتاب السابع: مثل الكهف ومراتب المعرفة',
        content: `تَخَيَّلْ يَا غْلَاوْكُون بَشَرًا يَعِيشُونَ فِي كَهْفٍ تَحْتَ الأَرْضِ،
مُقَيَّدِينَ مُنْذُ طُفُولَتِهِمْ بِسَلَاسِلَ تَمْنَعُهُمْ مِنَ الِالْتِفَاتِ،
وَلَا يَرَوْنَ أَمَامَهُمْ إِلَّا جِدَارَ الكَهْفِ الصَّلْدَ،
وَخَلْفَهُمْ نَارٌ تُضِيءُ، يَمُرُّ أَمَامَهَا أَشْخَاصٌ يَحْمِلُونَ تَمَاثِيلَ، فَتَسْقُطُ ظِلَالُهَا عَلَى الجِدَارِ.

إِنَّ هَؤُلَاءِ المَسَاكِينَ لَا يَعْرِفُونَ مِنَ العَالَمِ إِلَّا تِلْكَ الظِّلَالَ، وَيَحْسَبُونَهَا هِيَ الحَقِيقَةَ المُطْلَقَةَ!
فَكَيْفَ إِذَا تَحَرَّرَ أَحَدُهُمْ وَصَعِدَ إِلَى النُّورِ وَعَايَنَ الشَّمْسَ بِعَيْنَيْهِ؟`
      }
    ]
  },
  {
    id: 'novel-tahafut',
    title: 'تهافت التهافت',
    author: 'ابن رشد الأندلسي',
    authorBio: 'فيلسوف قرطبة الأكبر وقاضي قضاتها، الشارح الأكبر لأرسطو ورائد التنوير العقلي الأندلسي.',
    category: 'فلسفة برهانية إسلامية',
    riwaqId: 'riwaq-al-hikma',
    riwaqName: 'رواق الحكمة',
    coverGradient: 'from-stone-900 via-stone-800 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAcE3jnOgqe_x8_a7ydOtHUxSCAcHW44Qt1D5bpKXnLlZniq_tITZZ_Um1myeyd5ARCP_3YRz1iF9ob_GzkUqaySLvszXMgmTdIxUEA-oKtXVWrkaHnXCgGE0nRkpKtl1723zCz5Ks577S0Ou_GWB-YfKyM8aHEO1YTPJgRiMK3LnhjZu1t2NNX8aPrkEa2QKuYj9z10lDoZBvnx9xx3TT-5vAbaq1ePL52DvtQYIZTuFlowWWcy6S1A',
    accentColor: '#e5e1e4',
    rating: 4.87,
    ratingCount: 2200,
    views: '160K',
    badge: 'برهان الأندلس',
    section: 'riwaq-al-hikma',
    description: 'رد ابن رشد الفلسفي الرصين على الغزالي دفاعاً عن السببية وحرية النظر البرهاني وانسجام الحكمة مع الشريعة.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'المسألة الأولى: في قدم العالم والعلية',
        content: `قَالَ أَبُو الوَلِيدِ مُحَمَّدُ بْنُ رُشْدٍ:
إِنَّ القَوْلَ بِإِبْطَالِ السَّبَبِيَّةِ هُوَ إِبْطَالٌ لِلْعَقْلِ نَفْسِهِ،
إِذْ لَا مَعْنَى لِلْمَعْرِفَةِ إِلَّا مَعْرِفَةُ الأَشْيَاءِ بِأَسْبَابِهَا وَعِلَلِهَا الفَاعِلَةِ.
وَالحِكْمَةُ هِيَ صَاحِبَةُ الشَّرِيعَةِ وَالأُخْتُ الرَّضِيعَةُ لَهَا، فَلَا يُمْكِنُ لِلْحَقِّ أَنْ يُضَادَّ الحَقَّ، بَلْ يُوَافِقُهُ وَيَشْهَدُ لَهُ.`
      }
    ]
  },

  // 4. رواق التراث
  {
    id: 'novel-kalila',
    title: 'كليلة ودمنة',
    author: 'عبد الله بن المقفع',
    authorBio: 'كاتب ومترجم عباسي فذ، صاغ أبلغ نصوص النثر العربي ورمزية الحكمة السياسية والأخلاقية.',
    category: 'أدب الحكمة والرمز التراثي',
    riwaqId: 'riwaq-al-turath',
    riwaqName: 'رواق التراث',
    coverGradient: 'from-emerald-950 via-stone-900 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqyh1dOPajX2YdU5w4Z7hiXckD2Fra20bSJe96dWVIspi0x76GplpKB730UrEU4yF1gI3IQ2B5-HAiVBBoCn_2m0b5d5JpSBIUbUVBhnMCcQ7R5COuA-GMTaoicjT1-BttPaMbi2DzlMpAEoaAHl2wvx7QwRAbyXtbDa1Snp_iF9n8HAc0fSKldrHXdykVDdPfOTzRIlXtJMjHNT80RoR7Mr2ZQ9M2q5cqUApmgNGhyj4W6AtOHeIomQ',
    accentColor: '#7bd8b1',
    rating: 4.97,
    ratingCount: 8400,
    views: '540K',
    badge: 'خزانة الأدب',
    section: 'riwaq-al-turath',
    description: 'تحفة ابن المقفع النثرية التي صاغ فيها أبلغ حكايات الحيوان الرمزية ليقدم دستوراً سياسياً وأخلاقياً يجمع بين المتعة وعمق الحكمة الإنسانية.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'باب الأسد والثور: منبع الفتنة ووسواس دمنة',
        content: `قَالَ دَبْشَلِيمُ المَلِكُ لِبَيْدَبَا الفَيْلَسُوفِ:
«اضْرِبْ لِي مَثَلَ المُتَحَابَّيْنِ يَقْطَعُ بَيْنَهُمَا الكَذُوبُ المُحْتَالُ حَتَّى يُحَوِّلَ صَفْوَهُمَا إِلَى عَدَاوَةٍ».

قَالَ الفَيْلَسُوفُ:
إِذَا ابْتُلِيَ المَلِكُ بِجَلِيسِ سُوءٍ كَانَ كَالسَّفِينَةِ فِي لُجَّةِ البَحْرِ، لَا تَنْجُو إِلَّا بِيَقَظَةِ رُبَّانِهَا.
وَكَانَ بِأَرْضِ دَسْتَاوَنْدَ تَاجِرٌ ذُو مَالٍ جَمٍّ، لَهُ ثَوْرٌ اسْمُهُ شَتْرَبَةُ، تَرَكَهُ فِي مَرْعًى خَصِيبٍ فَاسْتَوْحَشَ حَتَّى صَارَ قَرِيبًا مِنْ عَرِينِ الأَسَدِ، وَكَانَ لِلأَسَدِ جَلِيسَانِ مِنَ ابْنِ آوَى: كَلِيلَةُ وَدِمْنَةُ، وَكَانَ دِمْنَةُ شَدِيدَ الحِرْصِ طَامِحًا لِلرِّفْعَةِ بِالحِيلَةِ وَالدَّهَاءِ...`
      }
    ]
  },
  {
    id: 'novel-maqamat',
    title: 'المقامات',
    author: 'أبو محمد القاسم الحريري',
    authorBio: 'إمام الأدب واللغة في القرن الخامس الهجري، صاحب المقامات الخمسين الأشهر في ديوان الفصاحة العربية.',
    category: 'نثر فني وبلاغة أدبية رفيعة',
    riwaqId: 'riwaq-al-turath',
    riwaqName: 'رواق التراث',
    coverGradient: 'from-emerald-950 via-stone-900 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDca81_eT3CHu1VAvYjtwzdfmLJUnI4goojyyKzeTkTKZWKbwuT_knymHeEkn1UtuGpxCf7Reji21jpX3XY6CgwrIHb35_BsZLLmqdp2-iEQM9AC5-IwFGwLWxTBxF7_goVRwycp7ef1OgXlZ6_5iyS1VtFJOHd9lUpc5yWmdWWy7yBQXR5SGYgRAJVziWTUlVqzc2O8nfU91IoogKevPYPBcf1onpPCjBl3dHG53PhQav0BFcTVmlxQQ',
    accentColor: '#7bd8b1',
    rating: 4.93,
    ratingCount: 3900,
    views: '240K',
    badge: 'درر البلاغة',
    section: 'riwaq-al-turath',
    description: 'مغامرات أبي زيد السروجي ورواية الحارث بن همام؛ قمة الفصاحة العربية والمسجع البديع الذي يحفظ ذخائر المفردات وأسرار النحو والبيان.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'المقامة الصنعانية: حلية الأدب وفصاحة السروجي',
        content: `رَوَى الحَارِثُ بْنُ هَمَّامٍ قَالَ:
طَرَّحَتْنِي نَوَى الاغْتِرَابِ، إِلَى صَنْعَاءَ اليَمَنِ، فَدَخَلْتُهَا خَاوِيَ الوِفَاضِ، بَادِيَ الِانْفِضَاضِ،
لَا أَمْلِكُ سِوَى شُعَاعِ الأَمَلِ وَبُلْغَةِ الأَجَلِ.

فَبَيْنَمَا أَنَا فِي سَاحَةِ جَامِعِهَا الكَبِيرِ، إِذْ رَأَيْتُ شَيْخًا ذَا طِمْرَيْنِ رَثَّيْنِ، يَقِفُ بَيْنَ الجُمُوعِ كَالخَطِيبِ المِصْقَعِ،
يَنْثُرُ الدُّرَّ مِنْ فَمِهِ، وَيَسْحَرُ الأَلْبَابَ بِبَيَانِهِ، فَيَقُولُ:
«يَا قَوْمِ، إِنَّ الدُّنْيَا غَدَّارَةٌ خَتَّارَةٌ، تُعْطِي بِيَدٍ وَتَسْلِبُ بِأُخْرَى، فَلَا يَغُرَّنَّكُمُ السَّرَابُ عَنِ الشَّرَابِ!»`
      }
    ]
  },
  {
    id: 'novel-muqaddimah',
    title: 'المقدمة',
    author: 'عبد الرحمن بن خلدون',
    authorBio: 'مؤسس علم الاجتماع وفلسفة التاريخ، الوزير والقاضي والمؤرخ التونسي الأندلسي العبقري.',
    category: 'علم العمران البشري والتاريخ',
    riwaqId: 'riwaq-al-turath',
    riwaqName: 'رواق التراث',
    coverGradient: 'from-emerald-950 via-stone-900 to-black',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7mc_dt-XBW63CnuhHSQeHqmBFk3HFzLhWVq-tDgfEdc3TzilNmAnExo0y-SMN-A3fYlBOyTO2bVsZX88JMK1Gu0xG7YWWyzCf2-p1pJ4GMgAdJiUiVLyIKLotoXwxwsNiDHIqmCAq1abRU0gBAXTGTTU8ULcKsESrYILzUR2wv2rHPjSy7L8fE1Bbt04Eq5ZcMZkzluR6CYofwIcDQOEQ5105K-IvWLkdHt4iHrmTivWII2kvQi0MxA',
    accentColor: '#7bd8b1',
    rating: 4.99,
    ratingCount: 9600,
    views: '710K',
    badge: 'سفر العمران',
    section: 'riwaq-al-turath',
    description: 'كتاب العبر وديوان المبتدأ والخبر؛ العمل العبقري الذي صاغ لأول مرة في تاريخ الفكر الإنساني قوانين قيام الدول وسقوطها وأثر العصبية والعمران.',
    chapters: [
      {
        chapterIndex: 1,
        title: 'الفصل الأول: في طبيعة العمران البشري ووجوب الاجتماع',
        content: `اعْلَمْ أَنَّ الاجْتِمَاعَ الإِنْسَانِيَّ ضَرُورِيٌّ، وَيُعَبِّرُ الحُكَمَاءُ عَنْ هَذَا بِقَوْلِهِمْ: «الإِنْسَانُ مَدَنِيٌّ بِالطَّبْعِ».
ذَلِكَ أَنَّ القُدْرَةَ الوَاحِدَةَ مِنَ البَشَرِ قَاصِرَةٌ عَنْ تَحْصِيلِ حَاجَتِهَا مِنَ الغِذَاءِ وَالدِّفَاعِ دُونَ مُعَاوَنَةِ أَبْنَاءِ جِنْسِهَا.

وَإِذَا حَصَلَ هَذَا الِاجْتِمَاعُ لِلْبَشَرِ، كَانَ لَا بُدَّ لَهُمْ مِنْ وَازِعٍ يَدْفَعُ بَعْضَهُمْ عَنْ بَعْضٍ لِمَا فِي الطِّبَاعِ الحَيَوَانِيَّةِ مِنَ العُدْوَانِ،
وَذَلِكَ الوَازِعُ هُوَ المَلِكُ وَالسُّلْطَانُ، وَأَسَاسُهُ العَصَبِيَّةُ الَّتِي بِهَا تَكُونُ الحِمَايَةُ وَالمُدَافَعَةُ وَالمُطَالَبَةُ بِكُلِّ حَقٍّ.`
      }
    ]
  }
];
