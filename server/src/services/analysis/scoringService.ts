/**
 * Scoring Service
 * 
 * Calculates communication scores based on word comparison results.
 * All scoring is deterministic and reproducible.
 */

interface WordComparisonResult {
  totalExpected: number;
  totalSpoken: number;
  correctCount: number;
  missingCount: number;
  extraCount: number;
  mismatchCount: number;
}

interface Scores {
  overall_score: number;
  speech_accuracy: number;
  pronunciation_score: number;
  fluency_score: number;
  word_accuracy: number;
  communication_score: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateScores(
  comparison: WordComparisonResult,
  pronunciationIssueCount: number,
  duration: number
): Scores {
  const { totalExpected, totalSpoken, correctCount, missingCount, extraCount, mismatchCount } = comparison;

  // Speech Accuracy: How many expected words were correctly spoken
  const speech_accuracy = totalExpected > 0
    ? clamp(Math.round((correctCount / totalExpected) * 100), 0, 100)
    : 0;

  // Word Accuracy: Penalize for missing and extra words
  const totalIssues = missingCount + extraCount + mismatchCount;
  const word_accuracy = totalExpected > 0
    ? clamp(Math.round(((totalExpected - totalIssues) / totalExpected) * 100), 0, 100)
    : 0;

  // Pronunciation Score: Based on pronunciation issues relative to total words
  const pronunciation_score = totalExpected > 0
    ? clamp(Math.round(((totalExpected - pronunciationIssueCount) / totalExpected) * 100), 0, 100)
    : 0;

  // Fluency Score: Based on word count ratio and speaking rate
  // Ideal speaking rate: ~130-160 words per minute
  const wordsPerMinute = duration > 0 ? (totalSpoken / duration) * 60 : 0;
  let fluencyBase = 80;

  // Penalize if too slow or too fast
  if (wordsPerMinute < 80) {
    fluencyBase -= Math.min(30, Math.round((80 - wordsPerMinute) * 0.5));
  } else if (wordsPerMinute > 200) {
    fluencyBase -= Math.min(20, Math.round((wordsPerMinute - 200) * 0.3));
  } else if (wordsPerMinute >= 100 && wordsPerMinute <= 170) {
    fluencyBase = 90; // Ideal range
  }

  // Also penalize if word count differs significantly
  const countRatio = totalExpected > 0 ? totalSpoken / totalExpected : 0;
  if (countRatio < 0.7) fluencyBase -= 15;
  else if (countRatio < 0.85) fluencyBase -= 8;
  else if (countRatio > 1.3) fluencyBase -= 10;

  const fluency_score = clamp(fluencyBase, 0, 100);

  // Communication Score: Weighted combination
  const communication_score = clamp(
    Math.round(
      speech_accuracy * 0.3 +
      word_accuracy * 0.2 +
      pronunciation_score * 0.2 +
      fluency_score * 0.3
    ),
    0,
    100
  );

  // Overall: Weighted average
  const overall_score = clamp(
    Math.round(
      speech_accuracy * 0.25 +
      word_accuracy * 0.2 +
      pronunciation_score * 0.2 +
      fluency_score * 0.15 +
      communication_score * 0.2
    ),
    0,
    100
  );

  return {
    overall_score,
    speech_accuracy,
    pronunciation_score,
    fluency_score,
    word_accuracy,
    communication_score,
  };
}
