import csvText from '../../words.csv?raw';
import type { Level, NativeLanguage, Word, WordGroupId } from '../types';
import { parseCsv } from './csv';

const SUPPORTED_LEVELS: Level[] = ['A2', 'B1'];
const MIN_GROUP_WORDS = 10;
const SUPPORTED_GROUPS: WordGroupId[] = [
  'basics',
  'language',
  'verbs',
  'people',
  'food',
  'home',
  'body',
  'clothes',
  'money',
  'school',
  'city',
  'countries',
  'weather',
  'animals',
  'time',
  'communication',
  'feelings',
  'leisure',
  'society',
  'general',
];

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
  const groupIndex = pickHeaderIndex(headerRow, ['group']);

  if (greekIndex === -1 || englishIndex === -1 || levelIndex === -1 || groupIndex === -1) {
    throw new Error('words.csv must contain greek, english, level, and group columns.');
  }

  const parsedWords = dataRows.reduce<Word[]>((words, row, index) => {
    const levelValue = row[levelIndex]?.trim().toUpperCase();
    if (!levelValue || !SUPPORTED_LEVELS.includes(levelValue as Level)) {
      return words;
    }

    const greek = row[greekIndex]?.trim();
    const english = row[englishIndex]?.trim();
    const russian = russianIndex >= 0 ? row[russianIndex]?.trim() : undefined;
    const group = row[groupIndex]?.trim().toLowerCase() as WordGroupId | undefined;

    if (!greek || !english) {
      return words;
    }

    const id = row[idIndex]?.trim() || String(index + 1);

    words.push({
      id,
      greek,
      english,
      russian: russian || undefined,
      level: levelValue as Level,
      group: SUPPORTED_GROUPS.includes(group as WordGroupId) ? (group as WordGroupId) : 'general',
    });

    return words;
  }, []);

  const groupCountsByLevel = parsedWords.reduce<Record<Level, Partial<Record<WordGroupId, number>>>>(
    (counts, word) => {
      if (word.group !== 'general') {
        counts[word.level][word.group] = (counts[word.level][word.group] ?? 0) + 1;
      }

      return counts;
    },
    {
      A2: {},
      B1: {},
    },
  );

  return parsedWords.map((word) => {
    if (word.group === 'general') {
      return word;
    }

    const groupCount = groupCountsByLevel[word.level][word.group] ?? 0;
    return groupCount >= MIN_GROUP_WORDS ? word : { ...word, group: 'general' };
  });
}

export const allWords = parseWords();

export const wordsByLevel: Record<Level, Word[]> = {
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
