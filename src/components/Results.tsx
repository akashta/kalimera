import { t } from '../lib/i18n';
import type { LessonAnswer, NativeLanguage } from '../types';
import styles from './Results.module.css';
import ui from '../styles/ui.module.css';

type ResultsProps = {
  uiLanguage: NativeLanguage;
  correctAnswers: number;
  scoredAnswers: number;
  totalAnswers: number;
  lessonMistakes: string[];
  mistakeAnswers: LessonAnswer[];
  onBack: () => void;
  onStartReview: () => void;
};

function Results({
  uiLanguage,
  correctAnswers,
  scoredAnswers,
  totalAnswers,
  lessonMistakes,
  mistakeAnswers,
  onBack,
  onStartReview,
}: ResultsProps) {
  return (
    <section className={`${ui.panel} ${styles.resultsPanel} ${styles.resultsScreen}`}>
      <p className={ui.kicker}>{t(uiLanguage, 'score')}</p>
      <h1>
        {correctAnswers}/{scoredAnswers || totalAnswers}
      </h1>

      <section className={styles.resultsBlock}>
        {lessonMistakes.length === 0 ? (
          <p className={styles.emptyMessage}>{t(uiLanguage, 'noMistakes')}</p>
        ) : (
          <>
            <h2 className={styles.resultsHeading}>{t(uiLanguage, 'mistakesList')}</h2>
            <div className={`${styles.resultsList} ${styles.compactResultsList}`}>
              {mistakeAnswers.slice(0, 8).map((answer) => (
                <article key={`${answer.question.wordId}-${answer.question.prompt}`} className={styles.resultsRow}>
                  <strong className={styles.resultsPrompt}>{answer.question.prompt}</strong>
                  <span className={styles.resultsArrow}>&rarr;</span>
                  <span className={styles.resultsAnswer}>{answer.question.correctAnswer}</span>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <div className={ui.actions}>
        <button type="button" className={ui.primaryButton} onClick={onBack}>
          {t(uiLanguage, 'backToDashboard')}
        </button>
        <button type="button" className={ui.secondaryButton} onClick={onStartReview} disabled={lessonMistakes.length === 0}>
          {t(uiLanguage, 'repeatMistakes')}
        </button>
      </div>
    </section>
  );
}

export default Results;
