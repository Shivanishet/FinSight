# FinSight — AI-Powered Personal Finance & Expense Intelligence

A production-ready full-stack personal finance platform with AI-driven insights, built with React + Vite on the frontend and Supabase (Postgres + Auth) as the backend.

## Features

### Frontend
- **Modern responsive dashboard** with stat cards, charts, and recent activity
- **Dark mode** with system preference detection and persistence
- **Sidebar navigation** (collapsible on mobile)
- **Pages**: Dashboard, Expenses, Income, Budgets, Analytics, AI Insights, Profile, Login, Register
- **Expense form** with category, amount, date, notes, and AI auto-categorization
- **Budget progress bars** with utilization color coding
- **Interactive charts** (Recharts): monthly spending, category distribution (pie + bar), savings trends
- **Loading states** (skeletons, spinners) and **toast notifications**
- **Protected routes** with redirect-to-login
- **Context API** state management (Auth, Theme, Toast, Data)

### AI Features (mock implementation)
- **Automatic expense categorization** — keyword-based category suggestion from descriptions
- **Monthly spending prediction** — trend-weighted forecast from last 3 months
- **Unusual expense detection** — statistical anomaly detection (mean + 2σ)
- **Personalized savings recommendations** — savings-rate analysis vs 20% benchmark
- **AI financial coach messages** — context-aware coaching based on net cash flow

### Analytics
- Total income, total expenses, current balance
- Monthly trends (income vs expenses vs savings)
- Category breakdown
- Budget utilization per category

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (dark mode via `class` strategy)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Backend**: Supabase (Postgres database + JWT auth + Row Level Security)

> **Note on backend**: The original spec called for Node.js + Express + MongoDB. This implementation uses Supabase (Postgres + built-in JWT auth with refresh-token rotation) because it is the provisioned backend in this environment. The data layer is isolated in `src/services/api.ts` so the persistence layer can be swapped to a REST/Express backend by replacing that one file. Supabase Auth provides JWT access tokens and automatic refresh-token rotation out of the box, and RLS enforces per-user data isolation server-side.

## Project Structure
```
src/
  components/      # Layout, Sidebar, Topbar, Modal, charts, forms, UI primitives
  context/         # AuthContext, ThemeContext, ToastContext, DataContext
  hooks/           # useSeed (sample data seeding)
  pages/           # Dashboard, Expenses, Income, Budgets, Analytics, Insights, Profile, Login, Register
  services/        # supabase client, api (data layer), ai (insight engine), auth
  types/           # shared TypeScript types
  utils/           # formatting helpers
```

## Database Schema
Four tables, all owner-scoped with RLS:
- `expenses` (amount, category, description, date)
- `income` (amount, source, description, date)
- `budgets` (category, limit_amount, month — unique per user/category/month)
- `insights` (type, title, body, severity, metadata, read)

Each table has 4 RLS policies (SELECT/INSERT/UPDATE/DELETE) scoped to `auth.uid() = user_id`, with `user_id` defaulting to `auth.uid()` so client inserts succeed without explicitly passing the owner.

## Getting Started

The dev server runs automatically. To build:
```bash
npm install
npm run build      # production build
npm run typecheck  # TypeScript check
```

## Environment Variables
Already provisioned in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Deployment
- **Frontend (Vercel)**: `vercel` — builds with `npm run build`, serves `dist/`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel env vars.
- **Backend**: Supabase project (no separate backend deploy needed). Database migrations and RLS policies are applied via the Supabase MCP tools.

## Sample Seed Data
On first sign-in, the app auto-seeds sample expenses, income, budgets, and AI insights for the new user (only if they have no existing data). This gives the dashboard, charts, and analytics immediate content to render.
