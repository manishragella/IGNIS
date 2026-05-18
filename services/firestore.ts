// ============================================================
//  LOCAL STORE — replaces Firebase Firestore for demo mode
//  All data lives in localStorage, persists across refreshes
// ============================================================

import { Activity, Submission, Report } from '@/types';

// ── helpers ──────────────────────────────────────────────────
function readCollection<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function writeCollection<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── ACTIVITIES ────────────────────────────────────────────────
const ACTIVITIES_KEY = 'ignis_activities';

export async function createActivity(data: Omit<Activity, 'id'>): Promise<string> {
  const id = generateId();
  const items = readCollection<Activity>(ACTIVITIES_KEY);
  items.unshift({ ...data, id });
  writeCollection(ACTIVITIES_KEY, items);
  return id;
}

export async function getActivity(id: string): Promise<Activity | null> {
  const items = readCollection<Activity>(ACTIVITIES_KEY);
  return items.find((a) => a.id === id) ?? null;
}

export async function getActivitiesByUser(uid: string): Promise<Activity[]> {
  const items = readCollection<Activity>(ACTIVITIES_KEY);
  return items.filter((a) => a.createdBy === uid);
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<void> {
  const items = readCollection<Activity>(ACTIVITIES_KEY);
  const idx = items.findIndex((a) => a.id === id);
  if (idx !== -1) items[idx] = { ...items[idx], ...data };
  writeCollection(ACTIVITIES_KEY, items);
}

export async function deleteActivity(id: string): Promise<void> {
  const items = readCollection<Activity>(ACTIVITIES_KEY);
  writeCollection(ACTIVITIES_KEY, items.filter((a) => a.id !== id));
}

// ── SUBMISSIONS ───────────────────────────────────────────────
const SUBMISSIONS_KEY = 'ignis_submissions';

export async function createSubmission(data: Omit<Submission, 'id'>): Promise<string> {
  const id = generateId();
  const items = readCollection<Submission>(SUBMISSIONS_KEY);
  items.unshift({ ...data, id });
  writeCollection(SUBMISSIONS_KEY, items);
  return id;
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const items = readCollection<Submission>(SUBMISSIONS_KEY);
  return items.find((s) => s.id === id) ?? null;
}

export async function getSubmissionsByUser(uid: string): Promise<Submission[]> {
  const items = readCollection<Submission>(SUBMISSIONS_KEY);
  return items.filter((s) => s.createdBy === uid);
}

export async function updateSubmission(id: string, data: Partial<Submission>): Promise<void> {
  const items = readCollection<Submission>(SUBMISSIONS_KEY);
  const idx = items.findIndex((s) => s.id === id);
  if (idx !== -1) items[idx] = { ...items[idx], ...data };
  writeCollection(SUBMISSIONS_KEY, items);
}

// ── REPORTS ───────────────────────────────────────────────────
const REPORTS_KEY = 'ignis_reports';

export async function createReport(data: Omit<Report, 'id'>): Promise<string> {
  const id = generateId();
  const items = readCollection<Report>(REPORTS_KEY);
  items.unshift({ ...data, id });
  writeCollection(REPORTS_KEY, items);
  return id;
}

export async function getReport(id: string): Promise<Report | null> {
  const items = readCollection<Report>(REPORTS_KEY);
  return items.find((r) => r.id === id) ?? null;
}

export async function getReportsByUser(uid: string): Promise<Report[]> {
  const items = readCollection<Report>(REPORTS_KEY);
  return items.filter((r) => r.createdBy === uid);
}

export async function updateReport(id: string, data: Partial<Report>): Promise<void> {
  const items = readCollection<Report>(REPORTS_KEY);
  const idx = items.findIndex((r) => r.id === id);
  if (idx !== -1) items[idx] = { ...items[idx], ...data };
  writeCollection(REPORTS_KEY, items);
}

// ── DASHBOARD STATS ───────────────────────────────────────────
export async function getDashboardStats(uid: string) {
  const [activities, submissions, reports] = await Promise.all([
    getActivitiesByUser(uid),
    getSubmissionsByUser(uid),
    getReportsByUser(uid),
  ]);

  return {
    totalActivities: activities.length,
    totalSubmissions: submissions.length,
    totalReports: reports.length,
    recentActivities: activities.slice(0, 5),
    recentSubmissions: submissions.slice(0, 3),
  };
}
