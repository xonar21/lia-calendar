# Lia Calendar (Skeleton v1)

Desktop-first skeleton of a task-oriented calendar app based on Figma.

## Stack

- Next.js 16 + TypeScript + App Router
- Prisma + PostgreSQL
- Tailwind CSS
- Docker Compose for local startup
- Auth: server-side Google OAuth 2.0 + HttpOnly JWT session (via `jose`)

## Quick Start (Docker — fullstack)

Runs PostgreSQL + Next.js app in containers:

```bash
cp .env.example .env   # fill AUTH_SECRET (at least 32 chars), optionally Google creds
docker compose up --build
```

Application: [http://localhost:3000](http://localhost:3000)

## Dev Mode (only backend DB in Docker, app on host)

Preferred local workflow — fast hot reload while PostgreSQL stays in Docker.

```bash
cp .env.example .env       # set AUTH_SECRET; Google creds are optional
npm install
npm run dev:setup          # starts postgres container + applies Prisma schema
npm run dev                # starts Next.js with hot reload on http://localhost:3000
```

Helpful scripts:

- `npm run dev:db` — start only the `postgres` service (`docker compose up -d postgres`)
- `npm run dev:db:stop` — stop the DB container
- `npm run prisma:push` — sync Prisma schema to the DB (run after schema changes)
- `npm run prisma:generate` — regenerate Prisma client

## Authentication

- Google OAuth:
  1. Create OAuth 2.0 Client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
  2. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (and production URL).
  3. Fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in `.env`.
- Dev login: if `AUTH_ALLOW_DEV_LOGIN=true` (default in non-production), `/login` shows a simple email form at `POST /api/auth/dev`. Useful while you don't have Google credentials yet.
- Sessions are stored in HttpOnly cookie `lia_session` (JWT signed with `AUTH_SECRET`, 30 days TTL).

### Auth endpoints

- `GET /api/auth/google/start?next=/` — redirect to Google
- `GET /api/auth/google/callback` — OAuth callback (sets session cookie)
- `POST /api/auth/dev` — dev-only login (body: `{ email, name? }`)
- `POST /api/auth/logout` — clear session
- `GET /api/auth/me` — current user and available auth modes

Unauthenticated users are redirected by middleware to `/login`. API calls without a session respond with `401`.

## Current API Skeleton

- `GET /api/health`
- `GET|POST /api/categories`
- `GET /api/calendar?from=<iso>&to=<iso>&categoryId=<optional>`
- `POST /api/events`
- `POST /api/tasks`
- `POST /api/journals`
- `POST /api/notes`
- `GET|PUT /api/settings`

## Troubleshooting

- **`P1010` / «User was denied access» / `role "lia" does not exist`**: на порту **5432** часто уже крутится свой PostgreSQL (не из Docker). В `docker-compose.yml` Postgres проброшен на хост **`5433`**, в `.env` должен быть `...@127.0.0.1:5433/...`. После смены порта выполни `docker compose down` и снова `docker compose up -d postgres` (или `npm run dev:setup`).

## Notes

- Default categories are auto-created per user: `personal`, `work`, `health`.
- Figma-accurate UI implementation continues screen-by-screen based on the agreed `node-id` list.
