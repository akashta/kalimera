import type { LevelStats, UserProgress, UserSettings, WordProgress } from '../types';
import { createDefaultProgress, mergeProgress } from './progress';
import { supportsTelegramCloudStorage } from './telegram';

export interface AppStorage {
  loadProgress(): Promise<UserProgress>;
  saveProgress(progress: UserProgress): Promise<void>;
}

const STORAGE_PREFIX = 'greek-trainer';

class LocalStorageAdapter implements AppStorage {
  async loadProgress(): Promise<UserProgress> {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:progress`);
    if (!raw) {
      return createDefaultProgress();
    }

    try {
      return mergeProgress(JSON.parse(raw) as UserProgress);
    } catch {
      return createDefaultProgress();
    }
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    window.localStorage.setItem(`${STORAGE_PREFIX}:progress`, JSON.stringify(progress));
  }
}

class TelegramCloudStorageAdapter implements AppStorage {
  async loadProgress(): Promise<UserProgress> {
    const settings = await this.getItem<UserSettings>('settings');
    const [words, statsA2, statsB1] = await Promise.all([
      this.getItem<Record<string, WordProgress>>('progress_words'),
      this.getItem<LevelStats>('stats_A2'),
      this.getItem<LevelStats>('stats_B1'),
    ]);

    return mergeProgress({
      settings: settings ?? createDefaultProgress().settings,
      words: words ?? undefined,
      levels: {
        A2: statsA2 ?? createDefaultProgress().levels.A2,
        B1: statsB1 ?? createDefaultProgress().levels.B1,
      },
    });
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    await Promise.all([
      this.setItem('settings', progress.settings),
      this.setItem('progress_words', progress.words),
      this.setItem('stats_A2', progress.levels.A2),
      this.setItem('stats_B1', progress.levels.B1),
    ]);
  }

  private async getItem<T>(key: string): Promise<T | null> {
    const cloudStorage = window.Telegram?.WebApp?.CloudStorage;
    if (!cloudStorage) {
      return null;
    }

    try {
      return await new Promise((resolve) => {
        cloudStorage.getItem(`${STORAGE_PREFIX}:${key}`, (error, value) => {
          if (error || !value) {
            resolve(null);
            return;
          }

          try {
            resolve(JSON.parse(value) as T);
          } catch {
            resolve(null);
          }
        });
      });
    } catch {
      return null;
    }
  }

  private async setItem(key: string, value: unknown): Promise<void> {
    const cloudStorage = window.Telegram?.WebApp?.CloudStorage;
    if (!cloudStorage) {
      return;
    }

    try {
      await new Promise<void>((resolve) => {
        cloudStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value), () => resolve());
      });
    } catch {
      return;
    }
  }
}

export function getStorageAdapter(): AppStorage {
  return supportsTelegramCloudStorage() ? new TelegramCloudStorageAdapter() : new LocalStorageAdapter();
}
