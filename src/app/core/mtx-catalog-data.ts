import { NovelCard } from './models/library.models';

export const ORIGIN_TO_LANGUAGE_CODE: Record<string, string> = {
  'عربي أصيل': 'ar',
  'الإنجليزية': 'en',
  'الروسية': 'ru',
  'الإسبانية': 'es',
  'اليابانية': 'ja',
  'الفرنسية': 'fr',
  'الفرنسية القديمة': 'fro',
  'السومرية': 'sux',
  'الفارسية': 'fa',
  'اليونانية القديمة': 'grc',
  'الفنلندية': 'fi',
  'الألمانية القديمة': 'goh',
  'الألمانية': 'de',
  'السنسكريتية': 'sa',
  'الصينية القديمة': 'lzh',
  'اللاتينية': 'la',
};

export function isArabicCatalogNovel(item: NovelCard): boolean {
  const code = item.languageCode || ORIGIN_TO_LANGUAGE_CODE[item.originLanguage || ''] || 'ar';
  return code === 'ar' || item.originLanguage === 'عربي أصيل';
}

/** Catalog starts empty and is hydrated strictly from Firestore published novels. */
export const INITIAL_EXPLORE_CATALOG: NovelCard[] = [];
