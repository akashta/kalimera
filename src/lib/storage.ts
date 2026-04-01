import type { LevelProgress, UserProgress, UserSettings } from '../types';
import { createDefaultProgress, mergeProgress } from './progress';

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

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        CloudStorage?: {
          getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
          setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void;
        };
      };
    };
  }
}

class TelegramCloudStorageAdapter implements AppStorage {
  async loadProgress(): Promise<UserProgress> {
    const settings = await this.getItem<UserSettings>('settings');
    const [a1, a2, b1] = await Promise.all([
      this.getItem<LevelProgress>('progress_A1'),
      this.getItem<LevelProgress>('progress_A2'),
      this.getItem<LevelProgress>('progress_B1'),
    ]);

    return mergeProgress({
      settings: settings ?? createDefaultProgress().settings,
      levels: {
        A1: a1 ?? createDefaultProgress().levels.A1,
        A2: a2 ?? createDefaultProgress().levels.A2,
        B1: b1 ?? createDefaultProgress().levels.B1,
      },
    });
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    await Promise.all([
      this.setItem('settings', progress.settings),
      this.setItem('progress_A1', progress.levels.A1),
      this.setItem('progress_A2', progress.levels.A2),
      this.setItem('progress_B1', progress.levels.B1),
    ]);
  }

  private async getItem<T>(key: string): Promise<T | null> {
    const cloudStorage = window.Telegram?.WebApp?.CloudStorage;
    if (!cloudStorage) {
      return null;
    }

    return new Promise((resolve) => {
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
  }

  private async setItem(key: string, value: unknown): Promise<void> {
    const cloudStorage = window.Telegram?.WebApp?.CloudStorage;
    if (!cloudStorage) {
      return;
    }

    return new Promise((resolve) => {
      cloudStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value), () => resolve());
    });
  }
}

export function getStorageAdapter(): AppStorage {
  return window.Telegram?.WebApp?.CloudStorage ? new TelegramCloudStorageAdapter() : new LocalStorageAdapter();
}
