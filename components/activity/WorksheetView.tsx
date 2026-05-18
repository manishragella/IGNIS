'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface WorksheetViewProps {
  activity: GeneratedActivity;
  activityId?: string | null;
  grade?: string;
  topic?: string;
  languageFocus?: string;
  lifeSkillFocus?: string;
  onReset?: () => void;
}

const sectionColors: Record<string, string> = {
  instructions: 'border-l-indigo-400 bg-indigo-50',
  activity: 'border-l-purple-400 bg-purple-50',
  questions: 'border-l-cyan-400 bg-cyan-50',
  reflection: 'border-l-emerald-400 bg-emerald-50',
};

export default function WorksheetView({
  activity,
  activityId,
  grade,
  topic,
  languageFocus,
  lifeSkillFocus,
  onReset,
}: WorksheetViewProps) {
  const [showRubric, setShowRubric] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('worksheet-content');
      if (!element) throw new Error('Worksheet content not found');

      const opt = {
        margin: [15, 15, 15, 15],
        filename: `${activity.title.replace(/[^a-z0-9]/gi, '_')}_worksheet.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('PDF downloaded! 📄');
    } catch (error) {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-emerald-700">Activity Generated</span>
          {activityId && (
            <span className="text-xs text-slate-400 ml-2">
              <Bookmark className="w-3 h-3 inline mr-1" />
              Auto-saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary gap-2 text-sm py-2 px-4 no-print"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="btn-primary text-sm py-2 px-4 no-print"
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="btn-secondary gap-2 text-sm py-2 px-4 no-print"
            >
              <RotateCcw className="w-4 h-4" />
              New Activity
            </button>
          )}
        </div>
      </div>

      {/* Worksheet Content */}
      <div
        id="worksheet-content"
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="ignis-gradient p-8 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-white/70 text-sm font-medium mb-2 uppercase tracking-widest">
                Ignis Activity Worksheet
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-4">
                {activity.title}
              </h2>

              <div className="flex flex-wrap gap-2">
                {grade && (
                  <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 font-medium">
                    {grade}
                  </span>
                )}
                {languageFocus && (
                  <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 font-medium">
                    📖 {languageFocus}
                  </span>
                )}
                {lifeSkillFocus && (
                  <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 font-medium">
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
              <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <item.icon className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <div className="font-bold text-slate-700 text-sm">{item.value}</div>
                <div className="text-xs text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Objectives */}
          {activity.objectives && activity.objectives.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-500" />
                Learning Objectives
              </h3>
              <div className="space-y-2">
                {activity.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                    </div>
                    <p className="text-slate-700 text-sm">{obj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {activity.materials && activity.materials.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-indigo-500" />
                Materials Needed
              </h3>
              <div className="flex flex-wrap gap-2">
                {activity.materials.map((mat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg font-medium"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Teacher Instructions */}
          {activity.instructions && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <h3 className="font-bold text-amber-800 text-sm mb-2 uppercase tracking-wider">
                Teacher Instructions
              </h3>
              <p className="text-amber-900 text-sm leading-relaxed">{activity.instructions}</p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t-2 border-dashed border-slate-200 my-6" />
          <div className="text-center text-xs text-slate-400 -mt-4">Student Worksheet Below</div>

          {/* Worksheet Sections */}
          {activity.worksheet && activity.worksheet.length > 0 && (
            <div className="space-y-4">
              {activity.worksheet.map((section, i) => (
                <div
                  key={i}
                  className={cn(
                    'worksheet-section border-l-4 rounded-r-xl',
                    sectionColors[section.type] || 'border-l-slate-300 bg-slate-50'
                  )}
                >
                  <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wider">
                    {section.heading}
                  </h4>
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Discussion Questions */}
          {activity.discussionQuestions && activity.discussionQuestions.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-cyan-500" />
                Discussion Questions
              </h3>
              <div className="space-y-2">
                {activity.discussionQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-cyan-50 rounded-xl border border-cyan-100"
                  >
                    <span className="text-sm font-bold text-cyan-600 flex-shrink-0 mt-0.5">
                      Q{i + 1}.
                    </span>
                    <p className="text-sm text-slate-700">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Presentation Task */}
          {activity.presentationTask && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
              <h3 className="font-bold text-purple-800 flex items-center gap-2 mb-2">
                <Presentation className="w-4 h-4" />
                Presentation Task
              </h3>
              <p className="text-purple-900 text-sm leading-relaxed">{activity.presentationTask}</p>
            </div>
          )}

          {/* Rubric Toggle */}
          {activity.rubric && activity.rubric.length > 0 && (
            <div>
              <button
                onClick={() => setShowRubric(!showRubric)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Assessment Rubric ({activity.rubric.length} criteria)
                </div>
                {showRubric ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showRubric && (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="ignis-gradient text-white">
                        <th className="text-left p-3 font-semibold w-1/5">Criterion</th>
                        <th className="text-left p-3 font-semibold">Excellent (4)</th>
                        <th className="text-left p-3 font-semibold">Good (3)</th>
                        <th className="text-left p-3 font-semibold">Developing (2)</th>
                        <th className="text-left p-3 font-semibold">Beginning (1)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.rubric.map((item: RubricItem, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-3 font-semibold text-slate-700 align-top">
                            {item.criterion}
                          </td>
                          <td className="p-3 text-slate-600 align-top">{item.excellent}</td>
                          <td className="p-3 text-slate-600 align-top">{item.good}</td>
                          <td className="p-3 text-slate-600 align-top">{item.developing}</td>
                          <td className="p-3 text-slate-600 align-top">{item.beginning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Generated by Ignis AI Facilitator Assistant • For educational use only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
