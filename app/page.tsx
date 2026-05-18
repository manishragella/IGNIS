'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 ignis-gradient rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Ignis AI...</p>
      </div>
    </div>
  );
}
