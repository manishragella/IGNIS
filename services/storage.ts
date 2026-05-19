// ============================================================
//  HYBRID FIREBASE STORAGE SERVICE — supports remote storage and offline
// ============================================================

import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

export async function uploadSubmissionImage(file: File, userId?: string): Promise<string> {
  if (storage) {
    try {
      const fileRef = ref(storage, `submissions/${userId || 'anonymous'}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      console.error('Firebase Storage upload failed, falling back to base64:', e);
    }
  }

  // Convert to base64 data URL — stays entirely in the browser
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadWorksheetPDF(
  blob: Blob,
  userId: string,
  activityTitle: string
): Promise<string> {
  if (storage) {
    try {
      const sanitizedTitle = activityTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileRef = ref(storage, `worksheets/${userId}/${Date.now()}_${sanitizedTitle}.pdf`);
      const snapshot = await uploadBytes(fileRef, blob);
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      console.error('Firebase Storage PDF upload failed:', e);
    }
  }
  return '';
}

export async function uploadGeneratedImage(
  base64Data: string,
  userId: string,
  topic: string
): Promise<string> {
  if (storage && base64Data && base64Data.startsWith('data:')) {
    try {
      const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileRef = ref(storage, `illustrations/${userId}/${Date.now()}_${sanitizedTopic}.png`);
      
      // Upload base64 string
      const snapshot = await uploadString(fileRef, base64Data, 'data_url');
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      console.error('Firebase Storage illustration upload failed:', e);
    }
  }
  return base64Data; // Fallback to returning base64 Data URL directly
}

export async function deleteFile(_url: string): Promise<void> {
  // No-op for safety, can be expanded if storage file deletion is needed
}
