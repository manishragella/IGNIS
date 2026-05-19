// ============================================================
//  HYBRID FIREBASE / LOCAL STORE — supports remote DB and offline
// ============================================================

import { Activity, Submission, Report } from '@/types';
import { db } from '@/firebase/config';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';

// ── local storage helpers ────────────────────────────────────
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
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'activities'), data);
      return docRef.id;
    } catch (e) {
      console.error('Firestore createActivity failed:', e);
      throw e;
    }
  } else {
    const id = generateId();
    const items = readCollection<Activity>(ACTIVITIES_KEY);
    items.unshift({ ...data, id });
    writeCollection(ACTIVITIES_KEY, items);
    return id;
  }
}

export async function getActivity(id: string): Promise<Activity | null> {
  if (db) {
    try {
      const docSnap = await getDoc(doc(db, 'activities', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Activity;
      }
      return null;
    } catch (e) {
      console.error('Firestore getActivity failed, checking local:', e);
      // Fallback to local if doc fails
      const items = readCollection<Activity>(ACTIVITIES_KEY);
      return items.find((a) => a.id === id) ?? null;
    }
  } else {
    const items = readCollection<Activity>(ACTIVITIES_KEY);
    return items.find((a) => a.id === id) ?? null;
  }
}

export async function getActivitiesByUser(uid: string): Promise<Activity[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'activities'),
        where('createdBy', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const activities: Activity[] = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() } as Activity);
      });
      return activities;
    } catch (e) {
      console.warn('Firestore query failed, trying without orderBy', e);
      try {
        const q = query(
          collection(db, 'activities'),
          where('createdBy', '==', uid)
        );
        const querySnapshot = await getDocs(q);
        const activities: Activity[] = [];
        querySnapshot.forEach((doc) => {
          activities.push({ id: doc.id, ...doc.data() } as Activity);
        });
        return activities.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (err) {
        console.error('Firestore fetch failed completely:', err);
        return [];
      }
    }
  } else {
    const items = readCollection<Activity>(ACTIVITIES_KEY);
    return items.filter((a) => a.createdBy === uid);
  }
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, 'activities', id);
      await updateDoc(docRef, data as any);
    } catch (e) {
      console.error('Firestore updateActivity failed:', e);
      throw e;
    }
  } else {
    const items = readCollection<Activity>(ACTIVITIES_KEY);
    const idx = items.findIndex((a) => a.id === id);
    if (idx !== -1) items[idx] = { ...items[idx], ...data };
    writeCollection(ACTIVITIES_KEY, items);
  }
}

export async function deleteActivity(id: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'activities', id));
    } catch (e) {
      console.error('Firestore deleteActivity failed:', e);
      throw e;
    }
  } else {
    const items = readCollection<Activity>(ACTIVITIES_KEY);
    writeCollection(ACTIVITIES_KEY, items.filter((a) => a.id !== id));
  }
}

// ── SUBMISSIONS ───────────────────────────────────────────────
const SUBMISSIONS_KEY = 'ignis_submissions';

export async function createSubmission(data: Omit<Submission, 'id'>): Promise<string> {
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'submissions'), data);
      return docRef.id;
    } catch (e) {
      console.error('Firestore createSubmission failed:', e);
      throw e;
    }
  } else {
    const id = generateId();
    const items = readCollection<Submission>(SUBMISSIONS_KEY);
    items.unshift({ ...data, id });
    writeCollection(SUBMISSIONS_KEY, items);
    return id;
  }
}

export async function getSubmission(id: string): Promise<Submission | null> {
  if (db) {
    try {
      const docSnap = await getDoc(doc(db, 'submissions', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Submission;
      }
      return null;
    } catch (e) {
      console.error('Firestore getSubmission failed:', e);
      const items = readCollection<Submission>(SUBMISSIONS_KEY);
      return items.find((s) => s.id === id) ?? null;
    }
  } else {
    const items = readCollection<Submission>(SUBMISSIONS_KEY);
    return items.find((s) => s.id === id) ?? null;
  }
}

export async function getSubmissionsByUser(uid: string): Promise<Submission[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'submissions'),
        where('createdBy', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const submissions: Submission[] = [];
      querySnapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() } as Submission);
      });
      return submissions;
    } catch (e) {
      console.warn('Firestore submissions query failed, trying in-memory sort:', e);
      try {
        const q = query(
          collection(db, 'submissions'),
          where('createdBy', '==', uid)
        );
        const querySnapshot = await getDocs(q);
        const submissions: Submission[] = [];
        querySnapshot.forEach((doc) => {
          submissions.push({ id: doc.id, ...doc.data() } as Submission);
        });
        return submissions.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (err) {
        return [];
      }
    }
  } else {
    const items = readCollection<Submission>(SUBMISSIONS_KEY);
    return items.filter((s) => s.createdBy === uid);
  }
}

export async function updateSubmission(id: string, data: Partial<Submission>): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, 'submissions', id), data as any);
    } catch (e) {
      console.error('Firestore updateSubmission failed:', e);
      throw e;
    }
  } else {
    const items = readCollection<Submission>(SUBMISSIONS_KEY);
    const idx = items.findIndex((s) => s.id === id);
    if (idx !== -1) items[idx] = { ...items[idx], ...data };
    writeCollection(SUBMISSIONS_KEY, items);
  }
}

// ── REPORTS ───────────────────────────────────────────────────
const REPORTS_KEY = 'ignis_reports';

export async function createReport(data: Omit<Report, 'id'>): Promise<string> {
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'reports'), data);
      return docRef.id;
    } catch (e) {
      console.error('Firestore createReport failed:', e);
      throw e;
    }
  } else {
    const id = generateId();
    const items = readCollection<Report>(REPORTS_KEY);
    items.unshift({ ...data, id });
    writeCollection(REPORTS_KEY, items);
    return id;
  }
}

export async function getReport(id: string): Promise<Report | null> {
  if (db) {
    try {
      const docSnap = await getDoc(doc(db, 'reports', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Report;
      }
      return null;
    } catch (e) {
      console.error('Firestore getReport failed:', e);
      const items = readCollection<Report>(REPORTS_KEY);
      return items.find((r) => r.id === id) ?? null;
    }
  } else {
    const items = readCollection<Report>(REPORTS_KEY);
    return items.find((r) => r.id === id) ?? null;
  }
}

export async function getReportsByUser(uid: string): Promise<Report[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'reports'),
        where('createdBy', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reports: Report[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as Report);
      });
      return reports;
    } catch (e) {
      console.warn('Firestore reports query failed, trying in-memory sort:', e);
      try {
        const q = query(
          collection(db, 'reports'),
          where('createdBy', '==', uid)
        );
        const querySnapshot = await getDocs(q);
        const reports: Report[] = [];
        querySnapshot.forEach((doc) => {
          reports.push({ id: doc.id, ...doc.data() } as Report);
        });
        return reports.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (err) {
        return [];
      }
    }
  } else {
    const items = readCollection<Report>(REPORTS_KEY);
    return items.filter((r) => r.createdBy === uid);
  }
}

export async function updateReport(id: string, data: Partial<Report>): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, 'reports', id), data as any);
    } catch (e) {
      console.error('Firestore updateReport failed:', e);
      throw e;
    }
  } else {
    const items = readCollection<Report>(REPORTS_KEY);
    const idx = items.findIndex((r) => r.id === id);
    if (idx !== -1) items[idx] = { ...items[idx], ...data };
    writeCollection(REPORTS_KEY, items);
  }
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
