import { useEffect, useMemo, useRef, useState } from 'react';
import BottomNav from './components/BottomNav';
import Home from './components/Home';
import Lesson from './components/Lesson';
import Results from './components/Results';
import Stats from './components/Stats';
import styles from './App.module.css';
import { playCorrectSound, playLessonFinishedSound, playWrongSound, speakGreek } from './lib/audio';
import { t } from './lib/i18n';
import { buildLessonSession, buildReviewSession } from './lib/lesson';
import { applyLessonAnswers, createDefaultProgress, getMasteredWordCount, getWeakWordIds } from './lib/progress';
import { getStorageAdapter } from './lib/storage';
import { hasCompleteNativeTranslations, wordsByLevel } from './lib/words';
import type { LessonAnswer, LessonSession, UserProgress } from './types';

type Screen = 'home' | 'stats' | 'lesson' | 'results';

const storage = getStorageAdapter();

function App() {
  const advanceTimeoutRef = useRef<number | null>(null);
  const lastAutoSpokenQuestionRef = useRef<string | null>(null);
  const [progress, setProgress] = useState<UserProgress>(createDefaultProgress());
  const [screen, setScreen] = useState<Screen>('home');
  const [activeLesson, setActiveLesson] = useState<LessonSession | null>(null);
  const [answers, setAnswers] = useState<LessonAnswer[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState<LessonAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentLevel = progress.settings.currentLevel;
  const currentWords = wordsByLevel[currentLevel];
  const currentLevelProgress = progress.levels[currentLevel];
  const uiLanguage = progress.settings.nativeLanguage;
  const question = activeLesson?.questions[questionIndex] ?? null;
  const hasRussianTranslations = useMemo(
    () => hasCompleteNativeTranslations(currentWords, progress.settings.nativeLanguage),
    [currentWords, progress.settings.nativeLanguage],
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      const nextProgress = await storage.loadProgress();
      if (mounted) {
        setProgress(nextProgress);
        setIsLoading(false);
      }
    }

    void load();

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready?.();
      window.Telegram.WebApp.expand?.();
    }

    return () => {
      mounted = false;
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (screen !== 'lesson' || !question || question.promptLanguage !== 'el') {
      return;
    }

    const questionKey = `${question.wordId}:${questionIndex}:${question.promptLanguage}`;
    if (lastAutoSpokenQuestionRef.current === questionKey) {
      return;
    }

    lastAutoSpokenQuestionRef.current = questionKey;
    speakGreek(question.prompt);
  }, [question, questionIndex, screen]);

  async function persistProgress(nextProgress: UserProgress) {
    setProgress(nextProgress);
    await storage.saveProgress(nextProgress);
  }

  async function updateSettings(nextSettings: Partial<UserProgress['settings']>) {
    const nextProgress = {
      ...progress,
      settings: {
        ...progress.settings,
        ...nextSettings,
      },
    };
    await persistProgress(nextProgress);
  }

  function openLesson(lesson: LessonSession) {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    lastAutoSpokenQuestionRef.current = null;
    setActiveLesson(lesson);
    setAnswers([]);
    setQuestionIndex(0);
    setCurrentResponse(null);
    setScreen('lesson');
  }

  function startLesson() {
    openLesson(
      buildLessonSession(
        currentWords,
        progress,
        progress.settings.currentLevel,
        progress.settings.nativeLanguage,
      ),
    );
  }

  function startReview(wordIds?: string[]) {
    const targetWordIds = wordIds && wordIds.length > 0 ? wordIds : getWeakWordIds(currentLevelProgress);
    openLesson(buildReviewSession(currentWords, progress.settings.nativeLanguage, targetWordIds));
  }

  function queueAdvance(nextAnswers: LessonAnswer[]) {
    advanceTimeoutRef.current = window.setTimeout(() => {
      void moveToNextQuestion(nextAnswers);
    }, 850);
  }

  function submitChoice(choice: string) {
    if (!question || currentResponse) {
      return;
    }

    const isCorrect = choice === question.correctAnswer;
    const response: LessonAnswer = {
      question,
      selectedAnswer: choice,
      outcome: isCorrect ? 'correct' : 'wrong',
    };
    const nextAnswers = [...answers, response];

    setCurrentResponse(response);
    setAnswers(nextAnswers);

    const playResultSound = () => {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    };

    if (question.answerLanguage === 'el') {
      void speakGreek(choice).finally(() => {
        playResultSound();
        queueAdvance(nextAnswers);
      });
      return;
    }

    playResultSound();
    queueAdvance(nextAnswers);
  }

  function revealAnswer() {
    if (!question || currentResponse) {
      return;
    }

    const response: LessonAnswer = {
      question,
      outcome: 'dont_know',
    };
    const nextAnswers = [...answers, response];

    setCurrentResponse(response);
    setAnswers(nextAnswers);
    playWrongSound();
    queueAdvance(nextAnswers);
  }

  function markKnown() {
    if (!question || currentResponse) {
      return;
    }

    const response: LessonAnswer = {
      question,
      outcome: 'know_it',
    };
    const nextAnswers = [...answers, response];

    setCurrentResponse(response);
    setAnswers(nextAnswers);
    playCorrectSound();
    queueAdvance(nextAnswers);
  }

  async function moveToNextQuestion(nextAnswersArg?: LessonAnswer[]) {
    if (!activeLesson) {
      return;
    }

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    const nextAnswers = nextAnswersArg ?? answers;
    const isLastQuestion = questionIndex >= activeLesson.questions.length - 1;
    if (isLastQuestion) {
      const nextProgress = applyLessonAnswers(progress, activeLesson.level, nextAnswers);
      playLessonFinishedSound();
      await persistProgress(nextProgress);
      setScreen('results');
      return;
    }

    setQuestionIndex((current) => current + 1);
    setCurrentResponse(null);
  }

  function resetToHome() {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    lastAutoSpokenQuestionRef.current = null;
    setActiveLesson(null);
    setAnswers([]);
    setQuestionIndex(0);
    setCurrentResponse(null);
    setScreen('home');
  }

  const correctAnswers = answers.filter((answer) => answer.outcome === 'correct').length;
  const scoredAnswers = answers.filter((answer) => answer.outcome !== 'know_it').length;
  const weakWords = getWeakWordIds(currentLevelProgress).length;
  const learnedWords = getMasteredWordCount(currentLevelProgress);
  const totalWords = currentWords.length;
  const learnedPercent = totalWords === 0 ? 0 : Math.min(100, (learnedWords / totalWords) * 100);
  const reviewPercent = totalWords === 0 ? 0 : Math.min(100 - learnedPercent, (weakWords / totalWords) * 100);
  const totalAttempts = currentLevelProgress.totalCorrect + currentLevelProgress.totalWrong;
  const accuracy = totalAttempts === 0 ? 0 : Math.round((currentLevelProgress.totalCorrect / totalAttempts) * 100);
  const canStartLesson =
    currentWords.length >= 10 && (progress.settings.nativeLanguage === 'en' || hasRussianTranslations);
  const lessonMistakes = answers
    .filter((answer) => answer.outcome === 'wrong' || answer.outcome === 'dont_know')
    .map((answer) => answer.question.wordId);
  const mistakeAnswers = answers.filter((answer) => answer.outcome === 'wrong' || answer.outcome === 'dont_know');
  const hasMistakesToReview = weakWords > 0;
  const currentPromptLabel =
    question?.answerLanguage === 'el' ? t(uiLanguage, 'answerGreek') : t(uiLanguage, 'answerNative');

  if (isLoading) {
    return <main className={`${styles.appShell} ${styles.loadingState}`}>{t(uiLanguage, 'loading')}</main>;
  }

  return (
    <main
      className={
        screen === 'lesson' || screen === 'results'
          ? `${styles.appShell} ${styles.appShellFocused}`
          : styles.appShell
      }
    >
      {screen === 'home' && (
        <Home
          uiLanguage={uiLanguage}
          settings={progress.settings}
          learnedWords={learnedWords}
          weakWords={weakWords}
          totalWords={totalWords}
          learnedPercent={learnedPercent}
          reviewPercent={reviewPercent}
          canStartLesson={canStartLesson}
          hasMistakesToReview={hasMistakesToReview}
          hasRussianTranslations={hasRussianTranslations}
          onUpdateSettings={updateSettings}
          onStartLesson={startLesson}
          onStartReview={() => startReview()}
        />
      )}
      {screen === 'stats' && (
        <Stats
          uiLanguage={uiLanguage}
          currentLevel={currentLevel}
          currentLevelProgress={currentLevelProgress}
          progress={progress}
          learnedWords={learnedWords}
          weakWords={weakWords}
          accuracy={accuracy}
        />
      )}
      {screen === 'lesson' && question && activeLesson && (
        <Lesson
          uiLanguage={uiLanguage}
          activeLesson={activeLesson}
          question={question}
          questionIndex={questionIndex}
          currentResponse={currentResponse}
          currentPromptLabel={currentPromptLabel}
          onBack={resetToHome}
          onSubmitChoice={submitChoice}
          onRevealAnswer={revealAnswer}
          onMarkKnown={markKnown}
        />
      )}
      {screen === 'results' && (
        <Results
          uiLanguage={uiLanguage}
          correctAnswers={correctAnswers}
          scoredAnswers={scoredAnswers}
          totalAnswers={answers.length}
          lessonMistakes={lessonMistakes}
          mistakeAnswers={mistakeAnswers}
          onBack={resetToHome}
          onStartReview={() => startReview(lessonMistakes)}
        />
      )}

      {(screen === 'home' || screen === 'stats') && (
        <BottomNav screen={screen} uiLanguage={uiLanguage} onChangeScreen={setScreen} />
      )}
    </main>
  );
}

export default App;
