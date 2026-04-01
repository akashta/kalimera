import type { Level, LevelProgress, LessonAnswer, UserProgress } from '../types';

export const LEVELS: Level[] = ['A1', 'A2', 'B1'];

export function createEmptyLevelProgress(): LevelProgress {
  return {
    words: {},
    completedLessons: 0,
    totalCorrect: 0,
    totalWrong: 0,
  };
}

function normalizeWordProgress(word: LevelProgress['words'][string] | undefined) {
  return {
    correct: word?.correct ?? 0,
    wrong: word?.wrong ?? 0,
    streak: word?.streak ?? 0,
    correctDirections: {
      elToNative: word?.correctDirections?.elToNative ?? false,
      nativeToEl: word?.correctDirections?.nativeToEl ?? false,
    },
    learnedByChoice: word?.learnedByChoice ?? false,
    lastSeenAt: word?.lastSeenAt,
  };
}

export function isWordLearned(word: LevelProgress['words'][string] | undefined): boolean {
  if (!word) {
    return false;
  }

  if (word.learnedByChoice) {
    return true;
  }

  return Boolean(word.correctDirections?.elToNative && word.correctDirections?.nativeToEl);
}

export function createDefaultProgress(): UserProgress {
  return {
    settings: {
      currentLevel: 'A1',
      nativeLanguage: 'en',
    },
    levels: {
      A1: createEmptyLevelProgress(),
      A2: createEmptyLevelProgress(),
      B1: createEmptyLevelProgress(),
    },
  };
}

export function mergeProgress(rawValue: Partial<UserProgress> | null | undefined): UserProgress {
  const base = createDefaultProgress();

  if (!rawValue) {
    return base;
  }

  return {
    settings: {
      currentLevel: rawValue.settings?.currentLevel ?? base.settings.currentLevel,
      nativeLanguage: rawValue.settings?.nativeLanguage ?? base.settings.nativeLanguage,
    },
    levels: {
      A1: {
        ...base.levels.A1,
        ...(rawValue.levels?.A1 ?? {}),
        words: rawValue.levels?.A1?.words ?? base.levels.A1.words,
      },
      A2: {
        ...base.levels.A2,
        ...(rawValue.levels?.A2 ?? {}),
        words: rawValue.levels?.A2?.words ?? base.levels.A2.words,
      },
      B1: {
        ...base.levels.B1,
        ...(rawValue.levels?.B1 ?? {}),
        words: rawValue.levels?.B1?.words ?? base.levels.B1.words,
      },
    },
  };
}

export function applyLessonAnswers(
  previous: UserProgress,
  level: Level,
  answers: LessonAnswer[],
): UserProgress {
  const currentLevel = previous.levels[level];
  const nextWords = { ...currentLevel.words };
  let correctCount = 0;
  let wrongCount = 0;

  for (const answer of answers) {
    const existing = normalizeWordProgress(nextWords[answer.question.wordId]);
    const directionKey = answer.question.promptLanguage === 'el' ? 'elToNative' : 'nativeToEl';

    if (answer.outcome === 'correct') {
      correctCount += 1;
      nextWords[answer.question.wordId] = {
        ...existing,
        correct: existing.correct + 1,
        streak: existing.streak + 1,
        correctDirections: {
          ...existing.correctDirections,
          [directionKey]: true,
        },
        lastSeenAt: new Date().toISOString(),
      };
    } else if (answer.outcome === 'wrong' || answer.outcome === 'dont_know') {
      wrongCount += 1;
      nextWords[answer.question.wordId] = {
        ...existing,
        wrong: existing.wrong + 1,
        streak: 0,
        lastSeenAt: new Date().toISOString(),
      };
    } else if (answer.outcome === 'know_it') {
      nextWords[answer.question.wordId] = {
        ...existing,
        learnedByChoice: true,
        correctDirections: {
          elToNative: true,
          nativeToEl: true,
        },
        lastSeenAt: new Date().toISOString(),
      };
    }
  }

  return {
    ...previous,
    levels: {
      ...previous.levels,
      [level]: {
        ...currentLevel,
        words: nextWords,
        completedLessons: currentLevel.completedLessons + 1,
        totalCorrect: currentLevel.totalCorrect + correctCount,
        totalWrong: currentLevel.totalWrong + wrongCount,
        lastStudiedAt: new Date().toISOString(),
      },
    },
  };
}

export function getMasteredWordCount(levelProgress: LevelProgress): number {
  return Object.values(levelProgress.words).filter((word) => isWordLearned(word)).length;
}

export function getWeakWordIds(levelProgress: LevelProgress): string[] {
  return Object.entries(levelProgress.words)
    .filter(([, word]) => !isWordLearned(word))
    .map(([wordId]) => wordId);
}
