// ============================================
// TypeScript Types for the AI Interview Platform
// ============================================

// Auth
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

// Communication
export interface CommunicationChallenge {
  id: string;
  title: string;
  paragraph: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  created_at: string;
}

export interface CommunicationSession {
  id: string;
  user_id: string;
  challenge_id: string;
  expected_text: string;
  raw_transcript: string;
  duration: number;
  created_at: string;
}

export interface WordComparisonItem {
  word: string;
  status: 'correct' | 'missing' | 'extra' | 'mismatch';
  expected?: string;
  index: number;
}

export interface WordComparison {
  expected: WordComparisonItem[];
  spoken: WordComparisonItem[];
  totalExpected: number;
  totalSpoken: number;
  correctCount: number;
  missingCount: number;
  extraCount: number;
  mismatchCount: number;
}

export interface PronunciationIssue {
  id: string;
  result_id: string;
  word: string;
  expected_pronunciation: string;
  detected_form: string;
  ipa: string;
  severity: 'low' | 'medium' | 'high';
  feedback: string;
  created_at?: string;
}

export interface CommunicationFeedback {
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface CommunicationResult {
  id: string;
  session_id: string;
  overall_score: number;
  speech_accuracy: number;
  pronunciation_score: number;
  fluency_score: number;
  word_accuracy: number;
  communication_score: number;
  word_comparison: WordComparison;
  feedback: CommunicationFeedback;
  pronunciation_issues: PronunciationIssue[];
  created_at: string;
}

export interface SessionWithResult {
  session: CommunicationSession;
  result: CommunicationResult;
  challenge: CommunicationChallenge;
}

// Speech Recognition
export interface SpeechRecognitionState {
  isListening: boolean;
  isPaused: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

// Toast Notification
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// Theme
export type Theme = 'light' | 'dark';

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
