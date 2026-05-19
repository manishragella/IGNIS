'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { createSubmission, updateSubmission } from '@/services/firestore';
import { uploadSubmissionImage } from '@/services/storage';
import { AIFeedback, EvaluationScores } from '@/types';
import {
  Upload,
  User,
  FileImage,
  Loader2,
  Star,
  MessageCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Edit3,
  Save,
  RefreshCw,
  ImageIcon,
  Type,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';

const SCORE_LABELS: Record<keyof EvaluationScores, string> = {
  creativity: 'Creativity',
  grammar: 'Grammar',
  communication: 'Communication',
  understanding: 'Understanding',
  participation: 'Participation',
  overall: 'Overall Score',
};

const SCORE_ICONS: Record<keyof EvaluationScores, string> = {
  creativity: '🎨',
  grammar: '📝',
  communication: '💬',
  understanding: '🧠',
  participation: '🙋',
  overall: '⭐',
};

export default function SubmissionsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [studentName, setStudentName] = useState('');
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max size is 10MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) {
      toast.error('Please enter the student\'s name');
      return;
    }
    if (inputMode === 'image' && !imageFile) {
      toast.error('Please upload an image');
      return;
    }
    if (inputMode === 'text' && !submissionText.trim()) {
      toast.error('Please enter the submission text');
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      if (inputMode === 'image' && imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('text', submissionText);
      }

      const res = await fetch('/api/evaluate-submission', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');

      setFeedback(data.feedback);
      toast.success('Evaluation complete! 🎯');

      // Save to Firestore
      if (user) {
        let imageUrl = '';
        if (imageFile) {
          imageUrl = await uploadSubmissionImage(imageFile, user.uid);
        }

        const subData = {
          studentName,
          activityId: '',
          imageUrl: imageUrl || undefined,
          submissionText: submissionText || undefined,
          aiFeedback: data.feedback,
          scores: data.feedback.scores,
          status: 'evaluated' as const,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
        };

        const id = await createSubmission(subData);
        setSavedId(id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!savedId) return;
    setSavingNotes(true);
    try {
      await updateSubmission(savedId, {
        teacherNotes,
        status: 'reviewed',
      });
      setEditingNotes(false);
      toast.success('Notes saved!');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleReset = () => {
    setStudentName('');
    setImageFile(null);
    setImagePreview(null);
    setSubmissionText('');
    setFeedback(null);
    setSavedId(null);
    setTeacherNotes('');
    setEditingNotes(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-medium text-sm mb-2">
            <Upload className="w-4 h-4" />
            <span>Student Submissions</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">AI Evaluation</h1>
          <p className="text-slate-500 mt-1">
            Upload student work and receive instant AI-powered evaluation with scores and feedback.
          </p>
        </div>

        {!feedback ? (
          /* Upload Form */
          <div className="grid lg:grid-cols-5 gap-6">
            <form onSubmit={handleEvaluate} className="lg:col-span-3 space-y-6">
              {/* Student Name */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <User className="w-4 h-4 text-violet-500" />
                  Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student's name"
                  className="input-field"
                  required
                />
              </div>

              {/* Input Mode Toggle */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setInputMode('image')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                      inputMode === 'image'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                      inputMode === 'text'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                  >
                    <Type className="w-4 h-4" />
                    Type Text
                  </button>
                </div>

                {inputMode === 'image' ? (
                  <div>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                        imagePreview
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                      )}
                    >
                      {imagePreview ? (
                        <div>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg object-contain"
                          />
                          <p className="text-sm text-violet-600 font-medium mt-3">
                            {imageFile?.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Click to change image</p>
                        </div>
                      ) : (
                        <div>
                          <FileImage className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="font-semibold text-slate-600">
                            Drop an image here or click to upload
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            PNG, JPG, JPEG up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Student&apos;s Written Response
                    </label>
                    <textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Paste or type the student's written response here..."
                      rows={8}
                      className="input-field resize-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI is evaluating...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5" />
                    Evaluate with AI
                  </>
                )}
              </button>
            </form>

            {/* Info Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl border border-violet-100 p-5">
                <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-violet-500" />
                  What AI evaluates
                </h3>
                <ul className="space-y-2">
                  {[
                    { label: '🎨 Creativity', desc: 'Original thinking & expression' },
                    { label: '📝 Grammar', desc: 'Language accuracy & usage' },
                    { label: '💬 Communication', desc: 'Clarity of ideas' },
                    { label: '🧠 Understanding', desc: 'Topic comprehension' },
                    { label: '🙋 Participation', desc: 'Effort & engagement' },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-slate-700 min-w-[120px]">
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-500">{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
                <p className="text-sm text-emerald-800 font-medium mb-1">✅ Teacher reviews first</p>
                <p className="text-xs text-emerald-700">
                  All AI feedback is shown to the teacher before being finalized. 
                  You can add your own notes and override the evaluation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Evaluation Results */
          <div className="space-y-6 animate-fade-in">
            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="font-semibold text-emerald-700 text-sm">
                  Evaluation complete for{' '}
                  <span className="text-slate-800">{studentName}</span>
                </span>
              </div>
              <button
                onClick={handleReset}
                className="btn-secondary text-sm py-2 px-4 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Evaluate Another
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Scores */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-500" />
                  Performance Scores
                </h3>

                <div className="space-y-4">
                  {Object.entries(feedback.scores).map(([key, value]) => {
                    const scoreKey = key as keyof EvaluationScores;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {SCORE_ICONS[scoreKey]} {SCORE_LABELS[scoreKey]}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn('font-bold text-sm', getScoreColor(value))}
                            >
                              {value}/10
                            </span>
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                value >= 8
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : value >= 6
                                  ? 'bg-blue-100 text-blue-700'
                                  : value >= 4
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              )}
                            >
                              {getScoreLabel(value)}
                            </span>
                          </div>
                        </div>
                        <div className="score-bar">
                          <div
                            className="score-bar-fill"
                            style={{ width: `${value * 10}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Overall */}
                <div className="mt-6 p-4 ignis-gradient-soft rounded-xl border border-indigo-100 text-center">
                  <div className="text-4xl font-bold ignis-gradient-text">
                    {feedback.scores.overall}/10
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Overall Score</div>
                  <div className="text-lg font-semibold text-slate-700 mt-1">
                    {getScoreLabel(feedback.scores.overall)}
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-4">
                {/* Overall Comment */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-violet-500" />
                    AI Overall Feedback
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed italic">
                    &quot;{feedback.overallComment}&quot;
                  </p>
                </div>

                {/* Strengths */}
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
                  <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                  <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4" />
                    Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {feedback.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Teacher Notes */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-500" />
                      Teacher Notes
                    </h3>
                    {!editingNotes ? (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
                      >
                        Add notes
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:text-emerald-700"
                      >
                        <Save className="w-3 h-3" />
                        {savingNotes ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <textarea
                      value={teacherNotes}
                      onChange={(e) => setTeacherNotes(e.target.value)}
                      placeholder="Add your personal observations, additional feedback, or override notes..."
                      rows={4}
                      className="input-field resize-none text-sm"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-slate-400">
                      {teacherNotes || 'No teacher notes added yet. Click "Add notes" to review and add your feedback.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
