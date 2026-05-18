'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, DEMO_USERS } from '@/contexts/AuthContext';
import {
  Flame,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  KeyRound,
  Copy,
  CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome to Ignis! 🔥');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (u: (typeof DEMO_USERS)[0]) => {
    setLoading(true);
    try {
      await signIn(u.email, u.password);
      toast.success(`Signed in as ${u.displayName} 🔥`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 ignis-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Ignis AI</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Assisted Education Platform
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight">
            Empowering<br />
            <span className="text-white/80">Teachers</span><br />
            with AI
          </h1>
          <p className="text-lg text-white/70 max-w-sm leading-relaxed">
            Generate activities, evaluate student work, and automate reporting — all in seconds.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {['Activity Generator', 'AI Evaluation', 'Report Writer', 'PDF Export'].map((f) => (
              <span key={f} className="px-4 py-1.5 bg-white/15 text-white text-sm rounded-full border border-white/20">
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex gap-8">
          {[
            { value: '10s', label: 'Activity Generated' },
            { value: '30s', label: 'Report Written' },
            { value: '100%', label: 'Teacher-Centered' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-white/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 ignis-gradient rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold ignis-gradient-text">Ignis AI</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to your Ignis account</p>
          </div>

          {/* ── DEMO CREDENTIALS BOX ── */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800 uppercase tracking-wider">
                Demo Accounts — Click to login instantly
              </span>
            </div>

            <div className="space-y-3">
              {DEMO_USERS.map((u, i) => (
                <div
                  key={u.uid}
                  className="bg-white rounded-xl border border-amber-100 p-3 flex items-center justify-between gap-3 group hover:border-amber-300 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{u.displayName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-600">
                        {u.email}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-600">
                        {u.password}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => copyCredentials(i, `${u.email} / ${u.password}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy credentials"
                    >
                      {copiedIdx === i ? (
                        <CheckCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => quickLogin(u)}
                      disabled={loading}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Login →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Manual Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@ignis.ai"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
