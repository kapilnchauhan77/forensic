import { useState, useEffect, useCallback } from 'react';
import { LearningProgress } from '../data/learningCases';

const STORAGE_KEY_PREFIX = 'learning_progress_';

interface UseLearningProgressReturn {
  progress: LearningProgress | null;
  saveProgress: (updates: Partial<LearningProgress>) => void;
  resetProgress: () => void;
  initializeProgress: (chapterId: string, sceneId: string) => void;
  isCompleted: boolean;
  score: number;
}

export function useLearningProgress(caseId: string): UseLearningProgressReturn {
  const [progress, setProgress] = useState<LearningProgress | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${caseId}`;

  // Load progress from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LearningProgress;
        setProgress(parsed);
      } catch {
        console.error('Failed to parse learning progress from localStorage');
      }
    }
  }, [storageKey]);

  // Save progress to localStorage
  const saveToStorage = useCallback(
    (data: LearningProgress) => {
      localStorage.setItem(storageKey, JSON.stringify(data));
    },
    [storageKey]
  );

  // Initialize new progress
  const initializeProgress = useCallback(
    (chapterId: string, sceneId: string) => {
      const newProgress: LearningProgress = {
        caseId,
        currentChapter: chapterId,
        currentScene: sceneId,
        score: 0,
        completedScenes: [],
        startedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        isCompleted: false,
      };
      setProgress(newProgress);
      saveToStorage(newProgress);
    },
    [caseId, saveToStorage]
  );

  // Update progress
  const saveProgress = useCallback(
    (updates: Partial<LearningProgress>) => {
      setProgress((current) => {
        if (!current) return null;

        const updated: LearningProgress = {
          ...current,
          ...updates,
          lastPlayedAt: new Date().toISOString(),
        };
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Reset progress
  const resetProgress = useCallback(() => {
    localStorage.removeItem(storageKey);
    setProgress(null);
  }, [storageKey]);

  return {
    progress,
    saveProgress,
    resetProgress,
    initializeProgress,
    isCompleted: progress?.isCompleted ?? false,
    score: progress?.score ?? 0,
  };
}

// Get all progress entries for the learning page
export function getAllLearningProgress(): Record<string, LearningProgress> {
  const result: Record<string, LearningProgress> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const caseId = key.replace(STORAGE_KEY_PREFIX, '');
          result[caseId] = JSON.parse(stored);
        } catch {
          // Skip invalid entries
        }
      }
    }
  }

  return result;
}
