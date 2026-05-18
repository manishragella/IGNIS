// ============================================================
//  STORAGE STUB — replaces Firebase Storage for demo mode
//  Images are converted to base64 data URLs (no upload needed)
// ============================================================

export async function uploadSubmissionImage(file: File, _userId?: string): Promise<string> {
  // Convert to base64 data URL — stays entirely in the browser
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadWorksheetPDF(
  _blob: Blob,
  _userId: string,
  _activityTitle: string
): Promise<string> {
  // No-op stub for demo — PDFs are downloaded directly without storage
  return '';
}

export async function deleteFile(_url: string): Promise<void> {
  // No-op for demo mode
}
