'use client';

import { useState, useEffect, useRef } from 'react';
import { GeneratedActivity, RubricItem } from '@/types';
import {
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  Package,
  Target,
  MessageSquare,
  Presentation,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Printer,
  Bookmark,
  Sparkles,
  FileText,
  Layout,
  ExternalLink,
  Loader2,
  FileSpreadsheet,
  Flame,
  Trophy,
  Check,
  X,
  Award,
  AlertCircle,
  HelpCircle,
  HelpCircle as GameIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface WorksheetViewProps {
  activity: GeneratedActivity & {
    slides?: Array<{
      stepNumber: number;
      stepTitle: string;
      stepContent: string;
      imageUrl: string;
      imagePrompt?: string;
    }>;
    citations?: Array<{
      id: number;
      source: string;
      type: 'File' | 'Link';
      summary: string;
    }>;
    creativity_rationale?: {
      factual_basis: string;
      creative_adaptations: string;
    };
    gamified_activities?: {
      sorting?: {
        title: string;
        description: string;
        categories: string[];
        scenarios: Array<{
          id: string;
          text: string;
          correctCategory: string;
        }>;
      };
      blanks?: {
        title: string;
        description: string;
        sentences: Array<{
          text_before: string;
          blank_key: string;
          text_after: string;
        }>;
      };
    };
  };
  activityId?: string | null;
  grade?: string;
  topic?: string;
  languageFocus?: string;
  lifeSkillFocus?: string;
  includeIllustrations?: boolean;
  onReset?: () => void;
}

const sectionColors: Record<string, string> = {
  instructions: 'border-l-indigo-500 bg-slate-900/30 text-indigo-200',
  activity: 'border-l-purple-500 bg-slate-900/30 text-purple-200',
  questions: 'border-l-cyan-500 bg-slate-900/30 text-cyan-200',
  reflection: 'border-l-emerald-500 bg-slate-900/30 text-emerald-200',
};

// Inline superscript citation element managing its own popover state
function CitationSuperscript({ id, citations }: { id: number; citations: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const cit = citations.find((c) => c.id === id);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!cit) return <sup className="text-amber-500">[{id}]</sup>;

  const isLink = cit.type === 'Link' || (cit.source && typeof cit.source === 'string' && cit.source.startsWith('http'));

  return (
    <span ref={ref} className="relative inline-block select-none font-sans no-print" style={{ verticalAlign: 'super' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center justify-center px-1 text-[10px] font-extrabold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded mx-0.5 transition-all cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.1)] hover:scale-105"
        style={{ fontSize: '0.65rem', lineHeight: '1' }}
      >
        [{id}]
      </button>
      
      {isOpen && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 p-3 bg-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-md rounded-xl text-left block animate-fade-in text-[11px] leading-relaxed text-slate-200 ring-1 ring-slate-800">
          <span className="flex items-center justify-between font-extrabold text-amber-400 uppercase tracking-widest text-[9px] mb-1.5 border-b border-slate-800 pb-1">
            <span>Source [{id}] • {cit.type}</span>
            <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white font-normal">&times;</button>
          </span>
          {isLink ? (
            <a
              href={cit.source}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 mb-1 truncate cursor-pointer"
            >
              <span className="truncate">{cit.source}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          ) : (
            <span className="block font-bold text-slate-100 truncate mb-1">{cit.source}</span>
          )}
          <span className="block text-slate-400 font-medium text-[10px]">{cit.summary}</span>
        </span>
      )}
    </span>
  );
}

export default function WorksheetView({
  activity,
  activityId,
  grade,
  topic,
  languageFocus,
  lifeSkillFocus,
  includeIllustrations = true,
  onReset,
}: WorksheetViewProps) {
  const { user } = useAuth();
  
  // Tab states: 'document' | 'slides' | 'gamified'
  const [activeTab, setActiveTab] = useState<'document' | 'slides' | 'gamified'>('document');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [showRubric, setShowRubric] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  
  // Exporters state
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [exportingPPT, setExportingPPT] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  // Gamified States
  const [gameScore, setGameScore] = useState(0);
  const [gameStreak, setGameStreak] = useState(0);
  
  // Game 1: Sorting
  const sortingData = activity.gamified_activities?.sorting;
  const [sortingScenarios, setSortingScenarios] = useState<any[]>([]);
  const [activeSortingIdx, setActiveSortingIdx] = useState(0);
  const [sortingCorrectSet, setSortingCorrectSet] = useState<string[]>([]);
  const [sortingWrongId, setSortingWrongId] = useState<string | null>(null);
  const [sortingCompleted, setSortingCompleted] = useState(false);

  // Game 2: Blanks
  const blanksData = activity.gamified_activities?.blanks;
  const [blanksAnswers, setBlanksAnswers] = useState<Record<number, string>>({});
  const [blanksCorrectMap, setBlanksCorrectMap] = useState<Record<number, boolean>>({});
  const [blanksWrongMap, setBlanksWrongMap] = useState<Record<number, boolean>>({});
  const [blanksCompleted, setBlanksCompleted] = useState(false);

  const pptSlides = activity.slides || [];
  const cits = activity.citations || [];

  // Reset/Initialize games when new activity loads
  useEffect(() => {
    if (sortingData?.scenarios) {
      setSortingScenarios(sortingData.scenarios);
      setActiveSortingIdx(0);
      setSortingCorrectSet([]);
      setSortingWrongId(null);
      setSortingCompleted(false);
    }
    if (blanksData?.sentences) {
      setBlanksAnswers({});
      setBlanksCorrectMap({});
      setBlanksWrongMap({});
      setBlanksCompleted(false);
    }
  }, [activity]);

  // Inline RAG citation parsing utility
  const renderContentWithCitations = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const isCit = /^\[\d+\]$/.test(part);
      if (isCit) {
        const citId = parseInt(part.slice(1, -1));
        return (
          <CitationSuperscript
            key={idx}
            id={citId}
            citations={cits}
          />
        );
      }
      return part;
    });
  };

  // Drag and Drop Scenario Sorting handlers (HTML5 API)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleSortSelection = (scenarioId: string, category: string) => {
    const scenario = sortingScenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    if (scenario.correctCategory === category) {
      // Correct Match
      setSortingCorrectSet((prev) => [...prev, scenarioId]);
      setGameScore((prev) => prev + 10);
      setGameStreak((prev) => prev + 1);
      toast.success('Nice match! 🔥 +10 points', { icon: '🔥' });
      
      // Move to next scenario
      if (activeSortingIdx < sortingScenarios.length - 1) {
        setActiveSortingIdx((prev) => prev + 1);
      } else {
        setSortingCompleted(true);
      }
    } else {
      // Incorrect Match
      setSortingWrongId(scenarioId);
      setGameStreak(0);
      toast.error('Not quite right. Try again!');
      setTimeout(() => setSortingWrongId(null), 800); // clear shake
    }
  };

  // Blanks game input handlers
  const handleBlankChange = (index: number, val: string) => {
    setBlanksAnswers({ ...blanksAnswers, [index]: val });
    setBlanksWrongMap({ ...blanksWrongMap, [index]: false });
  };

  const handleBlankSubmit = (index: number, correctKey: string) => {
    const userVal = (blanksAnswers[index] || '').trim().toLowerCase();
    const correctClean = correctKey.trim().toLowerCase();

    if (userVal === correctClean) {
      setBlanksCorrectMap({ ...blanksCorrectMap, [index]: true });
      setGameScore((prev) => prev + 10);
      setGameStreak((prev) => prev + 1);
      toast.success('Spot on! 🔥 +10 points', { icon: '🔥' });

      // Check if all are correct
      const sentencesCount = blanksData?.sentences?.length || 0;
      const currentCorrectCount = Object.keys(blanksCorrectMap).length + 1;
      if (currentCorrectCount === sentencesCount) {
        setBlanksCompleted(true);
      }
    } else {
      setBlanksWrongMap({ ...blanksWrongMap, [index]: true });
      setGameStreak(0);
      toast.error('Wrong key! Try again.');
    }
  };

  // PDF Export
  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    const loadToast = toast.loading('Formatting PDF document...');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('worksheet-printable-area');
      if (!element) throw new Error('Worksheet content not found');

      const opt = {
        margin: [15, 15, 15, 15],
        filename: `${activity.title.replace(/[^a-z0-9]/gi, '_')}_worksheet.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Worksheet PDF downloaded! 📄', { id: loadToast });
    } catch (error) {
      toast.error('PDF download failed. Please try again.', { id: loadToast });
    } finally {
      setDownloadingPDF(false);
    }
  };

  // PowerPoint Exporter call
  const handleExportPPT = async () => {
    setExportingPPT(true);
    const loadToast = toast.loading('Compiling 16:9 widescreen PowerPoint presentation...');
    try {
      const res = await fetch('/api/export-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity, includeIllustrations }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export PowerPoint');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activity.title.replace(/[^a-z0-9]/gi, '_')}_presentation.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PowerPoint deck downloaded! 📊', { id: loadToast });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'PowerPoint export failed.', { id: loadToast });
    } finally {
      setExportingPPT(false);
    }
  };

  // Word Document Exporter call
  const handleExportWord = async () => {
    setExportingWord(true);
    const loadToast = toast.loading('Formulating structured Microsoft Word document...');
    try {
      const res = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity, includeIllustrations }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export Word document');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activity.title.replace(/[^a-z0-9]/gi, '_')}_worksheet.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Word document downloaded! 📝', { id: loadToast });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Word document export failed.', { id: loadToast });
    } finally {
      setExportingWord(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar & Tab Switcher (Frosted dark row) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl p-4 no-print">
        {/* Left: Tab selectors */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('document')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-lg transition-all',
              activeTab === 'document'
                ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <FileText className="w-4 h-4" />
            📄 Worksheet Document
          </button>
          
          {pptSlides.length > 0 && (
            <button
              onClick={() => setActiveTab('slides')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-lg transition-all',
                activeTab === 'slides'
                  ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Layout className="w-4 h-4" />
              📊 PPT Slides Preview
            </button>
          )}

          {(sortingData || blanksData) && (
            <button
              onClick={() => setActiveTab('gamified')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-lg transition-all relative overflow-hidden',
                activeTab === 'gamified'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-md border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              🎮 Gamified Learning
              <span className="absolute top-0 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </button>
          )}
        </div>

        {/* Right: Action Exporters */}
        <div className="flex flex-wrap items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="btn-secondary gap-1.5 text-xs py-2 px-3 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>
          )}
          
          <button
            onClick={() => window.print()}
            className="btn-secondary gap-1.5 text-xs py-2 px-3 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="btn-secondary gap-1.5 text-xs py-2 px-3 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 shadow-sm"
          >
            {downloadingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            PDF
          </button>

          <button
            onClick={handleExportWord}
            disabled={exportingWord}
            className="btn-primary gap-1.5 text-xs py-2 px-4 shadow-sm bg-blue-700/80 hover:bg-blue-700 border-none font-bold"
          >
            {exportingWord ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            )}
            Word Export
          </button>

          <button
            onClick={handleExportPPT}
            disabled={exportingPPT}
            className="btn-primary gap-1.5 text-xs py-2 px-4 shadow-md bg-gradient-to-r from-amber-500/90 to-orange-600/95 hover:from-amber-600 hover:to-orange-700 border-none font-bold"
          >
            {exportingPPT ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Layout className="w-3.5 h-3.5 text-white" />
            )}
            PowerPoint Export
          </button>
        </div>
      </div>

      {/* Primary Display */}
      {activeTab === 'document' ? (
        /* PRINTABLE WORKSHEET DOCUMENT (Beautiful Dark Glass Theme webview, light print layout) */
        <div className="space-y-6 animate-fade-in">
          
          {/* AI Insights Collapsible Accordion (Why This Works) */}
          {activity.creativity_rationale && (
            <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden no-print">
              <button
                type="button"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="w-full flex items-center justify-between p-5 bg-slate-950/45 hover:bg-slate-950/70 border-b border-slate-800/40 text-left transition-all"
              >
                <div className="flex items-center gap-2.5 font-black text-slate-200 text-sm tracking-wider uppercase">
                  <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
                  AI Insights: Why This Works
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase">
                  <span>{showAIInsights ? "Collapse" : "Expand"}</span>
                  {showAIInsights ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {showAIInsights && (
                <div className="p-6 grid sm:grid-cols-2 gap-6 text-xs text-slate-300 font-medium leading-relaxed font-sans border-t border-slate-800/20 bg-slate-900/20 select-text">
                  {/* Factual Basis */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-100 uppercase tracking-widest text-[10px] flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Factual Basis & Tracing
                    </h4>
                    <p className="whitespace-pre-line text-slate-400">
                      {activity.creativity_rationale.factual_basis}
                    </p>
                  </div>
                  {/* Creative Adaptations */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-100 uppercase tracking-widest text-[10px] flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Creative Adaptations
                    </h4>
                    <p className="whitespace-pre-line text-slate-400">
                      {activity.creativity_rationale.creative_adaptations}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Printable Worksheet Area */}
          <div
            id="worksheet-printable-area"
            className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden text-slate-100 print:bg-white print:text-slate-900 print:border-none select-text"
          >
            {/* Header banner */}
            <div className="ignis-gradient p-8 text-white print:bg-none print:text-slate-900 print:border-b-2 print:border-slate-800 print:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-white/80 text-[10px] font-extrabold uppercase tracking-widest mb-1.5 print:text-slate-500">
                    Ignis Classroom Worksheet
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-4 tracking-tight print:text-slate-900 print:text-2xl">
                    {activity.title}
                  </h2>

                  <div className="flex flex-wrap gap-2 print:hidden">
                    {grade && (
                      <span className="bg-white/10 text-slate-200 text-xs px-3.5 py-1.5 rounded-full border border-white/20 font-bold shadow-xs">
                        Class: {grade}
                      </span>
                    )}
                    {languageFocus && (
                      <span className="bg-white/10 text-slate-200 text-xs px-3.5 py-1.5 rounded-full border border-white/20 font-bold shadow-xs">
                        📖 {languageFocus}
                      </span>
                    )}
                    {lifeSkillFocus && (
                      <span className="bg-white/10 text-slate-200 text-xs px-3.5 py-1.5 rounded-full border border-white/20 font-bold shadow-xs">
                        💡 {lifeSkillFocus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Meta metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                {[
                  { icon: Clock, label: 'Duration', value: activity.estimatedTime || '45 minutes' },
                  { icon: Target, label: 'Objectives', value: `${activity.objectives?.length || 3} goals` },
                  { icon: Package, label: 'Materials', value: `${activity.materials?.length || 3} items` },
                  { icon: BarChart3, label: 'Rubric', value: `${activity.rubric?.length || 4} criteria` },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 text-center print:bg-slate-100 print:border-none print:rounded-lg">
                    <item.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2 print:text-slate-700" />
                    <div className="font-extrabold text-slate-100 text-sm print:text-slate-900">{item.value}</div>
                    <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5 print:text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Objectives */}
              {activity.objectives && activity.objectives.length > 0 && (
                <div>
                  <h3 className="font-black text-slate-200 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider border-b border-slate-800/40 pb-2 print:text-slate-900 print:border-slate-300">
                    <Target className="w-4.5 h-4.5 text-indigo-400" />
                    Learning Objectives
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 print:grid-cols-2">
                    {activity.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-950/30 border border-slate-800/40 p-4 rounded-2xl print:bg-none print:border-none print:p-1">
                        <div className="w-5.5 h-5.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm print:bg-slate-200 print:border-none">
                          <span className="text-[11px] font-bold text-indigo-400 print:text-slate-800">{i + 1}</span>
                        </div>
                        <p className="text-slate-300 text-xs font-semibold leading-relaxed print:text-slate-800">{renderContentWithCitations(obj)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {activity.materials && activity.materials.length > 0 && (
                <div>
                  <h3 className="font-black text-slate-200 flex items-center gap-2 mb-3.5 text-sm uppercase tracking-wider border-b border-slate-800/40 pb-2 print:text-slate-900 print:border-slate-300">
                    <Package className="w-4.5 h-4.5 text-indigo-400" />
                    Materials Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activity.materials.map((mat, i) => (
                      <span
                        key={i}
                        className="px-3.5 py-1.5 bg-slate-950/50 text-slate-300 border border-slate-850 text-[11px] font-bold rounded-xl shadow-xs print:bg-slate-100 print:text-slate-900 print:border-none"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Instructions */}
              {activity.teacherInstructions && (
                <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-5 shadow-sm print:bg-slate-50 print:border-slate-200">
                  <h3 className="font-extrabold text-amber-400 text-xs mb-2.5 uppercase tracking-wider flex items-center gap-1.5 print:text-slate-700">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Teacher Implementation Guide
                  </h3>
                  <p className="text-slate-300 text-xs font-semibold leading-relaxed whitespace-pre-line print:text-slate-800">
                    {renderContentWithCitations(activity.teacherInstructions)}
                  </p>
                </div>
              )}

              {/* Steps Layout in Printable view */}
              {pptSlides.length > 0 && (
                <div>
                  <h3 className="font-black text-slate-200 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider border-b border-slate-800/40 pb-2 print:text-slate-900 print:border-slate-300">
                    <Layout className="w-4.5 h-4.5 text-indigo-400" />
                    Sequential Activity Steps
                  </h3>
                  
                  <div className="space-y-6">
                    {pptSlides.map((slide, idx) => (
                      <div
                        key={idx}
                        className="grid md:grid-cols-2 gap-6 bg-slate-950/20 border border-slate-850 rounded-2xl p-5 shadow-xs print:grid-cols-1 print:bg-white print:border-none print:p-2"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-amber-500 uppercase tracking-widest print:text-slate-500">
                            <span>Step {slide.stepNumber}</span>
                            <span>•</span>
                            <span>facilitator instruction</span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-200 print:text-slate-900">
                            {slide.stepTitle}
                          </h4>
                          <p className="text-slate-350 text-xs font-medium leading-relaxed whitespace-pre-line print:text-slate-800">
                            {renderContentWithCitations(slide.stepContent)}
                          </p>
                        </div>

                        {/* Display image ONLY if illustration toggle is true */}
                        {includeIllustrations && slide.imageUrl ? (
                          <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[160px] max-h-[220px] shadow-md print:hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slide.imageUrl}
                              alt={slide.stepTitle}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          includeIllustrations && (
                            <div className="bg-slate-950/20 border border-slate-800 border-dashed rounded-xl flex items-center justify-center min-h-[140px] text-[10px] font-extrabold text-slate-500 uppercase tracking-widest print:hidden">
                              Painting Visual...
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-800/80 my-8" />

              {/* Student Worksheet Sections */}
              {activity.worksheet && activity.worksheet.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-200 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider border-b border-slate-800/40 pb-2 print:text-slate-900 print:border-slate-300">
                    <FileText className="w-4.5 h-4.5 text-indigo-400" />
                    Student Classroom Worksheet
                  </h3>
                  {activity.worksheet.map((section, i) => (
                    <div
                      key={i}
                      className={cn(
                        'border-l-4 rounded-r-xl p-5 shadow-xs transition-all print:bg-white print:border-slate-300 print:p-2 print:text-slate-900',
                        sectionColors[section.type] || 'border-l-slate-800 bg-slate-950/25'
                      )}
                    >
                      <h4 className="font-extrabold text-slate-200 mb-2 text-xs uppercase tracking-wider print:text-slate-800">
                        {section.heading}
                      </h4>
                      <div className="text-slate-300 text-xs font-semibold leading-relaxed whitespace-pre-line print:text-slate-900">
                        {renderContentWithCitations(section.content)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Presentation Task */}
              {activity.presentationTask && (
                <div className="bg-purple-950/15 border border-purple-500/10 rounded-2xl p-5 shadow-xs print:bg-slate-50 print:border-slate-200">
                  <h3 className="font-extrabold text-purple-400 flex items-center gap-2 mb-2 text-xs uppercase tracking-wider print:text-slate-700">
                    <Presentation className="w-4 h-4 text-purple-400" />
                    Presentation Submission Task
                  </h3>
                  <p className="text-slate-300 text-xs font-semibold leading-relaxed print:text-slate-800">
                    {activity.presentationTask}
                  </p>
                </div>
              )}

              {/* Rubric Table */}
              {activity.rubric && activity.rubric.length > 0 && (
                <div className="no-print">
                  <button
                    onClick={() => setShowRubric(!showRubric)}
                    className="w-full flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 hover:bg-slate-950/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-extrabold text-slate-300 text-xs uppercase tracking-widest">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      Class Assessment Rubric ({activity.rubric.length} criteria)
                    </div>
                    {showRubric ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showRubric && (
                    <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 shadow-xl">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-slate-950 text-slate-300 border-b border-slate-850">
                            <th className="text-left p-3.5 font-extrabold uppercase tracking-widest border-r border-slate-850">Criterion</th>
                            <th className="text-left p-3.5 font-extrabold uppercase tracking-widest border-r border-slate-850">Excellent (4)</th>
                            <th className="text-left p-3.5 font-extrabold uppercase tracking-widest border-r border-slate-850">Good (3)</th>
                            <th className="text-left p-3.5 font-extrabold uppercase tracking-widest border-r border-slate-850">Developing (2)</th>
                            <th className="text-left p-3.5 font-extrabold uppercase tracking-widest">Beginning (1)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.rubric.map((item: RubricItem, i: number) => (
                            <tr key={i} className={cn(i % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-950/10', 'border-b border-slate-850')}>
                              <td className="p-3.5 font-extrabold text-slate-200 align-top border-r border-slate-850">
                                {item.criterion}
                              </td>
                              <td className="p-3.5 text-slate-400 font-semibold align-top leading-relaxed border-r border-slate-850">{item.excellent}</td>
                              <td className="p-3.5 text-slate-400 font-semibold align-top leading-relaxed border-r border-slate-850">{item.good}</td>
                              <td className="p-3.5 text-slate-400 font-semibold align-top leading-relaxed border-r border-slate-850">{item.developing}</td>
                              <td className="p-3.5 text-slate-400 font-semibold align-top leading-relaxed">{item.beginning}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Citations references (RAG Bibliography) */}
              {cits.length > 0 && (
                <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-5 mt-6 print:bg-none print:border-none print:p-0">
                  <h3 className="font-black text-slate-200 text-xs mb-3.5 uppercase tracking-wider flex items-center gap-1.5 print:text-slate-900">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    References & Sourced Context
                  </h3>
                  <div className="space-y-3">
                    {cits.map((cit, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-slate-950/60 border border-slate-900/50 p-3.5 rounded-xl shadow-xs transition-colors hover:border-slate-800 print:bg-none print:border-none print:p-1"
                      >
                        <div className="p-1 px-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg text-[9px] uppercase flex-shrink-0 mt-0.5 print:bg-slate-200 print:text-slate-800">
                          {cit.type === 'File' ? `DOC [${cit.id}]` : `URL [${cit.id}]`}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-1.5 font-bold text-slate-350 text-xs">
                            {cit.type === 'Link' || (cit.source && typeof cit.source === 'string' && cit.source.startsWith('http')) ? (
                              <a
                                href={cit.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-350 hover:underline truncate max-w-[320px] print:max-w-full flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="truncate">{cit.source}</span>
                                <ExternalLink className="w-3.5 h-3.5 inline-block flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="truncate max-w-[320px] print:max-w-full text-slate-200 print:text-slate-900">{cit.source}</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[10px] font-semibold mt-0.5 print:text-slate-650">
                            {cit.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-850 pt-4 text-center">
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                  Generated by Ignis AI Facilitator Assistant • Adapted for {grade} classroom
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'slides' ? (
        /* INTERACTIVE POWERPOINT SLIDE DECK PREVIEW (Frosted Dark 16:9 mockup) */
        <div className="space-y-6 animate-fade-in no-print">
          <div className="w-full aspect-[16/9] bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col justify-between p-8 sm:p-12">
            
            {activeSlideIdx === 0 ? (
              /* Cover page slide */
              <div className="absolute inset-0 bg-slate-950 z-0 flex flex-col justify-center px-12 sm:px-24">
                <div className="space-y-4 max-w-3xl">
                  <div className="text-amber-500 text-xs font-black uppercase tracking-widest animate-pulse">
                    🔥 IGNIS SLIDE PRESENTATION DECK
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white uppercase leading-tight tracking-tight">
                    {activity.title}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm font-semibold">
                    Interactive Activity Presentation and Lesson Guide. Format: 16:9 widescreen split-screen slides.
                  </p>
                  <div className="flex items-center gap-3 pt-4">
                    <span className="bg-slate-900 text-slate-300 text-[10px] px-3.5 py-1.5 rounded-full font-bold border border-slate-800">
                      Class Level: {grade}
                    </span>
                    <span className="bg-slate-900 text-slate-300 text-[10px] px-3.5 py-1.5 rounded-full font-bold border border-slate-800">
                      Duration: {activity.estimatedTime || '45 mins'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Step slide details */
              <div className="absolute inset-0 bg-slate-900 z-0 flex flex-col p-8 sm:p-10 justify-between">
                
                {/* Widescreen step header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-amber-500 text-xs font-black uppercase tracking-widest">
                    STEP {pptSlides[activeSlideIdx - 1]?.stepNumber}: {pptSlides[activeSlideIdx - 1]?.stepTitle}
                  </h3>
                  <div className="text-slate-500 text-[10px] font-extrabold uppercase">
                    Ignis activity-based slide
                  </div>
                </div>

                {/* Main slide body split container */}
                <div className="grid md:grid-cols-2 gap-8 items-center flex-grow py-4">
                  {/* Left: Text */}
                  <div className="space-y-4 max-h-[75%] overflow-y-auto pr-2 text-left">
                    <p className="text-slate-200 text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line">
                      {/* Strip inline citations in slides to match PPTX export */}
                      {pptSlides[activeSlideIdx - 1]?.stepContent.replace(/\[\d+\]/g, '')}
                    </p>
                  </div>

                  {/* Right: South Asian graphics */}
                  {includeIllustrations && pptSlides[activeSlideIdx - 1]?.imageUrl ? (
                    <div className="w-full aspect-[4/3] max-h-[220px] rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pptSlides[activeSlideIdx - 1]?.imageUrl}
                        alt="Indian Style Visual illustration"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    includeIllustrations && (
                      <div className="bg-slate-950 border border-slate-800 border-dashed rounded-2xl flex items-center justify-center w-full aspect-[4/3] max-h-[220px] text-[10px] font-extrabold text-slate-500 tracking-wider">
                        Painting Visual...
                      </div>
                    )
                  )}
                </div>

                {/* Footer */}
                <div className="text-[9px] text-slate-500 font-extrabold border-t border-slate-800 pt-2 flex justify-between items-center">
                  <span>© IGNIS FACILITATOR DECK</span>
                  <span>SLIDE {activeSlideIdx + 1} OF {pptSlides.length + 1}</span>
                </div>

              </div>
            )}
          </div>

          {/* Slide thumbnail navigation panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-md p-4 flex items-center gap-3 overflow-x-auto">
            {/* Title slide */}
            <button
              onClick={() => setActiveSlideIdx(0)}
              className={cn(
                'flex-shrink-0 w-28 aspect-[16/9] rounded-xl border-2 flex flex-col justify-center p-2 text-left relative transition-all shadow-sm',
                activeSlideIdx === 0
                  ? 'border-indigo-500 bg-slate-950 text-white'
                  : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300'
              )}
            >
              <div className="text-[8px] font-black uppercase tracking-wider text-amber-500">COVER</div>
              <div className="text-[9px] font-extrabold truncate w-full mt-1">
                {activity.title}
              </div>
            </button>

            {/* Steps slides */}
            {pptSlides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlideIdx(idx + 1)}
                className={cn(
                  'flex-shrink-0 w-28 aspect-[16/9] rounded-xl border-2 overflow-hidden relative transition-all shadow-sm flex flex-col justify-between p-2 text-left',
                  activeSlideIdx === idx + 1
                    ? 'border-indigo-500 bg-slate-800'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300'
                )}
              >
                {includeIllustrations && slide.imageUrl && (
                  <div className="absolute inset-0 opacity-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <span className="text-[8px] font-extrabold text-indigo-400 uppercase tracking-widest relative z-10">
                  STEP {slide.stepNumber}
                </span>
                <span className="text-[9px] font-bold truncate w-full relative z-10 text-slate-200">
                  {slide.stepTitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* PLAYABLE GAMIFIED SELF-LEARNING DASHBOARD (Duolingo Widescreen Style) */
        <div className="space-y-6 animate-fade-in no-print text-slate-100 select-none">
          
          {/* Global Game Status Header (Vibrant Glass banner) */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-violet-950/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-100 uppercase tracking-widest text-sm">Gamified Self-Learning Mode</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Solve interactive Duolingo-style challenges to review key lesson concepts!</p>
              </div>
            </div>
            
            {/* Streaks & Score values */}
            <div className="flex items-center gap-6">
              {/* Streak */}
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-inner relative group cursor-pointer transition-all hover:scale-105">
                <Flame className={cn("w-5 h-5 text-orange-500 animate-bounce", gameStreak > 0 ? "text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "text-slate-600")} />
                <div>
                  <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Streak</span>
                  <span className="block text-sm font-black text-slate-200 mt-0.5">{gameStreak} Days 🔥</span>
                </div>
              </div>
              {/* Score */}
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-inner transition-all hover:scale-105">
                <Award className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Total XP</span>
                  <span className="block text-sm font-black text-slate-200 mt-0.5">{gameScore} Points</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-side Game Board */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Activity 1: Scenario Sorting */}
            {sortingData && (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-[420px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/45 pb-3">
                    <h4 className="font-black text-slate-200 text-xs uppercase tracking-widest flex items-center gap-2">
                      <Layout className="w-4 h-4 text-indigo-400" />
                      Game 1: {sortingData.title}
                    </h4>
                    <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {sortingCompleted ? "Completed" : `${activeSortingIdx + 1} / ${sortingScenarios.length}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">{sortingData.description}</p>
                </div>

                {sortingCompleted ? (
                  /* Game 1 Completed screen */
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Check className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-lg uppercase tracking-wider">Sorting Completed!</h5>
                    <p className="text-xs text-slate-400 max-w-xs font-semibold leading-relaxed">
                      You sorted all daily water and community habit scenarios correctly. You earned 100% sorting accuracy XP!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSortingIdx(0);
                        setSortingCorrectSet([]);
                        setSortingCompleted(false);
                      }}
                      className="btn-secondary text-xs px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 font-bold rounded-xl transition-all"
                    >
                      Replay Game
                    </button>
                  </div>
                ) : (
                  /* Playable Sorting Card and Targets */
                  <div className="flex-grow flex flex-col justify-between py-6 space-y-6">
                    {/* Active Scenario Card */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, sortingScenarios[activeSortingIdx]?.id)}
                      className={cn(
                        "bg-slate-950 border border-slate-800/80 shadow-2xl rounded-2xl p-6 text-center max-w-md mx-auto text-slate-200 font-extrabold text-sm cursor-pointer select-none transition-all duration-300 relative",
                        sortingWrongId === sortingScenarios[activeSortingIdx]?.id ? "animate-shake border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]" : "hover:scale-102 hover:border-slate-700 hover:shadow-indigo-500/5"
                      )}
                    >
                      {/* Drag handle graphic */}
                      <div className="w-10 h-1.5 bg-slate-800/60 rounded-full mx-auto mb-4" />
                      <p className="leading-relaxed">
                        {sortingScenarios[activeSortingIdx]?.text}
                      </p>
                      <span className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mt-4">
                        Drag card or Click Category buttons below to sort
                      </span>
                    </div>

                    {/* Category Snapping buckets */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      {sortingData.categories.map((cat) => {
                        const isCorrectTarget = sortingScenarios[activeSortingIdx]?.correctCategory === cat;
                        return (
                          <div
                            key={cat}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleSortSelection(sortingScenarios[activeSortingIdx]?.id, cat)}
                            onClick={() => handleSortSelection(sortingScenarios[activeSortingIdx]?.id, cat)}
                            className={cn(
                              "border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col justify-center min-h-[90px] relative select-none",
                              "border-slate-800 bg-slate-950 hover:bg-slate-900/60 hover:border-slate-700"
                            )}
                          >
                            <span className="block text-xs font-black text-slate-200 uppercase tracking-widest mb-1.5">{cat}</span>
                            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">
                              Drop scenario here
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity 2: Contextual Fill-in-the-Blanks */}
            {blanksData && (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-[420px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/45 pb-3">
                    <h4 className="font-black text-slate-200 text-xs uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      Game 2: {blanksData.title}
                    </h4>
                    <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {blanksCompleted ? "Completed" : "Active"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">{blanksData.description}</p>
                </div>

                {blanksCompleted ? (
                  /* Game 2 Completed Screen */
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-bounce">
                      <Trophy className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-lg uppercase tracking-wider">Water Hero Sentences Completed!</h5>
                    <p className="text-xs text-slate-400 max-w-xs font-semibold leading-relaxed">
                      Amazing job! You identified and filled in all the missing contextual keywords accurately. Excellent review skill score!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setBlanksAnswers({});
                        setBlanksCorrectMap({});
                        setBlanksCompleted(false);
                      }}
                      className="btn-secondary text-xs px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 font-bold rounded-xl transition-all"
                    >
                      Replay Game
                    </button>
                  </div>
                ) : (
                  /* Blanks sentences list */
                  <div className="flex-grow flex flex-col justify-center py-4 space-y-5 animate-fade-in select-text">
                    {blanksData.sentences.map((sent, idx) => {
                      const isCorrect = blanksCorrectMap[idx];
                      const isWrong = blanksWrongMap[idx];
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-xl border flex flex-wrap items-center gap-1.5 transition-all text-xs font-semibold leading-relaxed",
                            isCorrect
                              ? "bg-emerald-950/20 border-emerald-500/40"
                              : "bg-slate-950/30 border-slate-850"
                          )}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold flex-shrink-0">
                            {idx + 1}
                          </span>
                          
                          <span>{sent.text_before}</span>
                          
                          {/* Blank Input text box */}
                          <input
                            type="text"
                            value={blanksAnswers[idx] || ''}
                            disabled={isCorrect}
                            onChange={(e) => handleBlankChange(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBlankSubmit(idx, sent.blank_key);
                              }
                            }}
                            placeholder={isCorrect ? sent.blank_key : "type keyword..."}
                            className={cn(
                              "w-28 mx-1 px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:border-indigo-500 text-center font-black transition-all",
                              isCorrect && "bg-emerald-900/60 border-emerald-500 text-emerald-300 font-extrabold cursor-not-allowed uppercase tracking-wider scale-98",
                              isWrong && "border-red-500 text-red-300 animate-shake"
                            )}
                          />

                          <span>{sent.text_after}</span>

                          {/* Action validation click button */}
                          {!isCorrect && (
                            <button
                              type="button"
                              onClick={() => handleBlankSubmit(idx, sent.blank_key)}
                              className="ml-auto p-1 px-2.5 bg-slate-800 hover:bg-indigo-600 border border-slate-700/80 hover:border-indigo-500 text-[10px] font-extrabold text-slate-300 hover:text-white rounded-lg transition-all"
                            >
                              Check
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
