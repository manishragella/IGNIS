'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { getDashboardStats } from '@/services/firestore';
import {
  Sparkles,
  Upload,
  FileText,
  BarChart3,
  ArrowRight,
  BookOpen,
  Clock,
  TrendingUp,
  Flame,
  Zap,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Activity } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalSubmissions: 0,
    totalReports: 0,
    recentActivities: [] as Activity[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getDashboardStats(user.uid).then((data) => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { label: 'Activities Created', value: stats.totalActivities, icon: BookOpen, color: 'from-indigo-500 to-purple-600', href: '/activity-generator' },
    { label: 'Student Submissions', value: stats.totalSubmissions, icon: Upload, color: 'from-violet-500 to-fuchsia-600', href: '/submissions' },
    { label: 'Reports Generated', value: stats.totalReports, icon: FileText, color: 'from-cyan-500 to-blue-600', href: '/reports' },
    { label: 'Hours Saved', value: `${Math.max(0, stats.totalActivities * 2 + stats.totalReports * 3)}h`, icon: TrendingUp, color: 'from-emerald-500 to-teal-600', href: '/dashboard' },
  ];

  const quickActions = [
    { title: 'Generate Activity', description: 'Create an AI-powered classroom activity with worksheet and rubric', icon: Sparkles, href: '/activity-generator', gradient: 'from-indigo-500 to-purple-600', badge: 'Most Used' },
    { title: 'Evaluate Submission', description: 'Upload student work and get instant AI-powered feedback and scores', icon: Upload, href: '/submissions', gradient: 'from-violet-500 to-fuchsia-600', badge: null },
    { title: 'Generate Report', description: 'Create a professional school implementation report in seconds', icon: FileText, href: '/reports', gradient: 'from-cyan-500 to-blue-600', badge: null },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-1">
              <Flame className="w-4 h-4" />
              <span>Ignis AI Facilitator</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              {greeting()},{' '}
              <span className="ignis-gradient-text">
                {user?.displayName?.split(' ')[0] || 'Teacher'}
              </span>{' '}
              👋
            </h1>
            <p className="text-slate-500 mt-1">Ready to inspire your students today?</p>
          </div>
          <Link href="/activity-generator" className="btn-primary flex-shrink-0">
            <Sparkles className="w-4 h-4" />
            Create Activity
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <Link key={card.label} href={card.href} className="premium-card p-5 group cursor-pointer">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-sm`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {loading ? <div className="skeleton h-7 w-12 rounded" /> : card.value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{card.label}</div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Zap className="w-3.5 h-3.5" />
              AI-powered
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <Link key={action.title} href={action.href} className="premium-card p-6 group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                {action.badge && (
                  <span className="absolute top-3 right-3 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                    {action.badge}
                  </span>
                )}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-md`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{action.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{action.description}</p>
                <div className="flex items-center gap-1 text-indigo-600 text-sm font-semibold group-hover:gap-2 transition-all duration-200">
                  Get started <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Activities</h2>
            <Link href="/activity-generator" className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="premium-card p-4 flex gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats.recentActivities.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-bold text-slate-700 mb-2">No activities yet</h3>
              <p className="text-slate-400 text-sm mb-4">Generate your first AI-powered activity to get started</p>
              <Link href="/activity-generator" className="btn-primary inline-flex">
                <Sparkles className="w-4 h-4" />
                Create First Activity
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <Link key={activity.id} href={`/activity-generator/${activity.id}`} className="premium-card p-4 flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {activity.generatedContent?.title || activity.topic}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{activity.grade}</span>
                      <span>•</span>
                      <span className="truncate">{activity.topic}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(activity.createdAt)}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Tip Banner */}
        <div className="ignis-gradient rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-10 -translate-y-10" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-white/80 text-sm font-medium">Pro Tip</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Save 5+ hours weekly</h3>
              <p className="text-white/75 text-sm max-w-sm">
                Use the Activity Generator before every session. AI builds the full worksheet, rubric, and discussion guide instantly.
              </p>
            </div>
            <Link
              href="/activity-generator"
              className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm border border-white/20 flex items-center gap-2"
            >
              Try now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
