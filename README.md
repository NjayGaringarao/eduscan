# Eduscan Web

Eduscan is a thesis project that automates attendance tracking for students and employees. The web app (Next.js + Supabase) exposes dashboards, scheduling, and a machine-learning powered analytics module.

## Key Capabilities

- **Real-time attendance logging** via Eduscan FaceID kiosks.
- **Performance analytics** that summarize punctuality, time balance, and attendance rate per user.
- **Dropout-risk prediction** based on literature-backed 10-day attendance sequences:
  - Encode PRESENT/ABSENT as binary time steps (most recent → oldest).
  - Append a `user_type` flag (students=0, employees=1).
  - Train a shallow Random Forest classifier for `AT_RISK` vs `NOT_AT_RISK`.
  - Thresholds: students <70% attendance ⇒ at risk, employees <90% ⇒ at risk.
- **Front-end insights** rendered via `UserPerformance.tsx`, showing risk, punctuality, time-balance, and attendance rate.

The heavier ML components live in `../eduscan-faceid/ml`. The web app consumes results through the Supabase edge function `performance_analytics`.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the UI. Update environment variables (Supabase keys, FaceID service URL/password) before running in production.

## ML Analytics Overview

1. Supabase edge function (`supabase/functions/performance_analytics`) proxies requests to the FaceID backend.
2. The backend (`eduscan-faceid`) fetches:
   - Session stats for punctuality/time-balance.
   - Attendance-state rows for the last 10 days.
   - User type (student vs employee).
3. `AttendanceFeature.extract_binary_sequence` builds the 10-step vector, appends the user_type flag, and feeds the dropout-risk classifier.
4. The response is rendered by `src/components/user/UserPerformance.tsx`.

For dataset and training guidance, see `../eduscan-faceid/ml/README.md`.

## Scripts

```bash
npm run dev        # Local development
npm run build      # Production build
npm run lint       # ESLint
```

## Deployment

Deploy the web app to Vercel or any platform that supports Next.js 14+. Ensure the ML backend (`eduscan-faceid`) and Supabase function endpoints are reachable from the deployed URL.
