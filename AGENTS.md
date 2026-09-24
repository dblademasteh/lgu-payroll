# LGU Payroll — Agent Guide

## Commands
- Frontend dev: `cd frontend && npm run dev` → http://localhost:5176
- Frontend build must pass: `cd frontend && npm run build` (only real "verify" gate)
- Backend dev: `cd backend && npm run dev` → http://localhost:4101
- Backend prod start: `cd backend && npm run start` (node src/server.js)
- Syntax-check backend fast: `cd backend && node --check src/routes/<name>.js` (no boot needed)
- DB up: `docker compose up -d db` (dead DB container = 500s on login; publishes **5441**)
- Prisma migrate: `cd backend && npx prisma migrate dev`
- Prisma generate: stop backend watch first, then `cd backend && npx prisma generate`
- Seed: `cd backend && node prisma/seed.js` after migrate (idempotent: 6 users per role + 6 departments + 6 employees + 8 deductions + 16 PH holidays)
- No ESLint/typecheck/test runner — verify with `npm run build` + `node --check` + color lint
- Color lint: `Get-ChildItem frontend/src -Recurse -Include *.jsx,*.js | Select-String -Pattern '#[0-9a-fA-F]{3,8}\b|slate-|gray-|bg-white|text-white'`
- npm lifecycle-script gate: `npm install-scripts approve bcrypt prisma @prisma/engines @prisma/client` then `npm install` (bcrypt node-gyp + prisma engines need them)

## Purpose & Integration
- Payroll management & reporting system; shares stack with LGU-HRMS/LGU-Attendance (Express 5, React 19, Vite 5, Tailwind 4, Prisma/PostgreSQL 16)
- **Optional** HRMS/Attendance integration: same webhook + polling pattern as Attendance; HRMS pushes `employee.*` + `leave.*`, Attendance pulls punches via external API; configured in Settings > Integration (AES-GCM encrypted secrets, hot-reload via `getHrmsConfig()`)
- **Payroll supplies data to HRMS**: `POST /api/v1/payroll/changes` (Bearer API key, scope `payroll:read`, mounted before JWT-gated `/payroll`) is pulled by HRMS `payrollAdapter.sync()` with `{ since }` and returns `{records:[{entity,action,payload}]}` events (`period`/`run`/`record` ids in `externalId`, source statuses DRAFT|PROCESSING|APPROVED|COMPLETED, CANCELLED omitted). Service: `services/payrollChangesService.js`; HRMS upserts `PayrollPeriod` (by name) → `PayrollRun` (by externalId) → `PayrollItem`/`Payslip` (by externalId) keyed to HRMS employees by `employeeNumber`.
- Standalone by default: seed provides full demo dataset (employees, departments, deductions, holidays) — works offline

## Architecture
- Frontend: React 19 + Vite 5 plain JS, Tailwind 4 design tokens in `frontend/src/index.css` (mirrors lgu-hrms/attendance), no hardcoded colors
- Backend: Express 5 ESM, port **4101**, Prisma Postgres **5441**, JWT access ~15m + refresh rotation (`typ: 'refresh'` claim)
- Payroll core: `PayrollRun` (period YYYY-MM, status DRAFT→PROCESSING→APPROVED→COMPLETED) → `PayrollRecord` per employee (gross, deductions, tax, net) → `Payslip` (generated from completed runs)
- Deductions: 4 types (GOVERNMENT, TAX, LOAN, OTHER) × 3 amount types (FIXED, PERCENTAGE, TABLE) × 3 bases (GROSS, TAXABLE, NET); seeded SSS/PhilHealth/Pag-IBIG/Withholding/Loans/Union/Coop
- Manila-day logic: dates stored UTC, displayed Asia/Manila; PH holidays in `Holiday` table (2025 seeded)

## Auth & RBAC
- JWT verified by `backend/src/middleware/auth.js` `requireAuth`; mounted globally after `/auth` + `/external` + `/webhooks/hrms` in `routes/index.js`
- Role gating: single `requireRole()` in `middleware/rbac.js` — do not re-add a copy in auth.js
- Roles: ADMIN > HR_MANAGER > PAYROLL_MANAGER > DEPARTMENT_HEAD > AUDITOR > VIEWER
  - Payroll writes: ADMIN/HR_MANAGER/PAYROLL_MANAGER
  - Employees/Departments writes: ADMIN/HR_MANAGER
  - Reports: ADMIN/HR_MANAGER/PAYROLL_MANAGER/DEPARTMENT_HEAD/AUDITOR
  - Settings (self): all roles; Integration: ADMIN/HR_MANAGER only
- Frontend mirrors it: `Protected roles={...}` in `App.jsx` + role-filtered `Sidebar.jsx` groups
- Audit middleware `middleware/audit.js` writes append-only `AuditLog` on mutating requests (global mount only, before/after snapshots, failed attempts logged, secrets redacted via `redact()`)

## Validation (Zod)
- `middleware/validate.js` handles body+params+query; query uses `defineProperty` (Express 5 getter)
- Contracts live in `backend/src/shared/contracts/`: auth, employees, payroll, departments, reports, leave, settings, apiKeys
- Webhook signature verified against **raw body** (`req.rawBody` captured in `server.js` json `verify`) BEFORE contract parses
- Dates = `YYYY-MM-DD` regex, coerced to UTC in services, never `new Date(raw)`

## Conventions
- Frontend changes preserve design tokens; zero hardcoded colors (`bg-white`, `text-white`, `slate-`, `gray-` forbidden)
- Toasts: `const toast = useToast()` + `toast('msg','type')` — never `const { push } = useToast()`
- ConfirmDialog props: `message|confirmLabel|danger` — never `description|confirmText|variant`
- One concern per file: routes = HTTP + validation, repositories = queries, services/controllers = business logic; keep routes thin
- All mutating endpoints must write AuditLog (exactly once — global mount only, no per-route duplicates)
- Soft delete via `deletedAt` (employee revival on rehire handled in `employeeService`)
- API-key raw values shown once at creation; sha256 at rest; never log keys (audit snapshots redact `key`)
- Ports: backend 4101, frontend 5176, db 5441 — kept clear of lgu-hrms (4000/5173/5432) and lgu-attendance (4100/5174/5440); storage key `lgu-payroll-auth`, theme key `lgu-payroll-theme`

## Do / Don't
**Do:**
- Wire to the API layer first and verify the component actually calls it; reuse `frontend/src/api/*` modules
- Reuse existing components (`StatCard`, `Modal`, `ConfirmDialog`, `Badge`, `EmptyState`, `useToast`) before writing new markup
- Use Prisma Decimal for money, YYYY-MM-DD + UTC for dates, Zod for all external input
- Toast every user action, confirm destructive actions, keep one `.btn-primary` per view, preserve design tokens
- Verify with `npm run build` + `node --check` + color lint before finishing; commit per unit with conventional messages (`feat|fix|chore|polish|refactor|docs`)

**Don't:**
- Don't ship mocks or hardcoded workflows (demo data is seeded into the DB)
- Don't swallow errors, don't leak stack traces/DB internals, don't log secrets or tokens
- Don't bypass RBAC or the audit trail; don't hardcode colors/spacing/font sizes
- Don't introduce a second styling system (no CSS-in-JS, no UI kit), no decorative animation
- Don't run duplicate dev watchers (file locks break prisma generate on Windows)