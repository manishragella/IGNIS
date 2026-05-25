'use client';

import { useState, useEffect } from 'react';
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
  Slideshow,
  Layout,
  ExternalLink,
  Loader2,
  FileSpreadsheet,
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
      source: string;
      type: 'File' | 'Link';
      summary: string;
    }>;
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
  instructions: 'border-l-indigo-400 bg-indigo-50/50',
  activity: 'border-l-purple-400 bg-purple-50/50',
  questions: 'border-l-cyan-400 bg-cyan-50/50',
  reflection: 'border-l-emerald-400 bg-emerald-50/50',
};

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
  
  // Tab states: 'document' (Print view) vs 'slides' (PowerPoint widescreen preview)
  const [activeTab, setActiveTab] = useState<'document' | 'slides'>('document');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [showRubric, setShowRubric] = useState(false);
  
  // Download/Export states
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [exportingPPT, setExportingPPT] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  // Fallback to worksheet items if slides are not present
  const pptSlides = activity.slides || [];

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    const loadToast = toast.loading('Formatting PDF document...');
    try {
      // Dynamic import to avoid SSR issues
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
      {/* Action Bar & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-md p-4 no-print">
        {/* Left: Tab selectors */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab('document')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all',
              activeTab === 'document'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <FileText className="w-4 h-4" />
            📄 Worksheet View
          </button>
          {pptSlides.length > 0 && (
            <button
              onClick={() => setActiveTab('slides')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all',
                activeTab === 'slides'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Layout className="w-4 h-4" />
              📊 PPT Slides Preview
            </button>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="btn-secondary gap-1.5 text-xs py-2 px-3 border border-slate-200 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>
          )}
          
          <button
            onClick={() => window.print()}
            className="btn-secondary gap-1.5 text-xs py-2 px-3 border border-slate-200 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Page
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="btn-secondary gap-1.5 text-xs py-2 px-3 border border-indigo-150 hover:bg-indigo-50/50 text-indigo-600 shadow-sm"
          >
            {downloadingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download PDF
          </button>

          <button
            onClick={handleExportWord}
            disabled={exportingWord}
            className="btn-primary gap-1.5 text-xs py-2 px-4 shadow-sm bg-blue-600 hover:bg-blue-700 border-none"
          >
            {exportingWord ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            )}
            Export to Word
          </button>

          <button
            onClick={handleExportPPT}
            disabled={exportingPPT}
            className="btn-primary gap-1.5 text-xs py-2 px-4 shadow-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-none"
          >
            {exportingPPT ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Layout className="w-3.5 h-3.5 text-white animate-pulse" />
            )}
            Export to PPT
          </button>
        </div>
      </div>

      {/* Primary Container */}
      {activeTab === 'document' ? (
        /* PRINTABLE WORKSHEET VIEW */
        <div
          id="worksheet-printable-area"
          className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="ignis-gradient p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1.5">
                  Ignis Classroom Worksheet
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-4">
                  {activity.title}
                </h2>

                <div className="flex flex-wrap gap-2">
                  {grade && (
                    <span className="bg-white/20 text-white text-xs px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/20 font-bold">
                      Class Level: {grade}
                    </span>
                  )}
                  {languageFocus && (
                    <span className="bg-white/20 text-white text-xs px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/20 font-bold">
                      📖 {languageFocus}
                    </span>
                  )}
                  {lifeSkillFocus && (
                    <span className="bg-white/20 text-white text-xs px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/20 font-bold">
                      💡 {lifeSkillFocus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Meta info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Clock, label: 'Duration', value: activity.estimatedTime || '45 minutes' },
                { icon: Target, label: 'Objectives', value: `${activity.objectives?.length || 3} goals` },
                { icon: Package, label: 'Materials', value: `${activity.materials?.length || 3} items` },
                { icon: BarChart3, label: 'Rubric', value: `${activity.rubric?.length || 4} criteria` },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
                  <item.icon className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
                  <div className="font-extrabold text-slate-800 text-sm">{item.value}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Objectives */}
            {activity.objectives && activity.objectives.length > 0 && (
              <div>
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-3.5 text-base border-b border-slate-100 pb-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Learning Objectives
                </h3>
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {activity.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                      <div className="w-5.5 h-5.5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                      </div>
                      <p className="text-slate-700 text-sm font-semibold leading-relaxed">{obj}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {activity.materials && activity.materials.length > 0 && (
              <div>
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-3 text-base border-b border-slate-100 pb-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  Materials Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activity.materials.map((mat, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 bg-indigo-50/40 text-indigo-700 border border-indigo-100/40 text-xs font-bold rounded-lg shadow-sm"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Instructions */}
            {activity.teacherInstructions && (
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-extrabold text-amber-800 text-xs mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Teacher Overview Instructions
                </h3>
                <p className="text-amber-900 text-sm leading-relaxed font-semibold whitespace-pre-line">
                  {activity.teacherInstructions}
                </p>
              </div>
            )}

            {/* Sequential steps preview in Printable area */}
            {pptSlides.length > 0 && (
              <div>
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-4 text-base border-b border-slate-100 pb-2">
                  <Layout className="w-5 h-5 text-indigo-500" />
                  Step-by-Step Activities
                </h3>
                
                <div className="space-y-6">
                  {pptSlides.map((slide, idx) => (
                    <div
                      key={idx}
                      className="grid md:grid-cols-2 gap-6 bg-slate-50/30 border border-slate-100/80 rounded-2xl p-5 shadow-sm"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest">
                          <span>Step {slide.stepNumber}</span>
                          <span>•</span>
                          <span className="text-slate-500 lowercase">facilitator instruction</span>
                        </div>
                        <h4 className="text-lg font-extrabold text-slate-800">
                          {slide.stepTitle}
                        </h4>
                        <p className="text-slate-600 text-sm font-semibold leading-relaxed whitespace-pre-line">
                          {slide.stepContent}
                        </p>
                      </div>

                      {/* Display image ONLY if illustration toggle is true */}
                      {includeIllustrations && slide.imageUrl ? (
                        <div className="relative group overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[200px] max-h-[250px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slide.imageUrl}
                            alt={slide.stepTitle}
                            className="w-full h-full object-cover transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        includeIllustrations && (
                          <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center min-h-[160px] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Painting Illustration...
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t-2 border-dashed border-slate-200 my-6" />
            <div className="text-center text-xs text-slate-400 -mt-8 font-bold bg-white px-4 py-1.5 rounded-full border border-slate-100 max-w-xs mx-auto shadow-sm">
              Student Worksheet Sections
            </div>

            {/* Worksheet Sections */}
            {activity.worksheet && activity.worksheet.length > 0 && (
              <div className="space-y-4">
                {activity.worksheet.map((section, i) => (
                  <div
                    key={i}
                    className={cn(
                      'worksheet-section border-l-4 rounded-r-xl p-5 shadow-sm transition-all',
                      sectionColors[section.type] || 'border-l-slate-300 bg-slate-50'
                    )}
                  >
                    <h4 className="font-extrabold text-slate-800 mb-2 text-sm uppercase tracking-wider">
                      {section.heading}
                    </h4>
                    <div className="text-slate-600 text-sm font-semibold leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Presentation Task */}
            {activity.presentationTask && (
              <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-extrabold text-purple-800 flex items-center gap-2 mb-2 text-sm">
                  <Presentation className="w-4 h-4 text-purple-500" />
                  Presentation Submission Task
                </h3>
                <p className="text-purple-900 text-sm font-semibold leading-relaxed">{activity.presentationTask}</p>
              </div>
            )}

            {/* Rubric Toggle */}
            {activity.rubric && activity.rubric.length > 0 && (
              <div className="no-print">
                <button
                  onClick={() => setShowRubric(!showRubric)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 font-extrabold text-slate-700 text-sm">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    Interactive Evaluation Rubric ({activity.rubric.length} criteria)
                  </div>
                  {showRubric ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showRubric && (
                  <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 shadow-md">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="ignis-gradient text-white">
                          <th className="text-left p-3.5 font-extrabold w-1/5 uppercase tracking-wider border-b border-indigo-200/20">Criterion</th>
                          <th className="text-left p-3.5 font-extrabold uppercase tracking-wider border-b border-indigo-200/20">Excellent (4)</th>
                          <th className="text-left p-3.5 font-extrabold uppercase tracking-wider border-b border-indigo-200/20">Good (3)</th>
                          <th className="text-left p-3.5 font-extrabold uppercase tracking-wider border-b border-indigo-200/20">Developing (2)</th>
                          <th className="text-left p-3.5 font-extrabold uppercase tracking-wider border-b border-indigo-200/20">Beginning (1)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.rubric.map((item: RubricItem, i: number) => (
                          <tr key={i} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60', 'border-b border-slate-100')}>
                            <td className="p-3.5 font-extrabold text-slate-700 align-top border-r border-slate-100">
                              {item.criterion}
                            </td>
                            <td className="p-3.5 text-slate-500 font-semibold align-top leading-relaxed">{item.excellent}</td>
                            <td className="p-3.5 text-slate-500 font-semibold align-top leading-relaxed">{item.good}</td>
                            <td className="p-3.5 text-slate-500 font-semibold align-top leading-relaxed">{item.developing}</td>
                            <td className="p-3.5 text-slate-500 font-semibold align-top leading-relaxed">{item.beginning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Citations & Reference Sources */}
            {activity.citations && activity.citations.length > 0 && (
              <div className="bg-slate-50/40 rounded-2xl border border-slate-150 p-5 mt-6">
                <h3 className="font-extrabold text-slate-800 text-xs mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Synthesis References & Citations
                </h3>
                <div className="space-y-3">
                  {activity.citations.map((cit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs transition-colors hover:border-slate-200"
                    >
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 text-xs flex-shrink-0 mt-0.5">
                        {cit.type === 'File' ? 'DOC' : 'URL'}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-1.5 font-extrabold text-slate-700 text-sm">
                          <span className="truncate max-w-[320px]">{cit.source}</span>
                          {cit.type === 'Link' && (
                            <a
                              href={cit.source}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-500 hover:text-indigo-600 p-0.5 inline-flex"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] font-bold mt-0.5">
                          {cit.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Generated by Ignis AI Facilitator Assistant • Adapted for {grade} classroom
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE POWERPOINT SLIDE DECK PREVIEW */
        <div className="space-y-6 animate-fade-in">
          {/* 16:9 Widescreen slide presentation container */}
          <div className="w-full aspect-[16/9] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col justify-between p-8 sm:p-12">
            
            {/* Background pattern for Slide 1 vs step slides */}
            {activeSlideIdx === 0 ? (
              /* Title slide background slate dark */
              <div className="absolute inset-0 bg-slate-950/90 z-0 flex flex-col justify-center px-12 sm:px-24">
                <div className="space-y-4 max-w-3xl">
                  <div className="text-amber-500 text-sm font-extrabold uppercase tracking-widest animate-pulse">
                    🔥 IGNIS SLIDE PRESENTATION DECK
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white uppercase leading-tight tracking-tight">
                    {activity.title}
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base font-semibold">
                    Interactive Activity Presentation and Lesson Guide. Format: 16:9 widescreen split-screen slides.
                  </p>
                  <div className="flex items-center gap-3 pt-4">
                    <span className="bg-slate-800 text-slate-300 text-xs px-3.5 py-1.5 rounded-full font-bold border border-slate-700">
                      Target Level: {grade}
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-xs px-3.5 py-1.5 rounded-full font-bold border border-slate-700">
                      Duration: {activity.estimatedTime || '45 mins'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Slide Content View: Split Screen Layout or Widescreen Full width */
              <div className="absolute inset-0 bg-white z-0 flex flex-col p-8 sm:p-10 justify-between">
                
                {/* Gold-accented step header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-amber-600 text-sm font-extrabold uppercase tracking-widest">
                    STEP {pptSlides[activeSlideIdx - 1]?.stepNumber}: {pptSlides[activeSlideIdx - 1]?.stepTitle}
                  </h3>
                  <div className="text-slate-300 text-xs font-bold uppercase">
                    Ignis activity-based slide
                  </div>
                </div>

                {/* Main Slide Body Split-Screen */}
                <div className="grid md:grid-cols-2 gap-8 items-center flex-grow py-4">
                  {/* Left 50%: High-contrast large-font text */}
                  <div className="space-y-4 max-h-[75%] overflow-y-auto pr-2">
                    <p className="text-slate-800 text-base sm:text-lg font-bold leading-relaxed whitespace-pre-line">
                      {pptSlides[activeSlideIdx - 1]?.stepContent}
                    </p>
                  </div>

                  {/* Right 50%: Indian-style vector illustration */}
                  {includeIllustrations && pptSlides[activeSlideIdx - 1]?.imageUrl ? (
                    <div className="w-full aspect-[4/3] max-h-[260px] rounded-2xl border border-slate-100/60 overflow-hidden bg-slate-50 flex items-center justify-center shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pptSlides[activeSlideIdx - 1]?.imageUrl}
                        alt="Indian Style Visual illustration"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    includeIllustrations && (
                      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex items-center justify-center w-full aspect-[4/3] max-h-[260px] text-xs font-semibold text-slate-400 tracking-wider">
                        Painting Illustration...
                      </div>
                    )
                  )}
                </div>

                {/* Footer of Slide */}
                <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2 flex justify-between items-center">
                  <span>© IGNIS FACILITATOR ASSISTANT</span>
                  <span>SLIDE {activeSlideIdx + 1} OF {pptSlides.length + 1}</span>
                </div>

              </div>
            )}
          </div>

          {/* Slide thumbnail navigation panel */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex items-center gap-3 overflow-x-auto">
            {/* Title slide thumbnail */}
            <button
              onClick={() => setActiveSlideIdx(0)}
              className={cn(
                'flex-shrink-0 w-28 aspect-[16/9] rounded-xl border-2 flex flex-col justify-center p-2 text-left relative transition-all shadow-sm',
                activeSlideIdx === 0
                  ? 'border-indigo-600 bg-slate-950 text-white'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              )}
            >
              <div className="text-[8px] font-bold uppercase tracking-wider text-amber-500">COVER</div>
              <div className="text-[9px] font-extrabold truncate w-full mt-1">
                {activity.title}
              </div>
            </button>

            {/* Steps thumbnails */}
            {pptSlides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlideIdx(idx + 1)}
                className={cn(
                  'flex-shrink-0 w-28 aspect-[16/9] rounded-xl border-2 overflow-hidden relative transition-all shadow-sm flex flex-col justify-between p-2 text-left',
                  activeSlideIdx === idx + 1
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                )}
              >
                {/* Thumbnail background image */}
                {includeIllustrations && slide.imageUrl && (
                  <div className="absolute inset-0 opacity-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest relative z-10">
                  STEP {slide.stepNumber}
                </span>
                <span className="text-[9px] font-bold truncate w-full relative z-10 text-slate-800">
                  {slide.stepTitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
