# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
composer run dev          # Start Laravel serve + Queue worker + Vite dev (concurrently)
composer run dev:ssr      # Same but with Reverb WebSocket server included
```

### Build & Formatting

```bash
npm run build             # Vite production build
npm run build:ssr         # SSR build
npm run lint              # ESLint with auto-fix
npm run format            # Prettier formatting
npm run format:check      # Check formatting without writing
npm run types             # TypeScript type-check (no emit)
```

### Testing

```bash
composer run test         # Clears config cache, then runs Pest test suite
php artisan test --filter=TestName  # Run a single test
```

### PHP

```bash
./vendor/bin/pint         # PHP code formatter (Laravel Pint)
php artisan migrate       # Run database migrations
php artisan db:seed       # Run seeders
```

## Architecture

Pondshare is a **Laravel 12 + React 19 + Inertia.js** monolith. The frontend and backend are tightly coupled via Inertia — there is no separate API; controllers return Inertia responses that render React page components.

### Request Flow

```
Browser → Nginx → Laravel (routes/*.php → Controllers) → Inertia → React Pages
```

Real-time updates (file upload progress, notifications) flow through **Laravel Reverb** (WebSocket server), proxied at `/app` by Nginx on port 8081.

### Backend (`app/`)

- **Controllers** (`app/Http/Controllers/`) — thin controllers; main domain objects are `PondController`, `PondFileController`, `ShareLinkController`, `ExternalUploadLinkController`, `BinController`
- **Models** (`app/Models/`) — `User`, `Pond`, `File`, `ShareLink`, `ExternalUploadLink`, `FileScan`, `Role`, `AllowedEmailDomain`, `PondDailyDownload`, `SystemSetting`
- **Jobs** (`app/Jobs/`) — async queue jobs: `ScanFileWithClamAV` (virus scan on upload), `DeletePondFiles`, `UpdateClamavSignatureCache`
- **Services** (`app/Services/ClamAVService.php`) — ClamAV virus scan integration
- **Policies** (`app/Policies/`) — Laravel authorization policies used throughout controllers

### Routes (`routes/`)

Split across multiple files loaded in `bootstrap/app.php`:
- `web.php` — main catch-all and dashboard
- `ponds.php` — pond CRUD
- `bin.php` — deleted-file recovery
- `settings.php` — user/system settings
- `auth.php` — Fortify auth routes
- `channels.php` — Reverb broadcast channel authorization

### Frontend (`resources/js/`)

- **Pages** (`pages/`) — Inertia page components; mirrors route structure: `auth/`, `ponds/`, `dashboard/`, `bin/`, `isolated/` (external upload links)
- **Components** (`components/`) — shared UI; `components/ui/` is shadcn/ui (do not edit generated files manually, use the shadcn CLI)
- **Layouts** (`layouts/`) — page shell layouts
- **Hooks** (`hooks/`) — custom React hooks
- Path alias `@/` maps to `resources/js/` (configured in `tsconfig.json` and `vite.config.ts`)

### Key Technical Details

- **Auth**: Laravel Fortify (2FA, password reset) + Socialite with Microsoft Azure OAuth; `AllowedEmailDomain` model whitelists Azure SSO domains
- **File storage**: Laravel filesystem; files scanned by ClamAV asynchronously after upload via queue job; `FileScan` model tracks scan results
- **Database**: SQLite locally, MySQL 8.0 in production (set in `.env`)
- **Queue**: `database` driver; worker runs with `--tries=3 --sleep=3`
- **Styling**: Tailwind CSS v4, 4-space indentation, single quotes (see `.prettierrc`), `tailwindcss/prettier-plugin-tailwindcss` for class sorting
- **UI components**: shadcn/ui with `neutral` base color and Lucide icons; component aliases configured in `components.json`

### Docker (Production)

7-service compose stack: `app` (PHP-FPM), `nginx`, `queue` (worker), `reverb` (WebSocket), `mysql`, `clamav`, `init` (runs migrations/seeds on startup). The `docker/entrypoint.sh` handles first-run setup automatically.
