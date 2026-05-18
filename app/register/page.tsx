'use client';

import Link from 'next/link';
import { Flame, ArrowRight, KeyRound } from 'lucide-react';
import { DEMO_USERS } from '@/contexts/AuthContext';

export default function RegisterPage() {
  // In demo mode — no real registration needed
  // Redirect users to login with demo credentials
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-14 h-14 ignis-gradient rounded-2xl flex items-center justify-center shadow-lg">
            <Flame className="w-7 h-7 text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800">Demo Mode Active</h2>
          <p className="text-slate-500 mt-2">
            This is a demo version. Use the pre-configured accounts below to sign in — no registration needed.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-800">Available Demo Accounts</span>
          </div>
          <div className="space-y-3">
            {DEMO_USERS.map((u) => (
              <div key={u.uid} className="bg-white rounded-xl border border-amber-100 p-3">
                <div className="font-semibold text-slate-800 text-sm">{u.displayName}</div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {u.email} / {u.password}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/login" className="btn-primary inline-flex mx-auto">
          <ArrowRight className="w-4 h-4" />
          Go to Login
        </Link>
      </div>
    </div>
  );
}
