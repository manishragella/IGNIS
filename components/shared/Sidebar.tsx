'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Flame,
  LayoutDashboard,
  Sparkles,
  Upload,
  FileText,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
  { label: 'Activity Generator', href: '/activity-generator', icon: Sparkles, description: 'Create AI activities' },
  { label: 'Submissions', href: '/submissions', icon: Upload, description: 'Student work & eval' },
  { label: 'Reports', href: '/reports', icon: FileText, description: 'School reports' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 ignis-gradient rounded-xl flex items-center justify-center shadow-md">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-base leading-tight">Ignis AI</div>
            <div className="text-xs text-slate-400">Facilitator Assistant</div>
          </div>
        </div>
      </div>

      <div className="mx-6 h-px bg-slate-100 mb-4" />

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
                isActive ? 'ignis-gradient shadow-sm' : 'bg-slate-100 group-hover:bg-slate-200'
              )}>
                <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-500')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn('font-semibold text-sm', isActive ? 'text-indigo-700' : 'text-slate-700')}>
                  {item.label}
                </div>
                <div className="text-xs text-slate-400 truncate">{item.description}</div>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 space-y-2">
        <div className="mx-px h-px bg-slate-100 mb-3" />
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 ignis-gradient rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm">
            {(user?.displayName || 'T')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-700 truncate">
              {user?.displayName || 'Teacher'}
            </div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>

        {/* Demo badge */}
        <div className="mx-3 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-center">
          <span className="text-xs font-semibold text-amber-600">🎭 Demo Mode</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center border border-slate-200"
      >
        {mobileOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={cn(
        'fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 lg:hidden shadow-2xl',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>

      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 min-h-screen sticky top-0">
        <SidebarContent />
      </div>
    </>
  );
}
