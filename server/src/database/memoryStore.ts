import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface Challenge {
  id: string;
  title: string;
  paragraph: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  expected_text: string;
  raw_transcript: string;
  duration: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  created_at: string;
}

class MemoryStore {
  public challenges: Challenge[] = [
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

  public sessions = new Map<string, Session>();
  public results = new Map<string, any>();
  public pronunciationIssues = new Map<string, any[]>();
  public users = new Map<string, UserProfile>();

  private getStorageFile(): string {
    if (process.env.VERCEL) {
      return path.join('/tmp', 'sessions_store.json');
    }
    return path.join(__dirname, 'sessions_store.json');
  }

  constructor() {
    // Default demo user
    const defaultUser: UserProfile = {
      id: 'demo-user-1',
      name: 'Demo Candidate',
      email: 'candidate@example.com',
      created_at: new Date().toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);
    this.users.set(defaultUser.email, defaultUser);

    // Load persisted sessions if available
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      const file = this.getStorageFile();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(raw);

        if (data.sessions) {
          for (const s of data.sessions) this.sessions.set(s.id, s);
        }
        if (data.results) {
          for (const r of data.results) this.results.set(r.session_id, r);
        }
        if (data.issues) {
          for (const k of Object.keys(data.issues)) {
            this.pronunciationIssues.set(k, data.issues[k]);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load sessions from disk', e);
    }
  }

  private saveToDisk() {
    try {
      const file = this.getStorageFile();
      const issuesObj: Record<string, any[]> = {};
      for (const [k, v] of this.pronunciationIssues.entries()) {
        issuesObj[k] = v;
      }

      const data = {
        sessions: Array.from(this.sessions.values()),
        results: Array.from(this.results.values()),
        issues: issuesObj,
      };
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save sessions to disk', e);
    }
  }

  public getRandomChallenge(): Challenge {
    const randomIndex = Math.floor(Math.random() * this.challenges.length);
    return this.challenges[randomIndex];
  }

  public getChallengeById(id: string): Challenge | undefined {
    return this.challenges.find((c) => c.id === id);
  }

  public createSession(data: {
    userId: string;
    challenge_id?: string | null;
    expected_text: string;
    raw_transcript: string;
    duration?: number;
  }): Session {
    const id = crypto.randomUUID();
    const session: Session = {
      id,
      user_id: data.userId,
      challenge_id: data.challenge_id || null,
      expected_text: data.expected_text,
      raw_transcript: data.raw_transcript,
      duration: data.duration || 0,
      created_at: new Date().toISOString(),
    };
    this.sessions.set(id, session);
    this.saveToDisk();
    return session;
  }

  public getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  public createResult(sessionId: string, resultData: any): any {
    const id = crypto.randomUUID();
    const record = {
      id,
      session_id: sessionId,
      ...resultData,
      created_at: new Date().toISOString(),
    };
    this.results.set(sessionId, record);
    this.saveToDisk();
    return record;
  }

  public getResultBySessionId(sessionId: string): any | undefined {
    return this.results.get(sessionId);
  }

  public setIssues(resultId: string, issues: any[]): void {
    this.pronunciationIssues.set(resultId, issues);
    this.saveToDisk();
  }

  public getIssuesByResultId(resultId: string): any[] {
    return this.pronunciationIssues.get(resultId) || [];
  }

  public getUserSessions(userId: string): Session[] {
    const list: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.user_id === userId) {
        list.push(session);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export const memoryStore = new MemoryStore();
