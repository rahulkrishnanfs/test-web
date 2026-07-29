# Cursor Northampton — Credits Distribution Web App

A responsive web application to manage and distribute Cursor AI referral credits for
Cursor Northampton event attendees.

- **Frontend:** React + Vite + React-Bootstrap (dark/light mode, QR codes)
- **Backend:** FastAPI + SQLAlchemy (JWT auth, bcrypt, role-based access, audit log)
- **Database:** PostgreSQL (Neon in production; SQLite by default for zero-config local dev)
- **Deploy:** Vercel (separate frontend and backend projects) + Neon Postgres

## Features

- Modern landing page for the Cursor Northampton community.
- Attendee portal with **email-only (passwordless) login** — each attendee sees only
  their own assigned referral code, URL and QR code, with copy-link and download-QR.
- Admin dashboard:
  - Upload attendee CSV and Cursor referral-code CSV (with preview + validation).
  - **Map Credits** — assigns one unique code per attendee (no duplicates); reports
    leftover unmapped attendees and unused codes.
  - Search by name/email, filter mapped/unmapped, reassign, edit, delete.
  - Export final mapping as CSV.
  - Dashboard stats: total attendees, total credits, assigned, remaining, redeemed.
  - Audit log of all admin actions.

## Project structure

```
backend/    FastAPI app (app/), Vercel entry (api/index.py)
frontend/   Vite React app
docker-compose.yml   Local Postgres (optional)
demo-details-user.csv, dummy-credits.csv   Sample CSVs for testing
```

## Local development

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # defaults to SQLite; edit for Postgres/Neon
uvicorn app.main:app --reload --port 8009
```

The API runs at `http://localhost:8009` (docs at `/docs`). On first start it creates the
tables and seeds an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(defaults: `admin@cursornorthampton.dev` / `admin1234` — change these).

**Optional — use Postgres locally instead of SQLite:**

```bash
docker compose up -d db
# then in backend/.env:
# DATABASE_URL=postgresql+psycopg2://cursor:cursor@localhost:5432/cursor_northampton
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:8009
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`).

## Usage workflow

1. Admin logs in at `/admin/login`.
2. Upload the attendee CSV (**Upload Attendees** tab) — preview then import.
3. Upload the referral codes CSV (**Upload Credits** tab).
4. Click **Map Credits** on the Mappings tab.
5. Attendees log in at `/login` with the email they registered with and view their
   assigned QR code / referral URL.

### CSV formats

- **Attendees** (Luma-style export): must include at least `name`/`first_name`+`last_name`
  and `email`. Extra columns (LinkedIn, source, etc.) are preserved.
- **Referral codes:** headers `Code,URL`. If `URL` is missing it is derived from the code.

Sample files `demo-details-user.csv` and `dummy-credits.csv` are included in the repo root.

## Deployment

### Database — Neon

1. Create a project at [neon.tech](https://neon.tech) and copy the connection string.
2. Use it as `DATABASE_URL`, e.g.
   `postgresql+psycopg2://user:password@ep-xxxx.aws.neon.tech/neondb?sslmode=require`.

### Backend — Vercel

- Root directory: `backend/`. It ships `vercel.json` and `api/index.py` (the
  `@vercel/python` entry that exposes the FastAPI `app`).
- Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD`, `FRONTEND_ORIGIN` (your deployed frontend URL).

### Frontend — Vercel

- Root directory: `frontend/`. Framework preset: Vite. `vercel.json` handles SPA routing.
- Set `VITE_API_BASE_URL` to the deployed backend URL.

## Security notes

- Passwords hashed with bcrypt; JWTs signed with `JWT_SECRET` (change it in production).
- Attendee login is passwordless-by-email by design (attendees have no password in the
  source CSV); tokens are scoped so an attendee can only read their own referral.
- Always set strong `ADMIN_PASSWORD` and `JWT_SECRET` and a restrictive `FRONTEND_ORIGIN`
  in production.
