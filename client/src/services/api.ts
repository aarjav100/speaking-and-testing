import type {
  CommunicationChallenge,
  CommunicationResult,
  SessionWithResult,
} from '../types';

const API_BASE = '/api';
const STORAGE_KEY = 'ai_interview_user';

const FALLBACK_CHALLENGES: CommunicationChallenge[] = [
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

function getAuthHeaders(): Record<string, string> {
  let userId = 'demo-user-1';
  let userEmail = 'candidate@example.com';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      userId = parsed.id || userId;
      userEmail = parsed.email || userEmail;
    }
  } catch {
    // ignore
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userId}`,
    'x-user-email': userEmail,
  };
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = getAuthHeaders();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data !== undefined ? data.data : data;
}

// Communication API
export async function fetchChallenge(): Promise<CommunicationChallenge> {
  try {
    return await apiRequest<CommunicationChallenge>('/communication/challenge');
  } catch (err) {
    console.warn('Backend challenge request failed, using client fallback:', err);
    const randomIndex = Math.floor(Math.random() * FALLBACK_CHALLENGES.length);
    return FALLBACK_CHALLENGES[randomIndex];
  }
}

export async function submitSession(payload: {
  challenge_id: string;
  expected_text: string;
  raw_transcript: string;
  duration: number;
}): Promise<{ session_id: string }> {
  try {
    return await apiRequest<{ session_id: string }>('/communication/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const fallbackId = 'local-sess-' + Date.now();
    try {
      sessionStorage.setItem('pending_session_' + fallbackId, JSON.stringify(payload));
    } catch {}
    return { session_id: fallbackId };
  }
}

export async function analyzeSession(sessionId: string): Promise<CommunicationResult> {
  return apiRequest<CommunicationResult>('/communication/analyze', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function fetchResult(sessionId: string): Promise<SessionWithResult> {
  return apiRequest<SessionWithResult>(`/communication/result/${sessionId}`);
}

export async function fetchHistory(): Promise<SessionWithResult[]> {
  try {
    return await apiRequest<SessionWithResult[]>('/communication/history');
  } catch {
    return [];
  }
}
