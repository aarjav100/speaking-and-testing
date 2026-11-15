/**
 * Pronunciation Analysis Service
 * 
 * Identifies potential pronunciation issues by comparing
 * the raw transcript with expected text at the word level.
 * 
 * Uses phonetic similarity (Soundex-like) and common mispronunciation patterns.
 * 
 * ARCHITECTURE NOTE: This is a rule-based implementation for Phase 1.
 * In Phase 2, this can be replaced with a real pronunciation assessment API
 * (e.g., Azure Speech Services, SpeechAce) without changing the interface.
 */

interface PronunciationIssue {
  word: string;
  expected_pronunciation: string;
  detected_form: string;
  ipa: string;
  severity: 'low' | 'medium' | 'high';
  feedback: string;
}

// Common IPA dictionary for frequently used English words
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
  reshaping: '/riːˈʃeɪpɪŋ/',
  industries: '/ˈɪndəstriz/',
  opportunities: '/ˌɒpərˈtjuːnɪtiz/',
  development: '/dɪˈveləpmənt/',
  leadership: '/ˈliːdərʃɪp/',
  demonstrate: '/ˈdemənstreɪt/',
  integrity: '/ɪnˈtegrɪti/',
  empathy: '/ˈempəθi/',
  authority: '/ɔːˈθɒrɪti/',
  empowering: '/ɪmˈpaʊərɪŋ/',
  potential: '/pəˈtenʃəl/',
  achieve: '/əˈtʃiːv/',
  problem: '/ˈprɒbləm/',
  solving: '/ˈsɒlvɪŋ/',
  critical: '/ˈkrɪtɪkəl/',
  profession: '/prəˈfeʃən/',
  involves: '/ɪnˈvɒlvz/',
  identifying: '/aɪˈdentɪfaɪɪŋ/',
  analyzing: '/ˈænəlaɪzɪŋ/',
  implementing: '/ˈɪmplɪmentɪŋ/',
  creativity: '/ˌkriːeɪˈtɪvɪti/',
  logical: '/ˈlɒdʒɪkəl/',
  obstacles: '/ˈɒbstəkəlz/',
  collaboration: '/kəˌlæbəˈreɪʃən/',
  accomplish: '/əˈkɒmplɪʃ/',
  individual: '/ˌɪndɪˈvɪdʒuəl/',
  challenges: '/ˈtʃælɪndʒɪz/',
  solutions: '/səˈluːʃənz/',
  approach: '/əˈprəʊtʃ/',
  thinking: '/ˈθɪŋkɪŋ/',
  overcome: '/ˌəʊvərˈkʌm/',
  confidence: '/ˈkɒnfɪdəns/',
  pronunciation: '/prəˌnʌnsiˈeɪʃən/',
  vocabulary: '/vəˈkæbjələri/',
};

// Common pronunciation feedback
const pronunciationTips: Record<string, string> = {
  communication: 'Focus on the stressed syllable "KAY" — com-myu-ni-KAY-shun.',
  technology: 'Stress falls on the second syllable — tek-NOL-uh-jee.',
  professional: 'Three syllables with stress on second — pruh-FESH-un-ul.',
  effective: 'Stress on the second syllable — ih-FEK-tiv.',
  successful: 'Stress on the second syllable — suk-SES-ful.',
  opportunities: 'Five syllables — op-er-TYOO-ni-teez.',
  development: 'Four syllables — dih-VEL-up-ment.',
  collaborate: 'Four syllables — kuh-LAB-uh-rayt.',
  relationships: 'Four syllables — rih-LAY-shun-ships.',
  intelligence: 'Four syllables — in-TEL-ih-juns.',
  creativity: 'Five syllables — kree-ay-TIV-ih-tee.',
  implementing: 'Four syllables — IM-pluh-men-ting.',
  identifying: 'Five syllables — eye-DEN-tih-fye-ing.',
};

function normalizeForComparison(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '');
}

function levenshteinDistance(a: string, b: string): number {
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

/**
 * Soundex-like phonetic encoding for English words
 */
function phoneticCode(word: string): string {
  const w = word.toLowerCase();
  if (w.length === 0) return '';

  const map: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };

  let code = w[0].toUpperCase();
  let lastCode = map[w[0]] || '';

  for (let i = 1; i < w.length && code.length < 6; i++) {
    const c = map[w[i]] || '';
    if (c && c !== lastCode) {
      code += c;
      lastCode = c;
    } else if (!c) {
      lastCode = '';
    }
  }

  return code.padEnd(6, '0');
}

export function analyzePronunciation(
  expectedText: string,
  rawTranscript: string
): PronunciationIssue[] {
  const expectedWords = expectedText.split(/\s+/).filter(Boolean);
  const spokenWords = rawTranscript.split(/\s+/).filter(Boolean);
  const issues: PronunciationIssue[] = [];
  const processedWords = new Set<string>();

  // Find words that differ between expected and spoken
  const expectedNorm = expectedWords.map(normalizeForComparison);
  const spokenNorm = spokenWords.map(normalizeForComparison);
  const spokenSet = new Set(spokenNorm);

  for (let i = 0; i < expectedWords.length; i++) {
    const expNorm = expectedNorm[i];
    if (!expNorm || processedWords.has(expNorm)) continue;

    // Check if exact match exists in spoken
    if (spokenSet.has(expNorm)) continue;

    // Find closest match in spoken words
    let bestMatch = '';
    let bestDistance = Infinity;

    for (let j = 0; j < spokenWords.length; j++) {
      const spokNorm = spokenNorm[j];
      if (!spokNorm) continue;

      const distance = levenshteinDistance(expNorm, spokNorm);
      const phoneticSimilar = phoneticCode(expNorm) === phoneticCode(spokNorm);

      // Consider it a pronunciation issue if phonetically similar but not exact match
      if ((distance <= Math.max(2, Math.floor(expNorm.length * 0.35)) || phoneticSimilar) && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = spokenWords[j];
      }
    }

    if (bestMatch && bestDistance > 0) {
      processedWords.add(expNorm);

      const severity: 'low' | 'medium' | 'high' = 
        bestDistance <= 1 ? 'low' :
        bestDistance <= 2 ? 'medium' : 'high';

      const wordKey = expNorm;
      const ipa = ipaDict[wordKey] || '';
      const tip = pronunciationTips[wordKey] || `Practice saying "${expectedWords[i]}" slowly and clearly.`;

      issues.push({
        word: expectedWords[i],
        expected_pronunciation: expectedWords[i],
        detected_form: bestMatch,
        ipa,
        severity,
        feedback: tip,
      });
    }
  }

  return issues;
}
