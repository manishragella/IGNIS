# 🔥 Ignis AI — Demo Setup (Zero Config)

## Step 1: Install Dependencies
Open PowerShell/Terminal in the `Ignis` folder:
```bash
npm install
```

## Step 2: The `.env.local` is already created with the Gemini API key ✅
No Firebase. No database. No other services needed.

## Step 3: Run the Dev Server
```bash
npm run dev
```
Open: **http://localhost:3000**

---

## 🎭 Demo Login Credentials

| Name | Email | Password |
|---|---|---|
| Priya Sharma | teacher@ignis.ai | ignis123 |
| Rahul Verma | admin@ignis.ai | admin123 |
| Demo User | demo@ignis.ai | demo123 |

All three accounts work. Just click the **Login →** button next to any account on the login page.

---

## 🚢 Deploying to Vercel (No DB needed)

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Ignis AI demo"
   git push
   ```
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add ONE environment variable:
   ```
   GEMINI_API_KEY = AIzaSyAQI2RcDkpFeiqWGQ_MgRZ6fp0bVxj-1Qc
   ```
4. Deploy! Done. 🎉

> **Note:** Data (activities, submissions, reports) is stored in the user's browser localStorage.
> It persists per browser session. For a real production deployment later, swap the services/firestore.ts with real Firebase.

---

## 📦 What's Inside

| Feature | How it works in Demo |
|---|---|
| Authentication | Hardcoded demo users, session in localStorage |
| Activities/Reports/Submissions | Stored in browser localStorage |
| Image uploads | Converted to base64 (no upload needed) |
| AI Generation | Real Gemini 1.5 Flash API (your key) |
| PDF Export | Client-side html2pdf.js |
