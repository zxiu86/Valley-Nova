export interface RiwaqHeritageItem {
  id: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  description: string;
  quote?: string;
  badge?: string;
  shelfId: 'major' | 'poetry' | 'tales' | 'language';
  source?: string;
  copyDate?: string;
  binding?: string;
  pages?: string;
  script?: string;
}

export interface HeritageOracleItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  pages: string;
  script: string;
  coverImage: string;
}

export interface HeritageEraItem {
  number: string;
  century: string;
  title: string;
  desc: string;
  scholars: string;
  centers: string;
}

export interface StudiedManuscriptItem {
  rank: string;
  title: string;
  desc: string;
  readersCount: string;
  id: string;
}

// 1. المخطوطة المحورية المميزة (Spotlight Hero)
export const SPOTLIGHT_HERITAGE: RiwaqHeritageItem = {
  id: 'heritage-kalila-wa-dimna',
  title: 'كليلة ودمنة: نفائس الحكمة وسير الملوك والوحوش',
  author: 'عبد الله بن المقفع',
  category: 'أمهات الأدب',
  badge: 'تحقيق سلطاني معتمد',
  quote: '«إن هذا الكتاب جُعل مثلاً يتوارثه الحكماء وينتفع به ذوو الفطن؛ جمع بين الهزل والجد، وظاهره أدب وباطنه حكمة تأبى الاندثار.»',
  description: 'تحفة ابن المقفع النثرية البديعة المنقولة عن الفهلوية والهندية القديمة؛ درة الحكمة السياسية والأخلاقية المحاكة على ألسنة الطير والوحش، مزينة بالرسوم والمنمنمات التاريخية النادرة.',
  coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD76biGS_Ze16Rn1VK5nyCUzE01oOXd2R7uSjndIzXj1NRz6eb4qlowSli0d6707mjCrS43w1xyZ1LihbSPfHn2UBS53nNmwzIKBldXHaVOrVb663fdjdRjYEfssPhSYrdI9W5w9GQHxdbfvaLfWcg5P2gAItjx4McYVHIzbVPkcf83ZjFr91pWkMVjpk65kcQcCy7WX9ZlkMP-26HEFTPech0wuugV401sfPLS1MvgC67xkXi5ML2gJQ',
  shelfId: 'major',
  source: 'خزانة كوبريللي',
  copyDate: 'أوائل القرن السادس',
  binding: 'جلد مغربي محفور',
  pages: '٣١٢ ورقة محققة',
  script: 'النسخ الأندلسي المذهب'
};

// 2. مختارات الخزانة التراثية الكبرى (٦ أصول نفيسة)
export const MAJOR_HERITAGE_SELECTIONS: RiwaqHeritageItem[] = [
  {
    id: 'heritage-kitab-al-aghani',
    title: 'كتاب الأغاني',
    author: 'أبو الفرج الأصفهاني',
    category: 'أمهات الأدب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyFny-oR__gF412ZFo5H6O0W4GICVxMN5iONx-cvCAaq09unwp8HsUcaQ8BTSxB2bRx1q7QaJzzRuQy1GoKtEPGgnsr7BG3DCXkoCFLlnnER6Dvo491x9tukYTtoTvc338NrViIdyLMQvx_KqmBVA0PSVYzTYsnVce7O2Cn_IBaDFi_c4B6mCuH_B8zJ2nLmgC0ynutT3ic6N9ecNPMhUumY6csT8evNl5fZzLWQTHpL5G23ce5bq3lg',
    description: 'ديوان العرب الأكبر وموسوعة الحضارة الإسلامية في الأدب والغناء وأخبار الشعراء وأيام الجاهلية وصدر الإسلام وبني أمية والعباسيين.',
    shelfId: 'major',
    source: 'دار الكتب المصرية'
  },
  {
    id: 'heritage-maqamat-al-hariri',
    title: 'مقامات الحريري',
    author: 'القاسم بن علي الحريري',
    category: 'أمهات الأدب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKTn-SXFuBWPJtCjjuY76smhQUFi9kQDkmLGJ1v1HonZ-YnI5nOoQL-RKh7XaX3UGA1Cr1qwpaByDVRvds9swSyIEMhWtGRtGXLblI29OOPIZqRB2ZM125oIR6P17pTM7ZJZtuQbGB__wuTzS0mrLZrQKTS8itnsN7jGYeCyaR-fE6AhxKKv1gQzTgsRv-VqX51OYhPFIY7ZtOyLJJXg7SDAwkaMKybt5CVY3guME9JOhlztSqkObiOw',
    description: 'خمسون مقامة أدبية تسحر الألباب ببديع السجع وجزالة المفردات وغرائب اللغة ومغامرات أبي زيد السروجي الفذة.',
    shelfId: 'major',
    source: 'المكتبة الوطنية بباريس'
  },
  {
    id: 'heritage-muqaddimah-ibn-khaldun',
    title: 'مقدمة ابن خلدون',
    author: 'عبد الرحمن بن خلدون',
    category: 'التراجم والسير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGKUQaxaMTWBquRb10gMYSP89ymUO7l9oTOqnZh23sZsUxqgdspTtKDX5iJS2NMBZT0zBI_BYhv9bINB0WY9H0RuQpusJvwi7QRNEFmtaT0AjaTnNHzo2CL5CrvbodWo8HUDHIsYBN7WN2_y3DfNGZ3SIcogQpDHzs4dZNQ2J4j6-7oGbebwiYGFaPteWhi7d4TN2Tx0orbW0clyH-DP1rhMPoLlmH1mvZkMzAqK1qP3kDIApbBQRlFQ',
    description: 'الأثر الخالد المؤسس لعلم الاجتماع وفلسفة التاريخ وقوانين قيام الدول وسقوطها وأثر العصبية والعمران البشري.',
    shelfId: 'major',
    source: 'مكتبة الفاتح بإسطنبول'
  },
  {
    id: 'heritage-kitab-al-hayawan',
    title: 'كتاب الحيوان',
    author: 'أبو عثمان عمرو بن بحر الجاحظ',
    category: 'أمهات الأدب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3EIisHukFA83vuCd5lmJYsiFERPCxlsZCpnOQ1coKwIa0S9DCR1n733L4iVPjOYpKg2OLdFZ_9sNObHIK3-XhRQKYh7M8ZM6fKUPQ2K_pqwSRYrJ-RBDeQylty8DNYxqah14AI2_7c7RpNj7AZM0AskZfIAMoLkqd3KtEL-Q47zWr3A-W9FxTbsjfjvz96iIR8mO4ywsaimCp71r8b6069RCiWSJZeNiKSUXGMmaOjYhOiUPBle1Fdg',
    description: 'أول كتاب جامع في علم الحيوان والأدب الطبيعي والفلسفي، حافل بالحجاج والبلاغة وعجائب الطبائع وأسرار الكون.',
    shelfId: 'major',
    source: 'معهد المخطوطات العربية'
  },
  {
    id: 'heritage-al-iqd-al-farid',
    title: 'العقد الفريد',
    author: 'ابن عبد ربه الأندلسي',
    category: 'نفائس المخطوطات الأندلسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHSQE0UtwcB5EcQdNTPYAKCJjE6aqkGtIU62YjQARjVvKhsMzmSUpNI2hrfNcUWJX--aCSoI1iFxeBQdB1GXLF9kWaeIWDrWywgScYDvKy54KgZm8ulwADM2NA1rMWm5EK2DxTQaXqrO-l28lgylIWNpnCDRw6rw5vFE96S4UnfHCDDh8kLCydw8cUVCvuIYwmyXFlSYjz3fv7zWanq0kw74TK_l-SzXyOC840y6JLLaifg2CCKilMVQ',
    description: 'موسوعة قرطبة الكبرى التي نظمت عيون الأدب والتاريخ في قلائد وعقود سميت بأسماء الجواهر النفيسة كالياقوتة والزبرجدة.',
    shelfId: 'major',
    source: 'خزانة الأسكوريال'
  },
  {
    id: 'heritage-tawq-al-hamama',
    title: 'طوق الحمامة',
    author: 'ابن حزم الأندلسي',
    category: 'نفائس المخطوطات الأندلسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYIstAn2OGosWQ7_GHrq9SiRagcaGVX8qxSHCYyT3_Xc_hk50oqbeuOskDhGo3qs7WQ4OwSIAxNbxGLiQuli4Bxvr2aSM7wU0VmxgzZkiwyzcFWcWJd0xt3LWfYuVo3dS4ZSLavAvV6RAJgGiamU6oxHdMHjwyDCprKv-yydxDg1InZG15PyYNNdm7Ib8gTQpGkmU0-UyYjo0-rV7MqtjCm8sbvCUI0faurLSWUw5NvzE-DazdtfMo1Q',
    description: 'أرق رسالة أندلسية في فلسفة الألفة وعلامات المحبين وأسباب الوصال والفراق بدقة نفسية وشعرية استثنائية.',
    shelfId: 'major',
    source: 'مكتبة جامعة ليدن'
  }
];

// 3. خزانة «ديوان العرب وعيون الشعر الكلاسيكي» (٦ كتب)
export const HERITAGE_POETRY_VAULT: RiwaqHeritageItem[] = [
  {
    id: 'heritage-diwan-al-mutanabbi',
    title: 'ديوان المتنبي',
    author: 'أبو الطيب المتنبي (بشرح الواحدي)',
    category: 'دواوين العرب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOBnPldTJRuDhyBEnDxsEB2RntZIsdBR66JO66KxhMjBa4uBzor4ypFB85GHMmqfVCjCIEWrObKFAAn0-hGAkUOjBJQoCjApFXGZsmhYxZJQjbGF4BMcC9saYr4ySncMl0lbAxB7VafnhZfPx5PoHQlsLikSc7ozuQGYk--qWVpXivw8ujaMEXgvXRYwiuh7KLAhtnHru51NZ2Ig9hJA8DNoqVOGHXTko702Va_v1uTKYP1O3U8xBLAw',
    description: 'شعر مالك صهوة القوافي وشاغل الناس وسيف الدولة، مفسراً بأدق الشروح اللغوية والنقدية للواحدي النيسابوري.',
    shelfId: 'poetry'
  },
  {
    id: 'heritage-al-muallaqat-al-sab',
    title: 'المعلقات السبع',
    author: 'شعراء الجاهلية (بشرح الزوزني)',
    category: 'دواوين العرب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbtP7dJNWpGA3iG-5agWBV_NzKsCcPPcfGLMEmpvYWrM2GPYpV4srmE7e_JDGm4xrkkgeZG89ZFcEb83Ntcce0GmLizpNoSwPusY4j0OOVebfSyi8uAh8k9jhachCWkTyWSXGb7MbASXxIIhYD2JBrPOx5SUyqOgkNMbOCC_rkEzahnGKdmslRTMFKK6parcaVW9WlaqC01HgSfU1DTLHj4NvYeZJvYwS7fVQwORcdY4amhQIxC1nReA',
    description: 'المذهبات الخالدات التي عُلقت على أستار الكعبة إعجاباً بفصاحتها، تمثل قمة البيان الشعري الجاهلي ومفردات الفصحى.',
    shelfId: 'poetry'
  },
  {
    id: 'heritage-al-luzumiyyat',
    title: 'اللزوميات',
    author: 'أبو العلاء المعري',
    category: 'دواوين العرب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNx_2fiIe_J64paFYadezBgBn4j4QnWgVupJ6AX1AYB28pWRqEOHioiJwGUZwyl3R6GB61Xhx6D1WrpOF4sC_h6FXWFkneL1_jY3J-C7cKB44bkOn9fqphKHOGH19rcXSotkbp95qwSCRorHL6G8_1EX0wt81ufJL6Pwhshp0qeMe0iqDh07FKAUusAMJQBcsy9-9a3l4tKcUe84d7Pa1zYkYe-BH2hHKJszrRCehvi1yFBWVJso4dwg',
    description: 'لزوم ما لا يلزم؛ صرخة رهين المحبسين الفلسفية والتأملية الصارمة في نقد أوهام البشر والانتصار للعدل والعقل.',
    shelfId: 'poetry'
  },
  {
    id: 'heritage-diwan-imru-al-qais',
    title: 'ديوان امرئ القيس',
    author: 'الملك الضليل امرؤ القيس الكندي',
    category: 'دواوين العرب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpDUwzF_MQgHr8RJbfKaCp9L-1acwLL_t4lmKk8rS1gagOSsSLp8pycSnIjTqCILvB_Q9RI8nzK7KHlU-T59n7qaSDsaJMBOhL_HQ40obOYxi1HhqaywVDj3yqoz47PrmfaLa58ZyMA8fIXp9nAsBXb6VZmoTCBwpLuFnSLKRIwYkH66i5e3fymRJwP9gqsGqm74wPQux9f4DiUkud6uESALTcJLihwCk-Q5LEhJGOMNWqVSFYXjHyYw',
    description: 'ديوان رأس شعراء العرب وأول من وقف واستوقف وبكى واستبكى، قمة التصوير البدوي وموسيقى القصيد الجاهلي.',
    shelfId: 'poetry'
  },
  {
    id: 'heritage-diwan-al-buhturi',
    title: 'ديوان البحتري',
    author: 'الوليد بن عبيد البحتري',
    category: 'دواوين العرب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7h9Oy6z-IYuaoLQmTxp4F7x4b8pqCrBJG_YyPvuKCypB8oxy5Jdn2x3F2A4WmoTxOpA4OPK--3RfZzQjOJGUhGIU-0CcdLPfSEmPlUtuTKJ_frqFLxBhp6_qKbU1R5jpRuRBjzaJj_zwZJ3Sn1EQbqA4oExwIsDOh2POySInc47CRyYwsNENe-yU8HYqd34YYFrGGVA8he8D89YECYmdfAuMghtsu0lQxmh4Tt36VJSYq-YI0DEFLzA',
    description: 'أمير الديباجة الشعرية الرقيقة وواصف إيوان كسرى والقصور العباسية بسلاسة لفظ كأنه الماء الزلال.',
    shelfId: 'poetry'
  },
  {
    id: 'heritage-al-hamasa',
    title: 'الحماسة',
    author: 'أبو تمام حبيب بن أوس الطائي',
    category: 'دواوين العرب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH5gnJqYUgvR6alVFv9qmPW0zwLKVt7-sZiAVTiDM8NC1-MuBnGqr-1BPb41afWAthtigVov083SC1tLra2lsVHHAAz0mB2XwvloYpkRKqgm6h9mIpfl0rqVXDfScCaBbBgsbL6NvdigNRZQaCRvI3ZXW0AClZEpu00ASxvEa-EMfTdWDtU0k62l0eufrKmuhlK6ifd7O9yOogvqXg9SGay-uJfyntoc9Z1z8zSSs9Vm2Is2ayIJTC5A',
    description: 'أعظم مختارات شعرية عربية في الفخر والبسالة والمراثي، قيل فيها: "اختيار أبي تمام في حماسته خير من شعره".',
    shelfId: 'poetry'
  }
];

// 4. خزانة «نوادر الحكايات وأدب المجالس والسير» (٥ كتب)
export const HERITAGE_TALES_VAULT: RiwaqHeritageItem[] = [
  {
    id: 'heritage-alf-layla-wa-layla',
    title: 'ألف ليلة وليلة',
    author: 'سرديات المشرق القديم (طبعة بولاق)',
    category: 'أمهات الأدب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtiPGKCk_nkj88Qq7yEJfIVWtFuGbQuQ59VlkbU4lf6peWmHoTT0VbGOPNkLTHSMGPMQ6ScVwoeiJF8Fa1m3oMW5sPuayrTPOLOkdIgUN9vogQ3nJQxtUuJzyxxKrOm0brezE6LpIcwRNwW7evNh1CdFL0AkW6XeHL1l58E5DjRugL_i7DrnJTKCzV-eOlCEjagxIm3W3FCuiXFl0pSLHu6QWmRSEZUsbt7d0UfHA6TThmtVLQOu6MfQ',
    description: 'أعظم ملحمة خيالية وسردية أنجبتها المدن الشرقية بين بغداد والقاهرة ودمشق، صوت شهرزاد الذي روض جبروت شهريار بالحكايا.',
    shelfId: 'tales'
  },
  {
    id: 'heritage-kitab-al-bukhala',
    title: 'بخلاء الجاحظ',
    author: 'أبو عثمان عمرو بن بحر الجاحظ',
    category: 'أمهات الأدب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJQwfWM6gCiBfSWpeqr2OVBNmAYKUjnt6KLJdTe7kMSHLisen8ENEFvBNSO1H_gpm5ZTeOu5cGbLbyTjc1wxkHTNSHHiPvP5bPQjoYJhd5CbbKkz64FTYzFunve4t6x7bsCqOV2vwjTDlbSYyZCgV_jW71XW0RYtf1hnBXcPehsI64l1SZOCNHyTZCirTWummq37FzZJeOJaCB1N6HSe_qsoYAS9SRDPPCRFiQTgk7RYziq_CNGmTU7g',
    description: 'درة السخرية الذكية والتشريح النفسي والاجتماعي، يعرض طرائف البخلاء وحججهم العقلية في خفة ظل وبلاغة لا نظير لها.',
    shelfId: 'tales'
  },
  {
    id: 'heritage-muruj-al-dhahab',
    title: 'مروج الذهب',
    author: 'أبو الحسن علي بن الحسين المسعودي',
    category: 'كتب الرحلات والمشاهدات',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ8Xx0v7dg-elwqyAiGGMQhbB3OtGyEPXyBZXJN-D4j8Xe8J2Goe809pxkWQzRXi58989fGJ70iCM_kBq2mlYuUwgPWZNrq-ijaassF5Gsi1_vfAn4OvCc1vvkS998-0h13xtMP3iodCxSRX_ia9CbixchCFKyuttSemS1nk9wa8AOXz61MBla71NGC0GEKIQWCTVgp7v_Wgl33YFkY7ymrf5ksF45Pz54C6oWoafms70WKCeX41PW3Q',
    description: 'مروج الذهب ومعادن الجوهر؛ طواف جغرافي وتاريخي مذهل يجمع بين أخبار الأمم والبحار وغرائب الشعوب والتقاليد.',
    shelfId: 'tales'
  },
  {
    id: 'heritage-badai-al-zuhur',
    title: 'بدائع الزهور',
    author: 'ابن إياس الحنفي',
    category: 'التراجم والسير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDs-fJYv7hvgX79xAxI-LkBUTqkgT4mj0BC9PMCTBJB_tBlqvPGjG5ve3YjeQTHJ4l1ZHdi8vQC9RfZTiFCNwFbFRpqscaggBumaP7-d4sSiGhvF9nTz-kmgDckkHuHI0ash6V4zNwYCseRX0ztR7z4pHenIiXkXqkcg5XH-KxSWVExxbh6xWQWgTR6gN_At11Ynqpqb24NrvszX3Ne_MJTNX_r26I5LQEZbpL0yUC7bH6zYV5s7HCcsQ',
    description: 'بدائع الزهور في وقائع الدهور؛ يوميات مصر المملوكية ومطلع العهد العثماني بتفاصيل الحياة الشعبية والمعارك والغرائب.',
    shelfId: 'tales'
  },
  {
    id: 'heritage-wafayat-al-ayan',
    title: 'وفيات الأعيان',
    author: 'ابن خلكان الإربلي',
    category: 'التراجم والسير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDz-YZ1j2IFT6rScae-Ps5GvC4YgCAlZQPTtDjyjzrdNTl7y41vwrXpcUoi9HUHBvjwRukX5V87B_wmtMXNezWVYEcltFfniVDG1gn6Hpg72H0WRqGBZbFLS2g-MX9n42EEvNoxd3JGO6o94OKzx8MYKlAcE3WFUQAxPj_xuT1UDmmTt7KUcvL28KFVCE6jjsVI4pbIpMxpds5a7ofQu-3Xvkv7ExUUED7AcgCi7RrDc7Yd5K0D6mwOnA',
    description: 'وفيات الأعيان وأنباء أبناء الزمان؛ أجمع كتاب في تراجم علماء وفقهاء ووزراء وشعراء المسلمين بأسلوب أدبي رصين وممتع.',
    shelfId: 'tales'
  }
];

// 5. خزانة «أصول اللغة وعلوم البيان والمعاجم» (٥ كتب)
export const HERITAGE_LANGUAGE_VAULT: RiwaqHeritageItem[] = [
  {
    id: 'heritage-lisan-al-arab',
    title: 'لسان العرب',
    author: 'ابن منظور الإفريقي المصري',
    category: 'اللغة والمعاجم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWhv7BcKjYWUOs_Bb8QrySKHtQ79W9O5aK-NEKwvjeRI3SyAZGGC3jZEh8In-c9xyzIIiTkrTVQIKGPE4itDsvGkyiEUepguqqcjF9PVd7YXYkD6xlaiJ4iKgm6PbFxgw_5QFbIp_z_JUedtrNYVTMg2vbELT4fn7dZmycSmTelfyJeC88VfZY52sRg5MFfn1_8zSJMVqQU9kwIn5xQkXATyYu7PWRSjpC53wgsYTscGzzvJ3ryHkLrA',
    description: 'تاج معاجم الضاد وأشملها، استوعب ثمانين ألف مادة لغوية مؤيدة بآلاف شواهد القرآن والحديث وشعر العرب.',
    shelfId: 'language'
  },
  {
    id: 'heritage-kitab-sibawayh',
    title: 'كتاب سيبويه',
    author: 'عمرو بن عثمان بن قنبر (سيبويه)',
    category: 'اللغة والمعاجم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNlbFy1vei2KKW8xR2UwL0sqjX08WIIUn5KbRPI1SX6A6L1rC9XeYakQh9OfOaZQGyCX33sniwnkRzguzKT_21771RdhYkXVbrpK2c6baQf0YObVsSxcz3x6Wk3WA931WsuQjHqKOhiha6224RXaO__M4rLUqfItxBOFoMSSKW1FqBsZ2IL6mLMy6vdKFyacVMtZw35BDizLqJKR4XmoceCO-uBgfCmtXiPH43Myo7_n37zjfZQBz3Jw',
    description: 'قرآن النحو وإمام كتب الصنعة اللسانية، أسس لقواعد الإعراب وفلسفة التراكيب بإحكام عقلي لا يزال معياراً حتى اليوم.',
    shelfId: 'language'
  },
  {
    id: 'heritage-asrar-al-balaghah',
    title: 'أسرار البلاغة',
    author: 'عبد القاهر الجرجاني',
    category: 'اللغة والمعاجم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSLYdn1Ky2U3ZsEUcTBhRrLSMZcCXQuv4_dydXB233giJ30zOsB4sUZnQUd-H-2XcK7AWriUexeRSO5EAsJGkun62s1OaIjj0jDeLHjckd9HVQyy9EL5197rCSxoVCU2_ZM_5QVjPxgMLRQlG96Hmqa8iXIMm0EfPmgpIE_zL1Y-ZLm0RIKm2bGpUzgRIGBAgmV7An3rXATmxTOcefkd6RJFM5CMuwQFSuOKiLibyi7TEfbVVljKa6FA',
    description: 'كشف عبقرية البيان العربي ونظرية النظم، مبيناً الفروق الدقيقة في دلالات المجاز والتشبيه والاستعارة والتمثيل.',
    shelfId: 'language'
  },
  {
    id: 'heritage-yatimat-al-dahr',
    title: 'يتيمة الدهر',
    author: 'أبو منصور عبد الملك الثعالبي',
    category: 'اللغة والمعاجم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPz7r1_-YL4JJRomZLUnh4sG7sKZDnuE0H55h5MeGFtgCpdLC3sQ9uQ6Cic4GSh-NZY5Sq1ef8G7Z169g9AFrCaXnIeMZDSaKvkzzzJjitc2h3Dtk1YkeZgTOY3Ur82BpWjxBKOQUKWSptkQZ83Yx3paz5kT4iH1Z16pnJSWMzobWYHHrTvQEP7p1lXDZyWaVUWwuVXVdNL-Gc6Tr8NXAJZpxfqcXkqwbtNq2Xc2p6xxpMVxqBYvx7KQ',
    description: 'يتيمة الدهر في محاسن أهل العصر؛ بانوراما العصر العباسي الرابع ونفائس شعر الشام والعراق ومصر وفارس والأندلس.',
    shelfId: 'language'
  },
  {
    id: 'heritage-adab-al-katib',
    title: 'أدب الكاتب',
    author: 'أبو محمد عبد الله بن مسلم بن قتيبة',
    category: 'اللغة والمعاجم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWEiWnIrIcbcOXjohDOLjh1Uf20DnOJM9aJXTXv9So5-L22lhD8v9Geyv7tH6BTC2Ug8aS6nyZc5v_TkAjSAaTQ7HFuybLTgg4co0hAvTzEJ41W49y0g_5VMq3zIXmtg96c079BhfsdeUKz3bHYjrNlwas5mPb1TuhJ9nmhd7NwSuGSs18HfPF3Af_-4reQUtVE3wHucOphGlOzW1Gk6bHGlN6hOJ6CvyejIzWEg5H69ZtMu9IFqKslQ',
    description: 'دستور الكاتب البليغ وموسوعة تصحيح الألسنة وتقويم العبارة ومعرفة دقائق الألفاظ والأبنية والمترادفات.',
    shelfId: 'language'
  }
];

// Master list of all heritage books
export const ALL_HERITAGE_BOOKS: RiwaqHeritageItem[] = [
  SPOTLIGHT_HERITAGE,
  ...MAJOR_HERITAGE_SELECTIONS,
  ...HERITAGE_POETRY_VAULT,
  ...HERITAGE_TALES_VAULT,
  ...HERITAGE_LANGUAGE_VAULT
];

// عصور التدوين وسجلات المخطوطات (٣ عصور)
export const HERITAGE_ERAS: HeritageEraItem[] = [
  {
    number: '٠١',
    century: 'القرن ١ - ٣ هـ',
    title: 'عصر الرواية والتدوين الأول',
    desc: 'بداية تقييد لغة البادية، وجمع الدواوين الأولى، وتدوين أحكام النحو ومغازي السيرة على الرق والبردي.',
    scholars: 'الخليل بن أحمد، سيبويه، ابن إسحاق',
    centers: 'البصرة، الكوفة، المدينة المنورة'
  },
  {
    number: '٠٢',
    century: 'القرن ٤ - ٧ هـ',
    title: 'عصر الازدهار الموسوعي والمدونات',
    desc: 'العصر الذهبي للمكتبات الكبرى، ظهور الموسوعات الأدبية والتاريخية الضخمة، وازدهار النساخة في بغداد وقرطبة.',
    scholars: 'الأصفهاني، التوحيدي، ابن حزم، الثعالبي',
    centers: 'بغداد، قرطبة، القاهرة، حلب'
  },
  {
    number: '٠٣',
    century: 'القرن ٨ - ١١ هـ',
    title: 'عصر الترتيب والموسوعات المتأخرة',
    desc: 'جمع شتات العلوم وحفظ التراث في مصنفات ضخمة، ضبط المعاجم الكبرى وتدوين شروح الشروح التاريخية.',
    scholars: 'ابن منظور، ابن خلدون، القلقشندي',
    centers: 'القاهرة المملوكية، دمشق، فاس'
  }
];

// Interactive Manuscript Oracle Discovery (خزينة النفائس)
export const HERITAGE_ORACLES: HeritageOracleItem[] = [
  {
    id: 'oracle-risalat-al-ghufran',
    tag: 'رسالة نادرة في البلاغة — رقم ٤١٩',
    title: 'رسالة الغفران — أبو العلاء المعري',
    desc: 'رحلة أدبية فلسفية تخيلية إلى العالم الآخر، كتبها المعري رداً على رسالة ابن القارح الحلبي، وتمثل ذروة البيان السردي والفلسفي في تراث القرن الخامس الهجري.',
    pages: 'المخطوط: ١٨٦ ورقة',
    script: 'الخط: النسخ الحلبي العتيق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGIP6qL17YIhKeCJ1UDDuRBl6c1RSoXt1lOl0CzZtQKWnQttwwac9Ewr4r1g-byqdWT1hoxM5Vv4zuW-16Q6-MsFf6AAaR7nRxn7xO2pGnIbfArIcM8hpGM2MPHu-ZbN6C7WJ807ERzyX4K1CRjPqWRcjrIrPmXG1BHvYRiRfMCXYFErTS3uoWOgRdVbF6WC_6uewq9alVI_7MXhd7sKrShlznoh-MaaXrlWeGqqF8jmfKBxFxzKLfbA'
  },
  {
    id: 'oracle-tuhfat-al-nuzzar',
    tag: 'نوادر الرحلات الأندلسية والمغربية — رقم ١٨٨',
    title: 'تحفة النظار في غرائب الأمصار — ابن بطوطة',
    desc: 'سجل أسطوري لرحلة استمرت ثلاثة عقود طاف فيها ابن بطوطة أقطار العالم المعمور، موثقاً تفاصيل حضارات الشرق الأوسط وآسيا وأفريقيا في أسلوب سردي بهيج.',
    pages: 'المخطوط: ٣٢٠ ورقة',
    script: 'الخط: المغربي المبسوط',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ8Xx0v7dg-elwqyAiGGMQhbB3OtGyEPXyBZXJN-D4j8Xe8J2Goe809pxkWQzRXi58989fGJ70iCM_kBq2mlYuUwgPWZNrq-ijaassF5Gsi1_vfAn4OvCc1vvkS998-0h13xtMP3iodCxSRX_ia9CbixchCFKyuttSemS1nk9wa8AOXz61MBla71NGC0GEKIQWCTVgp7v_Wgl33YFkY7ymrf5ksF45Pz54C6oWoafms70WKCeX41PW3Q'
  },
  {
    id: 'oracle-al-khasa-is',
    tag: 'أصول النحو وفقه اللغة — رقم ٩٠٢',
    title: 'الخصائص — أبو الفتح عثمان بن جني',
    desc: 'أجلّ كتاب صُنّف في فقه اللغة العربية وفلسفتها وتصريفها، يثبت فيه ابن جني عبقرية اللسان العربي وقدرته الاشتقاقية اللامحدودة بمناظرات لغوية باهرة.',
    pages: 'المخطوط: ٢٤٥ ورقة',
    script: 'الخط: الكوفي الأندلسي المورّق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNlbFy1vei2KKW8xR2UwL0sqjX08WIIUn5KbRPI1SX6A6L1rC9XeYakQh9OfOaZQGyCX33sniwnkRzguzKT_21771RdhYkXVbrpK2c6baQf0YObVsSxcz3x6Wk3WA931WsuQjHqKOhiha6224RXaO__M4rLUqfItxBOFoMSSKW1FqBsZ2IL6mLMy6vdKFyacVMtZw35BDizLqJKR4XmoceCO-uBgfCmtXiPH43Myo7_n37zjfZQBz3Jw'
  },
  {
    id: 'oracle-al-imtaa-wal-muanasa',
    tag: 'السير والمجالس الفلسفية — رقم ٣١٥',
    title: 'الإمتاع والمؤانسة — أبو حيان التوحيدي',
    desc: 'ثمرات أربعين ليلة قضاها التوحيدي مسامراً الوزير أبا عبد الله العارض، محاورة في الفلسفة وعلم النفس والنوادر وطبائع الملوك وأسرار الكلام.',
    pages: 'المخطوط: ٢١٠ ورقات',
    script: 'الخط: النسخي البغدادي المتقن',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3EIisHukFA83vuCd5lmJYsiFERPCxlsZCpnOQ1coKwIa0S9DCR1n733L4iVPjOYpKg2OLdFZ_9sNObHIK3-XhRQKYh7M8ZM6fKUPQ2K_pqwSRYrJ-RBDeQylty8DNYxqah14AI2_7c7RpNj7AZM0AskZfIAMoLkqd3KtEL-Q47zWr3A-W9FxTbsjfjvz96iIR8mO4ywsaimCp71r8b6069RCiWSJZeNiKSUXGMmaOjYhOiUPBle1Fdg'
  }
];

// 5. المخطوطات الأكثر مدارسةً واستقراءً (١ إلى ٥)
export const MOST_STUDIED_MANUSCRIPTS: StudiedManuscriptItem[] = [
  {
    rank: '١',
    title: 'مقدمة ابن خلدون',
    desc: 'علم العمران البشري والاجتماع الإنساني',
    readersCount: '١٤٢ دارساً',
    id: 'heritage-muqaddimah-ibn-khaldun'
  },
  {
    rank: '٢',
    title: 'لسان العرب — ابن منظور',
    desc: 'أكبر معاجم فقه اللغة واستشهادات الأشعار',
    readersCount: '١١٨ دارساً',
    id: 'heritage-lisan-al-arab'
  },
  {
    rank: '٣',
    title: 'ديوان المتنبي بشرح الواحدي',
    desc: 'عيون الحكمة والبيان في عصر سيف الدولة',
    readersCount: '٩٦ دارساً',
    id: 'heritage-diwan-al-mutanabbi'
  },
  {
    rank: '٤',
    title: 'كتاب الأغاني — الأصفهاني',
    desc: 'تاريخ الأدب والغناء وأخبار العرب وأيامهم',
    readersCount: '٨٤ دارساً',
    id: 'heritage-kitab-al-aghani'
  },
  {
    rank: '٥',
    title: 'دلائل الإعجاز — عبد القاهر الجرجاني',
    desc: 'نظرية النظم وفلسفة البيان القرآني والأدبي',
    readersCount: '٧٢ دارساً',
    id: 'heritage-asrar-al-balaghah'
  }
];

// أروقة التبويب (Filter Pills)
export const HERITAGE_CATEGORY_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'أمهات الأدب', label: 'أمهات الأدب' },
  { id: 'دواوين العرب', label: 'دواوين العرب' },
  { id: 'التراجم والسير', label: 'التراجم والسير' },
  { id: 'اللغة والمعاجم', label: 'اللغة والمعاجم' },
  { id: 'نفائس المخطوطات الأندلسية', label: 'نفائس المخطوطات الأندلسية' },
  { id: 'كتب الرحلات والمشاهدات', label: 'كتب الرحلات والمشاهدات' }
];
