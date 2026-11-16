import type { FinalStoryReport, ParagraphResult } from './storyAnalysis';

const STORY_HISTORY_KEY = 'ai_english_story_history';
const STORY_PROGRESS_KEY = 'ai_english_story_active_progress';
const STORY_STATS_KEY = 'ai_english_story_stats';

export interface ActiveStoryProgress {
  storyId: string;
  storyTitle: string;
  level: string;
  genre: string;
  currentParagraphIndex: number;
  paragraphResults: ParagraphResult[];
  savedAt: string;
}

export interface StoryStats {
  totalStoriesRead: number;
  totalParagraphsRead: number;
  streakDays: number;
  lastPracticeDate: string;
  averageScore: number;
}

// 1. Resume / Active Story Progress Management
export function saveActiveProgress(progress: ActiveStoryProgress): void {
  try {
    localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save story progress to localStorage:', err);
  }
}

export function getActiveProgress(): ActiveStoryProgress | null {
  try {
    const raw = localStorage.getItem(STORY_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveStoryProgress;
  } catch {
    return null;
  }
}

export function clearActiveProgress(): void {
  try {
    localStorage.removeItem(STORY_PROGRESS_KEY);
  } catch (err) {
    console.error('Failed to clear active story progress:', err);
  }
}

// 2. Story History & Comparisons
export function saveStoryReport(report: FinalStoryReport): void {
  try {
    const rawHistory = localStorage.getItem(STORY_HISTORY_KEY);
    const history: FinalStoryReport[] = rawHistory ? JSON.parse(rawHistory) : [];
    history.unshift(report);
    // Keep last 50 story reports
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORY_HISTORY_KEY, JSON.stringify(trimmed));

    // Update global story stats & streaks
    updateStoryStats(report);

    // Clear active progress once finished
    clearActiveProgress();
  } catch (err) {
    console.error('Failed to save story report to localStorage:', err);
  }
}

export function getStoryHistory(): FinalStoryReport[] {
  try {
    const raw = localStorage.getItem(STORY_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPreviousStoryScore(storyId: string): number | null {
  try {
    const history = getStoryHistory();
    const prev = history.find((h) => h.storyId === storyId);
    return prev ? prev.overallScore : null;
  } catch {
    return null;
  }
}

// 3. User Statistics & Streaks
export function getStoryStats(): StoryStats {
  try {
    const raw = localStorage.getItem(STORY_STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    totalStoriesRead: 0,
    totalParagraphsRead: 0,
    streakDays: 0,
    lastPracticeDate: '',
    averageScore: 0,
  };
}

function updateStoryStats(report: FinalStoryReport): void {
  try {
    const stats = getStoryStats();
    const today = new Date().toISOString().split('T')[0];

    let newStreak = stats.streakDays;
    if (!stats.lastPracticeDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(stats.lastPracticeDate);
      const currDate = new Date(today);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // Streak reset
      }
    }

    const newTotalStories = stats.totalStoriesRead + 1;
    const newTotalParagraphs = stats.totalParagraphsRead + report.paragraphResults.length;
    const newAvgScore = Math.round(
      (stats.averageScore * stats.totalStoriesRead + report.overallScore) / newTotalStories
    );

    const updated: StoryStats = {
      totalStoriesRead: newTotalStories,
      totalParagraphsRead: newTotalParagraphs,
      streakDays: newStreak,
      lastPracticeDate: today,
      averageScore: newAvgScore,
    };

    localStorage.setItem(STORY_STATS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update story stats:', err);
  }
}
