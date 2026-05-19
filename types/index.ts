// ============================================
// Ignis AI Facilitator — Global TypeScript Types
// ============================================

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'teacher' | 'admin';
  createdAt: string;
}

export interface Activity {
  id?: string;
  title: string;
  grade: string;
  topic: string;
  languageFocus: string;
  lifeSkillFocus: string;
  generatedContent: GeneratedActivity | null;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'active' | 'archived';
  imageUrl?: string;
  pdfUrl?: string;
}

export interface GeneratedActivity {
  title: string;
  objectives: string[];
  instructions: string;
  discussionQuestions: string[];
  presentationTask: string;
  rubric: RubricItem[];
  worksheet: WorksheetSection[];
  estimatedTime: string;
  materials: string[];
  imageUrl?: string;
  imagePrompt?: string;
}

export interface WorksheetSection {
  heading: string;
  content: string;
  type: 'instructions' | 'questions' | 'activity' | 'reflection';
}

export interface RubricItem {
  criterion: string;
  excellent: string;
  good: string;
  developing: string;
  beginning: string;
}

export interface Submission {
  id?: string;
  studentName: string;
  activityId: string;
  activityTitle?: string;
  imageUrl?: string;
  submissionText?: string;
  aiFeedback?: AIFeedback | null;
  scores?: EvaluationScores;
  teacherNotes?: string;
  status: 'pending' | 'evaluated' | 'reviewed';
  createdAt: string;
  createdBy: string;
}

export interface EvaluationScores {
  creativity: number;
  grammar: number;
  communication: number;
  understanding: number;
  participation: number;
  overall: number;
}

export interface AIFeedback {
  strengths: string[];
  improvements: string[];
  overallComment: string;
  scores: EvaluationScores;
}

export interface Report {
  id?: string;
  schoolName: string;
  teacherName: string;
  visitCount: number;
  dateRange: string;
  activitiesCompleted: number;
  observations: string;
  achievements: string;
  challenges: string;
  supportRequired: string;
  suggestions: string;
  generatedReport?: string | null;
  pdfUrl?: string;
  createdAt: string;
  createdBy: string;
}

export interface ActivityFormData {
  grade: string;
  topic: string;
  languageFocus: string;
  lifeSkillFocus: string;
}

export interface ReportFormData {
  schoolName: string;
  teacherName: string;
  visitCount: number;
  dateRange: string;
  activitiesCompleted: number;
  observations: string;
  achievements: string;
  challenges: string;
  supportRequired: string;
  suggestions: string;
}

export interface DashboardStats {
  totalActivities: number;
  totalSubmissions: number;
  totalReports: number;
  recentActivities: Activity[];
}
