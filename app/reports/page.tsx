'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { createReport } from '@/services/firestore';
import {
  FileText,
  School,
  User,
  Calendar,
  Hash,
  BookOpen,
  Eye,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Loader2,
  Download,
  RefreshCw,
  Printer,
  Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    schoolName: '',
    teacherName: user?.displayName || '',
    visitCount: '',
    dateRange: '',
    activitiesCompleted: '',
    observations: '',
    achievements: '',
    challenges: '',
    supportRequired: '',
    suggestions: '',
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolName || !formData.teacherName || !formData.observations) {
      toast.error('Please fill in school name, teacher name, and observations');
      return;
    }

    setLoading(true);
    setReport(null);

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Report generation failed');

      setReport(data.report);
      toast.success('Report generated! 📋');

      if (user) {
        const reportData = {
          ...formData,
          visitCount: parseInt(formData.visitCount) || 1,
          activitiesCompleted: parseInt(formData.activitiesCompleted) || 0,
          generatedReport: data.report,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
        };
        const id = await createReport(reportData);
        setSavedId(id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('report-content');
      if (!element) throw new Error('Report not found');

      const opt = {
        margin: [20, 20, 20, 20],
        filename: `Ignis_Report_${formData.schoolName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Report PDF downloaded! 📄');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-slate-400 text-sm';

  const fields = [
    {
      id: 'observations',
      label: 'Classroom Observations',
      icon: Eye,
      placeholder:
        'Describe what you observed during visits — student engagement, classroom dynamics, teacher facilitation style...',
      rows: 4,
    },
    {
      id: 'achievements',
      label: 'Key Achievements',
      icon: BookOpen,
      placeholder: 'What milestones were reached? What worked exceptionally well?',
      rows: 3,
    },
    {
      id: 'challenges',
      label: 'Challenges Faced',
      icon: AlertTriangle,
      placeholder: 'What obstacles did teachers or students encounter?',
      rows: 3,
    },
    {
      id: 'supportRequired',
      label: 'Support Required',
      icon: HelpCircle,
      placeholder: 'What resources, training, or assistance does the school need?',
      rows: 3,
    },
    {
      id: 'suggestions',
      label: 'Recommendations & Suggestions',
      icon: Lightbulb,
      placeholder: 'What improvements or next steps would you suggest?',
      rows: 3,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-cyan-600 font-medium text-sm mb-2">
            <FileText className="w-4 h-4" />
            <span>Report Generator</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">School Implementation Report</h1>
          <p className="text-slate-500 mt-1">
            Fill in your observations and let AI generate a professional report in seconds.
          </p>
        </div>

        {!report ? (
          /* Form */
          <div className="grid lg:grid-cols-5 gap-6">
            <form onSubmit={handleGenerate} className="lg:col-span-3 space-y-5">
              {/* Basic Info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                  Basic Information
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                      <School className="w-4 h-4 text-cyan-500" />
                      School Name *
                    </label>
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => update('schoolName', e.target.value)}
                      placeholder="e.g. St. Mary's Primary School"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                      <User className="w-4 h-4 text-cyan-500" />
                      Facilitator Name *
                    </label>
                    <input
                      type="text"
                      value={formData.teacherName}
                      onChange={(e) => update('teacherName', e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                      <Calendar className="w-4 h-4 text-cyan-500" />
                      Date Range
                    </label>
                    <input
                      type="text"
                      value={formData.dateRange}
                      onChange={(e) => update('dateRange', e.target.value)}
                      placeholder="e.g. April 2025 – May 2025"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                      <Hash className="w-4 h-4 text-cyan-500" />
                      Number of Visits
                    </label>
                    <input
                      type="number"
                      value={formData.visitCount}
                      onChange={(e) => update('visitCount', e.target.value)}
                      placeholder="e.g. 4"
                      min="1"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                      <BookOpen className="w-4 h-4 text-cyan-500" />
                      Activities Completed
                    </label>
                    <input
                      type="number"
                      value={formData.activitiesCompleted}
                      onChange={(e) => update('activitiesCompleted', e.target.value)}
                      placeholder="e.g. 8"
                      min="0"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Fields */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                  Detailed Report Content *
                </h3>

                {fields.map(({ id, label, icon: Icon, placeholder, rows }) => (
                  <div key={id}>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                      <Icon className="w-4 h-4 text-cyan-500" />
                      {label}
                    </label>
                    <textarea
                      value={(formData as any)[id]}
                      onChange={(e) => update(id, e.target.value)}
                      placeholder={placeholder}
                      rows={rows}
                      className={`${inputClass} resize-none`}
                      required={id === 'observations'}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6244ff 100%)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Professional Report
                  </>
                )}
              </button>
            </form>

            {/* Info Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 p-5">
                <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-500" />
                  Report includes
                </h3>
                <ul className="space-y-2.5">
                  {[
                    'Executive Summary',
                    'Classroom Observations (expanded)',
                    'Key Achievements & Milestones',
                    'Challenges & Root Analysis',
                    'Support Required (with action items)',
                    'Professional Recommendations',
                    'Conclusion & Next Steps',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-800 mb-1">
                      The more detail, the better
                    </p>
                    <p className="text-xs text-indigo-700">
                      Provide specific observations — names of activities tried, student reactions, 
                      teacher feedback. AI will transform your notes into professional prose.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500 font-medium mb-2">⏱ Generation time</p>
                <div className="text-2xl font-bold ignis-gradient-text">~30 seconds</div>
                <p className="text-xs text-slate-400 mt-1">
                  vs 2-3 hours of manual writing
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Generated Report */
          <div className="space-y-4 animate-fade-in">
            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="font-semibold text-emerald-700 text-sm">Report Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary text-sm py-2 px-4 gap-2 no-print"
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setReport(null);
                    setSavedId(null);
                  }}
                  className="btn-secondary text-sm py-2 px-4 gap-2 no-print"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Report
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div
              id="report-content"
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-12"
            >
              {/* Ignis Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
                <div>
                  <div className="text-2xl font-bold ignis-gradient-text">IGNIS</div>
                  <div className="text-xs text-slate-400 mt-0.5">AI Facilitator Assistant</div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Implementation Report</div>
                  <div className="font-medium text-slate-600">
                    {new Date().toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Rendered Report */}
              <div
                className="prose prose-slate max-w-none"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.8',
                  color: '#1e293b',
                }}
              >
                {report.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1
                        key={i}
                        className="text-2xl font-bold text-slate-900 mt-6 mb-3"
                        style={{ color: '#6244ff' }}
                      >
                        {line.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={i} className="text-xl font-bold text-slate-800 mt-6 mb-2">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={i} className="text-base font-bold text-slate-700 mt-4 mb-2">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('---')) {
                    return <hr key={i} className="border-slate-200 my-4" />;
                  }
                  if (line.startsWith('- ') || line.startsWith('• ')) {
                    return (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span className="text-slate-700 text-sm">
                          {line.replace(/^[-•] /, '')}
                        </span>
                      </div>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-semibold text-slate-800 mb-1 text-sm">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.trim() === '') {
                    return <div key={i} className="h-2" />;
                  }
                  // Inline bold
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  return (
                    <p key={i} className="text-slate-700 text-sm mb-1 leading-relaxed">
                      {parts.map((part, j) =>
                        j % 2 === 1 ? (
                          <strong key={j} className="font-semibold text-slate-800">
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                <span>Generated by Ignis AI Facilitator Assistant</span>
                <span>Confidential — Educational Use Only</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
