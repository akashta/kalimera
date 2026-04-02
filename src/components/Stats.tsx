import { t } from '../lib/i18n';
import { LEVELS, getMasteredWordCount, getWeakWordIds } from '../lib/progress';
import { wordsByLevel } from '../lib/words';
import type { Level, LevelStats, NativeLanguage, UserProgress } from '../types';
import styles from './Stats.module.css';
import ui from '../styles/ui.module.css';

type StatsProps = {
  uiLanguage: NativeLanguage;
  currentLevel: Level;
  currentLevelStats: LevelStats;
  progress: UserProgress;
  learnedWords: number;
  weakWords: number;
  accuracy: number;
};

function Stats({
  uiLanguage,
  currentLevel,
  currentLevelStats,
  progress,
  learnedWords,
  weakWords,
  accuracy,
}: StatsProps) {
  return (
    <>
      <section className={`${ui.panel} ${ui.introPanel}`}>
        <h1>{t(uiLanguage, 'statsTitle')}</h1>
      </section>

      <section className={`${ui.panel} ${styles.heroPanel}`}>
        <div className={styles.heroStats}>
          <article className={styles.heroCard}>
            <span className={styles.heroLabel}>{t(uiLanguage, 'learnedWords')}</span>
            <strong className={styles.heroValue}>{learnedWords}</strong>
          </article>
          <article className={styles.heroCard}>
            <span className={styles.heroLabel}>{t(uiLanguage, 'weakWords')}</span>
            <strong className={styles.heroValue}>{weakWords}</strong>
          </article>
          <article className={styles.heroCard}>
            <span className={styles.heroLabel}>{t(uiLanguage, 'completedLessons')}</span>
            <strong className={styles.heroValue}>{currentLevelStats.completedLessons}</strong>
          </article>
          <article className={styles.heroCard}>
            <span className={styles.heroLabel}>{t(uiLanguage, 'accuracy')}</span>
            <strong className={styles.heroValue}>{accuracy}%</strong>
          </article>
        </div>
      </section>

      <section className={`${ui.panel} ${styles.levelPanel}`}>
        {LEVELS.map((level) => {
          const levelStats = progress.levels[level];
          const levelAttempts = levelStats.totalCorrect + levelStats.totalWrong;
          const levelAccuracy = levelAttempts === 0 ? 0 : Math.round((levelStats.totalCorrect / levelAttempts) * 100);
          const levelWords = wordsByLevel[level];

          return (
            <article
              key={level}
              className={level === currentLevel ? `${styles.levelCard} ${styles.selected}` : styles.levelCard}
            >
              <header className={styles.levelHeader}>
                <h2>{level}</h2>
                <span className={styles.levelMeta}>
                  {levelWords.length} {t(uiLanguage, 'words')}
                </span>
              </header>
              <p className={styles.levelCopy}>
                {getMasteredWordCount(progress.words, levelWords)} {t(uiLanguage, 'learned')}, {getWeakWordIds(progress.words, levelWords).length}{' '}
                {t(uiLanguage, 'weak')}
              </p>
              <p className={styles.levelCopy}>
                {levelStats.completedLessons} {t(uiLanguage, 'lessons')}, {levelAccuracy}%{' '}
                {t(uiLanguage, 'accuracy').toLowerCase()}
              </p>
            </article>
          );
        })}
      </section>
    </>
  );
}

export default Stats;
