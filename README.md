# Anki my

A flashcard app built with React/TypeScript, Rust/Rocket, and PostgreSQL. The public-release branch adds a light interface inspired by the supplied Weekrise reference, a landing page, deck/card editing, and persistent per-user review scheduling.

## Core flow

- Register with a username and password, then sign in.
- Create a private deck and add, edit, or delete cards.
- Rename a deck or explicitly share it with other signed-in users.
- Study due cards and rate recall as Again, Hard, Good, or Easy.
- Progress is saved separately for each user, including on shared decks.
- Refreshing or opening a deck URL directly loads it from the API.

This app is independent of Anki. Scheduling is a small interval-based implementation, not Anki's FSRS/SM-2 implementation. `.apkg` import, email/password recovery, and Anki synchronization are not implemented.

## Run with Docker

Generate two random secrets and put them in a root `.env` file:

```env
JWT_SECRET=<random secret of at least 32 bytes>
ROCKET_SECRET_KEY=<random 32-byte value encoded as base64>
```

Then run:

```sh
docker compose up --build
```

Open `http://localhost:8000`. PostgreSQL uses a named volume; `docker compose down` retains it. Do not use `down --volumes` unless you intend to delete that local database.

## Native development

Requirements: Node.js 22.12+, stable Rust (edition 2024 support), PostgreSQL.

```sh
cd frontend
npm ci
npm run build
```

In `backend`, copy `.env.example` to `.env`, set the database URL and a random JWT secret, then run:

```sh
cargo run
```

The API is under `/api`, and the backend serves `frontend/dist` including SPA fallback routes. For frontend hot reload, run `npm run dev` in `frontend`; Vite proxies `/api` to port 8000. Leave `VITE_API_URL` and `ALLOWED_ORIGINS` unset for this same-origin setup. Set an explicit comma-separated `ALLOWED_ORIGINS` list only if you intentionally serve frontend and backend on different origins.

Database migrations run automatically at backend startup. The initial migration retains the original TEXT-id tables and creates review storage and indexes. Back up an existing database before its first migration.

## Checks

```sh
cd frontend
npm run build
```

```sh
cd backend
cargo test --locked
```

Backend database integration tests require `DATABASE_URL` for a local PostgreSQL account with permission to create test databases. Tests cover account validation, authentication, private/shared access, owner-only edits, persisted per-user reviews, and cascade cleanup. GitHub Actions starts a disposable PostgreSQL service, runs the checks, and builds the production container.

## Public deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the free Render + Neon setup. The checked-in Render Blueprint deploys the complete app as one Docker service. Never commit real secrets.
