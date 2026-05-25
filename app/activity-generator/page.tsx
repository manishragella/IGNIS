'use client';

import { useState, useEffect } from 'react';
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
  UploadCloud,
  Link,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { getGradeOptions } from '@/lib/utils';
import toast from 'react-hot-toast';

const LANGUAGE_FOCUS_SUGGESTIONS = [
  'There is / There are',
  'Present Continuous',
  'Simple Past Tense',
  'Comparative Adjectives',
  'Modal Verbs (can, should)',
  'Question Words',
  'Prepositions of Place',
  'Conjunctions',
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
  'Responsibility',
];

const LOADING_STEPS = [
  'Analyzing and parsing input files...',
  'Synthesizing grade-appropriate vocabulary...',
  'Drafting personalized classroom activities...',
  'Painting Indian-style educational illustrations...',
];

export default function ActivityGeneratorPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Primary Parameters
  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  
  // Multi-select Lists for Focus Areas
  const [languageFocusInput, setLanguageFocusInput] = useState('');
  const [languageFocusList, setLanguageFocusList] = useState<string[]>([]);
  const [lifeSkillFocusInput, setLifeSkillFocusInput] = useState('');
  const [lifeSkillFocusList, setLifeSkillFocusList] = useState<string[]>([]);

  // Multi-Inputs (Files & Links)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [linksText, setLinksText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Toggle & Preview
  const [includeIllustrations, setIncludeIllustrations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivity | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Cycle through loading steps in UI
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle Multi-Select Language tags
  const addLanguageTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (cleanTag && !languageFocusList.includes(cleanTag)) {
      setLanguageFocusList([...languageFocusList, cleanTag]);
    }
    setLanguageFocusInput('');
  };

  const removeLanguageTag = (tag: string) => {
    setLanguageFocusList(languageFocusList.filter((t) => t !== tag));
  };

  // Handle Multi-Select Life Skill tags
  const addLifeSkillTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (cleanTag && !lifeSkillFocusList.includes(cleanTag)) {
      setLifeSkillFocusList([...lifeSkillFocusList, cleanTag]);
    }
    setLifeSkillFocusInput('');
  };

  const removeLifeSkillTag = (tag: string) => {
    setLifeSkillFocusList(lifeSkillFocusList.filter((t) => t !== tag));
  };

  // File drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'txt') {
          newFiles.push(file);
        } else {
          toast.error(`Unsupported file type: ${file.name}`);
        }
      }
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        newFiles.push(e.target.files[i]);
      }
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Activity Submission Trigger
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) {
      toast.error('Please select a grade level');
      return;
    }
    if (!topic.trim()) {
      toast.error('Please enter an activity topic');
      return;
    }
    if (languageFocusList.length === 0) {
      toast.error('Please add at least one language focus');
      return;
    }
    if (lifeSkillFocusList.length === 0) {
      toast.error('Please add at least one life skill focus');
      return;
    }

    setLoading(true);
    setGeneratedActivity(null);
    setSavedId(null);

    try {
      // Build FormData for multipart upload
      const formData = new FormData();
      formData.append('grade', grade);
      formData.append('topic', topic);
      formData.append('languageFocus', JSON.stringify(languageFocusList));
      formData.append('lifeSkillFocus', JSON.stringify(lifeSkillFocusList));
      formData.append('includeIllustrations', includeIllustrations ? 'true' : 'false');

      // Process and validate links list
      const linkUrls = linksText
        .split('\n')
        .map((x) => x.trim())
        .filter((x) => x.startsWith('http'));
      formData.append('links', JSON.stringify(linkUrls));

      // Append files
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/generate-activity', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setGeneratedActivity(data.activity);
      toast.success('Activity generated successfully! ✨');

      // Auto-save to Firestore
      if (user) {
        let finalImageUrl = '';
        
        // Find the first illustration URL (if any) to save as the primary thumbnail
        if (data.activity.slides && data.activity.slides.length > 0) {
          const firstSlide = data.activity.slides[0];
          if (firstSlide.imageUrl && firstSlide.imageUrl.startsWith('data:')) {
            try {
              const uploadedUrl = await uploadGeneratedImage(firstSlide.imageUrl, user.uid, topic);
              firstSlide.imageUrl = uploadedUrl;
              finalImageUrl = uploadedUrl;
            } catch (err) {
              console.error('Failed to upload illustration on auto-save:', err);
            }
          } else if (firstSlide.imageUrl) {
            finalImageUrl = firstSlide.imageUrl;
          }
        }

        const activityData: Omit<Activity, 'id'> = {
          title: data.activity.title,
          grade,
          topic,
          languageFocus: languageFocusList.join(', '),
          lifeSkillFocus: lifeSkillFocusList.join(', '),
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
    setLanguageFocusList([]);
    setLifeSkillFocusList([]);
    setSelectedFiles([]);
    setLinksText('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-2">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>PERSONALIZED LEARNING ACTIVITY ENGINE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Create Indian-Context Activity
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Specify classroom parameters, drag-and-drop syllabus files, select focus skills, and generate hyper-personalized step-by-step activities with culturally rich illustrations.
          </p>
        </div>

        {!generatedActivity ? (
          /* Sleek Glassmorphism Panel */
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <form
                onSubmit={handleGenerate}
                className="bg-white/85 backdrop-blur-lg rounded-3xl border border-slate-100/70 shadow-xl p-8 space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Grade */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      Class / Level
                    </label>
                    <div className="relative">
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="input-field appearance-none pr-10 font-medium"
                        required
                      >
                        <option value="">Select a class...</option>
                        {getGradeOptions().map((g) => (
                          <option key={g} value={g} className="font-semibold">
                            {g === 'Class 3' || g === 'Class 5' ? `⭐ ${g} (AI Optimized)` : g}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Activity Topic
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Save Water, Organic Farming, Clean Energy"
                      className="input-field font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Language Focus Multi-Select Tag Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    Language Focus
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl mb-2 min-h-[46px] items-center">
                    {languageFocusList.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-transform hover:scale-[1.02]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeLanguageTag(tag)}
                          className="hover:bg-indigo-100 rounded-full p-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={languageFocusInput}
                      onChange={(e) => setLanguageFocusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addLanguageTag(languageFocusInput);
                        }
                      }}
                      placeholder={languageFocusList.length === 0 ? "Type and press Enter/comma..." : "Add more..."}
                      className="bg-transparent border-none outline-none text-sm font-semibold flex-grow min-w-[120px] px-1 text-slate-700"
                    />
                  </div>
                  {/* Suggestions list */}
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGE_FOCUS_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addLanguageTag(s)}
                        disabled={languageFocusList.includes(s)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors font-semibold ${
                          languageFocusList.includes(s)
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Life Skill Multi-Select Tag Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Heart className="w-4 h-4 text-indigo-500" />
                    Life Skill Focus
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl mb-2 min-h-[46px] items-center">
                    {lifeSkillFocusList.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold rounded-lg transition-transform hover:scale-[1.02]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeLifeSkillTag(tag)}
                          className="hover:bg-violet-100 rounded-full p-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={lifeSkillFocusInput}
                      onChange={(e) => setLifeSkillFocusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addLifeSkillTag(lifeSkillFocusInput);
                        }
                      }}
                      placeholder={lifeSkillFocusList.length === 0 ? "Type and press Enter/comma..." : "Add more..."}
                      className="bg-transparent border-none outline-none text-sm font-semibold flex-grow min-w-[120px] px-1 text-slate-700"
                    />
                  </div>
                  {/* Suggestions list */}
                  <div className="flex flex-wrap gap-1.5">
                    {LIFE_SKILL_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addLifeSkillTag(s)}
                        disabled={lifeSkillFocusList.includes(s)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors font-semibold ${
                          lifeSkillFocusList.includes(s)
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:bg-violet-50 text-violet-600 border-violet-100'
                        }`}
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Data Zone - Drag and Drop File Upload */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <UploadCloud className="w-4 h-4 text-indigo-500" />
                    Input Data Zone (Reference Materials)
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-inner'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                  >
                    <input
                      id="file-upload-input"
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-bold text-slate-700">
                      Drag & drop reference files here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF, DOCX, Word, or TXT formats (up to 10MB each)
                    </p>
                  </div>

                  {/* Selected files list */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 bg-white border border-slate-100 rounded-xl p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                        Attached Documents ({selectedFiles.length})
                      </div>
                      {selectedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-red-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Paste web links */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Link className="w-4 h-4 text-indigo-500" />
                    Web Documentation Links
                  </label>
                  <textarea
                    rows={2}
                    value={linksText}
                    onChange={(e) => setLinksText(e.target.value)}
                    placeholder="Paste web URLs here (one URL per line)..."
                    className="input-field text-xs font-semibold py-2 px-3 resize-none font-mono"
                  />
                </div>

                {/* Illustration Toggle Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-extrabold text-slate-700">
                        Include Indian-Style Illustrations
                      </span>
                      <span className="block text-xs text-slate-400 font-medium">
                        Paint vibrant South Asian vector graphics for each step.
                      </span>
                    </div>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIncludeIllustrations(!includeIllustrations)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      includeIllustrations ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        includeIllustrations ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-base py-4 font-bold disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
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

                {/* Premium Loading Skeletons */}
                {loading && (
                  <div className="space-y-3 bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100/50">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-700 px-1">
                      <span>{LOADING_STEPS[loadingStepIdx]}</span>
                      <span className="animate-pulse">AI Orchestrating...</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold px-1">
                      <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Synthesizing reference data takes up to 45 seconds. Please don&apos;t close this page.</span>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Tips Panel */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border border-indigo-100/80 p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-700 text-base">Indian Context Features</h3>
                </div>
                <ul className="space-y-3.5">
                  {[
                    'Hyper-personalized Class 3 & 5 cognitive grading',
                    'Curated Indian settings (Jaipur, Pune, Kochi, etc.)',
                    'Familiar South Asian names & attire for student roles',
                    'Curriculum-linked local topics (water harvesting, stepwells)',
                    'Multi-input document citation tracing & summaries',
                    'Split-screen PowerPoint slides export (1-to-1 steps)',
                    'Formatted inline Microsoft Word export (docx)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/80 rounded-3xl border border-amber-100/80 p-6 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 mb-1.5">Try an Example Input</p>
                    <div className="text-xs text-amber-700 font-semibold space-y-1 bg-white/50 rounded-xl p-3 border border-amber-100">
                      <p>Class: <strong>Class 3</strong></p>
                      <p>Topic: <strong>Rainwater Harvesting</strong></p>
                      <p>Language Focus: <strong>Descriptive Adjectives, Modal Verbs</strong></p>
                      <p>Life Skill: <strong>Teamwork, Problem Solving</strong></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGrade('Class 3');
                        setTopic('Rainwater Harvesting');
                        setLanguageFocusList(['Descriptive Adjectives', 'Modal Verbs (can, should)']);
                        setLifeSkillFocusList(['Teamwork', 'Problem Solving']);
                        setIncludeIllustrations(true);
                      }}
                      className="mt-4 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2.5 rounded-xl transition-all font-bold"
                    >
                      Apply Sample Configuration →
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
              languageFocus={languageFocusList.join(', ')}
              lifeSkillFocus={lifeSkillFocusList.join(', ')}
              includeIllustrations={includeIllustrations}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
