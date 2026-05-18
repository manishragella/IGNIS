'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import WorksheetView from '@/components/activity/WorksheetView';
import { getActivity } from '@/services/firestore';
import { Activity } from '@/types';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params?.id as string;
    if (id) {
      getActivity(id)
        .then((data) => {
          if (data) {
            setActivity(data);
          } else {
            setError('Activity not found');
          }
        })
        .catch(() => setError('Failed to load activity'))
        .finally(() => setLoading(false));
    }
  }, [params?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/activity-generator"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Generator
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-slate-500">Loading activity...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="font-semibold text-slate-700">{error}</p>
              <Link href="/activity-generator" className="btn-primary text-sm">
                Create New Activity
              </Link>
            </div>
          </div>
        ) : activity?.generatedContent ? (
          <WorksheetView
            activity={activity.generatedContent}
            activityId={activity.id}
            grade={activity.grade}
            topic={activity.topic}
            languageFocus={activity.languageFocus}
            lifeSkillFocus={activity.lifeSkillFocus}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
