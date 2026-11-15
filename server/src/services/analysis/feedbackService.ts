/**
 * Feedback Service
 * 
 * Generates human-readable feedback based on scores and comparison results.
 * Rule-based for Phase 1; can be enhanced with LLM in Phase 2.
 * 
 * IMPORTANT: This service generates FEEDBACK ABOUT the transcript.
 * It NEVER modifies the raw transcript itself.
 */

interface Scores {
  overall_score: number;
  speech_accuracy: number;
  pronunciation_score: number;
  fluency_score: number;
  word_accuracy: number;
  communication_score: number;
}

interface WordComparisonResult {
  totalExpected: number;
  totalSpoken: number;
  correctCount: number;
  missingCount: number;
  extraCount: number;
  mismatchCount: number;
}

interface CommunicationFeedback {
  strengths: string[];
  improvements: string[];
  summary: string;
}

export function generateFeedback(
  scores: Scores,
  comparison: WordComparisonResult,
  pronunciationIssueCount: number,
  duration: number
): CommunicationFeedback {
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Analyze speech accuracy
  if (scores.speech_accuracy >= 90) {
    strengths.push('Excellent speech accuracy — most words were recognized correctly');
  } else if (scores.speech_accuracy >= 75) {
    strengths.push('Good speech accuracy — majority of words matched the expected text');
  } else if (scores.speech_accuracy >= 50) {
    improvements.push('Work on reading accuracy — try to match the expected text more closely');
  } else {
    improvements.push('Speech accuracy needs significant improvement — practice reading the text slowly first');
  }

  // Analyze pronunciation
  if (pronunciationIssueCount === 0) {
    strengths.push('No pronunciation issues detected');
  } else if (pronunciationIssueCount <= 2) {
    strengths.push('Generally clear pronunciation with only minor issues');
    improvements.push('Practice the flagged words for clearer pronunciation');
  } else {
    improvements.push(`${pronunciationIssueCount} pronunciation areas to improve — review the flagged words and practice each one`);
  }

  // Analyze fluency
  const wpm = duration > 0 ? (comparison.totalSpoken / duration) * 60 : 0;
  if (wpm >= 100 && wpm <= 170) {
    strengths.push('Good speaking pace — natural and conversational');
  } else if (wpm < 80) {
    improvements.push('Try to speak at a slightly faster pace for more natural delivery');
  } else if (wpm > 200) {
    improvements.push('Consider slowing down slightly for clearer articulation');
  }

  // Analyze word coverage
  if (comparison.missingCount === 0) {
    strengths.push('Complete coverage — you spoke all the expected words');
  } else if (comparison.missingCount <= 2) {
    improvements.push(`${comparison.missingCount} word(s) were missed — review the expected text before speaking`);
  } else {
    improvements.push(`${comparison.missingCount} words were not detected — practice reading the full paragraph`);
  }

  // Analyze extra words
  if (comparison.extraCount === 0) {
    strengths.push('Clean delivery without extra filler words');
  } else if (comparison.extraCount <= 3) {
    improvements.push('Minor filler or extra words detected — aim for more precise delivery');
  } else {
    improvements.push('Reduce extra words and filler sounds for a cleaner delivery');
  }

  // Consistency
  if (scores.overall_score >= 80) {
    strengths.push('Consistent performance across all metrics');
  }

  // Ensure at least one strength and one improvement
  if (strengths.length === 0) {
    strengths.push('You completed the speaking challenge — keep practicing!');
  }
  if (improvements.length === 0) {
    improvements.push('Continue practicing with harder paragraphs to further improve');
  }

  // Generate summary
  let summary = '';
  if (scores.overall_score >= 85) {
    summary = 'Outstanding performance! Your communication skills are strong. Keep practicing to maintain and improve further.';
  } else if (scores.overall_score >= 70) {
    summary = 'Good effort! You demonstrated solid communication ability with some areas for improvement. Focus on the flagged areas to improve your score.';
  } else if (scores.overall_score >= 50) {
    summary = 'Decent attempt with room for growth. Review the pronunciation issues and practice reading the text more carefully. Regular practice will show improvement.';
  } else {
    summary = 'Keep practicing! Communication skills improve with consistent effort. Try reading the paragraph slowly first, then gradually increase your speaking speed.';
  }

  return { strengths, improvements, summary };
}
