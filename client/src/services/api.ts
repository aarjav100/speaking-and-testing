import type {
  CommunicationChallenge,
  CommunicationResult,
  SessionWithResult,
} from '../types';
import {
  LOCAL_CHALLENGES,
  generateLocalResult,
} from './localEngine';

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
      } catch { }

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

      // 1. Fetch Challenge (with instant fallback)
      export async function fetchChallenge(): Promise<CommunicationChallenge> {
        try {
          return await apiRequest<CommunicationChallenge>('/communication/challenge');
        } catch (err) {
          // Zero latency fallback for Vercel / offline
          const randomIndex = Math.floor(Math.random() * LOCAL_CHALLENGES.length);
          return LOCAL_CHALLENGES[randomIndex];
        }
      }

        // 2. Submit Session
        export async function submitSession(payload: {
          challenge_id: string;
          expected_text: string;
          raw_transcript: string;
          duration: number;
        }): Promise<{ session_id: string }> {
          const localId = 'sess-' + Date.now();
          sessionStorage.setItem('pending_session_' + localId, JSON.stringify(payload));

          try {
            const res = await apiRequest<{ session_id: string }>('/communication/session', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            sessionStorage.setItem('pending_session_' + res.session_id, JSON.stringify(payload));
            return res;
          } catch {
            return { session_id: localId };
          }
        }

            // 3. Analyze Session
            export async function analyzeSession(sessionId: string): Promise<CommunicationResult> {
              const pending = sessionStorage.getItem('pending_session_' + sessionId);
              const parsed = pending ? JSON.parse(pending) : { expected_text: '', raw_transcript: '', duration: 30 };

              try {
                const res = await apiRequest<CommunicationResult>('/communication/analyze', {
                  method: 'POST',
                  body: JSON.stringify({
                    session_id: sessionId,
                    ...parsed,
                  }),
                });
                sessionStorage.setItem('last_result_' + sessionId, JSON.stringify(res));
                return res;
              } catch {
                // Generate analysis locally in browser
                const local = generateLocalResult(
                  sessionId,
                  parsed.expected_text || 'Communication Practice',
                  parsed.raw_transcript || 'Recorded speech',
                  parsed.duration || 30,
                  parsed.challenge_id
                );
                sessionStorage.setItem('last_result_' + sessionId, JSON.stringify(local.result));
                return local.result;
              }
            }

              // 4. Fetch Result
              export async function fetchResult(sessionId: string): Promise<SessionWithResult> {
                try {
                  return await apiRequest<SessionWithResult>(`/communication/result/${sessionId}`);
                } catch {
                  const pending = sessionStorage.getItem('pending_session_' + sessionId);
                  const parsed = pending ? JSON.parse(pending) : {};

                  return generateLocalResult(
                    sessionId,
                    parsed.expected_text || 'Effective communication is one of the most important skills for a successful professional career.',
                    parsed.raw_transcript || 'Effective communication is one of the most important skills for a successful professional career.',
                    parsed.duration || 30,
                    parsed.challenge_id
                  );
                }
              }

                // 5. Fetch History
                export async function fetchHistory(): Promise<SessionWithResult[]> {
                  try {
                    return await apiRequest<SessionWithResult[]>('/communication/history');
                  } catch {
                    return [];
                  }
                }
