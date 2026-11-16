import type { BookSessionReport, BookParagraphResult } from './bookAnalysis';

const BOOK_SESSION_HISTORY_KEY = 'ai_english_book_session_history';
const BOOK_ACTIVE_PROGRESS_KEY = 'ai_english_book_active_progress';
const BOOK_USER_COPIES_KEY = 'ai_english_book_user_copies';
const BOOK_STATS_KEY = 'ai_english_book_stats';

export interface ActiveBookProgress {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  mode: 'my-copy' | 'key-ideas';
  currentParagraphIndex: number;
  totalParagraphs: number;
  paragraphResults: BookParagraphResult[];
  customParagraphs?: string[];
  savedAt: string;
}

export interface BookStats {
  booksPracticed: number;
  sessionsCompleted: number;
  totalParagraphsRead: number;
  streakDays: number;
  lastPracticeDate: string;
  averageScore: number;
  bestScore: number;
}

// ========================================================
// 1. Resume / Active Session Management
// ========================================================
export function saveActiveBookProgress(progress: ActiveBookProgress): void {
  try {
    localStorage.setItem(BOOK_ACTIVE_PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save active book progress:', err);
  }
}

export function getActiveBookProgress(): ActiveBookProgress | null {
  try {
    const raw = localStorage.getItem(BOOK_ACTIVE_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveBookProgress;
  } catch {
    return null;
  }
}

export function clearActiveBookProgress(): void {
  try {
    localStorage.removeItem(BOOK_ACTIVE_PROGRESS_KEY);
  } catch (err) {
    console.error('Failed to clear active book progress:', err);
  }
}

// ========================================================
// 2. Mode A: User "My Copy" Text Management (Device Only)
// ========================================================
export function saveUserCopyParagraphs(
  bookId: string,
  chapterId: string,
  paragraphs: string[]
): void {
  try {
    const raw = localStorage.getItem(BOOK_USER_COPIES_KEY);
    const store: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const key = `${bookId}__${chapterId}`;
    store[key] = paragraphs;
    localStorage.setItem(BOOK_USER_COPIES_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save user copy paragraphs:', err);
  }
}

export function getUserCopyParagraphs(bookId: string, chapterId: string): string[] | null {
  try {
    const raw = localStorage.getItem(BOOK_USER_COPIES_KEY);
    if (!raw) return null;
    const store: Record<string, string[]> = JSON.parse(raw);
    const key = `${bookId}__${chapterId}`;
    return store[key] || null;
  } catch {
    return null;
  }
}

// ========================================================
// 3. Completed Sessions History & Scores
// ========================================================
export function saveBookSessionReport(report: BookSessionReport): void {
  try {
    const raw = localStorage.getItem(BOOK_SESSION_HISTORY_KEY);
    const history: BookSessionReport[] = raw ? JSON.parse(raw) : [];
    history.unshift(report);
    // Keep last 50 session reports
    const trimmed = history.slice(0, 50);
    localStorage.setItem(BOOK_SESSION_HISTORY_KEY, JSON.stringify(trimmed));

    // Update global book stats
    updateBookStats(report);

    // Clear active session once completed
    clearActiveBookProgress();
  } catch (err) {
    console.error('Failed to save book session report:', err);
  }
}

export function getBookSessionHistory(): BookSessionReport[] {
  try {
    const raw = localStorage.getItem(BOOK_SESSION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPreviousChapterScore(bookId: string, chapterId: string): number | null {
  try {
    const history = getBookSessionHistory();
    const prev = history.find((h) => h.bookId === bookId && h.chapterId === chapterId);
    return prev ? prev.overallScore : null;
  } catch {
    return null;
  }
}

// ========================================================
// 4. Statistics, Streaks, & Badges
// ========================================================
export function getBookStats(): BookStats {
  try {
    const raw = localStorage.getItem(BOOK_STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    booksPracticed: 0,
    sessionsCompleted: 0,
    totalParagraphsRead: 0,
    streakDays: 0,
    lastPracticeDate: '',
    averageScore: 0,
    bestScore: 0,
  };
}

function updateBookStats(report: BookSessionReport): void {
  try {
    const stats = getBookStats();
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
        newStreak = 1;
      }
    }

    const history = getBookSessionHistory();
    const distinctBooks = new Set(history.map((h) => h.bookId)).size;
    const newSessions = stats.sessionsCompleted + 1;
    const newParagraphs = stats.totalParagraphsRead + report.paragraphResults.length;
    const newAvg = Math.round(
      (stats.averageScore * stats.sessionsCompleted + report.overallScore) / newSessions
    );
    const newBest = Math.max(stats.bestScore, report.overallScore);

    const updated: BookStats = {
      booksPracticed: distinctBooks,
      sessionsCompleted: newSessions,
      totalParagraphsRead: newParagraphs,
      streakDays: newStreak,
      lastPracticeDate: today,
      averageScore: newAvg,
      bestScore: newBest,
    };

    localStorage.setItem(BOOK_STATS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update book stats:', err);
  }
}
