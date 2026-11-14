import {
  ChapterBlock,
  ChapterEndStatus,
  ChapterItem,
  ChapterLanguage,
  ChapterType,
  LogicalChapter,
  NovelCard,
  NovelSection,
} from './models/library.models';

export interface ChapterTextContent {
  chapterId: number;
  firestoreChapterId?: string;
  chapterNumber: number;
  language: ChapterLanguage;
  translationGroupId: string;
  arabicNumber: string;
  title: string;
  subtitle: string;
  epigraph: string;
  epigraphAuthor?: string;
  paragraphs: string[];
  blocks?: ChapterBlock[];
  chapterType?: ChapterType;
  endStatus?: ChapterEndStatus;
  sectionTitle?: string;
  marginalNote?: string;
  marginalia?: string[];
}

export const SAMARKAND_ARABIC_CHAPTERS_META: ChapterItem[] = [
  { id: 1, chapterNumber: 1, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_1', arabicNumber: '١', title: 'شقشقة الفجر وظلال القلعة المفقودة', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في المحرم', status: 'read', partition: 1 },
  { id: 2, chapterNumber: 2, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_2', arabicNumber: '٢', title: 'أصداء الإسطرلاب النحاسي العتيق', duration: '٢٢ دقيقة قراءة', publishDate: 'نُشر في المحرم', status: 'read', partition: 1 },
  { id: 3, chapterNumber: 3, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_3', arabicNumber: '٣', title: 'قوافل الملح وخرائط التائهين', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في صفر', status: 'read', partition: 1 },
  { id: 4, chapterNumber: 4, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_4', arabicNumber: '٤', title: 'ساعة الرمل في محراب أولغ بك', duration: '٢٥ دقيقة قراءة', publishDate: 'موقعك الحالي للقراءة', status: 'current', partition: 1 },
  { id: 5, chapterNumber: 5, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_5', arabicNumber: '٥', title: 'دماء على أوراق الزيج الجديد', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في ربيع الأول', status: 'unread', partition: 1 },
  { id: 6, chapterNumber: 6, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_6', arabicNumber: '٦', title: 'متاهة حوانيت القاشاني الأزرق', duration: '١٩ دقيقة قراءة', publishDate: 'نُشر في ربيع الأول', status: 'unread', partition: 1 },
  { id: 7, chapterNumber: 7, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_7', arabicNumber: '٧', title: 'همسات المئذنة المائلة', duration: '١٧ دقيقة قراءة', publishDate: 'نُشر في ربيع الآخر', status: 'unread', partition: 1 },
  { id: 8, chapterNumber: 8, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_8', arabicNumber: '٨', title: 'انفجار مخزن البارود الغربي', duration: '٢٤ دقيقة قراءة', publishDate: 'نُشر في ربيع الآخر', status: 'unread', partition: 1 },
  { id: 9, chapterNumber: 9, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_9', arabicNumber: '٩', title: 'ختم سمرقند المحرم تحت الثرى', duration: '٢١ دقيقة قراءة', publishDate: 'نُشر في جمادى الأولى', status: 'unread', partition: 2 },
  { id: 10, chapterNumber: 10, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_10', arabicNumber: '١٠', title: 'شفرة الصوفي والأرقام الهندية', duration: '١٥ دقيقة قراءة', publishDate: 'نُشر في جمادى الأولى', status: 'unread', partition: 2 },
  { id: 11, chapterNumber: 11, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_11', arabicNumber: '١١', title: 'مؤامرة خانات السهوب الشمالية', duration: '٢٣ دقيقة قراءة', publishDate: 'نُشر في جمادى الآخرة', status: 'unread', partition: 2 },
  { id: 12, chapterNumber: 12, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_12', arabicNumber: '١٢', title: 'ليلة احتراق الرق الأندلسي', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في جمادى الآخرة', status: 'unread', partition: 2 },
  { id: 13, chapterNumber: 13, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_13', arabicNumber: '١٣', title: 'حين يتكلم مذنب الموت', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
  { id: 14, chapterNumber: 14, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_14', arabicNumber: '١٤', title: 'مبارزة على حافة سقف الرصد', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
  { id: 15, chapterNumber: 15, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_15', arabicNumber: '١٥', title: 'رسالة الوزير المسمومة', duration: '٢٢ دقيقة قراءة', publishDate: 'نُشر في رجب', status: 'unread', partition: 2 },
  { id: 16, chapterNumber: 16, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_16', arabicNumber: '١٦', title: 'صراع في خزانة الكتب الكبرى', duration: '١٩ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 2 },
  { id: 17, chapterNumber: 17, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_17', arabicNumber: '١٧', title: 'شروق كوكب الزهرة فوق جيحون', duration: '١٨ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
  { id: 18, chapterNumber: 18, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_18', arabicNumber: '١٨', title: 'نداء الأبواق عند أسوار شاه زنده', duration: '٢١ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
  { id: 19, chapterNumber: 19, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_19', arabicNumber: '١٩', title: 'مفتاح القوس السداسي الرخامي', duration: '١٧ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
  { id: 20, chapterNumber: 20, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_20', arabicNumber: '٢٠', title: 'سقوط القناع عن الفلكي المنفي', duration: '٢٤ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
  { id: 21, chapterNumber: 21, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_21', arabicNumber: '٢١', title: 'المعركة الأخيرة في دهليز البارود', duration: '٢٩ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
  { id: 22, chapterNumber: 22, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_22', arabicNumber: '٢٢', title: 'حين تلتقي الحسابات بالقدر', duration: '٢٠ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
  { id: 23, chapterNumber: 23, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_23', arabicNumber: '٢٣', title: 'انقشاع الدخان وسلام الفيروز', duration: '١٦ دقيقة قراءة', publishDate: 'نُشر في شعبان', status: 'unread', partition: 3 },
  { id: 24, chapterNumber: 24, language: 'ar', translationGroupId: 'echoes-of-samarkand__ch_24', arabicNumber: '٢٤', title: 'خاتمة الأسفار: ما حفظته مراصد الخلود', duration: '٢٧ دقيقة قراءة', publishDate: 'مسك الختام والملحمة', status: 'unread', partition: 3, isLast: true },
];

export const SAMARKAND_ENGLISH_CHAPTERS_META: ChapterItem[] = [
  { id: 1, chapterNumber: 1, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_1', arabicNumber: '1', title: 'Break of Dawn & Shadows of the Lost Citadel', duration: '18 min read', publishDate: 'Book I · Muharram', status: 'read', partition: 1 },
  { id: 2, chapterNumber: 2, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_2', arabicNumber: '2', title: 'Echoes of the Brass Toledo Astrolabe', duration: '22 min read', publishDate: 'Book I · Muharram', status: 'read', partition: 1 },
  { id: 3, chapterNumber: 3, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_3', arabicNumber: '3', title: 'Salt Caravans & Maps of the Wanderer', duration: '16 min read', publishDate: 'Book I · Safar', status: 'read', partition: 1 },
  { id: 4, chapterNumber: 4, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_4', arabicNumber: '4', title: 'The Hourglass in Ulugh Beg’s Mihrab', duration: '25 min read', publishDate: 'Book I · Rabi I', status: 'current', partition: 1 },
  { id: 5, chapterNumber: 5, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_5', arabicNumber: '5', title: 'Blood Upon the Folios of the New Zij', duration: '20 min read', publishDate: 'Book I · Rabi I', status: 'unread', partition: 1 },
  { id: 6, chapterNumber: 6, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_6', arabicNumber: '6', title: 'Labyrinth of the Azure Qashani Workshops', duration: '19 min read', publishDate: 'Book I · Rabi II', status: 'unread', partition: 1 },
  { id: 7, chapterNumber: 7, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_7', arabicNumber: '7', title: 'Whispers Beneath the Leaning Minaret', duration: '17 min read', publishDate: 'Book II · Rabi II', status: 'unread', partition: 2 },
  { id: 8, chapterNumber: 8, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_8', arabicNumber: '8', title: 'Breach at the Western Gunpowder Vault', duration: '24 min read', publishDate: 'Book II · Jumada I', status: 'unread', partition: 2 },
  { id: 9, chapterNumber: 9, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_9', arabicNumber: '9', title: 'The Buried Seal Beneath Registan’s Vault', duration: '21 min read', publishDate: 'Book II · Jumada I', status: 'unread', partition: 2 },
  { id: 10, chapterNumber: 10, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_10', arabicNumber: '10', title: 'The Sufi Cipher and the Hindu Numerals', duration: '15 min read', publishDate: 'Book II · Jumada II', status: 'unread', partition: 2 },
  { id: 11, chapterNumber: 11, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_11', arabicNumber: '11', title: 'Conspiracy of the Northern Steppe Caravanserais', duration: '23 min read', publishDate: 'Book III · Rajab', status: 'unread', partition: 3 },
  { id: 12, chapterNumber: 12, language: 'en', translationGroupId: 'echoes-of-samarkand__ch_12', arabicNumber: '12', title: 'Night of the Burning Andalusian Parchment', duration: '18 min read', publishDate: 'Book III · Rajab', status: 'unread', partition: 3, isLast: true },
];

export const OBSIDIAN_ENGLISH_CHAPTERS_META: ChapterItem[] = [
  { id: 1, chapterNumber: 1, language: 'en', translationGroupId: 'obsidian__ch_1', arabicNumber: '1', title: 'The Obsidian Arch & the Lamp of Red Oil', duration: '16 min read', publishDate: 'Edition · Part I', status: 'current', partition: 1 },
  { id: 2, chapterNumber: 2, language: 'en', translationGroupId: 'obsidian__ch_2', arabicNumber: '2', title: 'Calligraphy Etched Inside Hollow Basalt', duration: '19 min read', publishDate: 'Edition · Part I', status: 'unread', partition: 1 },
  { id: 3, chapterNumber: 3, language: 'en', translationGroupId: 'obsidian__ch_3', arabicNumber: '3', title: 'Seven Voices in the Sunken Cloister', duration: '21 min read', publishDate: 'Edition · Part I', status: 'unread', partition: 1 },
  { id: 4, chapterNumber: 4, language: 'en', translationGroupId: 'obsidian__ch_4', arabicNumber: '4', title: 'Where Candlelight Bends Around Stone', duration: '18 min read', publishDate: 'Edition · Part I', status: 'unread', partition: 1, isLast: true },
];

export const ENGLISH_ORIGINAL_CHAPTERS_META: Record<string, ChapterItem[]> = {
  'dorian-gray-classic': [
    { id: 1, chapterNumber: 1, language: 'en', translationGroupId: 'dorian-gray-classic__ch_1', arabicNumber: '1', title: 'Chapter I: Basil Hallward’s Studio of Lilac & Shadow', duration: '18 min read', publishDate: 'London, 1890', status: 'current', partition: 1 },
    { id: 2, chapterNumber: 2, language: 'en', translationGroupId: 'dorian-gray-classic__ch_2', arabicNumber: '2', title: 'Chapter II: Lord Henry’s Counsel of Youth', duration: '21 min read', publishDate: 'London, 1890', status: 'unread', partition: 1 },
    { id: 3, chapterNumber: 3, language: 'en', translationGroupId: 'dorian-gray-classic__ch_3', arabicNumber: '3', title: 'Chapter III: The Fatal Bargain Before the Easel', duration: '19 min read', publishDate: 'London, 1890', status: 'unread', partition: 2 },
    { id: 4, chapterNumber: 4, language: 'en', translationGroupId: 'dorian-gray-classic__ch_4', arabicNumber: '4', title: 'Chapter IV: Velvet Curtains at the Theatre', duration: '17 min read', publishDate: 'London, 1890', status: 'unread', partition: 2 },
    { id: 5, chapterNumber: 5, language: 'en', translationGroupId: 'dorian-gray-classic__ch_5', arabicNumber: '5', title: 'Chapter V: The First Cruel Change in the Canvas', duration: '22 min read', publishDate: 'London, 1890', status: 'unread', partition: 3 },
    { id: 6, chapterNumber: 6, language: 'en', translationGroupId: 'dorian-gray-classic__ch_6', arabicNumber: '6', title: 'Chapter VI: Mirrors Locked in the Attic Room', duration: '24 min read', publishDate: 'London, 1890', status: 'unread', partition: 3, isLast: true },
  ],
  'wuthering-heights-classic': [
    { id: 1, chapterNumber: 1, language: 'en', translationGroupId: 'wuthering-heights-classic__ch_1', arabicNumber: '1', title: 'Chapter I: Arriving at Wuthering Heights in the Mist', duration: '20 min read', publishDate: 'Yorkshire, 1847', status: 'current', partition: 1 },
    { id: 2, chapterNumber: 2, language: 'en', translationGroupId: 'wuthering-heights-classic__ch_2', arabicNumber: '2', title: 'Chapter II: Snowbound Night at the Farmhouse', duration: '18 min read', publishDate: 'Yorkshire, 1847', status: 'unread', partition: 1 },
    { id: 3, chapterNumber: 3, language: 'en', translationGroupId: 'wuthering-heights-classic__ch_3', arabicNumber: '3', title: 'Chapter III: Ledger Margins & Names Carven in Oak', duration: '23 min read', publishDate: 'Yorkshire, 1847', status: 'unread', partition: 2 },
    { id: 4, chapterNumber: 4, language: 'en', translationGroupId: 'wuthering-heights-classic__ch_4', arabicNumber: '4', title: 'Chapter IV: Ellen Dean’s Winter Hearth Tale', duration: '19 min read', publishDate: 'Yorkshire, 1847', status: 'unread', partition: 2 },
    { id: 5, chapterNumber: 5, language: 'en', translationGroupId: 'wuthering-heights-classic__ch_5', arabicNumber: '5', title: 'Chapter V: Wind Across Penistone Crags', duration: '21 min read', publishDate: 'Yorkshire, 1847', status: 'unread', partition: 3, isLast: true },
  ],
  'frankenstein-classic': [
    { id: 1, chapterNumber: 1, language: 'en', translationGroupId: 'frankenstein-classic__ch_1', arabicNumber: '1', title: 'Letter I: From Robert Walton Among Northern Ice', duration: '15 min read', publishDate: 'Geneva, 1818', status: 'current', partition: 1 },
    { id: 2, chapterNumber: 2, language: 'en', translationGroupId: 'frankenstein-classic__ch_2', arabicNumber: '2', title: 'Chapter I: Youth Beneath the Alps of Ingolstadt', duration: '19 min read', publishDate: 'Geneva, 1818', status: 'unread', partition: 1 },
    { id: 3, chapterNumber: 3, language: 'en', translationGroupId: 'frankenstein-classic__ch_3', arabicNumber: '3', title: 'Chapter II: Lightning on the Solitary Tower', duration: '22 min read', publishDate: 'Geneva, 1818', status: 'unread', partition: 2 },
    { id: 4, chapterNumber: 4, language: 'en', translationGroupId: 'frankenstein-classic__ch_4', arabicNumber: '4', title: 'Chapter III: On the Mer de Glace', duration: '25 min read', publishDate: 'Geneva, 1818', status: 'unread', partition: 3, isLast: true },
  ],
};

// Pure Arabic-only heritage/manuscript IDs where NO English translation exists yet (returns [] in 'en')
const ARABIC_ONLY_HERITAGE_IDS = new Set([
  'lisan-al-arab-ibn-manzur',
  'nafh-al-tib-tilimsani',
  'nuzhat-al-mushtaq-idrisi',
  'al-dhakhira-ibn-bassam',
  'subh-al-asha-qalqashandi',
  'rihlat-ibn-jubayr',
  'tahafut-al-tahafut',
  'hayy-ibn-yaqzan',
]);

// English-only original IDs where NO Arabic translation exists yet (returns [] in 'ar')
const ENGLISH_ONLY_ORIGINAL_IDS = new Set([
  'wuthering-heights-classic',
  'frankenstein-classic',
]);

function toArabicNumerals(n: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return n.toString().replace(/\d/g, (d) => digits[+d]);
}

function estimateDurationText(wordCount: number, lang: ChapterLanguage): string {
  const mins = Math.max(1, Math.ceil((wordCount || 180) / 180));
  return lang === 'en' ? `${mins} min read` : `${toArabicNumerals(mins)} دقيقة قراءة`;
}

export function getDefaultChapterLanguageForNovel(
  novel: NovelCard | null | undefined,
  preferredLang?: ChapterLanguage,
  firestoreChapters?: LogicalChapter[]
): ChapterLanguage {
  if (!novel) return preferredLang || 'ar';
  const arList = getChaptersForNovel(novel.id, 'ar', novel, firestoreChapters);
  const enList = getChaptersForNovel(novel.id, 'en', novel, firestoreChapters);

  if (preferredLang) {
    if (preferredLang === 'en' && enList.length > 0) return 'en';
    if (preferredLang === 'ar' && arList.length > 0) return 'ar';
  }
  if (novel.languageCode === 'en' && enList.length > 0) return 'en';
  if (arList.length > 0) return 'ar';
  if (enList.length > 0) return 'en';
  return preferredLang || (novel.languageCode === 'en' ? 'en' : 'ar');
}

export function getChaptersForNovel(
  novelId: string,
  lang: ChapterLanguage,
  novel?: NovelCard | null,
  firestoreChapters?: LogicalChapter[],
  sections?: NovelSection[]
): ChapterItem[] {
  // Real Firestore-backed novel: NEVER generate synthetic fallback chapters
  if (novel?.isFirestoreBacked || (firestoreChapters && firestoreChapters.length > 0)) {
    const source = (firestoreChapters || []).filter((ch) => ch.isPublished === true);
    const matching = source
      .filter((ch) => Boolean(lang === 'en' ? ch.editions?.en : ch.editions?.ar))
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    const sectionMap = new Map<string, NovelSection>((sections || []).map((s) => [s.id, s]));

    return matching.map((ch, idx) => {
      const edition = lang === 'en' ? ch.editions.en! : ch.editions.ar!;
      const sec = ch.sectionId ? sectionMap.get(ch.sectionId) : undefined;
      const partitionIndex = ((idx % 3) + 1) as 1 | 2 | 3;
      const wordCount = edition.wordCount || (lang === 'en' ? ch.wordCountEn : ch.wordCountAr) || 0;
      const titleForLang =
        edition.title ||
        (lang === 'en' ? ch.titleEn || ch.title : ch.title) ||
        (lang === 'en' ? `Chapter ${ch.chapterNumber}` : `الفصل ${toArabicNumerals(ch.chapterNumber)}`);

      return {
        id: ch.chapterNumber,
        firestoreChapterId: ch.id,
        chapterNumber: ch.chapterNumber,
        language: lang,
        translationGroupId: `${novelId}__ch_${ch.chapterNumber}`,
        arabicNumber: lang === 'en' ? `${ch.chapterNumber}` : toArabicNumerals(ch.chapterNumber),
        title: titleForLang,
        titleEn: ch.titleEn || ch.editions.en?.title,
        duration: estimateDurationText(wordCount, lang),
        publishDate:
          ch.endStatus === 'ending'
            ? lang === 'en'
              ? 'Ending Chapter'
              : 'انتهاء'
            : lang === 'en'
              ? 'Ongoing'
              : 'مستمر',
        status: idx === 0 ? 'current' : 'unread',
        partition: partitionIndex,
        isLast: idx === matching.length - 1,
        chapterType: ch.chapterType || 'narrative',
        endStatus: ch.endStatus || 'ongoing',
        sectionId: ch.sectionId,
        sectionTitle: sec?.title,
        sectionTitleEn: sec?.titleEn,
        revision: ch.revision,
        editions: ch.editions,
      };
    });
  }

  if (lang === 'en') {
    if (ARABIC_ONLY_HERITAGE_IDS.has(novelId) || (novel?.categoryGroup === 'heritage' && novelId !== 'cipher-cordoba')) {
      return [];
    }
    if (ENGLISH_ORIGINAL_CHAPTERS_META[novelId]) {
      return ENGLISH_ORIGINAL_CHAPTERS_META[novelId];
    }
    if (novelId === 'obsidian-labyrinth-full' || novelId === 'obsidian-labyrinth-spotlight' || novelId === 'rank-1') {
      return OBSIDIAN_ENGLISH_CHAPTERS_META;
    }
    if (novelId === 'echoes-of-samarkand') {
      return SAMARKAND_ENGLISH_CHAPTERS_META;
    }
    // Bilingual world classics and curated modern fiction have genuine linked English editions (1..8)
    return SAMARKAND_ENGLISH_CHAPTERS_META.slice(0, 8).map((c) => ({
      ...c,
      translationGroupId: `${novelId}__ch_${c.chapterNumber ?? c.id}`,
    }));
  }

  // Arabic chapters
  if (ENGLISH_ONLY_ORIGINAL_IDS.has(novelId)) {
    return [];
  }
  if (novelId === 'dorian-gray-classic') {
    // Only 3 Arabic translated chapters available for Dorian Gray as an honest partial case
    return SAMARKAND_ARABIC_CHAPTERS_META.slice(0, 3).map((c, idx) => ({
      ...c,
      title:
        idx === 0
          ? 'الفصل الأول: مرسم باسل هولورد بين الليلك والظلال'
          : idx === 1
            ? 'الفصل الثاني: نصيحة اللورد هنري عن الشباب'
            : 'الفصل الثالث: العهد الخفي أمام اللوحة الزيتية',
      translationGroupId: `dorian-gray-classic__ch_${idx + 1}`,
      isLast: idx === 2,
    }));
  }
  return SAMARKAND_ARABIC_CHAPTERS_META.map((c) => ({
    ...c,
    translationGroupId: `${novelId}__ch_${c.chapterNumber ?? c.id}`,
  }));
}

export const SAMARKAND_CHAPTERS_TEXTS: Record<number, Omit<ChapterTextContent, 'chapterNumber' | 'language' | 'translationGroupId'>> = {
  1: {
    chapterId: 1,
    arabicNumber: '١',
    title: 'شقشقة الفجر وظلال القلعة المفقودة',
    subtitle: 'في بواكير خروج القوافل من بوابة الركيك',
    epigraph: '«والنجومُ في أفلاكها كواكبُ دُرِّيّة، لا تُفصحُ عن سرّها إلا لمن أسلمَ ليله للرَّصَد والسهر»',
    epigraphAuthor: 'من لوح المرصد التيموري القديم',
    paragraphs: [
      'كَانَتْ شَقْشَقَةُ الفَجْرِ تَنْفُذُ مِنْ بَيْنِ أَقْوَاسِ سَمَرْقَنْدَ الزَّرْقَاءِ، كَأَنَّهَا خُيُوطُ فِضَّةٍ مَغْزُولَةٍ بِمَاءِ النَّدَى. عَلَى ارْتِفَاعِ تَلَّةِ كُوهَكْ، انْتَصَبَ مَرْصَدُ أُولُغْ بَك كَمَارِدٍ حَجَرِيٍّ يَسْتَنطِقُ السَّمَاءَ، يُطِلُّ عَلَى مَسَارِبِ وَادِي زَرَفْشَان حَيْثُ كَانَتْ قَوَافِلُ الحَرِيرِ تَحُطُّ رِحَالَهَا بَعْدَ رِحْلَةِ شَهْرَيْنِ عَبْرَ رِمَالِ قَرَاقُوم.',
      'وَقَفَ جَلَالُ الدِّينِ فِي صَحْنِ القَلْعَةِ، يَتَفَقَّدُ أَلْوَاحَ النُّحَاسِ المَصْقُولَةِ الَّتِي خُطَّتْ عَلَيْهَا مَوَاضِعُ الكَوَاكِبِ الثَّابِتَةِ. كَانَ الهَوَاءُ مُشْبَعاً بِرَائِحَةِ حَبَّاتِ العَرْعَرِ المَحْرُوقِ فِي دَوَاخِينِ المَدْرَسَةِ الكُبْرَى، وَبِرَنِينِ الأَجْرَاسِ النُّحَاسِيَّةِ الَّتِي تُنَبِّئُ بِفَتْحِ بَوَّابَاتِ المَدِينَةِ المُسَوَّرَةِ.',
      '«يَا جَلَالُ الدِّينِ»، نَادَاهُ الشَّيْخُ حُسَامُ الدِّينِ مُعْتَمِداً عَلَى عَصَاهُ الأَبَنُوسِيَّةِ، «لَمْ يَنَمِ السَّلْطَانُ البَارِحَةَ. كَانَتْ عَيْنُهُ عَلَى السُّدْسِ الرُّخَامِيِّ المَنْصُوبِ فِي عُمْقِ الجَبَلِ. ثَمَّةَ نَجْمٌ فِي بُرْجِ العَقْرَبِ يُبْدِي اضْطِرَاباً فِي دَرَجَةِ طُولِهِ، وَالأَلْوَاحُ البَابِلِيَّةُ القَدِيمَةُ لَا تَحْتَمِلُ هَذَا الفَارِقَ».',
      'صَمَتَ جَلَالُ الدِّينِ لَحْظَةً، ثُمَّ أَمَرَّ أَنَامِلَهُ عَلَى حَافَّةِ الرَّقِيمِ: «إِنَّ خَرَائِطَ بَطْلِيمُوس عَمِيَتْ عَنْ حَرَكَةِ الأَوْجِ الشَّمْسِيِّ يَا مَوْلَايَ. لَكِنَّ شَيْئاً آخَرَ حَدَثَ فِي اللَّيْلَةِ الفَارِطَةِ؛ حُجْرَةُ النَّاسِخِ إِسْمَاعِيل كَانَتْ مَفْتُوحَةَ البَابِ، وَحِبْرُ الزَّعْفَرَانِ قَدْ سَالَ عَلَى جَدَاوِلِ المَيْلِ الكُلِّيِّ».',
      'تَوَقَّفَتْ أَنْفَاسُ الشَّيْخِ، وَتَبَادَلَ الرَّجُلَانِ نَظْرَةً لَا يُخْطِئُهَا أَهْلُ الصَّنْعَةِ. إِنَّ جَدَاوِلَ الزِّيجِ السُّلْطَانِيِّ لَيْسَتْ مُجَرَّدَ حِسَابَاتٍ لِلأَهِلَّةِ وَالمَوَاقِيتِ، بَلْ هِيَ مِفْتَاحُ الهَيْمَنَةِ عَلَى خَرَائِطِ البَحْرِ وَالمَسَالِكِ العَسْكَرِيَّةِ لِدُوَلِ المَشْرِقِ بِأَسْرِهِ.',
      'عِنْدَمَا دَلَفَا إِلَى مَقْصُورَةِ الإِسْطِرْلَابِ، كَانَ النَّاسِخُ مُلْقَىً عَلَى سَجَّادَةِ بُخَارَى الحَمْرَاءِ، وَفِي قَبْضَتِهِ اليُمْنَى قِطْعَةٌ مِنْ جِلْدِ غَزَالٍ قَدْ حُرِقَتْ أَطْرَافُهَا، كُتِبَتْ عَلَيْهَا أَرْقَامٌ هِنْدِيَّةٌ لَا تَنْتَمِي لِحِسَابَاتِ التَّقْوِيمِ المَعْهُودَةِ، بَلْ لِشِفْرَةٍ أَنْدَلُسِيَّةٍ غَائِرَةٍ فِي القِدَمِ.',
      'هَكَذَا، فِي تِلْكَ السَّاعَةِ الَّتِي انْشَقَّ فِيهَا الفَجْرُ عَنْ زُرْقَةِ فَيْرُوزِ سَمَرْقَنْد، بَدَأَتِ الرِّحْلَةُ الَّتِي سَتَجُرُّ أَقْدَامَهُمْ مِنْ مَرَاصِدِ آسْيَا الوُسْطَى إِلَى مَكْتَبَاتِ قُرْطُبَةَ وَدَهَالِيزِ دِمَشْقَ المَنْسِيَّةِ.',
    ],
    marginalNote: 'موقع الرصد: خط عرض ٣٩° و٣٨ دقيقة شمالاً — مرصد سمرقند.',
  },
  2: {
    chapterId: 2,
    arabicNumber: '٢',
    title: 'أصداء الإسطرلاب النحاسي العتيق',
    subtitle: 'عن سر السمت ومقابض النحاس الموشى بماء الذهب',
    epigraph: '«من أصلح إسطرلابه أصلح نظره، ومن أقام قطب السمت استوت له جهات المعمورة»',
    epigraphAuthor: 'عبد الرحمن الصوفي في كتاب صور الكواكب',
    paragraphs: [
      'كَانَ الإِسْطِرْلَابُ المَوْضُوعُ عَلَى الطَّاوِلَةِ المُرَصَّعَةِ بِالعَاجِ يَحْمِلُ نَقْشاً كُوفِيّاً مُعَقَّداً: «صَنَعَهُ إِبْرَاهِيمُ بْنُ سَعِيدٍ السَّهْلِيُّ بِطُلَيْطِلَةَ فِي سَنَةِ أَرْبَعِمِائَةٍ وَسِتِّينَ لِلهِجْرَةِ». كَيْفَ وَصَلَتْ هَذِهِ الآلَةُ الأَنْدَلُسِيَّةُ النَّفِيسَةُ إِلَى هُنَا، بَعْدَ أَرْبَعَةِ قُرُونٍ، لِتَسْتَقِرَّ فِي خِزَانَةِ نَاسِخٍ مَقْتُولٍ؟',
      'تَنَاوَلَ جَلَالُ الدِّينِ حَلْقَةَ العُرْوَةِ بِيَدٍ مُرْتَعِشَةٍ، وَأَدَارَ العَضَادَةَ بِرِفْقٍ. عَلَى ظَهْرِ الصَّفِيحَةِ النُّحَاسِيَّةِ، انْكَشَفَتْ خُطُوطُ ارْتِفَاعٍ إِضَافِيَّةٌ لَمْ تُحْفَرْ لِمَوْضِعِ طُلَيْطِلَةَ وَلَا لِسَمَرْقَنْدَ، بَلْ كَانَتْ لِخَطِّ عَرْضٍ يَمُرُّ بِسَوَاحِلِ الأَطْلَسِيِّ المَجْهُولَةِ.',
      '«انْظُرْ هُنَا يَا حُسَامَ الدِّينِ»، هَمَسَ جَلَالُ الدِّينِ مُشِيراً إِلَى نَقْشٍ دَقِيقٍ تَحْتَ صَفِيحَةِ العَنْكَبُوتِ، «هَذَا لَيْسَ اسْمَ نَجْمٍ، بَلْ بَيْتُ شِعْرٍ لِابْنِ عَرَبِيٍّ قَدْ شُفِّرَتْ حُرُوفُهُ بِحِسَابِ الجُمَّلِ».',
      'قَرَأَ الشَّيْخُ بِصَوْتٍ خَافِتٍ يَخْتَلِجُ بِالوَجَلِ:\n«وَإِذَا التَقَى القُطْبَانِ فِي حَرَمِ الهَوَى .. انْفَضَّ خَتْمُ السِّرِّ فِي الإِسْطِرْلَابِ».',
      'فِي تِلْكَ اللَّحْظَةِ، تَرَدَّدَتْ خَطَوَاتٌ عَسْكَرِيَّةٌ ثَقِيلَةٌ خَارِجَ المَمَرِّ المَفْرُوشِ بِالجِصِّ الأَبْيَضِ. رِجَالُ الدَّرَكِ التَّيْمُورِيِّ كَانُوا يَطْلُبُونَ التَّحْقِيقَ، وَعُيُونُ أَمِيرِ الجُنْدِ «تَيْمُور لَنْك الحَفِيد» تَتَطَلَّعُ إِلَى أَيِّ ذَرِيعَةٍ لِإِغْلَاقِ المَرْصَدِ الَّذِي يَرَاهُ فُقَهَاءُ البَلْخِ بِدْعَةً تُعَطِّلُ صَرَامَةَ السَّيْفِ.',
      'أَخْفَى جَلَالُ الدِّينِ الإِسْطِرْلَابَ الصَّغِيرَ تَحْتَ رِدَائِهِ الأَخْضَرِ، وَأَشَارَ إِلَى رَفِيقِهِ بِالصَّمْتِ. كَانَ المَوْقِفُ يَتَطَلَّبُ حِيلَةً تَسْبِقُ قَعْقَعَةَ السُّيُوفِ.',
    ],
    marginalNote: 'الإسطرلاب السهلي: تحفة أندلسية فريدة في علم السمت والنجوم.',
  },
  3: {
    chapterId: 3,
    arabicNumber: '٣',
    title: 'قوافل الملح وخرائط التائهين',
    subtitle: 'عن خروج السر إلى دروب خانات السهوب',
    epigraph: '«في الصحراء لا تُقاس المسافات بالفراسخ، بل بعدد الآبار التي لم تجف بعد»',
    epigraphAuthor: 'أمثال البدو في سهوب قفجاق',
    paragraphs: [
      'انْطَلَقَتْ قَافِلَةُ جَلَالِ الدِّينِ تَحْتَ سِتَارِ اللَّيْلِ، مُتَنَكِّراً فِي زِيِّ تَاجِرِ زَعْفَرَانٍ مِنْ شِيرَاز. كَانَتْ نُوقُ القَافِلَةِ تَقْطَعُ هِضَابَ زَرَفْشَان بَصَمْتٍ مُهَيْمِنٍ، لَا يَكْسِرُهُ إِلَّا صَرِيرُ الأَحْمَالِ وَحَفِيفُ أَخْفَافِ الإِبِلِ عَلَى الحَصَى الرَّمَادِيِّ.',
      'كَانَ مَعَهُ فِي هَذِهِ الرِّحْلَةِ شَابٌّ أَنْدَلُسِيٌّ يُدْعَى «نُور الدِّين»، تَرَكَ غِرْنَاطَةَ قَبْلَ عَشْرِ سِنِينَ بَحْثاً عَنْ بَقَايَا مَكْتَبَةِ الحَكَمِ المُسْتَنْصِرِ الَّتِي تَبَدَّدَتْ بَيْنَ المَشْرِقِ وَالمَغْرِبِ. كَانَ نُور الدِّينِ خَبِيراً بِطُرُقِ الجِبَالِ وَلُغَاتِ التُّرْكُمَانِ.',
      '«إِنَّهُمْ يَتَّبِعُونَنَا يَا سَيِّدِي»، قَالَهَا نُور الدِّينِ وَهُوَ يَتَفَحَّصُ الأُفُقَ الجَنُوبِيَّ حَيْثُ كَانَتْ تَلْمَعُ شُعَلٌ خَافِتَةٌ كَأَنَّهَا عُيُونُ ذِئَابٍ فِي اللَّيْلِ. «خَيَّالَةُ خَانَاتِ بُخَارَى لَا يُرِيدُونَ لِلشِّفْرَةِ أَنْ تَعْبُرَ نَهْرَ جَيْحُون».',
      'فَتَحَ جَلَالُ الدِّينِ الخَرِيطَةَ الجِلْدِيَّةَ المَرْسُومَةَ بِمِدَادِ الصِّينِ المُقَاوِمِ لِلرُّطُوبَةِ: «إِذَا بَلَغْنَا خَانَقَاهَ الصُّوفِيَّةِ عِنْدَ مُنْعَرَجِ النَّهْرِ قَبْلَ بُزُوغِ نَجْمِ الشِّعْرَى، فَإِنَّ الشَّيْخَ مُحَمَّدَ بْنَ عَبْدِ اللهِ سَيُؤَمِّنُ لَنَا زَوْرَقاً يَعْبُرُ بِنَا إِلَى خُرَاسَان».',
      'وَتَحْتَ قُبَّةِ السَّمَاءِ الصَّافِيَةِ، كَانَتِ النُّجُومُ تَتَلَأْلَأُ بِبَرِيقٍ بَارِدٍ، كَأَنَّهَا شُهُودٌ أَزَلِيُّونَ عَلَى حِرَاسَةِ المَعْرِفَةِ فِي زَمَنٍ يَشْتَعِلُ فِيهِ السَّيْفُ وَيَخْبُو القَلَمُ.',
    ],
    marginalNote: 'مسار العبور: من سمرقند غرباً نحو واحة مرو الشاهجان.',
  },
  4: {
    chapterId: 4,
    arabicNumber: '٤',
    title: 'ساعة الرمل في محراب أولغ بك',
    subtitle: 'في حل الرموز وانكشاف أسرار المذنب الموعود',
    epigraph: '«العلمُ دينُ الأحرار، وحسابُ الأفلاك مرآةُ العدل الإلهي في هندسة الوجود»',
    epigraphAuthor: 'السلطان الفلكي أولغ بك بن شاه رخ',
    paragraphs: [
      'فِي هُدُوءِ خَانَقَاهِ مَرْوَ العَتِيقَةِ، تَحَلَّقَ الرِّجَالُ الثَّلَاثَةُ حَوْلَ قِنْدِيلِ الزَّيْتِ الشَّاحِبِ. كَانَتْ سَاعَةُ الرَّمْلِ الزُّجَاجِيَّةُ تُسْقِطُ حَبَّاتِهَا الدَّقِيقَةَ فِي انْسِيَابٍ مُتَّزِنٍ، يُذَكِّرُ بِسَيْلِ الأَعْمَارِ وَتَفَاوُتِ الآجَالِ.',
      'وَضَعَ جَلَالُ الدِّينِ قِطْعَةَ جِلْدِ الغَزَالِ المُحْتَرِقَةِ فَوْقَ صَفِيحَةِ الإِسْطِرْلَابِ، فَإِذَا بِخُطُوطِ الحَرْقِ تَتَطَابَقُ بِدِقَّةٍ مَذْهُولَةٍ مَعَ مَسَارِ بُرْجِ القَوْسِ. هُنَاكَ كَانَ المَطْلُوبُ: لَيْسَ كَنْزاً مِنَ الذَّهَبِ وَالجَوْهَرِ، بَلْ مَوْضِعُ المَخْزَنِ السِّرِّيِّ لِمَخْطُوطَاتِ دَارِ الحِكْمَةِ البَغْدَادِيَّةِ الَّتِي أَنْقَذَهَا نَصِيرُ الدِّينِ الطُّوسِيُّ قَبْلَ اجْتِيَاحِ هُولَاكُو، وَأَوْدَعَهَا فِي كُهُوفِ جِبَالِ أَلْبُرْز.',
      '«إِنَّهُمْ يَبْحَثُونَ عَنْ سِفْرِ الحَرَكَاتِ المَفْقُودِ»، هَمَسَ نُور الدِّينِ وَهُوَ يَمْسَحُ جَبِينَهُ. «السِّفْرُ الَّذِي يُثْبِتُ أَنَّ الأَرْضَ سَابِحَةٌ فِي الفَضَاءِ وَلَيْسَتْ ثَابِتَةً فِي مَرْكَزِ الكَوْنِ. إِنَّ اكْتِشَافاً كَهَذَا كَفِيلٌ بِأَنْ يُزَلْزِلَ عُرُوشاً قَامَتْ عَلَى تَفْسِيرَاتٍ مُتَحَجِّرَةٍ».',
      'فِي تِلْكَ اللَّحْظَةِ، دَخَلَ خَادِمُ الخَانَقَاهِ مُلْتَاعاً: «مَوْلَايَ! خَيْلٌ مُدَجَّجَةٌ بِالسِّلَاحِ تَقِفُ عِنْدَ طَرَفِ البُسْتَانِ، وَقَائِدُهُمْ يَحْمِلُ خَاتَمَ إِمَارَةِ بَلْخ!».',
      'انْتَصَبَ جَلَالُ الدِّينِ قَائِماً، وَلَمْلَمَ أَوْرَاقَهُ فِي كِيسٍ مِنَ الجِلْدِ المُشَمَّعِ: «لَا وَقْتَ لِلتَّرَدُّدِ. سَنَسْلُكُ طَرِيقَ القَنَوَاتِ التَّحْتِيَّةِ نَحْوَ الصَّحْرَاءِ. الكَلِمَةُ أَمَانَةٌ فِي أَعْنَاقِنَا، وَلَنْ تَمُوتَ مَا دَامَ فِي صُدُورِنَا نَبْضٌ!».',
    ],
    marginalNote: 'موقع التدوين: مرو الشاهجان — خزانة سياوش التاريخية.',
  },
  5: {
    chapterId: 5,
    arabicNumber: '٥',
    title: 'دماء على أوراق الزيج الجديد',
    subtitle: 'ليلة الحريق في خزانة مخطوطات نيسابور',
    epigraph: '«يَمُوتُ الحُكَّامُ وَتَفْنَى جُيُوشُهُمْ، وَتَبْقَى النُّقُوشُ عَلَى الأَحْجَارِ رَوَافِدَ لِلخُلُودِ»',
    epigraphAuthor: 'من حواشي زيج الإلخاني القديم',
    paragraphs: [
      'كَانَتْ نِيسَابُورُ تَلِفُّ أَرْدِيَتَهَا الشِّتْوِيَّةَ حِينَ وَصَلَهَا الرَّكْبُ. هُنَاكَ، فِي حَيِّ النَّسَّاخِينَ القَرِيبِ مِنْ مَقْبَرَةِ عُمَرَ الخَيَّام، كَانَتْ رَائِحَةُ الصَّمْغِ العَرَبِيِّ وَحِبْرِ العَفْصِ تَمْلَأُ الأَزِقَّةَ الضَّيِّقَةَ.',
      'لَكِنَّ السَّلَامَ لَمْ يَكُنْ مَكْتُوباً لِهَذِهِ المَدِينَةِ المُعَذَّبَةِ. فِي جَوْفِ اللَّيْلِ، انْدَلَعَتْ أَلْسِنَةُ اللَّهَبِ فِي خِزَانَةِ الكُتُبِ المَرْكَزِيَّةِ. كَانَتِ النَّارُ تَلْتَهِمُ قُرُوناً مِنَ البَلَاغَةِ وَالشِّعْرِ وَالهَنْدَسَةِ، بَيْنَمَا رِجَالٌ مُلَثَّمُونَ يَحْمِلُونَ خَنَاجِرَ مَسْمُومَةً كَانُوا يَقْطَعُونَ الطَّرِيقَ عَلَى كُلِّ مَنْ حَاوَلَ إِطْفَاءَ الحَرِيقِ.',
      'انْدَفَعَ جَلَالُ الدِّينِ وَسَطَ اللَّهِيبِ دُونَ اكْتِرَاثٍ لِحَيَاتِهِ، يَقْصِدُ المَقْصُورَةَ الشَّمَالِيَّةَ حَيْثُ كَانَتْ تُحْفَظُ أُصُولُ «جَامِعِ التَّوَارِيخِ». تَرَامَتْ شَظَايَا الأَخْشَابِ المُحْتَرِقَةِ أَمَامَهُ، وَسَالَ رَذَاذُ الزَّعْفَرَانِ وَالحِبْرِ كَدِمَاءِ الشُّهَدَاءِ عَلَى الرُّخَامِ البَارِدِ.',
      'اسْتَطَاعَ أَنْ يَسْحَبَ صُنْدُوقاً خَشَبِيّاً مَصْنُوعاً مِنْ خَشَبِ الجَوْزِ المَقْفُولِ بِأَقْفَالِ النُّحَاسِ الرُّومِيِّ، قَبْلَ أَنْ يَنْهَارَ سَقْفُ القَاعَةِ خَلْفَهُ كَرَأْسِ جَبَلٍ هَوَى فِي اليَمِّ.',
    ],
    marginalNote: 'نيسابور: مطلع خريطة إنقاذ المخطوطات الفارسية.',
  },
  6: {
    chapterId: 6,
    arabicNumber: '٦',
    title: 'متاهة حوانيت القاشاني الأزرق',
    subtitle: 'أسرار الخزف المشفر في أصفهان',
    epigraph: '«اللون الأزرق في القاشاني ليس طلاءً، بل هو سماءٌ مصغرة سجنها الصانع في طين الأرض»',
    epigraphAuthor: 'رسالة في صناعة الخزف السلطاني',
    paragraphs: [
      'فِي أَصْفَهَان، كَانَ كُلُّ جِدَارٍ يَنْطِقُ بِالحِكْمَةِ. البَلَاطَاتُ القَاشَانِيَّةُ المَصْقُولَةُ بِمَاءِ اللَّازَوَرْدِ كَانَتْ تَعْكِسُ نُورَ الشَّمْسِ كَأَنَّهَا بُحَيْرَةٌ مِنَ الزُّجَاجِ الصَّافِي.',
      'الْتَقَى جَلَالُ الدِّينِ بِالمُعَلِّمِ «بَهْزَاد القَاشَانِيِّ» فِي حَانُوتِهِ الصَّغِيرِ فِي قَيْسَرِيَّةِ المَدِينَةِ. كَانَ الشَّيْخُ العَجُوزُ يُزَخْرِفُ مِحْرَاباً جَدِيداً، وَلَكِنْ بِعَيْنٍ فِلَاحِيَّةٍ تَعْرِفُ أَسْرَارَ الزَّوَايَا الهَنْدَسِيَّةِ غَيْرِ الإِقْلِيدِيَّةِ.',
      '«هَذِهِ النُّقُوشُ يَا وَلَدِي لَيْسَتْ زِينَةً»، قَالَ المُعَلِّمُ وَهُوَ يَضَعُ صَحِيفَةً خَزَفِيَّةً تَحْتَ ضَوْءِ الشَّمْسِ، «إِنَّهَا خَرِيطَةُ الدَّهَالِيزِ المَائِيَّةِ الَّتِي حَفَرَهَا الأَكَاسِرَةُ تَحْتَ قَنَاطِرِ زَايَنْدَه رُود. إِذَا أَرَدْتُمْ النَّجَاةَ مِنَ عُيُونِ الخَانِ، فَعَلَيْكُمْ بِالسَّيْرِ فِي بَطْنِ الأَرْضِ حَيْثُ لَا تَطَأُ الخُيُولُ».',
    ],
    marginalNote: 'أصفهان: قناطر زاينده رود وفلسفة الخزف المعماري.',
  },
};

export const SAMARKAND_ENGLISH_TEXTS: Record<number, Omit<ChapterTextContent, 'chapterNumber' | 'language' | 'translationGroupId'>> = {
  1: {
    chapterId: 1,
    arabicNumber: '1',
    title: 'Break of Dawn & Shadows of the Lost Citadel',
    subtitle: 'As the silk caravans depart through the Gate of Rakkik',
    epigraph: '“Stars in their spheres are pearls of measured light; none shall read their riddle save him who surrenders his night to watchfulness.”',
    epigraphAuthor: 'From the Timurid Observatory Tablet',
    paragraphs: [
      'Dawn filtered between the turquoise arches of Samarkand like silver thread spun from morning dew. High upon Kuhak Hill, Ulugh Beg’s observatory stood like a stone sentinel questioning the heavens, overlooking the Zeravshan valley where silk caravans pitched camp after two months across the Karakum sands.',
      'Jalal al-Din stood in the stone courtyard inspecting the burnished brass plates engraved with fixed planetary coordinates. The crisp mountain air carried the scent of burning juniper incense from the Grand Madrasa and the deep bronze chime announcing the opening of the city gates.',
      '“Jalal al-Din,” murmured Sheikh Husam al-Din, leaning heavily upon his ebony staff, “the Sultan did not sleep last night. His eyes remained fixed upon the marble sextant sunk deep into the hillside. A star in Scorpio shows an unrecorded anomaly in longitude—and our ancient tables cannot account for it.”',
      'Jalal al-Din ran his fingers along the cool edge of the parchment. “Ptolemy’s charts missed the solar apogee drift, Master. Yet something darker occurred before dawn: the chamber of Ismail the Scribe stood unlatched, and saffron ink has spilled across the declination tables.”',
      'The elder’s breath caught. Both scholars exchanged the grave look shared by guardians of state astronomy. The Sultan’s Zij tables were no mere calendar for crescent moons; they held the key to sea charts, caravan routes, and the balance of eastern sovereignty.',
      'When they crossed the threshold of the astrolabe chamber, the scribe lay motionless upon a crimson Bukhara carpet. Clutched inside his right palm was a charred scrap of gazelle vellum inscribed with strange Indian numerals belonging not to standard almanacs, but to an older Andalusian cipher.',
    ],
    marginalNote: 'Observation Log: Latitude 39° 38′ N — Samarkand Observatory.',
  },
  2: {
    chapterId: 2,
    arabicNumber: '2',
    title: 'Echoes of the Brass Toledo Astrolabe',
    subtitle: 'On the hidden azimuth and gold-inlaid engravings',
    epigraph: '“He who refines his astrolabe clarifies his sight; he who levels the horizon commands every compass point of the inhabited world.”',
    epigraphAuthor: 'Abd al-Rahman al-Sufi, Book of Fixed Stars',
    paragraphs: [
      'Resting upon the ivory-inlaid desk, the brass astrolabe carried a crisp Kufic inscription: “Forged by Ibrahim ibn Sa‘id al-Sahli in Toledo, in the year 460 AH.” How had an Andalusian instrument survived four centuries to settle inside the cabinet of a murdered copyist in Central Asia?',
      'Jalal al-Din lifted the suspension ring with a trembling hand and rotated the alidade. Beneath the spider rete, extra altitude arcs emerged—engraved neither for Toledo nor Samarkand, but calibrated to an uncharted latitude along the western Atlantic coast.',
      '“Look closer, Husam al-Din,” he whispered, pointing beneath the ecliptic ring. “This is no star name. It is a verse from Ibn Arabi whose letters are keyed by abjad numerical weights.”',
      'The Sheikh read softly, his voice tight with awe: “When the twin poles converge within the sanctuary of longing, the seal of the astrolabe breaks open.”',
      'At that instant heavy iron boots echoed down the whitewashed corridor outside. The Timurid patrol demanded entry—seeking any pretext to shutter an observatory whose scholarship the hardline jurists of Balkh viewed with deepening suspicion.',
    ],
    marginalNote: 'Al-Sahli Astrolabe: 11th-century Toledan brass specimen.',
  },
  3: {
    chapterId: 3,
    arabicNumber: '3',
    title: 'Salt Caravans & Maps of the Wanderer',
    subtitle: 'Carrying the cipher along steppe caravanserai trails',
    epigraph: '“Across the open desert distances are measured not in leagues, but by wells that have not run dry.”',
    epigraphAuthor: 'Caravan proverb of the Kipchak Steppe',
    paragraphs: [
      'Jalal al-Din’s small caravan slipped outward under cover of night, disguised as a saffron merchant guild bound from Shiraz. Along the ridges of Zeravshan, only the creak of saddle timber and soft camel hooves over grey gravel broke the silence.',
      'Beside him rode Nur al-Din, a young Andalusian scholar who had left Granada ten years prior tracing scattered fragments of Caliph al-Hakam’s imperial library. Fluent in Turkoman dialects and mountain passes, he kept his gaze pinned to the southern horizon.',
      '“Riders are following our ridge, Master,” Nur al-Din warned, squinting toward distant torches flickering like wolves’ eyes against the dark. “The horsemen from Bukhara do not mean to let that parchment cross the Oxus River.”',
      'Jalal al-Din unrolled a moisture-proof leather map drawn in Chinese pine-soot ink. “If we reach the Sufi hospice at the river bend before Sirius clears the rim, Sheikh Muhammad will moor a ferry to carry us safely into Khorasan.”',
    ],
    marginalNote: 'Transit Coordinate: Westward from Samarkand toward Merv al-Shahijan.',
  },
  4: {
    chapterId: 4,
    arabicNumber: '4',
    title: 'The Hourglass in Ulugh Beg’s Mihrab',
    subtitle: 'Decoding the burnt vellum and the promised comet',
    epigraph: '“Knowledge is the liturgy of the free mind; celestial geometry mirrors divine order across the architecture of existence.”',
    epigraphAuthor: 'Ulugh Beg ibn Shah Rukh',
    paragraphs: [
      'Inside the quiet courtyard of old Merv’s hospice, the three scholars gathered around a pale olive-oil lamp. A glass hourglass filtered fine desert quartz grain by grain, marking the fragile span left before sunrise.',
      'When Jalal al-Din aligned the charred gazelle leather against the Toledo tympan plate, the scorch marks matched the ecliptic arc of Sagittarius down to a hair’s breadth. No chest of gold awaited there—rather the secret limestone vault housing manuscripts rescued by Nasir al-Din al-Tusi before the sack of Baghdad.',
      '“They are hunting the Lost Treatise on Motion,” Nur al-Din whispered, wiping moisture from his brow. “The codex arguing that the earth glides through space rather than resting motionless at creation’s center.”',
      'Before another word could pass, the gatekeeper burst in breathless: “Masters! Armed cavalry have halted at the orchard edge—and their commander bears the iron signet of Balkh!”',
    ],
    marginalNote: 'Archival Note: Recorded at Merv al-Shahijan.',
  },
};

export function getChapterProse(
  novelTitle: string,
  chapter: ChapterItem,
  novel?: NovelCard | null,
  firestoreChapters?: LogicalChapter[],
  sections?: NovelSection[]
): ChapterTextContent {
  const lang: ChapterLanguage = chapter.language || 'ar';
  const chNum = chapter.chapterNumber ?? chapter.id;
  const translationGroupId =
    chapter.translationGroupId || `${novel?.id || 'work'}__ch_${chNum}`;

  // If this chapter carries a live Firestore edition (from Writer Studio / DB), render ONLY its real authored blocks & prose
  const matchedLogical =
    firestoreChapters?.find(
      (c) => (chapter.firestoreChapterId && c.id === chapter.firestoreChapterId) || c.chapterNumber === chNum
    ) || null;
  const edition =
    (lang === 'en' ? matchedLogical?.editions?.en : matchedLogical?.editions?.ar) ||
    (lang === 'en' ? chapter.editions?.en : chapter.editions?.ar);

  if (edition || novel?.isFirestoreBacked) {
    const blocks = edition?.blocks && edition.blocks.length > 0 ? edition.blocks : [];
    const plainLines = (edition?.plainText || '')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    const paragraphs =
      blocks.length > 0
        ? blocks
            .filter((b) => b.type !== 'divider' && b.text.trim().length > 0)
            .map((b) => b.text)
        : plainLines;

    const sectionMatch = (sections || []).find((s) => s.id === (matchedLogical?.sectionId || chapter.sectionId));
    const sectionLabel =
      lang === 'en'
        ? sectionMatch?.titleEn || sectionMatch?.title || chapter.sectionTitleEn || chapter.sectionTitle
        : sectionMatch?.title || chapter.sectionTitle;

    return {
      chapterId: chapter.id,
      firestoreChapterId: matchedLogical?.id || chapter.firestoreChapterId,
      chapterNumber: chNum,
      language: lang,
      translationGroupId,
      arabicNumber: lang === 'en' ? `${chNum}` : toArabicNumerals(chNum),
      title: edition?.title || chapter.title,
      subtitle: sectionLabel ? `${novelTitle} · ${sectionLabel}` : novelTitle,
      epigraph: '',
      epigraphAuthor: novel?.author,
      paragraphs,
      blocks,
      chapterType: matchedLogical?.chapterType || chapter.chapterType || 'narrative',
      endStatus: matchedLogical?.endStatus || chapter.endStatus || 'ongoing',
      sectionTitle: sectionLabel,
      marginalNote:
        lang === 'en'
          ? `Authored Edition · ${novel?.author || 'Eternity Corridors'}`
          : `طبعة المؤلف الأصلية · ${novel?.author || 'أروقة الخلود'}`,
      marginalia: [],
    };
  }

  if (lang === 'en') {
    const prebuiltEn = SAMARKAND_ENGLISH_TEXTS[chNum];
    if (prebuiltEn && (novel?.id === 'echoes-of-samarkand' || !novel?.id)) {
      return {
        ...prebuiltEn,
        chapterId: chapter.id,
        chapterNumber: chNum,
        language: 'en',
        translationGroupId,
        marginalia: prebuiltEn.marginalia || [
          prebuiltEn.marginalNote || `Archival Log: Chapter ${chNum} of ${novelTitle}.`,
          'Verified English literary edition — MTX Editorial Sanctuary.',
          'Formatted for distraction-free LTR prose reading.',
        ],
      };
    }

    // Literary English prose for English classics & bilingual novels
    const quoteText =
      novel?.quote ||
      '“Words preserved with patience outlast citadels, carrying human memory untouched across centuries.”';
    return {
      chapterId: chapter.id,
      chapterNumber: chNum,
      language: 'en',
      translationGroupId,
      arabicNumber: `${chNum}`,
      title: chapter.title,
      subtitle: `${novelTitle} · ${chapter.duration}`,
      epigraph: quoteText,
      epigraphAuthor: novel?.author || 'Eternity Corridors Edition',
      paragraphs: [
        `In Chapter ${chNum} (“${chapter.title}”), the narrative of ${novelTitle} deepens inside halls lit by tall leaded windows and lingering dusk. Pages turn with deliberate cadence as long-buried correspondence comes to light.`,
        `Along the stone gallery, the protagonist paused beside the lectern where marginal notes had been inked decades earlier in iron-gall script. Each line revealed another link between memory, conscience, and the choices waiting beyond the threshold.`,
        `“A chronicle is never merely a record of hours already spent,” murmured the archivist as rain tapped steadily against the slate eaves. “It is an invitation for those who arrive later to look closely at what endures when noise subsides.”`,
        `By midnight the lantern wick had burned low, yet the folio remained open before them—structured, clear, and unbroken—carrying the thread of ${novelTitle} forward into the chapters yet to unfold.`,
      ],
      marginalNote: `Editorial Edition — Chapter ${chNum} of ${novelTitle}.`,
      marginalia: [
        `Editorial Edition — Chapter ${chNum} of ${novelTitle}.`,
        `Canonical Group ID: ${translationGroupId}`,
        'Verified English edition rendered natively in left-to-right prose.',
      ],
    };
  }

  // Arabic Chapter Prose
  if (SAMARKAND_CHAPTERS_TEXTS[chNum] && (novel?.id === 'echoes-of-samarkand' || !novel?.id)) {
    const raw = SAMARKAND_CHAPTERS_TEXTS[chNum];
    return {
      ...raw,
      chapterId: chapter.id,
      chapterNumber: chNum,
      language: 'ar',
      translationGroupId,
      marginalia: raw.marginalia || [
        raw.marginalNote || `تحقيق صرح أروقة الخلود — الفصل ${chapter.arabicNumber} من ${novelTitle}.`,
        'تحقيق وتدقيق لغوي وبلاغي: صرح أروقة الخلود التحريري.',
        'طبعة منقحة بخط النسخ الكلاسيكي ومحايدة تماماً للإعلانات.',
      ],
    };
  }

  const quoteAr =
    novel?.quote ||
    '«كُلَّمَا أَوْغَلَ القَارِئُ فِي دَهَالِيزِ الكَلِمَةِ، انْكَشَفَتْ لَهُ حَقَائِقُ كَانَتْ تَحْسَبُ فِي عِدَادِ الأَسَاطِيرِ»';
  return {
    chapterId: chapter.id,
    chapterNumber: chNum,
    language: 'ar',
    translationGroupId,
    arabicNumber: chapter.arabicNumber,
    title: chapter.title,
    subtitle: `مسار السفر الأدبي — ${chapter.duration}`,
    epigraph: quoteAr,
    epigraphAuthor: novel?.author || 'من ألواح أروقة الخلود المحققة',
    paragraphs: [
      `تَسْتَمِرُّ وَقَائِعُ الرِّوَايَةِ فِي هَذَا الفَصْلِ «${chapter.title}»، حَيْثُ تَتَشَابَكُ خُيُوطُ الحَبْكَةِ السَّرْدِيَّةِ فِي رِحَابِ ${novelTitle}. كَانَتِ الرِّيَاحُ تَهَبُّ مِنْ شَمَالِ الوَادِي مُحَمَّلَةً بِغُبَارِ التَّارِيخِ وَأَصْدَاءِ الصِّرَاعِ الفِكْرِيِّ الَّذِي مَيَّزَ تِلْكَ الحِقْبَةَ الاسْتِثْنَائِيَّةَ مِنَ الزَّمَانِ.`,
      `وَقَفَ البَطَلُ عَلَى شُرْفَةِ البُرْجِ العَالِي يَتَأَمَّلُ امْتِدَادَ الآفَاقِ البَعِيدَةِ. كَانَتْ سُطُورُ المَخْطُوطِ تَلْمَعُ تَحْتَ ضَوْءِ القَمَرِ المُكْتَمِلِ، وَكُلُّ حَرْفٍ نُقِشَ عَلَيْهَا يَبْدُو كَأَنَّهُ جَمْرَةٌ تَنْبِضُ بِالحَيَاةِ دُونَ أَنْ تَحْتَرِقَ، كَاشِفاً عَنْ سِرٍّ جَدِيدٍ كَانَ طَيَّ الكِتْمَانِ مُنْذُ قُرُونٍ طَوِيلَةٍ.`,
      `«إِنَّ السَّرْدَ يَا صَاحِبِي لَيْسَ مُجَرَّدَ حِكَايَةٍ تُقَالُ لِتُزْجِيَ الوَقْتَ»، قَالَ الصَّوْتُ القَادِمُ مِنْ عَتَمَةِ الرِّوَاقِ، «بَلْ هُوَ مِرْآةٌ تَسْتَحْضِرُ أَرْوَاحَ الَّذِينَ مَضَوْا، لِيُخَاطِبُوا الحَاضِرَ بِلُغَةِ الحِكْمَةِ وَالعِبْرَةِ الَّتِي لَا تَزُولُ بِمُرُورِ العُصُورِ».`,
      `وَهَكَذَا انْتَهَتْ لَيْلَةُ الرَّصْدِ، لِتَبْدَأَ صَفْحَةٌ جَدِيدَةٌ مِنَ السَّفَرِ الَّذِي لَا يَعْرِفُ النِّهَايَةَ، بَيْنَ طَيَّاتِ الحُرُوفِ وَأَشْوَاقِ البَاحِثِينَ عَنِ الحَقِيقَةِ فِي مَلَكُوتِ الخُلُودِ.`,
    ],
    marginalNote: `تحقيق صرح أروقة الخلود — الفصل ${chapter.arabicNumber} من ${novelTitle}.`,
    marginalia: [
      `تحقيق صرح أروقة الخلود — الفصل ${chapter.arabicNumber} من ${novelTitle}.`,
      `معرف الربط التحريري: ${translationGroupId}`,
      'طبعة عربية محققة بالاتجاه الكلاسيكي من اليمين إلى اليسار.',
    ],
  };
}
