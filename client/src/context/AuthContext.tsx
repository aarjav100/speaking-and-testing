import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';

export interface LocalSession {
  access_token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  session: LocalSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'ai_interview_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
        // Load user from localStorage or initialize default demo candidate
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            setSession({ access_token: parsed.id, user: parsed });
          } else {
            const defaultUser: User = {
              id: 'demo-user-1',
              name: 'Demo Candidate',
              email: 'candidate@example.com',
              created_at: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
            setUser(defaultUser);
            setSession({ access_token: defaultUser.id, user: defaultUser });
          }
        } catch {
          // Fallback
        } finally {
          setLoading(false);
  }
  }, []);

  const login = async (email: string, _password: string) => {
    const loggedUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
    setSession({ access_token: loggedUser.id, user: loggedUser });
  };

      const signup = async (name: string, email: string, _password: string) => {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
    created_at: new Date().toISOString(),
    };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  setUser(newUser);
  setSession({ access_token: newUser.id, user: newUser });
};

const logout = async () => {
  localStorage.removeItem(STORAGE_KEY);
  setUser(null);
  setSession(null);
};

return (
  <AuthContext.Provider value={{ user, session, loading, login, signup, logout }}>
    {children}
  </AuthContext.Provider>
);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
