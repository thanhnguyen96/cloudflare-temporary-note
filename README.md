# note-24h

Temporary room-based notes and file sharing app on Cloudflare. Messages/files expire after 24 hours.

- Vietnamese guide: [README.vi.md](./README.vi.md)

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Cloudflare Workers
- Storage: D1 (metadata) + R2 (file objects)

## Main Features

- Join a room by entering any string or URL
- Chat-like text messages
- File upload support (multipart upload to R2)
- Automatic 24h expiration
- Dark/light mode, responsive UI, VI/EN language toggle

## Project Structure

```text
note-24h/
├─ frontend/
│  ├─ src/
│  │  ├─ app/                # App shell and router
│  │  ├─ components/         # UI components
│  │  ├─ hooks/              # React hooks
│  │  ├─ lib/                # API client, room utils, i18n
│  │  └─ styles/             # SCSS (BEM + 7-1 pattern)
│  ├─ .env.example
│  └─ package.json
├─ worker/
│  ├─ src/
│  │  ├─ handlers/           # Route handlers
│  │  ├─ jobs/               # Scheduled cleanup jobs
│  │  ├─ lib/                # HTTP/R2 helpers/constants
│  │  ├─ services/           # D1 business logic
│  │  └─ worker.ts           # Worker entry + router
│  ├─ migrations/            # D1 migrations
│  ├─ wrangler.toml.example
│  ├─ .dev.vars.example
│  └─ package.json
├─ scripts/
│  └─ deploy-all.ps1         # Build + deploy worker + pages
├─ package.json              # Workspace scripts
└─ README.md
```

## Prerequisites

- Node.js 20+ (tested with Node 22)
- npm
- Cloudflare account
- Wrangler CLI (installed via workspace devDependencies)

## 1) Local Setup

### 1. Install dependencies

```powershell
npm install
```

### 2. Frontend env

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

Default value in `frontend/.env.local`:

```env
VITE_API_BASE=http://127.0.0.1:8787
```

### 3. Worker local env

```powershell
Copy-Item worker/.dev.vars.example worker/.dev.vars
```

Fill real values in `worker/.dev.vars` for local multipart upload testing.

### 4. Create local worker config from example

`worker/wrangler.toml` is gitignored. Create it from example:

```powershell
Copy-Item worker/wrangler.toml.example worker/wrangler.toml
```

### 5. Run local dev

Terminal A:

```powershell
npm run dev:worker
```

Terminal B:

```powershell
npm run dev:frontend
```

Open the Vite URL shown in terminal.

## 2) Cloudflare Setup (Production)

### 1. Login

```powershell
npx wrangler login
```

### 2. Create D1 database

```powershell
cd worker
npx wrangler d1 create note-24h-db
```

Copy returned `database_id` into `worker/wrangler.toml`.

### 3. Apply D1 migrations

```powershell
npx wrangler d1 migrations apply note-24h-db --remote
```

### 4. Create/bind R2 bucket

If needed:

```powershell
npx wrangler r2 bucket create note-24h-files
```

### 5. Configure R2 signing credentials

In `worker/wrangler.toml`, set:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_BUCKET_NAME`

Set secret:

```powershell
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

### 6. Configure R2 CORS

For browser multipart PUT requests, set CORS on the bucket to allow your Pages origin (for example `https://<your-pages-domain>`) with methods:

- `PUT`
- `GET`
- `HEAD`

Allow `content-type` header (or `*`).

## 3) Deploy

### Option A: One command

From repo root:

```powershell
npm run deploy:all
```

This script:

1. builds frontend with `VITE_API_BASE`
2. validates worker config
3. deploys worker
4. deploys Cloudflare Pages

Custom deploy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-all.ps1 -ProjectName "note-24h" -ApiBaseUrl "https://<your-worker>.workers.dev"
```

Dry run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-all.ps1 -ApiBaseUrl "https://<your-worker>.workers.dev" -DryRun
```

### Option B: Manual deploy

```powershell
npm run build:frontend
npm --workspace worker run deploy
npx wrangler pages deploy frontend/dist --project-name note-24h
```

Set Pages build variable:

- `VITE_API_BASE=https://<your-worker>.workers.dev`

## 4) Data Model (Current)

Current `notes` table fields:

- `id`
- `room_id`
- `type`
: `text/plain` for text messages, mime type for file messages
- `body`
: text content (text message) or file name (file message)
- `file_key`
: nullable, random R2 object key
- `file_size`
- `created_at`
- `expires_at`

## 5) Upload Flow

Large file upload uses multipart flow:

1. `POST /api/uploads/start`
2. `GET /api/uploads/part-url`
3. browser `PUT` parts directly to signed R2 URLs
4. `POST /api/uploads/complete`
5. `POST /api/uploads/abort` on failure

Default max file size: `1GB` (`MAX_FILE_BYTES=1073741824`).

## 6) Cleanup Strategy

- Worker cron runs every 30 minutes
- Expired rows in D1 are deleted by scheduled job
- R2 lifecycle rules should be configured in Cloudflare dashboard

## Troubleshooting

### `binding DB ... must have a valid database_id`

`database_id` in `worker/wrangler.toml` is missing/placeholder.

### `Missing config: R2_SECRET_ACCESS_KEY`

Set worker secret:

```powershell
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

### Frontend room shows API error immediately

Most common cause: `VITE_API_BASE` points to Pages domain instead of Worker domain.

### Upload fails with CORS/403 on PUT part URL

R2 bucket CORS not configured for Pages origin and `PUT` method.
