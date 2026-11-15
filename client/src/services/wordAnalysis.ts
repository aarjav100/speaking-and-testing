import type { WordItem } from '../data/words';

export interface SyllableResult {
  syllable: string;
  isStressed: boolean;
  status: 'correct' | 'unclear' | 'wrong';
}

export interface WordAnalysisResult {
  targetWord: string;
  spokenWord: string;
  overallScore: number;       // 0-100
  accuracyScore: number;      // 0-100
  stressScore: number;        // 0-100
  clarityScore: number;       // 0-100
  syllableResults: SyllableResult[];
  phonemeFeedback: string;
  tip: string;
  mastered: boolean;          // >= 85
  needsRetry: boolean;        // < 70
}

/**
 * Levenshtein distance algorithm for calculating similarity between 2 strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Phonetic similarity mapping to detect common sound confusions
 */
const PHONETIC_CONFUSIONS: Array<{
  pattern: RegExp;
  targetSound: string;
  feedback: string;
}> = [
  { pattern: /v/i, targetSound: 'th', feedback: "You substituted a 'v' sound where a 'th' was expected. Place your tongue gently between your front teeth." },
  { pattern: /f/i, targetSound: 'th', feedback: "You substituted an 'f' sound for 'th'. Don't bite your lower lip; push air over your tongue tip." },
  { pattern: /w/i, targetSound: 'v', feedback: "You made a 'w' sound instead of 'v'. Rest your top teeth on your bottom lip and let your vocal cords vibrate." },
  { pattern: /l/i, targetSound: 'r', feedback: "You made an 'l' sound instead of 'r'. Curl the sides of your tongue back without touching the roof of your mouth." },
  { pattern: /s/i, targetSound: 'sh', feedback: "You made an 's' sound instead of 'sh'. Round your lips slightly and pull your tongue back." },
  { pattern: /z/i, targetSound: 's', feedback: "You voiced a 'z' sound instead of an unvoiced 's'. Turn off your vocal vibration." },
  { pattern: /d/i, targetSound: 't', feedback: "You voiced a 'd' instead of an unvoiced 't'. Keep it crisp without vocal chord hum." },
];

export function analyzeSingleWord(
  target: WordItem,
  rawTranscript: string,
  durationSeconds: number
): { result?: WordAnalysisResult; error?: string } {
  const spoken = rawTranscript.trim().toLowerCase().replace(/[^\w\s]/g, '');

  if (!spoken) {
    return { error: 'No speech detected. Please tap the mic and speak clearly.' };
  }

  // Extract the main spoken word (in case multiple words were picked up)
  const targetLower = target.word.toLowerCase();
  const words = spoken.split(/\s+/);
  
  // Find the closest matching word in what was recognized
  let bestMatch = words[0];
  let minDistance = levenshteinDistance(targetLower, words[0]);

  for (let i = 1; i < words.length; i++) {
    const dist = levenshteinDistance(targetLower, words[i]);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = words[i];
    }
  }

  // Calculate character-level accuracy
  const maxLen = Math.max(targetLower.length, bestMatch.length);
  const similarity = Math.max(0, 1 - minDistance / maxLen);
  let accuracyScore = Math.round(similarity * 100);

  // If exact match
  if (bestMatch === targetLower) {
    accuracyScore = 100;
  }

  // Duration / Stress / Clarity heuristic
  // A single polysyllabic word should take ~0.5 to 1.8 seconds
  let stressScore = 90;
  let clarityScore = 90;

  if (durationSeconds < 0.3) {
    stressScore = 65; // Rushed, syllables likely swallowed
    clarityScore = 70;
  } else if (durationSeconds > 2.5) {
    stressScore = 75; // Stretched or hesitant
  } else if (durationSeconds >= 0.5 && durationSeconds <= 1.8) {
    stressScore = 98;
    clarityScore = 95;
  }

  // Scale stress and clarity if accuracy is lower
  if (accuracyScore < 70) {
    stressScore = Math.min(stressScore, accuracyScore + 10);
    clarityScore = Math.min(clarityScore, accuracyScore + 5);
  }

  // Calculate overall weighted score
  const overallScore = Math.round(
    accuracyScore * 0.5 + stressScore * 0.25 + clarityScore * 0.25
  );

  // Syllable breakdown scoring
  const syllableResults: SyllableResult[] = target.syllables.map((syl, index) => {
    const isStressed = index === target.stressedSyllableIndex;
    const cleanSyl = syl.toLowerCase();

    // Check if syllable sound is present in spoken word
    if (accuracyScore >= 85) {
      return { syllable: syl, isStressed, status: 'correct' };
    } else if (accuracyScore >= 60) {
      const isPresent = bestMatch.includes(cleanSyl) || bestMatch.length >= targetLower.length * 0.7;
      return {
        syllable: syl,
        isStressed,
        status: isPresent ? (isStressed ? 'correct' : 'unclear') : 'unclear',
      };
    } else {
      const isPresent = bestMatch.includes(cleanSyl);
      return {
        syllable: syl,
        isStressed,
        status: isPresent ? 'unclear' : 'wrong',
      };
    }
  });

  // Phoneme feedback identification
  let phonemeFeedback = '';
  for (const conf of PHONETIC_CONFUSIONS) {
    if (target.soundFocus.includes(conf.targetSound) && conf.pattern.test(bestMatch) && !conf.pattern.test(targetLower)) {
      phonemeFeedback = conf.feedback;
      break;
    }
  }

  if (!phonemeFeedback) {
    if (overallScore >= 85) {
      phonemeFeedback = `Excellent articulation! Every phoneme and the primary stress on "${target.syllables[target.stressedSyllableIndex]}" were crisp.`;
    } else if (overallScore >= 70) {
      phonemeFeedback = `Good effort! Your pacing was solid, but watch the primary stress on "${target.syllables[target.stressedSyllableIndex]}".`;
    } else {
      phonemeFeedback = `Detected "${bestMatch}" instead of "${target.word}". Notice the IPA spelling ${target.ipa}.`;
    }
  }

  return {
    result: {
      targetWord: target.word,
      spokenWord: bestMatch,
      overallScore,
      accuracyScore,
      stressScore,
      clarityScore,
      syllableResults,
      phonemeFeedback,
      tip: target.tip,
      mastered: overallScore >= 85,
      needsRetry: overallScore < 70,
    },
  };
}
