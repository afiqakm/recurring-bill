# Recurring Bill App

Next.js App Router app with Turso (libSQL) for:

- `items` (deduplicated recurring bill names)
- `transactions` (row-level CSV records)
- `categories` (dedicated category table)

## Environment

Copy `.env.example` to `.env.local`:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `APP_USERNAME`
- `APP_PASSWORD`
- `AUTH_SECRET`

`AUTH_SECRET` signs the session cookie used after login.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:migrate`

## Setup

1. `npm install`
2. Create `.env.local`
3. `npm run db:migrate`
4. `npm run dev`
5. Open `/login` and sign in

## Database Migrations

- `migrations/001_init.sql` -> `items`
- `migrations/002_transactions.sql` -> `transactions`
- `migrations/003_categories.sql` -> `categories`

Migrations are idempotent and safe to rerun.

## Pages

- `/login` -> username/password login
- `/` -> items page
- `/transactions` -> transaction listing page
- `/categories` -> category listing page
- `/import` -> CSV import page

## Auth

- Session-based auth with HTTP-only cookie (`rb_session`)
- Login endpoint verifies `APP_USERNAME` / `APP_PASSWORD`
- Data APIs require authenticated session

Auth APIs:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## CSV Import

Import endpoint: `POST /api/import` (`multipart/form-data`)

- Sample mode: `source=sample`
- Upload mode: `source=upload` + `file=<csv>`

Sample path used by server:

- `samples/normalized_with_categories.csv`
- fallback: `sample/normalized_with_categories.csv`

CSV expectations:

- required: `name`
- transaction fields: `month`, `amount`
- optional: `category`, `dueday`/`due_day`, `paid`

## API

- `GET /api/items`
- `POST /api/items`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`
- `GET /api/transactions`
- `GET /api/categories`
- `POST /api/import`
- `POST /api/admin/migrate`

## Deploy

1. Deploy to Vercel (or another Node host).
2. Set all environment variables above.
3. Run migrations once (`npm run db:migrate`).
