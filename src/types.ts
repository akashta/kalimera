export type Level = 'A1' | 'A2' | 'B1';
export type NativeLanguage = 'en' | 'ru';
export type LanguageCode = 'el' | NativeLanguage;

export interface Word {
  id: string;
  greek: string;
  english: string;
  russian?: string;
  level: Level;
}

export interface WordProgress {
  correct: number;
  wrong: number;
  streak: number;
  correctDirections?: {
    elToNative?: boolean;
    nativeToEl?: boolean;
  };
  learnedByChoice?: boolean;
  lastSeenAt?: string;
}

export interface LevelProgress {
  words: Record<string, WordProgress>;
  completedLessons: number;
  totalCorrect: number;
  totalWrong: number;
  lastStudiedAt?: string;
}

export interface UserSettings {
  currentLevel: Level;
  nativeLanguage: NativeLanguage;
  hasCompletedOnboarding: boolean;
}

export interface UserProgress {
  settings: UserSettings;
  levels: Record<Level, LevelProgress>;
}

export interface LessonQuestion {
  wordId: string;
  prompt: string;
  promptLanguage: LanguageCode;
  answerLanguage: LanguageCode;
  correctAnswer: string;
  choices: string[];
  isReview: boolean;
}

export interface LessonSession {
  level: Level;
  nativeLanguage: NativeLanguage;
  questions: LessonQuestion[];
}

export interface LessonAnswer {
  question: LessonQuestion;
  selectedAnswer?: string;
  outcome: 'correct' | 'wrong' | 'dont_know' | 'know_it';
}
