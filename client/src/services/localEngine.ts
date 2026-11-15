import type {
  CommunicationChallenge,
  CommunicationResult,
  SessionWithResult,
  WordComparison,
  WordComparisonItem,
  PronunciationIssue,
} from '../types';

export const LOCAL_CHALLENGES: CommunicationChallenge[] = [
  {
    id: 'ch-1',
    title: 'Professional Communication',
    paragraph: 'Effective communication is one of the most important skills for a successful professional career. It allows people to express their ideas clearly, collaborate with others, and build strong relationships.',
    difficulty: 'easy',
    category: 'professional',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-2',
    title: 'Technology Innovation',
    paragraph: 'Technology continues to transform the way we work and communicate. From artificial intelligence to cloud computing, modern innovations are reshaping industries and creating new opportunities for growth and development.',
    difficulty: 'medium',
    category: 'technology',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-3',
    title: 'Leadership Skills',
    paragraph: 'Great leaders inspire others through their actions and words. They demonstrate integrity, empathy, and a clear vision for the future. Leadership is not about authority but about empowering others to achieve their full potential.',
    difficulty: 'medium',
    category: 'leadership',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-4',
    title: 'Problem Solving',
    paragraph: 'Problem solving is a critical skill in every profession. It involves identifying challenges, analyzing possible solutions, and implementing the most effective approach. Strong problem solvers combine creativity with logical thinking to overcome obstacles.',
    difficulty: 'hard',
    category: 'skills',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-5',
    title: 'Team Collaboration',
    paragraph: 'Successful teams are built on trust, open communication, and shared goals. When team members respect each other and contribute their unique strengths, they can accomplish far more than any individual working alone.',
    difficulty: 'easy',
    category: 'teamwork',
    created_at: new Date().toISOString(),
  },
];

const ipaDict: Record<string, string> = {
  communication: '/kəˌmjuːnɪˈkeɪʃən/',
  effective: '/ɪˈfektɪv/',
  important: '/ɪmˈpɔːrtənt/',
  skills: '/skɪlz/',
  successful: '/səkˈsesfʊl/',
  professional: '/prəˈfeʃənəl/',
  career: '/kəˈrɪr/',
  allows: '/əˈlaʊz/',
  express: '/ɪkˈspres/',
  clearly: '/ˈklɪrli/',
  collaborate: '/kəˈlæbəreɪt/',
  relationships: '/rɪˈleɪʃənʃɪps/',
  technology: '/tekˈnɒlədʒi/',
  artificial: '/ˌɑːrtɪˈfɪʃəl/',
  intelligence: '/ɪnˈtelɪdʒəns/',
  computing: '/kəmˈpjuːtɪŋ/',
  innovations: '/ˌɪnəˈveɪʃənz/',
  leadership: '/ˈliːdərʃɪp/',
  demonstrate: '/ˈdemənstreɪt/',
  integrity: '/ɪnˈtegrɪti/',
  empathy: '/ˈempəθi/',
  authority: '/ɔːˈθɒrɪti/',
  empowering: '/ɪmˈpaʊərɪŋ/',
  potential: '/pəˈtenʃəl/',
};

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '');
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

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

export function runClientWordComparison(expectedText: string, rawTranscript: string): WordComparison {
  const expWords = expectedText.trim().split(/\s+/).filter(Boolean);
  const spkWords = rawTranscript.trim().split(/\s+/).filter(Boolean);

  const expected: WordComparisonItem[] = [];
  const spoken: WordComparisonItem[] = [];

  let correctCount = 0;
  let missingCount = 0;
  let extraCount = 0;
  let mismatchCount = 0;

  const usedSpoken = new Set<number>();

  expWords.forEach((expWord, i) => {
    const normExp = normalize(expWord);
    let matched = false;

    // Direct match check in sliding window
    for (let j = Math.max(0, i - 3); j <= Math.min(spkWords.length - 1, i + 3); j++) {
      if (!usedSpoken.has(j) && normalize(spkWords[j]) === normExp) {
        expected.push({ word: expWord, status: 'correct', index: i });
        usedSpoken.add(j);
        matched = true;
        correctCount++;
        break;
      }
    }

    if (!matched) {
      // Near match check
      for (let j = Math.max(0, i - 2); j <= Math.min(spkWords.length - 1, i + 2); j++) {
        if (!usedSpoken.has(j)) {
          const dist = levenshtein(normExp, normalize(spkWords[j]));
          if (dist <= 2 && dist < normExp.length) {
            expected.push({ word: expWord, status: 'mismatch', index: i });
            usedSpoken.add(j);
            matched = true;
            mismatchCount++;
            break;
          }
        }
      }
    }

    if (!matched) {
      expected.push({ word: expWord, status: 'missing', index: i });
      missingCount++;
    }
  });

  spkWords.forEach((spkWord, j) => {
    if (usedSpoken.has(j)) {
      spoken.push({ word: spkWord, status: 'correct', index: j });
    } else {
      spoken.push({ word: spkWord, status: 'extra', index: j });
      extraCount++;
    }
  });

  return {
    expected,
    spoken,
    totalExpected: expWords.length,
    totalSpoken: spkWords.length,
    correctCount,
    missingCount,
    extraCount,
    mismatchCount,
  };
}

export function runClientPronunciation(expectedText: string, rawTranscript: string): PronunciationIssue[] {
  const expWords = expectedText.trim().split(/\s+/).filter(Boolean);
  const spkWords = rawTranscript.trim().split(/\s+/).filter(Boolean);
  const issues: PronunciationIssue[] = [];

  expWords.forEach((expWord) => {
    const norm = normalize(expWord);
    if (norm.length >= 6) {
      const found = spkWords.some((sw) => normalize(sw) === norm);
      if (!found) {
        issues.push({
          id: `iss-${issues.length + 1}`,
          result_id: 'local',
          word: expWord,
          expected_pronunciation: norm,
          detected_form: 'unclear',
          ipa: ipaDict[norm] || `/${norm}/`,
          severity: norm.length > 9 ? 'high' : 'medium',
          feedback: `Practice articulating "${expWord}" clearly.`,
          created_at: new Date().toISOString(),
        });
      }
    }
  });

  return issues.slice(0, 5);
}

export function runClientScoring(
  comparison: WordComparison,
  issuesCount: number,
  durationSeconds: number
) {
  const { totalExpected, totalSpoken, correctCount } = comparison;

  const speech_accuracy = totalExpected > 0
    ? Math.min(100, Math.round((correctCount / totalExpected) * 100))
    : 0;

  const pronunciation_score = totalExpected > 0
    ? Math.max(0, Math.round(((totalExpected - issuesCount) / totalExpected) * 100))
    : 0;

  const minutes = durationSeconds / 60;
  const wpm = minutes > 0 ? Math.round(totalSpoken / minutes) : 0;

  let fluency_score = 90;
  if (wpm < 80) fluency_score = Math.max(30, 90 - (80 - wpm) * 0.7);
  else if (wpm > 190) fluency_score = Math.max(50, 90 - (wpm - 190) * 0.5);

  const word_accuracy = totalExpected > 0
    ? Math.min(100, Math.round((correctCount / Math.max(totalExpected, totalSpoken)) * 100))
    : 0;

  const communication_score = Math.round(
    speech_accuracy * 0.4 + fluency_score * 0.3 + pronunciation_score * 0.3
  );

  const overall_score = Math.round(
    speech_accuracy * 0.35 +
    pronunciation_score * 0.25 +
    fluency_score * 0.2 +
    word_accuracy * 0.2
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

export function generateLocalResult(
  sessionId: string,
  expectedText: string,
  rawTranscript: string,
  durationSeconds: number,
  challengeId?: string
): SessionWithResult {
  const comparison = runClientWordComparison(expectedText, rawTranscript);
  const issues = runClientPronunciation(expectedText, rawTranscript);
  const scores = runClientScoring(comparison, issues.length, durationSeconds);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (scores.speech_accuracy >= 80) strengths.push('Strong reading and pronunciation accuracy');
  else improvements.push('Practice matching the passage words more precisely');

  if (scores.fluency_score >= 80) strengths.push('Natural speaking pace and rhythm');
  else improvements.push('Aim for a steady pace of 120-150 words per minute');

  if (issues.length === 0) strengths.push('Clear articulation across all complex words');
  else improvements.push(`Focus on the ${issues.length} flagged pronunciation words`);

  const challenge = LOCAL_CHALLENGES.find((c) => c.id === challengeId) || LOCAL_CHALLENGES[0];

  const resultData: CommunicationResult = {
    id: `res-${sessionId}`,
    session_id: sessionId,
    overall_score: scores.overall_score,
    speech_accuracy: scores.speech_accuracy,
    pronunciation_score: scores.pronunciation_score,
    fluency_score: scores.fluency_score,
    word_accuracy: scores.word_accuracy,
    communication_score: scores.communication_score,
    word_comparison: comparison,
    feedback: {
      strengths,
      improvements,
      summary: scores.overall_score >= 80
        ? 'Great speaking performance! Your speech was clear and confident.'
        : 'Good effort! Review the flagged words and retry to boost your score.',
    },
    pronunciation_issues: issues,
    created_at: new Date().toISOString(),
  };

  return {
    session: {
      id: sessionId,
      user_id: 'demo-user-1',
      challenge_id: challenge.id,
      expected_text: expectedText,
      raw_transcript: rawTranscript,
      duration: durationSeconds,
      created_at: new Date().toISOString(),
    },
    result: resultData,
    challenge,
  };
}
