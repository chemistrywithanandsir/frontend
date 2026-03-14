## Chemistry By Anand – Frontend

This is the frontend web app for **Chemistry By Anand**, an exam–prep platform focused on NEET, JEE and CBSE students.  
It is a single‑page React app (Vite + TypeScript) that talks to:

- A **FastAPI backend** (deployed on Railway) for business logic, payments and heavy operations.
- **Supabase** for authentication, database access from the browser, and some analytics.

This README is written for someone taking over the project so you can understand how it is structured, how it talks to the backend, and how to run and deploy it safely.

---

### Tech Stack

- **Build tool / dev server:** Vite
- **UI:** React + TypeScript + Tailwind
- **Auth & client‑side DB:** Supabase JS client
- **Backend API:** FastAPI app (see `backend/` repo), exposed at a base URL such as  
  `https://backend-production-17b5.up.railway.app`
- **Payments:** Razorpay (all secrets and API calls are handled server‑side)
- **Hosting (frontend):** Vercel

---

## High‑Level Architecture

The system is split into two repos:

- **frontend/** (this project) – React SPA, routing, UI and direct Supabase reads.
- **backend/** – FastAPI server that:
  - Wraps Supabase with higher‑level APIs
  - Implements PYQ parsing/upload logic
  - Manages notes, bundles and purchases
  - Integrates with Razorpay
  - Provides a `/chat/*` proxy for Gemini / Cloudflare models

All frontend calls to the backend go through a single environment‑controlled base URL:

```ts
// Example from many files
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

await fetch(`${API_BASE}/notes/bundles?...`);
```

So in development the frontend can talk to `http://localhost:8000`, and in production it talks to the deployed Railway URL.

---

## Important Features (Frontend View)

### 1. Authentication & Profile

- Google sign‑in using **Supabase Auth**.
- Frontend wraps Supabase in:
  - `src/app/context/AuthContext.tsx` – exposes `user`, `loading`, `signInWithGoogle`, `signOut`.
  - `src/app/context/ProfileContext.tsx` – stores lightweight profile data (display name, avatar).
- On login, the access token from Supabase is:
  - Used directly for client‑side Supabase queries (e.g. `user_purchases`).
  - Sent as a `Bearer` token to backend endpoints that require authentication (e.g. `/admin/*`, `/payments/*`, `/notes/my-bundles`).

### 2. Student Dashboard

Key routes (see `src/app/App.tsx`):

- `/` – marketing homepage.
- `/neet`, `/jee-main`, `/jee-advanced` – exam weightage landing pages.
- `/dashboard` – main student dashboard:
  - Weekly activity (questions solved, accuracy).
  - “Today’s tasks” (persisted via Supabase tables through simple helper APIs).
  - Latest notes bundles preview (fetched from backend `/notes/bundles`).
- `/dashboard/pyq/...` – full PYQ interface including:
  - Exam → chemistry type → chapter → question navigation.
  - Personal tests (build your own test from chapters).
  - Attempt tracking (`user_question_attempts`, `user_daily_stats`).
- `/dashboard/notes/...` – Notes Library:
  - Browse bundles per exam and chemistry type.
  - Preview first N pages of each notes PDF (via backend `/notes/preview`).
- `/dashboard/my-notes/...` – “My Notes”:
  - Lists purchased bundles and contents based on `user_purchases` and backend `/notes/my-bundles`.

### 3. Notes Bundles & Purchases

- Public listing of bundles:
  - `GET ${API_BASE}/notes/bundles?exam_code=...` returns available notes bundles.
  - Data is mapped to cards in `src/app/pages/NotesDashboard.tsx`.
- “My bundles” for the current user:
  - `GET ${API_BASE}/notes/my-bundles` with Supabase access token.
  - Hook: `src/app/hooks/useMyBundles.ts`.
- Purchasing:
  - Frontend uses `useRazorpayPayment` and `openRazorpayCheckout` to open Razorpay.
  - Backend `POST /payments/razorpay/create-order` creates orders.
  - After successful payment, backend verifies and inserts into `user_purchases`.

### 4. PYQs & Personal Tests

- Admin uploads or manually creates PYQs from PDFs; backend parses and stores them.
- Students:
  - Choose exam and chemistry type.
  - Browse chapter questions (sorted by year).
  - Build **personal tests** – store attempts and show results/history via Supabase tables like `user_personal_tests`.
  - Frontend uses helper APIs in `src/app/api/pyqApi.ts` and `src/app/api/personalTestApi.ts`.

### 5. Admin Panel

- Route: `/admin/anand`
- Behavior (in `src/app/pages/Admin.tsx`):
  1. If not logged in, triggers Google sign‑in with redirect back to `/admin/anand`.
  2. Once logged in, fetches Supabase session, extracts access token.
  3. Calls `GET ${API_BASE}/admin/anand` with `Authorization: Bearer <token>`.
  4. Backend compares `user.email` with its `admin_email` setting.
     - If they match → admin dashboard UI.
     - Else → shows “404 — Page not found; only available to owner account”.

Admin capabilities:

- Upload PYQ PDFs / manual questions.
- Edit and delete existing PYQs.
- Upload notes PDFs and create notes bundles.
- Manage exam chapter weightage and JEE‑Main shift weightage.

**Important:** if you change the admin’s Google email, you must also update `admin_email` in the backend’s environment.

### 6. Chat Widget

- Component: `src/app/components/GeminiChatWidget.tsx`.
- Sends text and optional screenshot to backend:

  - `POST ${API_BASE}/chat/cloudflare`
  - Or `POST ${API_BASE}/chat/gemini` / `/chat/openai` if wired.

- Backend proxies to configured LLM APIs so the frontend never exposes those keys.

---

## Project Layout (Frontend)

Only key folders are listed here; browse the repo for full details.

- `src/main.tsx` – Vite entry point, wraps `App` with `AuthProvider` and `ProfileProvider`.
- `src/app/App.tsx` – React Router setup; defines all public, dashboard, and admin routes.
- `src/app/pages/` – page‑level components:
  - `Home.tsx`, `ExamWeightage.tsx`, `Pyq.tsx`, `NotesDashboard.tsx`,
    `MyNotesDashboard.tsx`, `UserDashboard.tsx`, `Admin.tsx`, etc.
- `src/app/components/` – reusable UI components.
- `src/app/context/` – `AuthContext` and `ProfileContext`.
- `src/app/api/` – thin wrappers around backend and Supabase APIs:
  - `analyticsApi.ts`, `personalTestApi.ts`, `pyqApi.ts`, `razorpayApi.ts`,
    `tasksApi.ts`, `purchasesApi.ts`, `analyticsApi.ts`, `apiWeightage.ts`.
- `src/app/hooks/` – custom hooks like `useMyBundles`, `useRazorpayPayment`.
- `src/data/` – static data / mock data (`notesData.ts`, `weightageChapters.ts`).
- `vercel.json` – rewrites all routes to `index.html` so client‑side routing works on Vercel.

---

## Environment Variables (Frontend)

The frontend uses **Vite** env vars, which **must** start with `VITE_` to be available in the browser.

Create a local `.env` file in `frontend/` for development:

```bash
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anon/public key>

# Backend base URL:
# - For local dev with backend running on your machine:
#   VITE_API_BASE=http://localhost:8000
# - For production:
#   VITE_API_BASE=https://backend-production-17b5.up.railway.app
VITE_API_BASE=http://localhost:8000
```

**Do NOT commit `.env`** – it is intentionally in `.gitignore`.  
In production (Vercel) you set the same keys through their dashboard.

---

## Local Development

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm (or pnpm / yarn – the repo currently assumes npm)
- Running backend:
  - Either the local FastAPI dev server on `http://localhost:8000`
  - Or point `VITE_API_BASE` at a deployed backend URL

### Install dependencies

From the `frontend/` directory:

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

Vite will show a localhost URL (typically `http://localhost:5173`).  
Ensure the backend is reachable at whatever you set in `VITE_API_BASE`, or many pages (notes, PYQ, admin, chat, payments) will show fetch errors.

---

## Building for Production

```bash
npm run build
```

This outputs a static bundle to `dist/`.  
You can preview the production build locally with:

```bash
npm run preview
```

---

## Deploying to Vercel

1. **Push the frontend repo** to GitHub (or another Git provider).
2. In Vercel:
   - Click **New Project → Import Git Repository**.
   - Select this repo / directory.
3. Configure:

   - **Framework preset:** Vite / React
   - **Build command:** `npm run build`
   - **Output directory:** `dist`

4. Set **Environment Variables** in Vercel:

   ```text
   VITE_SUPABASE_URL = <your Supabase URL>
   VITE_SUPABASE_ANON_KEY = <your Supabase anon key>
   VITE_API_BASE = https://backend-production-17b5.up.railway.app   # or your backend URL
   ```

5. Deploy.

Client‑side routing is handled by `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

so URLs like `/dashboard/pyq/...` and `/admin/anand` work directly.

---

## Backend Integration Notes

When making changes that add new backend endpoints:

1. **Add the endpoint in the FastAPI app**, including appropriate auth checks.
2. Update or create a small wrapper in `src/app/api/*.ts` or in the relevant page/hook.
3. Always use `API_BASE` (`import.meta.env.VITE_API_BASE`) for new fetches.
4. For authenticated routes, get the Supabase session and send the access token:

   ```ts
   const { data } = await supabase.auth.getSession();
   const token = data.session?.access_token;
   const res = await fetch(`${API_BASE}/your/endpoint`, {
     headers: { Authorization: `Bearer ${token}` },
   });
   ```

5. If the endpoint depends on a new table or column in Supabase, document it in the backend repo and keep the migrations in sync.

---

## Admin Access Checklist

If the admin panel starts returning “404 — Page not found / only available to the owner account”:

1. Confirm you are signed in with the **correct Google account**.
2. In the backend’s environment (Railway):
   - `admin_email` must match that Google email **exactly**.
3. Confirm `VITE_API_BASE` in the frontend points to the same backend you updated.
4. Check the Network tab: `/admin/anand` should return 200; 403 means the backend rejected your email.

---

## Where to Start When Changing Things

- **New page / flow:** start from `src/app/App.tsx` to add a route, then build components under `src/app/pages/` and `src/app/components/`.
- **New backend integration:** add a helper in `src/app/api/` and wire it into the relevant page or hook.
- **Styling:** Tailwind classes are used heavily; global styles live under `src/styles/index.css`.
- **State that spans pages:** prefer context providers in `src/app/context/` or custom hooks in `src/app/hooks/`.

If you keep the `API_BASE` pattern, respect the existing context/providers, and avoid hard‑coding URLs, the app will stay deployable across both local and production environments with minimal friction.


  # Chemistry Education Homepage

  This is a code bundle for Chemistry Education Homepage. The original project is available at https://www.figma.com/design/wuIqEBAwPu1Sk4Ga6NRMiX/Chemistry-Education-Homepage.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  