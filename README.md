# 🔥 Ignis AI Facilitator Assistant

An AI-powered platform that helps teachers generate educational activities, evaluate student work, and produce professional school reports — in seconds, not hours.

## ✨ Features

| Feature | Description |
|---|---|
| **AI Activity Generator** | Generate complete worksheets, rubrics, and discussion guides using Gemini AI |
| **Student Evaluation** | Upload student work (image or text) for AI-powered scoring and feedback |
| **Report Generator** | Create professional school implementation reports automatically |
| **PDF Export** | Download any activity or report as a formatted PDF |
| **Firebase Auth** | Email/password and Google sign-in |
| **Real-time Database** | Save all activities, submissions, and reports to Firestore |

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: TailwindCSS
- **AI**: Google Gemini 1.5 Flash (text + vision)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Authentication
- **PDF**: html2pdf.js

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in your credentials:
```bash
cp .env.local.example .env.local
```

### 3. Configure Firebase
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email + Google), Firestore, and Storage
3. Copy your config to `.env.local`

### 4. Get Gemini API Key
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Create an API key and add it to `.env.local`

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
ignis/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── generate-activity/  # Gemini activity generation
│   │   ├── evaluate-submission/# Gemini vision evaluation
│   │   └── generate-report/    # Gemini report generation
│   ├── dashboard/              # Main dashboard
│   ├── activity-generator/     # Activity creation + view
│   ├── submissions/            # Student submission + evaluation
│   ├── reports/                # Report generation
│   ├── login/                  # Auth pages
│   └── register/
├── components/
│   ├── shared/                 # Sidebar, DashboardLayout
│   └── activity/               # WorksheetView
├── contexts/                   # AuthContext
├── firebase/                   # Firebase config
├── lib/                        # Prompts, utils
├── services/                   # Firestore, Storage
└── types/                      # TypeScript interfaces
```

## 🎯 CEO Demo Flow

1. **Login** → Teacher signs in with Google
2. **Dashboard** → See overview with stats
3. **Generate Activity** → Fill grade + topic + language + life skill → AI generates worksheet in ~10 seconds
4. **Download PDF** → Print-ready worksheet with rubric
5. **Evaluate Student** → Upload student image → AI scores and gives feedback
6. **Generate Report** → Fill observations → AI writes professional report in ~30 seconds
7. **Export Report** → Download as PDF

## 🔒 Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini
GEMINI_API_KEY=
```

## 🚢 Deployment

Deploy on Vercel:
1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all environment variables
4. Deploy!

---

Built with ❤️ for the Ignis team. AI-assisted, teacher-centered, activity-based.
