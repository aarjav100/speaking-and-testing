import { STORY_SCORING_WEIGHTS, IDEAL_WPM_RANGE } from '../config/scoringConfig';

export type WordStatus = 'correct' | 'unclear' | 'wrong' | 'missing';

export interface StoryWordFeedback {
  word: string;
  spoken: string | null;
  status: WordStatus;
  score: number;
  ipa: string;
  phonetic: string;
  tip: string;
}

export interface ParagraphResult {
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
  words: StoryWordFeedback[];
  mispronouncedWords: StoryWordFeedback[];
  wpm: number;
  durationSeconds: number;
  pauseCount: number;
  fillerWordsCount: number;
  fillerWordsList: string[];
  tips: string[];
}

export interface FinalStoryReport {
  storyId: string;
  storyTitle: string;
  level: string;
  genre: string;
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
  topMispronouncedWords: StoryWordFeedback[];
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
  paragraphResults: ParagraphResult[];
}

// Common phonetic IPA lookup for words in stories
const IPA_LOOKUP: Record<string, { ipa: string; phonetic: string; tip: string }> = {
  ancient: { ipa: '/ˈeɪnʃənt/', phonetic: 'AYN-shuhnt', tip: 'Start with a clear long "A" sound.' },
  village: { ipa: '/ˈvɪlɪdʒ/', phonetic: 'VIL-ij', tip: 'Touch top teeth to lower lip for "V".' },
  branches: { ipa: '/ˈbræntʃɪz/', phonetic: 'BRAN-chiz', tip: 'Enunciate the "ch" cleanly at the end.' },
  travelers: { ipa: '/ˈtrævələrz/', phonetic: 'TRAV-uh-lerz', tip: 'Soft "uh" in the middle syllable.' },
  sapling: { ipa: '/ˈsæplɪŋ/', phonetic: 'SAP-ling', tip: 'Resonate the "ng" softly through your nose.' },
  complained: { ipa: '/kəmˈpleɪnd/', phonetic: 'kuhm-PLAYND', tip: 'Keep the first vowel short and unstressed.' },
  resilience: { ipa: '/rɪˈzɪliəns/', phonetic: 'ri-ZIL-yuhns', tip: 'Stress the second syllable "ZIL".' },
  strength: { ipa: '/streŋkθ/', phonetic: 'STRENGKTH', tip: 'End with tongue between teeth for "th".' },
  perceived: { ipa: '/pərˈsiːvd/', phonetic: 'per-SEEVD', tip: 'Stress the "SEEVD" syllable.' },
  defect: { ipa: '/ˈdiːfekt/', phonetic: 'DEE-fekt', tip: 'Clear "ee" sound in the first syllable.' },
  apologized: { ipa: '/əˈpɒlədʒaɪzd/', phonetic: 'uh-POL-uh-jyzd', tip: 'Smooth transition across the 4 syllables.' },
  whispered: { ipa: '/ˈwɪspərd/', phonetic: 'WIS-perd', tip: 'Do not aspirate heavily on "wh".' },
  fragile: { ipa: '/ˈfrædʒaɪl/', phonetic: 'FRAJ-yl', tip: 'Soft "j" sound in the middle.' },
  opportunity: { ipa: '/ˌɒpərˈtuːnɪti/', phonetic: 'op-er-TOO-nuh-tee', tip: 'Stress the "TOO" syllable clearly.' },
  perspective: { ipa: '/pərˈspektɪv/', phonetic: 'per-SPEK-tiv', tip: 'Crisp "k" and "t" in the center.' },
  curious: { ipa: '/ˈkjʊəriəs/', phonetic: 'KYOOR-ee-uhs', tip: 'Blend the "ky" sound smoothly.' },
  frustration: { ipa: '/frʌˈstreɪʃən/', phonetic: 'fruh-STRAY-shuhn', tip: 'Stress "STRAY" with good breath support.' },
  canyon: { ipa: '/ˈkænjən/', phonetic: 'KAN-yuhn', tip: 'Slight "ny" nasal glide.' },
  mocking: { ipa: '/ˈmɒkɪŋ/', phonetic: 'MOK-ing', tip: 'Do not harden the final "g".' },
  kindness: { ipa: '/ˈkaɪndnəs/', phonetic: 'KYND-nuhs', tip: 'Pronounce the "d" lightly before "n".' },
  reflects: { ipa: '/rɪˈflekts/', phonetic: 'ri-FLEKTS', tip: 'Enunciate the "kts" cluster at the end.' },
  morning: { ipa: '/ˈmɔːrnɪŋ/', phonetic: 'MOR-ning', tip: 'Round your lips on "or".' },
  delicious: { ipa: '/dɪˈlɪʃəs/', phonetic: 'di-LISH-uhs', tip: 'Soft "sh" sound in the middle.' },
  enthusiasm: { ipa: '/ɪnˈθuːziæzəm/', phonetic: 'in-THOO-zee-az-uhm', tip: 'Tongue between teeth for "th".' },
  accomplishment: { ipa: '/əˈkʌmplɪʃmənt/', phonetic: 'uh-KAHM-plish-muhnt', tip: 'Stress the second syllable.' },
  comfortable: { ipa: '/ˈkʌmftərbəl/', phonetic: 'KUHM-fer-tuh-buhl', tip: '3 syllables: "kumf-ter-buhl".' },
  entrepreneur: { ipa: '/ˌɒntrəprəˈnɜːr/', phonetic: 'on-truh-pruh-NUR', tip: 'French loan word, stress the last syllable.' },
  thorough: { ipa: '/ˈθʌroʊ/', phonetic: 'THUR-oh', tip: 'Tongue tip between teeth for "th".' },
  schedule: { ipa: '/ˈskedʒuːl/', phonetic: 'SKEJ-ool', tip: 'Soft "j" glide in US English.' },
  particularly: { ipa: '/pərˈtɪkjələrli/', phonetic: 'per-TIK-yuh-ler-lee', tip: 'Keep all five syllables distinct.' },
  pronunciation: { ipa: '/prəˌnʌnsiˈeɪʃən/', phonetic: 'pruh-nun-see-AY-shuhn', tip: 'Note: "nun", not "noun".' },
  hypothesis: { ipa: '/haɪˈpɒθəsɪs/', phonetic: 'hy-POTH-uh-sis', tip: 'Stress the second syllable "POTH".' },
  extraordinary: { ipa: '/ɪkˈstrɔːrdəneri/', phonetic: 'ik-STROR-din-air-ee', tip: 'Blend into four fluid syllables.' },
  determination: { ipa: '/dɪˌtɜːrmɪˈneɪʃən/', phonetic: 'di-tur-mi-NAY-shuhn', tip: 'Clear primary stress on "NAY".' },
  breakthrough: { ipa: '/ˈbreɪkθruː/', phonetic: 'BRAYK-throo', tip: 'Smooth shift from "k" to "th".' },
};

export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '');
}

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Generate fallback IPA and phonetic guidance for unlisted words
function getWordPhonetics(cleanWord: string): { ipa: string; phonetic: string; tip: string } {
  if (IPA_LOOKUP[cleanWord]) {
    return IPA_LOOKUP[cleanWord];
  }

  // Heuristic rule-based phonetic generator
  let tip = 'Speak clearly with even breath support.';
  if (cleanWord.includes('th')) {
    tip = 'Place the tip of your tongue gently between your front teeth for "th".';
  } else if (cleanWord.startsWith('r') || cleanWord.includes('rr')) {
    tip = 'Curl the tip of your tongue slightly backward without touching the roof of the mouth.';
  } else if (cleanWord.startsWith('v') || cleanWord.includes('ve')) {
    tip = 'Rest your upper teeth on your lower lip and vibrate your vocal cords for "v".';
  } else if (cleanWord.startsWith('w')) {
    tip = 'Round your lips tightly like you are about to whistle for "w".';
  } else if (cleanWord.endsWith('tion') || cleanWord.endsWith('sion')) {
    tip = 'Pronounce "-tion" as a soft "shuhn" sound.';
  } else if (cleanWord.endsWith('ing')) {
    tip = 'Let the "ng" resonate softly through your nose without a hard "g" drop.';
  }

  return {
    ipa: `/${cleanWord}/`,
    phonetic: cleanWord.toUpperCase(),
    tip,
  };
}

// Identify phonetic sound category from word
function identifySoundCategory(word: string): string | null {
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
  th: 'Practice placing your tongue gently between your upper and lower teeth.',
  r: 'Avoid tapping the roof of your mouth; curl your tongue slightly back.',
  'v/w': 'Distinguish "v" (teeth on lower lip) from "w" (rounded whistling lips).',
  ng: 'Allow the sound to resonate through the nasal passage without a hard "k" or "g".',
  'sh/ch': 'Push your lips forward slightly and release air with a controlled hiss.',
  's/z': 'Ensure vocal cords vibrate for "z" and stay silent for "s".',
};

// Common English filler words
const FILLER_WORDS = new Set(['um', 'uh', 'er', 'ah', 'like', 'you know', 'hmm', 'erm']);

export function analyzeStoryParagraph(
  expectedText: string,
  spokenTranscript: string,
  durationSeconds: number
): ParagraphResult {
  const cleanTranscript = (spokenTranscript || '').trim();
  const rawExpectedTokens = expectedText.split(/\s+/).filter(Boolean);
  const rawSpokenTokens = cleanTranscript.split(/\s+/).filter(Boolean);

  // Normalize tokens
  const normExpected = rawExpectedTokens.map(normalizeWord).filter(Boolean);
  const normSpoken = rawSpokenTokens.map(normalizeWord).filter(Boolean);

  // Detect filler words
  const fillerFound: string[] = [];
  rawSpokenTokens.forEach((tok) => {
    const clean = normalizeWord(tok);
    if (FILLER_WORDS.has(clean)) {
      fillerFound.push(clean);
    }
  });

  // Calculate WPM (Words Per Minute)
  const effectiveDuration = Math.max(durationSeconds, 1.5);
  const spokenWordCount = normSpoken.length;
  const calculatedWpm = Math.round((spokenWordCount / effectiveDuration) * 60);

  // Word-level matching using dynamic programming Levenshtein alignment
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;

  const wordFeedbackList: StoryWordFeedback[] = [];
  const mispronouncedList: StoryWordFeedback[] = [];

  let spokenPtr = 0;
  let correctWordCount = 0;
  let unclearWordCount = 0;

  for (let i = 0; i < rawExpectedTokens.length; i++) {
    const expRaw = rawExpectedTokens[i];
    const expNorm = normExpected[i] || '';
    const phonetics = getWordPhonetics(expNorm);

    if (spokenPtr >= normSpoken.length) {
      // Remaining words were deleted/skipped
      deletions++;
      const item: StoryWordFeedback = {
        word: expRaw,
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
    const distance = levenshteinDistance(expNorm, currentSpokenNorm);

    if (expNorm === currentSpokenNorm) {
      // Exact match
      correctWordCount++;
      wordFeedbackList.push({
        word: expRaw,
        spoken: rawSpokenTokens[spokenPtr],
        status: 'correct',
        score: 95 + Math.floor(Math.random() * 5),
        ipa: phonetics.ipa,
        phonetic: phonetics.phonetic,
        tip: 'Pronounced clearly.',
      });
      spokenPtr++;
    } else if (distance <= 2 && expNorm.length > 3) {
      // Close match / unclear
      unclearWordCount++;
      substitutions++;
      const score = Math.max(50, 80 - distance * 15);
      const item: StoryWordFeedback = {
        word: expRaw,
        spoken: rawSpokenTokens[spokenPtr],
        status: 'unclear',
        score,
        ipa: phonetics.ipa,
        phonetic: phonetics.phonetic,
        tip: phonetics.tip,
      };
      wordFeedbackList.push(item);
      mispronouncedList.push(item);
      spokenPtr++;
    } else {
      // Lookahead check to see if user skipped this word or inserted an extra word
      const nextMatchInSpoken = normSpoken.slice(spokenPtr + 1, spokenPtr + 4).indexOf(expNorm);
      if (nextMatchInSpoken !== -1) {
        // User inserted extra words before this expected word
        insertions += nextMatchInSpoken + 1;
        spokenPtr += nextMatchInSpoken + 1;
        correctWordCount++;
        wordFeedbackList.push({
          word: expRaw,
          spoken: rawSpokenTokens[spokenPtr],
          status: 'correct',
          score: 88,
          ipa: phonetics.ipa,
          phonetic: phonetics.phonetic,
          tip: 'Recognized after hesitation.',
        });
        spokenPtr++;
      } else {
        // Word was substituted or mispronounced
        substitutions++;
        const item: StoryWordFeedback = {
          word: expRaw,
          spoken: rawSpokenTokens[spokenPtr],
          status: 'wrong',
          score: Math.max(30, 60 - distance * 10),
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

  // Any extra spoken words count as insertions
  if (spokenPtr < normSpoken.length) {
    insertions += normSpoken.length - spokenPtr;
  }

  const totalWords = Math.max(normExpected.length, 1);

  // 1. Accuracy via standard WER formula: (1 - (S + D + I) / N) * 100
  const werErrors = substitutions + deletions + insertions;
  const rawAccuracy = Math.round((1 - werErrors / totalWords) * 100);
  const accuracyScore = Math.max(20, Math.min(100, rawAccuracy));

  // 2. Completeness: percentage of expected words attempted
  const spokenMatchedOrAttempted = correctWordCount + unclearWordCount + substitutions;
  const completenessScore = Math.max(25, Math.min(100, Math.round((spokenMatchedOrAttempted / totalWords) * 100)));

  // 3. Pronunciation: average of individual word scores
  const totalWordScores = wordFeedbackList.reduce((acc, curr) => acc + curr.score, 0);
  const pronunciationScore = Math.max(30, Math.min(100, Math.round(totalWordScores / wordFeedbackList.length)));

  // 4. Fluency: based on WPM against ideal range (110-150) and penalties for pauses / fillers
  // Estimated pauses based on duration vs word count
  const expectedReadingSeconds = (normExpected.length / 130) * 60; // 130 WPM benchmark
  const pauseSeconds = Math.max(0, durationSeconds - expectedReadingSeconds);
  const estimatedPauses = Math.min(8, Math.max(0, Math.floor(pauseSeconds / 1.5)));

  let fluencyScore = 85;
  if (calculatedWpm >= IDEAL_WPM_RANGE.min && calculatedWpm <= IDEAL_WPM_RANGE.max) {
    fluencyScore = 92;
  } else if (calculatedWpm < IDEAL_WPM_RANGE.min) {
    const deficit = IDEAL_WPM_RANGE.min - calculatedWpm;
    fluencyScore = Math.max(40, 85 - Math.round(deficit * 0.7));
  } else {
    const excess = calculatedWpm - IDEAL_WPM_RANGE.max;
    fluencyScore = Math.max(50, 85 - Math.round(excess * 0.5));
  }
  // Penalize for filler words and long pauses
  fluencyScore = Math.max(30, fluencyScore - fillerFound.length * 4 - estimatedPauses * 3);

  // 5. Intonation: Rhythm, flow, and completeness
  const intonationScore = Math.max(
    35,
    Math.min(100, Math.round(pronunciationScore * 0.5 + fluencyScore * 0.3 + completenessScore * 0.2))
  );

  // 6. Communication: Weighted average using STORY_SCORING_WEIGHTS
  // (0.35 x Pronunciation + 0.25 x Fluency + 0.25 x Accuracy + 0.15 x Completeness)
  const communicationScore = Math.round(
    STORY_SCORING_WEIGHTS.pronunciation * pronunciationScore +
      STORY_SCORING_WEIGHTS.fluency * fluencyScore +
      STORY_SCORING_WEIGHTS.accuracy * accuracyScore +
      STORY_SCORING_WEIGHTS.completeness * completenessScore
  );

  // Generate 2 personalized improvement tips
  const tips: string[] = [];
  if (calculatedWpm < IDEAL_WPM_RANGE.min) {
    tips.push(`Your pace was ${calculatedWpm} WPM. Aim to pick up speed slightly towards ${IDEAL_WPM_RANGE.min}-${IDEAL_WPM_RANGE.max} WPM.`);
  } else if (calculatedWpm > IDEAL_WPM_RANGE.max) {
    tips.push(`You read at ${calculatedWpm} WPM. Slow down slightly to give every syllable enough breathing room.`);
  } else {
    tips.push(`Great reading pace! You stayed right inside the natural speaking range of ${IDEAL_WPM_RANGE.min}-${IDEAL_WPM_RANGE.max} WPM.`);
  }

  if (fillerFound.length > 0) {
    tips.push(`Watch out for filler sounds like "${fillerFound[0]}". Pause silently instead of saying filler words.`);
  } else if (mispronouncedList.length > 0) {
    const targetWord = mispronouncedList[0].word;
    tips.push(`Focus on "${targetWord}": ${mispronouncedList[0].tip}`);
  } else {
    tips.push('Excellent clarity and articulation! Keep this smooth cadence going into the next paragraph.');
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

export function computeFinalStoryReport(
  storyId: string,
  storyTitle: string,
  level: string,
  genre: string,
  paragraphResults: ParagraphResult[],
  previousScore: number | null
): FinalStoryReport {
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

  const mispronouncedFrequency: Record<string, StoryWordFeedback> = {};
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
      const clean = normalizeWord(item.word);
      if (!mispronouncedFrequency[clean]) {
        mispronouncedFrequency[clean] = item;
      }
      const soundCat = identifySoundCategory(clean);
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

  // Paragraph bar chart items
  const paragraphScores = paragraphResults.map((res, idx) => ({
    index: idx + 1,
    score: res.scores.communication,
    wpm: res.wpm,
    isBest: idx === bestIdx,
    isWeakest: idx === weakestIdx && paragraphResults.length > 1,
  }));

  // Top 5 mispronounced words
  const topMispronouncedWords = Object.values(mispronouncedFrequency).slice(0, 5);

  // Weakest sounds tally
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
      sound: 'Consonant blends',
      count: 0,
      advice: 'Great clear speech across all phonetic clusters!',
    });
  }

  // Communication level label
  let communicationLevel: FinalStoryReport['communicationLevel'] = 'Needs Practice';
  if (avgComm >= 85) {
    communicationLevel = 'Excellent';
  } else if (avgComm >= 75) {
    communicationLevel = 'Very Good';
  } else if (avgComm >= 60) {
    communicationLevel = 'Good';
  }

  // Comparison with previous attempt
  let delta: number | null = null;
  let message = 'First attempt on this story! Great start.';
  if (previousScore !== null) {
    delta = avgComm - previousScore;
    if (delta > 0) {
      message = `+${delta} points improvement from your previous attempt!`;
    } else if (delta === 0) {
      message = 'Matched your previous score. Keep practicing for a new personal best!';
    } else {
      message = `${delta} points compared to your last attempt. Try again to boost your score!`;
    }
  }

  return {
    storyId,
    storyTitle,
    level,
    genre,
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
    paragraphResults,
  };
}
