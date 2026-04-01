import type {
  LanguageCode,
  LessonQuestion,
  LessonSession,
  Level,
  NativeLanguage,
  UserProgress,
  Word,
} from '../types';
import { getWeakWordIds, isWordLearned } from './progress';
import { getWordLabel } from './words';

const LESSON_WORD_COUNT = 10;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function startsWithUppercase(text: string): boolean {
  const firstCharacter = text.trim().charAt(0);
  return firstCharacter.length > 0 && firstCharacter === firstCharacter.toLocaleUpperCase();
}

function sortWordsForLesson(words: Word[], progress: UserProgress, level: Level): Word[] {
  const levelProgress = progress.levels[level];

  return [...words].sort((left, right) => {
    const leftProgress = levelProgress.words[left.id];
    const rightProgress = levelProgress.words[right.id];

    const leftLearned = isWordLearned(leftProgress) ? 1 : 0;
    const rightLearned = isWordLearned(rightProgress) ? 1 : 0;
    if (leftLearned !== rightLearned) {
      return leftLearned - rightLearned;
    }

    const leftSeen = leftProgress ? 1 : 0;
    const rightSeen = rightProgress ? 1 : 0;
    if (leftSeen !== rightSeen) {
      return leftSeen - rightSeen;
    }

    const leftScore = (leftProgress?.correct ?? 0) - (leftProgress?.wrong ?? 0);
    const rightScore = (rightProgress?.correct ?? 0) - (rightProgress?.wrong ?? 0);
    return leftScore - rightScore;
  });
}

function createQuestion(
  word: Word,
  pool: Word[],
  promptLanguage: LanguageCode,
  nativeLanguage: NativeLanguage,
  isReview: boolean,
): LessonQuestion | null {
  if (nativeLanguage === 'ru' && !word.russian) {
    return null;
  }

  const answerLanguage: LanguageCode = promptLanguage === 'el' ? nativeLanguage : 'el';
  const prompt = getWordLabel(word, promptLanguage);
  const correctAnswer = getWordLabel(word, answerLanguage);

  if (!prompt || !correctAnswer) {
    return null;
  }

  const requireUppercase = startsWithUppercase(correctAnswer);

  const distractors = shuffle(
    pool.filter((candidate) => {
      if (candidate.id === word.id) {
        return false;
      }

      const label = getWordLabel(candidate, answerLanguage);
      return Boolean(label && label !== correctAnswer && startsWithUppercase(label) === requireUppercase);
    }),
  )
    .map((candidate) => getWordLabel(candidate, answerLanguage))
    .filter((label): label is string => Boolean(label))
    .slice(0, 3);

  if (distractors.length < 3) {
    return null;
  }

  return {
    wordId: word.id,
    prompt,
    promptLanguage,
    answerLanguage,
    correctAnswer,
    choices: shuffle([correctAnswer, ...distractors]),
    isReview,
  };
}

function pickLessonWords(words: Word[], progress: UserProgress, level: Level): Word[] {
  const orderedWords = sortWordsForLesson(words, progress, level);
  const weakWordIds = new Set(getWeakWordIds(progress.levels[level]));
  const unseenWords = orderedWords.filter((word) => !progress.levels[level].words[word.id]);
  const weakWords = orderedWords.filter((word) => weakWordIds.has(word.id));
  const seenWords = orderedWords.filter((word) => progress.levels[level].words[word.id] && !weakWordIds.has(word.id));

  const uniqueTargets: Word[] = [];
  const addWords = (candidates: Word[], limit: number) => {
    for (const word of shuffle(candidates)) {
      if (uniqueTargets.length >= limit) {
        break;
      }
      if (!uniqueTargets.some((candidate) => candidate.id === word.id)) {
        uniqueTargets.push(word);
      }
    }
  };

  addWords(unseenWords, 6);
  addWords(weakWords, 9);
  addWords(unseenWords, LESSON_WORD_COUNT);
  addWords(weakWords, LESSON_WORD_COUNT);
  addWords(seenWords, LESSON_WORD_COUNT);

  return uniqueTargets.slice(0, LESSON_WORD_COUNT);
}

function buildQuestionsForWords(
  words: Word[],
  pool: Word[],
  nativeLanguage: NativeLanguage,
  isReviewLookup: Set<string>,
): LessonQuestion[] {
  const greekToNative = words
    .map((word) => createQuestion(word, pool, 'el', nativeLanguage, isReviewLookup.has(word.id)))
    .filter((question): question is LessonQuestion => Boolean(question));

  const nativeToGreek = words
    .map((word) => createQuestion(word, pool, nativeLanguage, nativeLanguage, isReviewLookup.has(word.id)))
    .filter((question): question is LessonQuestion => Boolean(question));

  return [...greekToNative, ...nativeToGreek];
}

export function buildLessonSession(
  words: Word[],
  progress: UserProgress,
  level: Level,
  nativeLanguage: NativeLanguage,
): LessonSession {
  const weakWordIds = new Set(getWeakWordIds(progress.levels[level]));
  const lessonWords = pickLessonWords(words, progress, level);
  const questions = buildQuestionsForWords(lessonWords, words, nativeLanguage, weakWordIds);

  return {
    level,
    nativeLanguage,
    questions,
  };
}

export function buildReviewSession(
  words: Word[],
  nativeLanguage: NativeLanguage,
  wordIds: string[],
): LessonSession {
  const preferredWords = shuffle(words.filter((word) => wordIds.includes(word.id)));
  const fallbackWords = shuffle(words.filter((word) => !wordIds.includes(word.id)));
  const targetWords = [...preferredWords, ...fallbackWords].slice(0, LESSON_WORD_COUNT);
  const reviewLookup = new Set(wordIds);
  const questions = buildQuestionsForWords(targetWords, words, nativeLanguage, reviewLookup);

  return {
    level: targetWords[0]?.level ?? 'A1',
    nativeLanguage,
    questions,
  };
}
