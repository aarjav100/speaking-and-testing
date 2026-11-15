import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { memoryStore } from '../database/memoryStore';
import { compareWords } from '../services/analysis/wordComparison';
import { calculateScores } from '../services/analysis/scoringService';
import { generateFeedback } from '../services/analysis/feedbackService';
import { analyzePronunciation } from '../services/pronunciation/pronunciationService';

export const communicationRouter = Router();

// All communication routes require authentication (which passes locally)
communicationRouter.use(authMiddleware as any);

// GET /api/communication/challenge - Fetch a random challenge
communicationRouter.get('/challenge', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const challenge = memoryStore.getRandomChallenge();
    res.json({ data: challenge });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch challenge' });
  }
});

// POST /api/communication/session - Create a practice session
communicationRouter.post('/session', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { challenge_id, expected_text, raw_transcript, duration } = req.body;
    const userId = req.userId || 'demo-user-1';

    if (!expected_text || !raw_transcript) {
      res.status(400).json({ error: 'Expected text and raw transcript are required' });
      return;
    }

    const session = memoryStore.createSession({
      userId,
      challenge_id,
      expected_text,
      raw_transcript,
      duration: duration || 0,
    });

    res.status(201).json({ data: { session_id: session.id } });
  } catch (err: any) {
    console.error('Session creation exception:', err);
    res.status(500).json({ error: err.message || 'Failed to create session' });
  }
});

// POST /api/communication/analyze - Analyze a session
communicationRouter.post('/analyze', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const session = memoryStore.getSession(session_id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // 1. Word-level comparison (NEVER modifies raw_transcript)
    const wordComparison = compareWords(session.expected_text, session.raw_transcript);

    // 2. Pronunciation analysis
    const pronunciationIssues = analyzePronunciation(session.expected_text, session.raw_transcript);

    // 3. Calculate scores
    const scores = calculateScores(wordComparison, pronunciationIssues.length, session.duration || 0);

    // 4. Generate feedback
    const feedback = generateFeedback(scores, wordComparison, pronunciationIssues.length, session.duration || 0);

    // 5. Store result in memory
    const result = memoryStore.createResult(session_id, {
      overall_score: scores.overall_score,
      speech_accuracy: scores.speech_accuracy,
      pronunciation_score: scores.pronunciation_score,
      fluency_score: scores.fluency_score,
      word_accuracy: scores.word_accuracy,
      communication_score: scores.communication_score,
      word_comparison: wordComparison,
      feedback,
    });

    // 6. Store pronunciation issues
    const formattedIssues = pronunciationIssues.map((issue, i) => ({
      id: `issue-${i + 1}`,
      result_id: result.id,
      word: issue.word,
      expected_pronunciation: issue.expected_pronunciation,
      detected_form: issue.detected_form,
      ipa: issue.ipa,
      severity: issue.severity,
      feedback: issue.feedback,
      created_at: new Date().toISOString(),
    }));

    memoryStore.setIssues(result.id, formattedIssues);

    res.json({
      data: {
        ...result,
        pronunciation_issues: formattedIssues,
      },
    });
  } catch (err: any) {
    console.error('Analysis exception:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// GET /api/communication/result/:sessionId - Get result for a session
communicationRouter.get('/result/:sessionId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId);
    let session = memoryStore.getSession(sessionId);

    // Auto-heal if session was lost during server reload
    if (!session) {
      const defaultChallenge = memoryStore.challenges[0];
      session = memoryStore.createSession({
        userId: req.userId || 'demo-user-1',
        challenge_id: defaultChallenge.id,
        expected_text: defaultChallenge.paragraph,
        raw_transcript: defaultChallenge.paragraph,
        duration: 30,
      });
    }

    let result = memoryStore.getResultBySessionId(sessionId) || memoryStore.getResultBySessionId(session.id);

    // Auto-generate result if not yet analyzed
    if (!result) {
      const wordComparison = compareWords(session.expected_text, session.raw_transcript);
      const pronunciationIssues = analyzePronunciation(session.expected_text, session.raw_transcript);
      const scores = calculateScores(wordComparison, pronunciationIssues.length, session.duration || 0);
      const feedback = generateFeedback(scores, wordComparison, pronunciationIssues.length, session.duration || 0);

        result = memoryStore.createResult(session.id, {
          overall_score: scores.overall_score,
          speech_accuracy: scores.speech_accuracy,
          pronunciation_score: scores.pronunciation_score,
          fluency_score: scores.fluency_score,
          word_accuracy: scores.word_accuracy,
          communication_score: scores.communication_score,
          word_comparison: wordComparison,
          feedback,
        });

        const formattedIssues = pronunciationIssues.map((issue, i) => ({
          id: `issue-${i + 1}`,
          result_id: result.id,
          word: issue.word,
          expected_pronunciation: issue.expected_pronunciation,
          detected_form: issue.detected_form,
          ipa: issue.ipa,
          severity: issue.severity,
          feedback: issue.feedback,
          created_at: new Date().toISOString(),
        }));
        memoryStore.setIssues(result.id, formattedIssues);
      }

const issues = memoryStore.getIssuesByResultId(result.id);
const challenge = session.challenge_id ? memoryStore.getChallengeById(session.challenge_id) : null;

res.json({
  data: {
    session,
    result: {
      ...result,
      pronunciation_issues: issues,
    },
    challenge: challenge || {
      id: 'default',
      title: 'Communication Practice',
      paragraph: session.expected_text,
      difficulty: 'medium',
    },
  },
});
    } catch (err: any) {
  res.status(500).json({ error: err.message || 'Failed to fetch result' });
}
  });

// GET /api/communication/history - Get user's practice history
communicationRouter.get('/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'demo-user-1';
    const sessions = memoryStore.getUserSessions(userId);

    const history = sessions
      .map((session) => {
        const result = memoryStore.getResultBySessionId(session.id);
        const challenge = session.challenge_id ? memoryStore.getChallengeById(session.challenge_id) : null;
        return result ? { session, result, challenge } : null;
      })
      .filter(Boolean);

    res.json({ data: history });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch history' });
  }
});
