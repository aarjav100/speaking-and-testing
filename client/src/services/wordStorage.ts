export interface WordAttemptRecord {
  id: string;
  wordId: string;
  word: string;
  score: number;
  accuracy: number;
  stress: number;
  clarity: number;
  mastered: boolean;
  soundFocus: string;
  timestamp: string;
}

const STORAGE_KEY_ATTEMPTS = 'ai_speaking_word_attempts';

export function saveWordAttempt(data: Omit<WordAttemptRecord, 'id' | 'timestamp'>) {
  try {
    const records = getWordAttempts();
    const newRecord: WordAttemptRecord = {
      ...data,
      id: `att-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    records.unshift(newRecord);
    // Keep last 200 attempts in localStorage
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(records.slice(0, 200)));
  } catch (e) {
    console.warn('Failed to save word attempt to localStorage', e);
  }
}

export function getWordAttempts(): WordAttemptRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getWordPracticeStats() {
  const attempts = getWordAttempts();
  const totalPracticed = attempts.length;

  // Mastered words (unique words where latest attempt score >= 85)
  const latestByWord = new Map<string, WordAttemptRecord>();
  for (const a of attempts) {
    if (!latestByWord.has(a.wordId)) {
      latestByWord.set(a.wordId, a);
    }
  }

  const masteredWords: WordAttemptRecord[] = [];
  const needsPracticeWords: WordAttemptRecord[] = [];
  const weakSoundsCount: Record<string, number> = {};

  for (const record of latestByWord.values()) {
    if (record.score >= 85) {
      masteredWords.push(record);
    } else {
      needsPracticeWords.push(record);
      // Tally weak sound
      if (record.soundFocus) {
        weakSoundsCount[record.soundFocus] = (weakSoundsCount[record.soundFocus] || 0) + 1;
      }
    }
  }

  // Calculate streak
  const uniqueDates = new Set(attempts.map((a) => a.timestamp.split('T')[0]));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (uniqueDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    totalPracticed,
    masteredCount: masteredWords.length,
    needsPracticeCount: needsPracticeWords.length,
    masteredWords,
    needsPracticeWords,
    weakSoundsCount,
    streak,
  };
}
