'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// ============================================================
//  DEMO CREDENTIALS  (no Firebase, no DB — pure demo mode)
// ============================================================
export const DEMO_USERS = [
  {
    uid: 'demo-teacher-001',
    email: 'teacher@ignis.ai',
    password: 'ignis123',
    displayName: 'Priya Sharma',
    role: 'teacher' as const,
    photoURL: null,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    uid: 'demo-admin-002',
    email: 'admin@ignis.ai',
    password: 'admin123',
    displayName: 'Rahul Verma',
    role: 'admin' as const,
    photoURL: null,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    uid: 'demo-facilitator-003',
    email: 'demo@ignis.ai',
    password: 'demo123',
    displayName: 'Demo User',
    role: 'teacher' as const,
    photoURL: null,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

export type DemoUser = (typeof DEMO_USERS)[0];

interface AuthContextType {
  user: DemoUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'ignis_demo_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      throw new Error('Invalid email or password. Try: teacher@ignis.ai / ignis123');
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    setUser(found);
  };

  // Google login in demo → auto-login as demo user
  const signInWithGoogle = async () => {
    const demoUser = DEMO_USERS[2]; // "Demo User"
    localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
