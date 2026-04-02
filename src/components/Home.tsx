import { t } from '../lib/i18n';
import type { LessonGroupId, Level, NativeLanguage } from '../types';
import styles from './Home.module.css';
import ui from '../styles/ui.module.css';
import type { LessonGroupSummary } from '../lib/groups';

type HomeProps = {
  uiLanguage: NativeLanguage;
  currentLevel: Level;
  learnedWords: number;
  weakWords: number;
  newWords: number;
  totalWords: number;
  learnedPercent: number;
  reviewPercent: number;
  newPercent: number;
  groupSummaries: LessonGroupSummary[];
  hasMistakesToReview: boolean;
  hasRussianTranslations: boolean;
  onStartGroupLesson: (groupId: LessonGroupId) => void;
  onStartReview: () => void;
};

function Home({
  uiLanguage,
  currentLevel,
  learnedWords,
  weakWords,
  newWords,
  totalWords,
  learnedPercent,
  reviewPercent,
  newPercent,
  groupSummaries,
  hasMistakesToReview,
  hasRussianTranslations,
  onStartGroupLesson,
  onStartReview,
}: HomeProps) {
  return (
    <>
      <section className={`${ui.panel} ${ui.introPanel}`}>
        <h1>{t(uiLanguage, 'title')}</h1>
      </section>

      <section className={`${ui.panel} ${styles.settingsPanel}`}>
        <section className={styles.levelProgressCard} aria-label={t(uiLanguage, 'levelProgress')}>
          <h2 className={styles.currentLevel}>
            {t(uiLanguage, 'level')}: {currentLevel}
          </h2>
          <div className={styles.progressCopy}>
            <span className={styles.progressMeta}>
              {learnedWords} / {totalWords} {t(uiLanguage, 'learnedWords').toLowerCase()}
            </span>
          </div>
          <div className={styles.segmentedProgress} aria-hidden="true">
            <span className={`${styles.segment} ${styles.learnedSegment}`} style={{ width: `${learnedPercent}%` }} />
            <span className={`${styles.segment} ${styles.reviewSegment}`} style={{ width: `${reviewPercent}%` }} />
            <span className={`${styles.segment} ${styles.newSegment}`} style={{ width: `${newPercent}%` }} />
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
            <span className={styles.legendItem}>
              <i className={`${styles.legendDot} ${styles.newDot}`} />
              {t(uiLanguage, 'newWords')}: {newWords}
            </span>
          </div>
        </section>

        <section className={styles.groupSection}>
          <h3 className={styles.groupHeading}>{t(uiLanguage, 'lessonGroups')}</h3>
          <div className={styles.groupGrid}>
            {groupSummaries.map((group) => (
              <button
                key={group.id}
                type="button"
                className={styles.groupCard}
                onClick={() => onStartGroupLesson(group.id)}
              >
                <span className={styles.groupTopRow}>
                  <span className={styles.groupName}>{group.label}</span>
                  <span className={styles.groupMeta}>
                    {group.learnedWords} / {group.totalWords}
                  </span>
                </span>
                <span className={styles.groupProgress} aria-hidden="true">
                  <span
                    className={`${styles.segment} ${styles.learnedSegment}`}
                    style={{
                      width: `${group.totalWords === 0 ? 0 : (group.learnedWords / group.totalWords) * 100}%`,
                    }}
                  />
                  <span
                    className={`${styles.segment} ${styles.reviewSegment}`}
                    style={{
                      width: `${group.totalWords === 0 ? 0 : (group.weakWords / group.totalWords) * 100}%`,
                    }}
                  />
                  <span
                    className={`${styles.segment} ${styles.newSegment}`}
                    style={{
                      width: `${group.totalWords === 0 ? 0 : ((group.totalWords - group.learnedWords - group.weakWords) / group.totalWords) * 100}%`,
                    }}
                  />
                </span>
              </button>
            ))}
          </div>
        </section>

        {!hasRussianTranslations && <p className={ui.notice}>{t(uiLanguage, 'noRussianData')}</p>}

        <section className={styles.reviewSection}>
          <button
            className={styles.reviewCard}
            type="button"
            onClick={onStartReview}
            disabled={!hasMistakesToReview}
          >
            <span className={styles.groupTopRow}>
              <span className={styles.groupName}>{t(uiLanguage, 'repeatMistakes')}</span>
              <span className={styles.groupMeta}>{weakWords}</span>
            </span>
            <span className={styles.groupProgress} aria-hidden="true">
              <span
                className={`${styles.segment} ${styles.reviewSegment}`}
                style={{ width: `${totalWords === 0 ? 0 : (weakWords / totalWords) * 100}%` }}
              />
            </span>
          </button>
        </section>
      </section>
    </>
  );
}

export default Home;
