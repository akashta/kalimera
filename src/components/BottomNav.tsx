import { t } from '../lib/i18n';
import type { NativeLanguage } from '../types';
import styles from './BottomNav.module.css';

type BottomNavProps = {
  screen: 'home' | 'stats' | 'settings';
  uiLanguage: NativeLanguage;
  onChangeScreen: (screen: 'home' | 'stats' | 'settings') => void;
};

function BottomNav({ screen, uiLanguage, onChangeScreen }: BottomNavProps) {
  return (
    <nav className={styles.tabBar} aria-label="Primary">
      <button
        type="button"
        className={screen === 'home' ? `${styles.tabButton} ${styles.active}` : styles.tabButton}
        onClick={() => onChangeScreen('home')}
      >
        {t(uiLanguage, 'homeTab')}
      </button>
      <button
        type="button"
        className={screen === 'stats' ? `${styles.tabButton} ${styles.active}` : styles.tabButton}
        onClick={() => onChangeScreen('stats')}
      >
        {t(uiLanguage, 'statsTab')}
      </button>
      <button
        type="button"
        className={screen === 'settings' ? `${styles.tabButton} ${styles.active}` : styles.tabButton}
        onClick={() => onChangeScreen('settings')}
      >
        {t(uiLanguage, 'settingsTab')}
      </button>
    </nav>
  );
}

export default BottomNav;
