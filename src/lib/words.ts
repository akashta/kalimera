import csvText from '../../words.csv?raw';
import type { Level, NativeLanguage, Word } from '../types';
import { parseCsv } from './csv';

const SUPPORTED_LEVELS: Level[] = ['A1', 'A2', 'B1'];

function slugifyGreekWord(word: string, fallbackIndex: number): string {
  const normalized = word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\u0370-\u03ff0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.length > 0 ? normalized : `word-${fallbackIndex + 1}`;
}

function pickHeaderIndex(headers: string[], candidates: string[]): number {
  const lowerHeaders = headers.map((header) => header.trim().toLowerCase());
  return lowerHeaders.findIndex((header) => candidates.includes(header));
}

function parseWords(): Word[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const greekIndex = pickHeaderIndex(headerRow, ['greek', 'greek_word']);
  const englishIndex = pickHeaderIndex(headerRow, ['english', 'translation_en']);
  const russianIndex = pickHeaderIndex(headerRow, ['russian', 'translation_ru']);
  const levelIndex = pickHeaderIndex(headerRow, ['level']);
  const idIndex = pickHeaderIndex(headerRow, ['id']);

  if (greekIndex === -1 || englishIndex === -1 || levelIndex === -1) {
    throw new Error('words.csv must contain greek, english, and level columns.');
  }

  return dataRows.reduce<Word[]>((words, row, index) => {
    const levelValue = row[levelIndex]?.trim().toUpperCase();
    if (!levelValue || !SUPPORTED_LEVELS.includes(levelValue as Level)) {
      return words;
    }

    const greek = row[greekIndex]?.trim();
    const english = row[englishIndex]?.trim();
    const russian = russianIndex >= 0 ? row[russianIndex]?.trim() : undefined;

    if (!greek || !english) {
      return words;
    }

    words.push({
      id: row[idIndex]?.trim() || `${levelValue}-${slugifyGreekWord(greek, index)}`,
      greek,
      english,
      russian: russian || undefined,
      level: levelValue as Level,
    });

    return words;
  }, []);
}

export const allWords = parseWords();

export const wordsByLevel: Record<Level, Word[]> = {
  A1: allWords.filter((word) => word.level === 'A1'),
  A2: allWords.filter((word) => word.level === 'A2'),
  B1: allWords.filter((word) => word.level === 'B1'),
};

export function hasCompleteNativeTranslations(words: Word[], nativeLanguage: NativeLanguage): boolean {
  if (nativeLanguage === 'en') {
    return true;
  }

  return words.every((word) => Boolean(word.russian));
}

export function getWordLabel(word: Word, language: NativeLanguage | 'el'): string | undefined {
  if (language === 'el') {
    return word.greek;
  }

  if (language === 'ru') {
    return word.russian;
  }

  return word.english;
}
