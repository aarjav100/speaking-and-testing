import type {
  CommunicationChallenge,
  CommunicationResult,
  SessionWithResult,
} from '../types';

const API_BASE = '/api';
const STORAGE_KEY = 'ai_interview_user';

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
      return apiRequest<CommunicationChallenge>('/communication/challenge');
    }

    export async function submitSession(payload: {
      challenge_id: string;
      expected_text: string;
      raw_transcript: string;
      duration: number;
    }): Promise<{ session_id: string }> {
      return apiRequest<{ session_id: string }>('/communication/session', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
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
      return apiRequest<SessionWithResult[]>('/communication/history');
    }
