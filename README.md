# PennyPilot — personal finance tracker

React/Vite frontend with an Express/Prisma/PostgreSQL backend. Sign in, manage income/expenses, budgets, savings goals and recurring payments. Analytics and Smart Insights derive their figures from your saved records.

## What's included in this MVP

- Register, sign in, restore session and sign out (bcrypt password hashes + HttpOnly JWT cookie).
- Account-isolated cloud data at `/api/data` (JSON snapshot stored in PostgreSQL using Prisma).
- Dashboard, transactions, monthly budgets, savings goals, recurring payments, analytics and Smart Insights.
- Auto-save after changes; sync status and retry control in the sidebar.
- One-time import of existing browser LocalStorage data, with backup before replacement.
- Optimistic version check: an older tab cannot silently overwrite changes made in another tab.
- Single-origin production serving from Express; Vite `/api` proxy in development.

**Architecture note:** The existing normalized Prisma models for transactions, budgets, goals and recurring payments remain in the schema. This MVP saves the UI state as a per-user JSON snapshot in `User.appData` to preserve the current UI's record IDs and monthly budget cycles without rewriting every page. Future versions can migrate to individual CRUD endpoints.

## First-time setup (Windows / PowerShell)

Prerequisites: Node.js 22+ and access to your existing PostgreSQL database.

**IMPORTANT:** Do not delete or overwrite your existing `backend/.env`. It contains your database connection strings and JWT secret. The ZIP deliberately excludes it.

In `backend/.env`, you need `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` (random string, at least 32 characters). See `backend/.env.example` for variable names only.

### 1. Backend dependencies and database migration

```powershell
cd "C:\Users\ARYAN\Penny pilot\backend"
npm ci
npm run db:deploy
npm run db:generate
npm start
```

Leave this terminal running. Check `http://localhost:5000/api/health`.

### 2. Frontend

Open a **second** terminal:

```powershell
cd "C:\Users\ARYAN\Penny pilot"
npm ci
npm run dev
```

Open `http://localhost:5173` and sign in. Existing accounts work; if you have old browser data, PennyPilot will ask whether to import it. You can double-click `START-PENNYPILOT.bat` on future runs after the first-time setup.

### 3. Tests

```powershell
cd "C:\Users\ARYAN\Penny pilot\backend"
npm test
```

From project root, run `npm run build` to build the frontend.

## Production deployment (one Railway service)

Use a **single service** so the React app and API share an origin; this avoids cross-site cookie problems.

- Deploy the GitHub repository from the project root.
- Build command: `npm ci && npm run build && cd backend && npm ci && npm run db:generate`
- Start command: `cd backend && npm run db:deploy && npm start`
- Environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` and `NODE_ENV=production`.
- Health check path: `/api/health`.

Do not paste secrets into GitHub, screenshots, or deployment logs. Confirm the PostgreSQL direct connection works from the deployment provider before launching.

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in, set HttpOnly session cookie |
| GET | `/api/auth/me` | Check authenticated session |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/data` | Read signed-in user's data + version |
| PUT | `/api/data` | Validate and save snapshot with version check |

All `/api/data` routes require a valid session. The server accepts same-origin browser requests; development uses Vite's proxy.

## Limitations / next improvements

- The cloud snapshot uses a last-writer-per-version workflow, not real-time collaborative merging. If another tab changes data, download a local backup before reloading.
- No password-reset email or email verification yet.
- No bank connection, real AI service or scheduled payment processing; Smart Insights are rule-based and recurring payments are manually tracked.
- Do an end-to-end test with your own database and hosting environment before calling this production-ready.
