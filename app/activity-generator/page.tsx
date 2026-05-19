'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import WorksheetView from '@/components/activity/WorksheetView';
import { createActivity } from '@/services/firestore';
import { uploadGeneratedImage } from '@/services/storage';
import { GeneratedActivity, Activity } from '@/types';
import {
  Sparkles,
  GraduationCap,
  BookOpen,
  Heart,
  MessageSquare,
  Loader2,
  ChevronDown,
  Lightbulb,
  Wand2,
} from 'lucide-react';
import { getGradeOptions } from '@/lib/utils';
import toast from 'react-hot-toast';

const LANGUAGE_FOCUS_SUGGESTIONS = [
  'There is / There are',
  'Present Continuous',
  'Simple Past Tense',
  'Comparative Adjectives',
  'Modal Verbs (can, should, must)',
  'Question Words (Who, What, Where)',
  'Future Tense (will / going to)',
  'Prepositions of Place',
  'Conjunctions (because, so, but)',
  'Descriptive Adjectives',
];

const LIFE_SKILL_SUGGESTIONS = [
  'Teamwork',
  'Communication',
  'Critical Thinking',
  'Problem Solving',
  'Creativity',
  'Empathy',
  'Leadership',
  'Time Management',
  'Decision Making',
  'Responsibility',
];

export default function ActivityGeneratorPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  const [languageFocus, setLanguageFocus] = useState('');
  const [lifeSkillFocus, setLifeSkillFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivity | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade || !topic || !languageFocus || !lifeSkillFocus) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    setGeneratedActivity(null);

    try {
      const res = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, topic, languageFocus, lifeSkillFocus }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setGeneratedActivity(data.activity);
      toast.success('Activity generated successfully! ✨');

      // Auto-save to Firestore
      if (user) {
        let finalImageUrl = data.activity.imageUrl || '';
        
        // If the image is a base64 Data URL, upload it to Firebase Storage
        if (finalImageUrl.startsWith('data:')) {
          try {
            const uploadedUrl = await uploadGeneratedImage(finalImageUrl, user.uid, topic);
            finalImageUrl = uploadedUrl;
            data.activity.imageUrl = uploadedUrl;
          } catch (err) {
            console.error('Failed to upload illustration on auto-save:', err);
          }
        }

        const activityData: Omit<Activity, 'id'> = {
          title: data.activity.title,
          grade,
          topic,
          languageFocus,
          lifeSkillFocus,
          generatedContent: data.activity,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          status: 'active',
          imageUrl: finalImageUrl || undefined,
        };
        const id = await createActivity(activityData);
        setSavedId(id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate activity');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedActivity(null);
    setSavedId(null);
    setGrade('');
    setTopic('');
    setLanguageFocus('');
    setLifeSkillFocus('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Activity Generator</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Create Classroom Activity</h1>
          <p className="text-slate-500 mt-1">
            Fill in the details below and let AI build a complete activity worksheet, rubric, and guide.
          </p>
        </div>

        {!generatedActivity ? (
          /* Form */
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <form
                onSubmit={handleGenerate}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
              >
                {/* Grade */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    Grade / Level
                  </label>
                  <div className="relative">
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="input-field appearance-none pr-10"
                      required
                    >
                      <option value="">Select a grade...</option>
                      {getGradeOptions().map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Activity Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Sustainable Villages, My Community, Animals"
                    className="input-field"
                    required
                  />
                </div>

                {/* Language Focus */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    Language Focus
                  </label>
                  <input
                    type="text"
                    value={languageFocus}
                    onChange={(e) => setLanguageFocus(e.target.value)}
                    placeholder="e.g. There is / There are, Present Tense"
                    className="input-field"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {LANGUAGE_FOCUS_SUGGESTIONS.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setLanguageFocus(s)}
                        className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Life Skill */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Heart className="w-4 h-4 text-indigo-500" />
                    Life Skill Focus
                  </label>
                  <input
                    type="text"
                    value={lifeSkillFocus}
                    onChange={(e) => setLifeSkillFocus(e.target.value)}
                    placeholder="e.g. Teamwork, Communication, Empathy"
                    className="input-field"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {LIFE_SKILL_SUGGESTIONS.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setLifeSkillFocus(s)}
                        className="px-2.5 py-1 text-xs bg-violet-50 text-violet-600 rounded-full border border-violet-100 hover:bg-violet-100 transition-colors font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Activity...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      ✨ Generate Activity
                    </>
                  )}
                </button>

                {loading && (
                  <div className="text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span>AI is crafting your activity...</span>
                  </div>
                )}
              </form>
            </div>

            {/* Tips Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-slate-700 text-sm">What AI will generate</h3>
                </div>
                <ul className="space-y-2.5">
                  {[
                    'Complete activity title & objectives',
                    'Step-by-step teacher instructions',
                    'Student worksheet with sections',
                    '4-5 discussion questions',
                    'Presentation task for students',
                    'Full 4-criterion rubric',
                    'Estimated time & materials list',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1">Example Inputs</p>
                    <div className="text-xs text-amber-700 space-y-1">
                      <p>Grade: <strong>Grade 5</strong></p>
                      <p>Topic: <strong>Sustainable Villages</strong></p>
                      <p>Language: <strong>There is / There are</strong></p>
                      <p>Life Skill: <strong>Teamwork</strong></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGrade('Grade 5');
                        setTopic('Sustainable Villages');
                        setLanguageFocus('There is / There are');
                        setLifeSkillFocus('Teamwork');
                      }}
                      className="mt-3 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors font-medium"
                    >
                      Use this example →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Generated Activity View */
          <div className="animate-fade-in">
            <WorksheetView
              activity={generatedActivity}
              activityId={savedId}
              grade={grade}
              topic={topic}
              languageFocus={languageFocus}
              lifeSkillFocus={lifeSkillFocus}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
