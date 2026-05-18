import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ignis AI — Facilitator Assistant',
  description:
    'AI-assisted activity learning platform for teachers. Generate educational activities, evaluate student work, and automate reporting.',
  keywords: [
    'education',
    'AI',
    'classroom',
    'teacher',
    'facilitator',
    'activity generator',
    'student evaluation',
  ],
  openGraph: {
    title: 'Ignis AI Facilitator Assistant',
    description: 'Empowering teachers with AI-assisted activity generation and reporting.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              },
              success: {
                iconTheme: { primary: '#6244ff', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
