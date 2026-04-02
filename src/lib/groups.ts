import { t, type TranslationKey } from './i18n';
import { isWordLearned } from './progress';
import type { LessonGroupId, NativeLanguage, Word, WordProgress, WordGroupId } from '../types';

export type LessonGroupSummary = {
  id: LessonGroupId;
  label: string;
  totalWords: number;
  learnedWords: number;
  weakWords: number;
};

export const WORD_GROUPS: WordGroupId[] = [
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

const GROUP_LABEL_KEYS: Record<LessonGroupId, TranslationKey> = {
  all: 'allWords',
  basics: 'groupBasics',
  language: 'groupLanguage',
  verbs: 'groupVerbs',
  people: 'groupPeople',
  food: 'groupFood',
  home: 'groupHome',
  body: 'groupBody',
  clothes: 'groupClothes',
  money: 'groupMoney',
  school: 'groupSchool',
  city: 'groupCity',
  countries: 'groupCountries',
  weather: 'groupWeather',
  animals: 'groupAnimals',
  time: 'groupTime',
  communication: 'groupCommunication',
  feelings: 'groupFeelings',
  leisure: 'groupLeisure',
  society: 'groupSociety',
  general: 'groupGeneral',
};

export function getLessonGroupLabel(groupId: LessonGroupId, language: NativeLanguage): string {
  return t(language, GROUP_LABEL_KEYS[groupId]);
}

export function getWordsForGroup(words: Word[], groupId: LessonGroupId): Word[] {
  if (groupId === 'all') {
    return words;
  }

  return words.filter((word) => word.group === groupId);
}

export function buildLessonGroupSummaries(
  words: Word[],
  wordsProgress: Record<string, WordProgress>,
  language: NativeLanguage,
): LessonGroupSummary[] {
  const summaries: LessonGroupSummary[] = [
    {
      id: 'all',
      label: getLessonGroupLabel('all', language),
      totalWords: words.length,
      learnedWords: words.filter((word) => isWordLearned(wordsProgress[word.id])).length,
      weakWords: words.filter((word) => {
        const progress = wordsProgress[word.id];
        return Boolean(progress) && !isWordLearned(progress);
      }).length,
    },
  ];

  for (const groupId of WORD_GROUPS) {
    const groupWords = words.filter((word) => word.group === groupId);
    if (groupWords.length === 0) {
      continue;
    }

    summaries.push({
      id: groupId,
      label: getLessonGroupLabel(groupId, language),
      totalWords: groupWords.length,
      learnedWords: groupWords.filter((word) => isWordLearned(wordsProgress[word.id])).length,
      weakWords: groupWords.filter((word) => {
        const progress = wordsProgress[word.id];
        return Boolean(progress) && !isWordLearned(progress);
      }).length,
    });
  }

  return summaries;
}
