/**
 * Word Comparison Service
 * 
 * Implements word-level diff between expected text and raw transcript.
 * Uses a modified Levenshtein / LCS approach for alignment.
 * 
 * CRITICAL: This service NEVER modifies the raw transcript.
 * It only compares and categorizes differences.
 */

interface WordComparisonItem {
  word: string;
  status: 'correct' | 'missing' | 'extra' | 'mismatch';
  expected?: string;
  index: number;
}

interface WordComparisonResult {
  expected: WordComparisonItem[];
  spoken: WordComparisonItem[];
  totalExpected: number;
  totalSpoken: number;
  correctCount: number;
  missingCount: number;
  extraCount: number;
  mismatchCount: number;
}

function normalizeForComparison(word: string): string {
  // Lowercase and remove punctuation for comparison only
  // We never modify the actual words stored in the transcript
  return word.toLowerCase().replace(/[^a-z0-9']/g, '');
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function isSimilar(word1: string, word2: string): boolean {
  const n1 = normalizeForComparison(word1);
  const n2 = normalizeForComparison(word2);
  if (n1 === n2) return true;
  if (n1.length === 0 || n2.length === 0) return false;
  
  const maxLen = Math.max(n1.length, n2.length);
  const distance = levenshteinDistance(n1, n2);
  
  // Allow ~30% edit distance for fuzzy matching
  return distance <= Math.max(1, Math.floor(maxLen * 0.3));
}

export function compareWords(expectedText: string, rawTranscript: string): WordComparisonResult {
  const expectedWords = expectedText.split(/\s+/).filter(Boolean);
  const spokenWords = rawTranscript.split(/\s+/).filter(Boolean);

  // LCS-based alignment
  const m = expectedWords.length;
  const n = spokenWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalizeForComparison(expectedWords[i - 1]) === normalizeForComparison(spokenWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find alignment
  const expectedResult: WordComparisonItem[] = [];
  const spokenResult: WordComparisonItem[] = [];
  let i = m;
  let j = n;

  const alignedPairs: { ei: number; si: number }[] = [];

  while (i > 0 && j > 0) {
    if (normalizeForComparison(expectedWords[i - 1]) === normalizeForComparison(spokenWords[j - 1])) {
      alignedPairs.push({ ei: i - 1, si: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  alignedPairs.reverse();

  // Build results from alignment
  const matchedExpected = new Set(alignedPairs.map((p) => p.ei));
  const matchedSpoken = new Set(alignedPairs.map((p) => p.si));

  let correctCount = 0;
  let missingCount = 0;
  let extraCount = 0;
  let mismatchCount = 0;

  // Process expected words
  for (let idx = 0; idx < expectedWords.length; idx++) {
    if (matchedExpected.has(idx)) {
      expectedResult.push({
        word: expectedWords[idx],
        status: 'correct',
        index: idx,
      });
      correctCount++;
    } else {
      // Check if there's a similar word nearby in spoken that isn't matched
      let foundMismatch = false;
      for (let k = 0; k < spokenWords.length; k++) {
        if (!matchedSpoken.has(k) && isSimilar(expectedWords[idx], spokenWords[k])) {
          expectedResult.push({
            word: expectedWords[idx],
            status: 'mismatch',
            expected: expectedWords[idx],
            index: idx,
          });
          mismatchCount++;
          foundMismatch = true;
          break;
        }
      }
      if (!foundMismatch) {
        expectedResult.push({
          word: expectedWords[idx],
          status: 'missing',
          index: idx,
        });
        missingCount++;
      }
    }
  }

  // Process spoken words
  for (let idx = 0; idx < spokenWords.length; idx++) {
    if (matchedSpoken.has(idx)) {
      spokenResult.push({
        word: spokenWords[idx],
        status: 'correct',
        index: idx,
      });
    } else {
      // Check if similar to any unmatched expected word
      let foundMismatch = false;
      for (let k = 0; k < expectedWords.length; k++) {
        if (!matchedExpected.has(k) && isSimilar(spokenWords[idx], expectedWords[k])) {
          spokenResult.push({
            word: spokenWords[idx],
            status: 'mismatch',
            expected: expectedWords[k],
            index: idx,
          });
          foundMismatch = true;
          break;
        }
      }
      if (!foundMismatch) {
        spokenResult.push({
          word: spokenWords[idx],
          status: 'extra',
          index: idx,
        });
        extraCount++;
      }
    }
  }

  return {
    expected: expectedResult,
    spoken: spokenResult,
    totalExpected: expectedWords.length,
    totalSpoken: spokenWords.length,
    correctCount,
    missingCount,
    extraCount,
    mismatchCount,
  };
}
