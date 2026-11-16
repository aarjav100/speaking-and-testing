import { STORY_SCORING_WEIGHTS, IDEAL_WPM_RANGE } from '../config/scoringConfig';
import type { ChapterVocabulary } from '../data/books';

export type WordStatus = 'correct' | 'unclear' | 'wrong' | 'missing';

export interface BookWordFeedback {
  word: string;
  spoken: string | null;
  status: WordStatus;
  score: number;
  ipa: string;
  phonetic: string;
  tip: string;
}

export interface BookParagraphResult {
  paragraphIndex: number;
  expectedText: string;
  spokenTranscript: string;
  scores: {
    pronunciation: number;
    fluency: number;
    accuracy: number;
    completeness: number;
    intonation: number;
    communication: number;
  };
  words: BookWordFeedback[];
  mispronouncedWords: BookWordFeedback[];
  wpm: number;
  durationSeconds: number;
  pauseCount: number;
  fillerWordsCount: number;
  fillerWordsList: string[];
  tips: string[];
}

export interface BookSessionReport {
  sessionId: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  mode: 'my-copy' | 'key-ideas';
  completedAt: string;
  overallScore: number;
  averageScores: {
    pronunciation: number;
    fluency: number;
    accuracy: number;
    completeness: number;
    intonation: number;
    communication: number;
  };
  paragraphScores: {
    index: number;
    score: number;
    wpm: number;
    isBest: boolean;
    isWeakest: boolean;
  }[];
  bestParagraphIndex: number;
  weakestParagraphIndex: number;
  topMispronouncedWords: BookWordFeedback[];
  weakestSounds: { sound: string; count: number; advice: string }[];
  fluencySummary: {
    averageWpm: number;
    totalPauses: number;
    totalFillerWords: number;
  };
  communicationLevel: 'Needs Practice' | 'Good' | 'Very Good' | 'Excellent';
  previousScoreComparison: {
    previousScore: number | null;
    delta: number | null;
    message: string;
  };
  vocabularyBuilder: ChapterVocabulary[];
  paragraphResults: BookParagraphResult[];
}

const FILLER_WORDS = new Set(['um', 'uh', 'er', 'ah', 'like', 'you know', 'hmm', 'erm']);

const PHONETIC_MAP: Record<string, { ipa: string; phonetic: string; tip: string }> = {
  communication: { ipa: '/kəˌmjuːnɪˈkeɪʃən/', phonetic: 'kuh-myoo-nih-KAY-shun', tip: 'Stress the fourth syllable KAY.' },
  dialogue: { ipa: '/ˈdaɪəlɒɡ/', phonetic: 'DY-uh-log', tip: 'Smooth three syllables without hardening the g.' },
  validation: { ipa: '/ˌvælɪˈdeɪʃən/', phonetic: 'val-ih-DAY-shun', tip: 'Clear V with top teeth on lower lip.' },
  receptivity: { ipa: '/ˌriːsepˈtɪvəti/', phonetic: 'ree-sep-TIV-ih-tee', tip: 'Stress the TIV syllable.' },
  rapport: { ipa: '/ræˈpɔːr/', phonetic: 'ra-POR', tip: 'Silent t at the end; stress POR.' },
  subconscious: { ipa: '/sʌbˈkɒnʃəs/', phonetic: 'sub-KON-shus', tip: 'Soft sh sound in the final syllable.' },
  empathy: { ipa: '/ˈempəθi/', phonetic: 'EM-puh-thee', tip: 'Tongue tip between teeth for th.' },
  collaborative: { ipa: '/kəˈlæbərətɪv/', phonetic: 'kuh-LAB-er-uh-tiv', tip: 'Keep the first vowel short.' },
  reciprocate: { ipa: '/rɪˈsɪprəkeɪt/', phonetic: 'rih-SIP-ruh-kayt', tip: 'Stress the second syllable SIP.' },
  competence: { ipa: '/ˈkɒmpɪtəns/', phonetic: 'KOM-pih-tuns', tip: 'Clear first syllable KOM.' },
  adversarial: { ipa: '/ˌædvərˈseəriəl/', phonetic: 'ad-ver-SAIR-ee-ul', tip: 'Five distinct flowing syllables.' },
  detachment: { ipa: '/dɪˈtætʃmənt/', phonetic: 'dih-TACH-munt', tip: 'Crisp ch sound in the middle.' },
  inflammatory: { ipa: '/ɪnˈflæmətɔːri/', phonetic: 'in-FLAM-uh-tor-ee', tip: 'Stress the FLAM syllable.' },
  trajectory: { ipa: '/trəˈdʒektəri/', phonetic: 'truh-JEK-tuh-ree', tip: 'Soft j glide in JEK.' },
  articulate: { ipa: '/ɑːrˈtɪkjələt/', phonetic: 'ar-TIK-yuh-lut', tip: 'Pronounce every syllable cleanly.' },
};

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function getPhoneticGuidance(cleanWord: string): { ipa: string; phonetic: string; tip: string } {
  if (PHONETIC_MAP[cleanWord]) {
    return PHONETIC_MAP[cleanWord];
  }

  let tip = 'Articulate each syllable with steady breath.';
  if (cleanWord.includes('th')) {
    tip = 'Touch your tongue tip gently between your upper and lower teeth.';
  } else if (cleanWord.startsWith('r') || cleanWord.includes('rr')) {
    tip = 'Curl your tongue slightly back without touching the upper palate.';
  } else if (cleanWord.startsWith('v')) {
    tip = 'Gently press top teeth to bottom lip and voice the V.';
  } else if (cleanWord.startsWith('w')) {
    tip = 'Round your lips closely like preparing to whistle.';
  } else if (cleanWord.endsWith('tion') || cleanWord.endsWith('sion')) {
    tip = 'Pronounce the suffix as a soft shuhn sound.';
  }

  return {
    ipa: `/${cleanWord}/`,
    phonetic: cleanWord.toUpperCase(),
    tip,
  };
}

function identifyPhoneticSound(word: string): string | null {
  const lower = word.toLowerCase();
  if (lower.includes('th')) return 'th';
  if (lower.startsWith('r') || lower.includes('rr')) return 'r';
  if (lower.includes('v') || lower.includes('w')) return 'v/w';
  if (lower.includes('ng')) return 'ng';
  if (lower.includes('sh') || lower.includes('ch')) return 'sh/ch';
  if (lower.includes('s') && lower.includes('z')) return 's/z';
  return null;
}

const SOUND_ADVICE: Record<string, string> = {
  th: 'Place the tip of your tongue between your teeth to avoid saying "d" or "t".',
  r: 'Keep the tongue curled back in the center of your mouth without tapping the roof.',
  'v/w': 'Notice the difference: "v" uses upper teeth on lower lip; "w" rounds the lips.',
  ng: 'Allow resonance in your nasal cavity without clicking a hard "k" or "g".',
  'sh/ch': 'Shape your lips forward and release air smoothly.',
  's/z': 'Ensure vocal cords vibrate continuously for "z".',
};

export function analyzeBookParagraph(
  expectedText: string,
  spokenTranscript: string,
  durationSeconds: number
): BookParagraphResult {
  const cleanTranscript = (spokenTranscript || '').trim();
  const rawExpectedTokens = expectedText.split(/\s+/).filter(Boolean);
  const rawSpokenTokens = cleanTranscript.split(/\s+/).filter(Boolean);

  const normExpected = rawExpectedTokens.map(normalize).filter(Boolean);
  const normSpoken = rawSpokenTokens.map(normalize).filter(Boolean);

  // Check filler words
  const fillerFound: string[] = [];
  rawSpokenTokens.forEach((tok) => {
    const clean = normalize(tok);
    if (FILLER_WORDS.has(clean)) {
      fillerFound.push(clean);
    }
  });

  const effectiveDuration = Math.max(durationSeconds, 1.5);
  const spokenCount = normSpoken.length;
  const calculatedWpm = Math.round((spokenCount / effectiveDuration) * 60);

  // Levenshtein alignment
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;

  const wordFeedbackList: BookWordFeedback[] = [];
  const mispronouncedList: BookWordFeedback[] = [];

  let spokenPtr = 0;
  let correctCount = 0;
  let unclearCount = 0;

  for (let i = 0; i < rawExpectedTokens.length; i++) {
    const rawWord = rawExpectedTokens[i];
    const expNorm = normExpected[i] || '';
    const phonetics = getPhoneticGuidance(expNorm);

    if (spokenPtr >= normSpoken.length) {
      deletions++;
      const item: BookWordFeedback = {
        word: rawWord,
        spoken: null,
        status: 'missing',
        score: 0,
        ipa: phonetics.ipa,
        phonetic: phonetics.phonetic,
        tip: phonetics.tip,
      };
      wordFeedbackList.push(item);
      mispronouncedList.push(item);
      continue;
    }

    const currentSpokenNorm = normSpoken[spokenPtr];
    const dist = levenshtein(expNorm, currentSpokenNorm);

    if (expNorm === currentSpokenNorm) {
      correctCount++;
      wordFeedbackList.push({
        word: rawWord,
        spoken: rawSpokenTokens[spokenPtr],
        status: 'correct',
        score: 95 + Math.floor(Math.random() * 5),
        ipa: phonetics.ipa,
        phonetic: phonetics.phonetic,
        tip: 'Pronounced clearly.',
      });
      spokenPtr++;
    } else if (dist <= 2 && expNorm.length > 3) {
      unclearCount++;
      substitutions++;
      const item: BookWordFeedback = {
        word: rawWord,
        spoken: rawSpokenTokens[spokenPtr],
        status: 'unclear',
        score: Math.max(55, 80 - dist * 12),
        ipa: phonetics.ipa,
        phonetic: phonetics.phonetic,
        tip: phonetics.tip,
      };
      wordFeedbackList.push(item);
      mispronouncedList.push(item);
      spokenPtr++;
    } else {
      // Lookahead check for insertions
      const nextMatchInSpoken = normSpoken.slice(spokenPtr + 1, spokenPtr + 4).indexOf(expNorm);
      if (nextMatchInSpoken !== -1) {
        insertions += nextMatchInSpoken + 1;
        spokenPtr += nextMatchInSpoken + 1;
        correctCount++;
        wordFeedbackList.push({
          word: rawWord,
          spoken: rawSpokenTokens[spokenPtr],
          status: 'correct',
          score: 88,
          ipa: phonetics.ipa,
          phonetic: phonetics.phonetic,
          tip: 'Recognized after brief pause.',
        });
        spokenPtr++;
      } else {
        substitutions++;
        const item: BookWordFeedback = {
          word: rawWord,
          spoken: rawSpokenTokens[spokenPtr],
          status: 'wrong',
          score: Math.max(30, 60 - dist * 10),
          ipa: phonetics.ipa,
          phonetic: phonetics.phonetic,
          tip: phonetics.tip,
        };
        wordFeedbackList.push(item);
        mispronouncedList.push(item);
        spokenPtr++;
      }
    }
  }

  if (spokenPtr < normSpoken.length) {
    insertions += normSpoken.length - spokenPtr;
  }

  const totalWords = Math.max(normExpected.length, 1);

  // 1. WER Accuracy: (1 - (S + D + I) / N) * 100
  const werErrors = substitutions + deletions + insertions;
  const rawAccuracy = Math.round((1 - werErrors / totalWords) * 100);
  const accuracyScore = Math.max(20, Math.min(100, rawAccuracy));

  // 2. Completeness
  const attemptedWords = correctCount + unclearCount + substitutions;
  const completenessScore = Math.max(25, Math.min(100, Math.round((attemptedWords / totalWords) * 100)));

  // 3. Pronunciation
  const totalWordScores = wordFeedbackList.reduce((acc, curr) => acc + curr.score, 0);
  const pronunciationScore = Math.max(30, Math.min(100, Math.round(totalWordScores / wordFeedbackList.length)));

  // 4. Fluency (WPM + Pauses + Fillers)
  const expectedReadingSeconds = (normExpected.length / 130) * 60;
  const pauseSeconds = Math.max(0, durationSeconds - expectedReadingSeconds);
  const estimatedPauses = Math.min(8, Math.max(0, Math.floor(pauseSeconds / 1.5)));

  let fluencyScore = 85;
  if (calculatedWpm >= IDEAL_WPM_RANGE.min && calculatedWpm <= IDEAL_WPM_RANGE.max) {
    fluencyScore = 93;
  } else if (calculatedWpm < IDEAL_WPM_RANGE.min) {
    const deficit = IDEAL_WPM_RANGE.min - calculatedWpm;
    fluencyScore = Math.max(40, 85 - Math.round(deficit * 0.7));
  } else {
    const excess = calculatedWpm - IDEAL_WPM_RANGE.max;
    fluencyScore = Math.max(50, 85 - Math.round(excess * 0.5));
  }
  fluencyScore = Math.max(30, fluencyScore - fillerFound.length * 4 - estimatedPauses * 3);

  // 5. Intonation
  const intonationScore = Math.max(
    35,
    Math.min(100, Math.round(pronunciationScore * 0.5 + fluencyScore * 0.3 + completenessScore * 0.2))
  );

  // 6. Weighted Communication score
  const communicationScore = Math.round(
    STORY_SCORING_WEIGHTS.pronunciation * pronunciationScore +
      STORY_SCORING_WEIGHTS.fluency * fluencyScore +
      STORY_SCORING_WEIGHTS.accuracy * accuracyScore +
      STORY_SCORING_WEIGHTS.completeness * completenessScore
  );

  // 2 Actionable Tips
  const tips: string[] = [];
  if (calculatedWpm < IDEAL_WPM_RANGE.min) {
    tips.push(`Your pace was ${calculatedWpm} WPM. Aim for a slightly brisker tempo toward ${IDEAL_WPM_RANGE.min}-${IDEAL_WPM_RANGE.max} WPM.`);
  } else if (calculatedWpm > IDEAL_WPM_RANGE.max) {
    tips.push(`Pacing was ${calculatedWpm} WPM. Slow down slightly to give multi-syllabic book vocabulary space to breathe.`);
  } else {
    tips.push(`Great reading pace! You stayed inside the optimal speaking range of ${IDEAL_WPM_RANGE.min}-${IDEAL_WPM_RANGE.max} WPM.`);
  }

  if (fillerFound.length > 0) {
    tips.push(`Noticed filler word "${fillerFound[0]}". Pause silently rather than speaking verbal placeholders.`);
  } else if (mispronouncedList.length > 0) {
    tips.push(`Review "${mispronouncedList[0].word}": ${mispronouncedList[0].tip}`);
  } else {
    tips.push('Excellent clarity and vocal posture! Maintain this relaxed rhythm into the next paragraph.');
  }

  return {
    paragraphIndex: 0,
    expectedText,
    spokenTranscript: cleanTranscript,
    scores: {
      pronunciation: pronunciationScore,
      fluency: fluencyScore,
      accuracy: accuracyScore,
      completeness: completenessScore,
      intonation: intonationScore,
      communication: communicationScore,
    },
    words: wordFeedbackList,
    mispronouncedWords: mispronouncedList.slice(0, 8),
    wpm: calculatedWpm,
    durationSeconds: Math.round(durationSeconds),
    pauseCount: estimatedPauses,
    fillerWordsCount: fillerFound.length,
    fillerWordsList: fillerFound,
    tips: tips.slice(0, 2),
  };
}

export function computeBookSessionReport(
  bookId: string,
  bookTitle: string,
  chapterId: string,
  chapterTitle: string,
  mode: 'my-copy' | 'key-ideas',
  paragraphResults: BookParagraphResult[],
  previousScore: number | null,
  vocabulary: ChapterVocabulary[] = []
): BookSessionReport {
  const count = Math.max(paragraphResults.length, 1);

  let totalPron = 0;
  let totalFluency = 0;
  let totalAcc = 0;
  let totalComp = 0;
  let totalInton = 0;
  let totalComm = 0;
  let totalWpm = 0;
  let totalPauses = 0;
  let totalFiller = 0;

  let bestScore = -1;
  let bestIdx = 0;
  let weakestScore = 999;
  let weakestIdx = 0;

  const mispronouncedFrequency: Record<string, BookWordFeedback> = {};
  const soundIssueCount: Record<string, number> = {};

  paragraphResults.forEach((res, idx) => {
    const comm = res.scores.communication;
    totalPron += res.scores.pronunciation;
    totalFluency += res.scores.fluency;
    totalAcc += res.scores.accuracy;
    totalComp += res.scores.completeness;
    totalInton += res.scores.intonation;
    totalComm += comm;
    totalWpm += res.wpm;
    totalPauses += res.pauseCount;
    totalFiller += res.fillerWordsCount;

    if (comm > bestScore) {
      bestScore = comm;
      bestIdx = idx;
    }
    if (comm < weakestScore) {
      weakestScore = comm;
      weakestIdx = idx;
    }

    res.mispronouncedWords.forEach((item) => {
      const clean = normalize(item.word);
      if (!mispronouncedFrequency[clean]) {
        mispronouncedFrequency[clean] = item;
      }
      const soundCat = identifyPhoneticSound(clean);
      if (soundCat) {
        soundIssueCount[soundCat] = (soundIssueCount[soundCat] || 0) + 1;
      }
    });
  });

  const avgPron = Math.round(totalPron / count);
  const avgFluency = Math.round(totalFluency / count);
  const avgAcc = Math.round(totalAcc / count);
  const avgComp = Math.round(totalComp / count);
  const avgInton = Math.round(totalInton / count);
  const avgComm = Math.round(totalComm / count);
  const avgWpm = Math.round(totalWpm / count);

  const paragraphScores = paragraphResults.map((res, idx) => ({
    index: idx + 1,
    score: res.scores.communication,
    wpm: res.wpm,
    isBest: idx === bestIdx,
    isWeakest: idx === weakestIdx && paragraphResults.length > 1,
  }));

  const topMispronouncedWords = Object.values(mispronouncedFrequency).slice(0, 5);

  const weakestSounds = Object.entries(soundIssueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sound, c]) => ({
      sound,
      count: c,
      advice: SOUND_ADVICE[sound] || 'Practice this sound slowly in isolated words.',
    }));

  if (weakestSounds.length === 0) {
    weakestSounds.push({
      sound: 'Vowel articulation',
      count: 0,
      advice: 'Crisp articulation across all phonetic boundaries!',
    });
  }

  let communicationLevel: BookSessionReport['communicationLevel'] = 'Needs Practice';
  if (avgComm >= 85) {
    communicationLevel = 'Excellent';
  } else if (avgComm >= 75) {
    communicationLevel = 'Very Good';
  } else if (avgComm >= 60) {
    communicationLevel = 'Good';
  }

  let delta: number | null = null;
  let message = 'First session on this chapter! Strong foundation set.';
  if (previousScore !== null) {
    delta = avgComm - previousScore;
    if (delta > 0) {
      message = `+${delta} points improvement from your previous session!`;
    } else if (delta === 0) {
      message = 'Matched your previous score. Keep practicing for a new personal best!';
    } else {
      message = `${delta} points compared to your last session. Try again to push higher!`;
    }
  }

  return {
    sessionId: `session-${Date.now()}`,
    bookId,
    bookTitle,
    chapterId,
    chapterTitle,
    mode,
    completedAt: new Date().toISOString(),
    overallScore: avgComm,
    averageScores: {
      pronunciation: avgPron,
      fluency: avgFluency,
      accuracy: avgAcc,
      completeness: avgComp,
      intonation: avgInton,
      communication: avgComm,
    },
    paragraphScores,
    bestParagraphIndex: bestIdx + 1,
    weakestParagraphIndex: weakestIdx + 1,
    topMispronouncedWords,
    weakestSounds,
    fluencySummary: {
      averageWpm: avgWpm,
      totalPauses,
      totalFillerWords: totalFiller,
    },
    communicationLevel,
    previousScoreComparison: {
      previousScore,
      delta,
      message,
    },
    vocabularyBuilder: vocabulary,
    paragraphResults,
  };
}
