import { useState } from 'react';
import { t } from '../lib/i18n';
import { LEVELS } from '../lib/progress';
import { hasCompleteNativeTranslations, wordsByLevel } from '../lib/words';
import type { Level, NativeLanguage, UserSettings } from '../types';
import styles from './Home.module.css';
import ui from '../styles/ui.module.css';

type OnboardingProps = {
  onComplete: (settings: Pick<UserSettings, 'currentLevel' | 'nativeLanguage'>) => void | Promise<void>;
};

function Onboarding({ onComplete }: OnboardingProps) {
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage>('en');
  const [currentLevel, setCurrentLevel] = useState<Level>('A2');

  const hasRussianTranslations = hasCompleteNativeTranslations(wordsByLevel[currentLevel], nativeLanguage);
  const uiLanguage = nativeLanguage;

  return (
    <>
      <section className={`${ui.panel} ${ui.introPanel}`}>
        <h1>{t(uiLanguage, 'onboardingTitle')}</h1>
        <p className={ui.subtitle}>{t(uiLanguage, 'onboardingSubtitle')}</p>
      </section>

      <section className={`${ui.panel} ${styles.settingsPanel}`}>
        <label className={styles.fieldLabel}>
          <span>{t(uiLanguage, 'nativeLanguage')}</span>
          <select
            className={styles.selectControl}
            value={nativeLanguage}
            onChange={(event) => setNativeLanguage(event.target.value as NativeLanguage)}
          >
            <option value="en">{t(uiLanguage, 'english')}</option>
            <option value="ru">{t(uiLanguage, 'russian')}</option>
          </select>
        </label>

        <label className={styles.fieldLabel}>
          <span>{t(uiLanguage, 'level')}</span>
          <select
            className={styles.selectControl}
            value={currentLevel}
            onChange={(event) => setCurrentLevel(event.target.value as Level)}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        {nativeLanguage === 'ru' && !hasRussianTranslations && <p className={ui.notice}>{t(uiLanguage, 'noRussianData')}</p>}

        <div className={ui.actions}>
          <button
            className={ui.primaryButton}
            type="button"
            onClick={() => onComplete({ currentLevel, nativeLanguage })}
          >
            {t(uiLanguage, 'continueAction')}
          </button>
        </div>
      </section>
    </>
  );
}

export default Onboarding;
