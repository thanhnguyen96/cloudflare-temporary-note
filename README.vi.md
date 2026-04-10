# note-24h (Hướng dẫn tiếng Việt)

Ứng dụng chia sẻ ghi chú/tệp theo room trên Cloudflare. Dữ liệu tự hết hạn sau 24 giờ.

- Bản tiếng Anh: [README.md](./README.md)

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Cloudflare Workers
- Lưu trữ: D1 (metadata) + R2 (file)

## Chức năng chính

- Vào room bằng chuỗi bất kỳ hoặc URL
- Gửi tin nhắn dạng chat
- Upload file lớn bằng multipart upload
- Tự động xóa dữ liệu sau 24h
- Hỗ trợ dark/light mode, responsive, VI/EN

## Cấu trúc dự án

```text
note-24h/
├─ frontend/
│  ├─ src/
│  │  ├─ app/                # App shell + router
│  │  ├─ components/         # UI components
│  │  ├─ hooks/              # React hooks
│  │  ├─ lib/                # API client, room utils, i18n
│  │  └─ styles/             # SCSS (BEM + 7-1)
│  ├─ .env.example
│  └─ package.json
├─ worker/
│  ├─ src/
│  │  ├─ handlers/           # Xử lý route API
│  │  ├─ jobs/               # Job cron cleanup
│  │  ├─ lib/                # Helper HTTP/R2/constants
│  │  ├─ services/           # Logic thao tác D1
│  │  └─ worker.ts           # Entry + router
│  ├─ migrations/            # D1 migrations
│  ├─ wrangler.toml.example
│  ├─ .dev.vars.example
│  └─ package.json
├─ scripts/
│  └─ deploy-all.ps1         # Build + deploy worker + pages
├─ package.json              # Scripts workspace
└─ README.vi.md
```

## 1) Setup local

### Bước 1: Cài dependencies

```powershell
npm install
```

### Bước 2: Tạo file env cho frontend

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

Giá trị mặc định:

```env
VITE_API_BASE=http://127.0.0.1:8787
```

### Bước 3: Tạo file env local cho worker

```powershell
Copy-Item worker/.dev.vars.example worker/.dev.vars
```

Điền giá trị thật trong `worker/.dev.vars` nếu muốn test multipart upload local.

### Bước 4: Tạo `wrangler.toml` từ file mẫu

`worker/wrangler.toml` đã được đưa vào `.gitignore`, nên cần tạo thủ công:

```powershell
Copy-Item worker/wrangler.toml.example worker/wrangler.toml
```

### Bước 5: Chạy local

Terminal A:

```powershell
npm run dev:worker
```

Terminal B:

```powershell
npm run dev:frontend
```

Mở URL Vite được in ra terminal.

## 2) Setup Cloudflare production

### Bước 1: Login

```powershell
npx wrangler login
```

### Bước 2: Tạo D1

```powershell
cd worker
npx wrangler d1 create note-24h-db
```

Copy `database_id` và dán vào `worker/wrangler.toml`.

### Bước 3: Apply migrations

```powershell
npx wrangler d1 migrations apply note-24h-db --remote
```

### Bước 4: Tạo/bind R2 bucket

Nếu chưa có bucket:

```powershell
npx wrangler r2 bucket create note-24h-files
```

### Bước 5: Cấu hình biến R2 cho Worker

Trong `worker/wrangler.toml`, điền:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_BUCKET_NAME`

Set secret:

```powershell
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

### Bước 6: Cấu hình CORS cho R2

Cần CORS để browser upload part trực tiếp lên R2. Cho phép origin Pages (ví dụ `https://<your-pages-domain>`) và methods:

- `PUT`
- `GET`
- `HEAD`

Header cho phép: `content-type` (hoặc `*`).

## 3) Deploy

### Cách A: 1 lệnh

Tại root:

```powershell
npm run deploy:all
```

Script sẽ:

1. build frontend với `VITE_API_BASE`
2. validate config worker
3. deploy worker
4. deploy pages

Deploy custom:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-all.ps1 -ProjectName "note-24h" -ApiBaseUrl "https://<worker>.workers.dev"
```

Dry run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-all.ps1 -ApiBaseUrl "https://<worker>.workers.dev" -DryRun
```

### Cách B: Manual

```powershell
npm run build:frontend
npm --workspace worker run deploy
npx wrangler pages deploy frontend/dist --project-name note-24h
```

Trên Pages, set biến build:

- `VITE_API_BASE=https://<worker>.workers.dev`

## 4) Cấu trúc dữ liệu hiện tại (D1)

Bảng `notes` hiện gồm:

- `id`
- `room_id`
- `type`
: `text/plain` cho text, mime type cho file
- `body`
: nội dung text hoặc tên file
- `file_key`
: nullable, key random của object trong R2
- `file_size`
- `created_at`
- `expires_at`

## 5) Luồng upload file lớn

1. `POST /api/uploads/start`
2. `GET /api/uploads/part-url`
3. browser `PUT` từng chunk lên signed URL của R2
4. `POST /api/uploads/complete`
5. lỗi thì `POST /api/uploads/abort`

Giới hạn mặc định: `1GB` (`MAX_FILE_BYTES=1073741824`).

## 6) Cleanup dữ liệu

- Worker cron chạy mỗi 30 phút
- Xóa record hết hạn trong D1
- R2 lifecycle bạn tự cấu hình trên dashboard Cloudflare

## Troubleshooting nhanh

### Lỗi `binding DB ... must have a valid database_id`

`database_id` trong `worker/wrangler.toml` chưa điền đúng.

### Lỗi `Missing config: R2_SECRET_ACCESS_KEY`

Chưa set secret cho worker:

```powershell
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

### Vào room thấy lỗi API ngay

Thường do `VITE_API_BASE` đang trỏ nhầm về Pages domain thay vì Worker domain.

### Upload lỗi CORS/403

CORS bucket R2 chưa cho origin Pages + method `PUT`.
