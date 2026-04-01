import { t } from '../lib/i18n';
import type { Level, NativeLanguage } from '../types';
import styles from './Home.module.css';
import ui from '../styles/ui.module.css';

type HomeProps = {
  uiLanguage: NativeLanguage;
  currentLevel: Level;
  learnedWords: number;
  weakWords: number;
  totalWords: number;
  learnedPercent: number;
  reviewPercent: number;
  canStartLesson: boolean;
  hasMistakesToReview: boolean;
  onStartLesson: () => void;
  onStartReview: () => void;
};

function Home({
  uiLanguage,
  currentLevel,
  learnedWords,
  weakWords,
  totalWords,
  learnedPercent,
  reviewPercent,
  canStartLesson,
  hasMistakesToReview,
  onStartLesson,
  onStartReview,
}: HomeProps) {
  return (
    <>
      <section className={`${ui.panel} ${ui.introPanel}`}>
        <h1>{t(uiLanguage, 'title')}</h1>
      </section>

      <section className={`${ui.panel} ${styles.settingsPanel}`}>
        <section className={styles.levelProgressCard} aria-label={t(uiLanguage, 'levelProgress')}>
          <h2 className={styles.currentLevel}>{t(uiLanguage, 'level')}: {currentLevel}</h2>
          <div className={styles.progressCopy}>
            <span className={styles.progressMeta}>
              {learnedWords} / {totalWords} {t(uiLanguage, 'learnedWords').toLowerCase()}
            </span>
          </div>
          <div className={styles.segmentedProgress} aria-hidden="true">
            <span className={`${styles.segment} ${styles.learnedSegment}`} style={{ width: `${learnedPercent}%` }} />
            <span className={`${styles.segment} ${styles.reviewSegment}`} style={{ width: `${reviewPercent}%` }} />
          </div>
          <div className={styles.progressLegend}>
            <span className={styles.legendItem}>
              <i className={`${styles.legendDot} ${styles.learnedDot}`} />
              {t(uiLanguage, 'learnedWords')}: {learnedWords}
            </span>
            <span className={styles.legendItem}>
              <i className={`${styles.legendDot} ${styles.reviewDot}`} />
              {t(uiLanguage, 'reviewReady')}: {weakWords}
            </span>
          </div>
        </section>

        {!canStartLesson && <p className={ui.notice}>{t(uiLanguage, 'insufficientWords')}</p>}

        <div className={ui.actions}>
          <button className={ui.primaryButton} type="button" onClick={onStartLesson} disabled={!canStartLesson}>
            {t(uiLanguage, 'startLesson')}
          </button>
          <button className={ui.secondaryButton} type="button" onClick={onStartReview} disabled={!hasMistakesToReview}>
            {t(uiLanguage, 'repeatMistakes')}
          </button>
        </div>
      </section>
    </>
  );
}

export default Home;
