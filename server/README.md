# SIH26003 — server

Express + MongoDB (Mongoose) API for the Smriti app: accounts, the patient
profile (including uploaded photos/audio), and stored game-session results.

## Setup

1. **MongoDB must be running.** Either install MongoDB Community Server
   locally (default connects to `mongodb://127.0.0.1:27017`), or use a free
   [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and paste its
   connection string into `.env`.
2. `npm install`
3. A working `.env` is already included for local development
   (`MONGODB_URI` pointing at a local MongoDB, a dev `JWT_SECRET`). Change
   `JWT_SECRET` before this ever goes anywhere real.
4. `npm run dev` — starts on `http://localhost:5000` with auto-reload.

The client expects this to be running at `http://localhost:5000/api`
(`client/.env`, `VITE_API_URL`) — start this before starting the client.

## What's here

- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` — JWT
  auth. Token goes in `Authorization: Bearer <token>` on every other request.
- `GET /api/patients/me`, `PUT /api/patients/me` — the patient profile.
  `PUT` is a full upsert: the client always sends its complete current state
  (basic details, medical/care, preferences, memories, people, photos, voice
  sample), so create and edit are the same call.
- `POST /api/uploads` — accepts one `multipart/form-data` file (`file` field),
  returns `{ url }`. Used for every image and the voice sample; the returned
  URL is what actually gets saved onto the patient record.
- `POST /api/games/sessions`, `GET /api/games/sessions` — stores/reads results
  from a completed game round (accuracy, timing, per-category breakdown).

## Not done yet

- **No refresh tokens** — the JWT is long-lived (`JWT_EXPIRES_IN`, default 30
  days) rather than short-lived-with-refresh. Fine for a prototype, not for
  production.
- **No rate limiting or request validation library** — inputs are checked by
  hand in each controller, which is fine at this size but won't scale past it.
- **Dashboard/Reports on the frontend still show placeholder data** — the
  sessions are now genuinely stored, but nothing reads `GET
  /api/games/sessions` yet to replace the mock charts.
