# LGU Payroll — Payroll Management & Reporting System

On-premise payroll workspace for LGU personnel — salary computation, deductions, government contributions, and BIR reports in one place, synced with LGU-HRMS/LGU-Attendance.

## Tech Stack (mirrors LGU-Attendance)

- **Frontend**: React 19 + Vite 5, Tailwind 4, plain JS (no TypeScript), React Router 6, Zustand, Lucide React
- **Backend**: Express 5 (ESM), Prisma ORM, PostgreSQL 16, JWT access (15m) + refresh rotation (7d), bcrypt, Zod validation
- **Database**: PostgreSQL on port 5441 (Docker), Prisma migrations
- **Ports**: Backend 4101, Frontend 5175, Database 5441

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL)
- npm 9+

### Development

1. **Start the database:**
   ```bash
   docker compose up -d db
   ```

2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your JWT_SECRET
   ```

4. **Run migrations & seed:**
   ```bash
   cd backend && npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start dev servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

6. **Open http://localhost:5175**

### Demo Accounts
All passwords are `admin123`:
- `admin` — Full system access
- `hr_manager` — HR & payroll oversight
- `payroll_manager` — Payroll processing
- `dept_head` — Department reports
- `auditor` — Read-only reports
- `viewer` — Self-service only

## Project Structure

```
lgu-payroll/
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, Header, UI components
│   │   ├── pages/          # Dashboard, Payroll, Payslips, Deductions, Employees, Departments, Reports, Settings
│   │   ├── stores/         # Zustand auth store
│   │   ├── hooks/          # useToast, etc.
│   │   ├── api/            # Axios client + API modules
│   │   ├── lib/            # Roles, theme, utilities
│   │   ├── App.jsx         # Routes + Protected wrapper
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Design tokens + component classes
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/         # Express routes (auth, employees, payroll, deductions, etc.)
│   │   ├── middleware/     # Auth, RBAC, audit, rate-limit, validation
│   │   ├── lib/            # Prisma, errors, secrets (AES-GCM encryption)
│   │   ├── shared/contracts/ # Zod schemas
│   │   └── server.js       # Express app entry
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Demo data
│   └── package.json
└── docker-compose.yml
```

## Key Features

### Payroll Runs
- Create payroll periods (YYYY-MM format)
- Process: computes gross, deductions (SSS, PhilHealth, Pag-IBIG, tax, loans), net pay
- Approve → Complete workflow with audit trail
- Department cost analysis

### Deductions
- Government (SSS, PhilHealth, Pag-IBIG)
- Tax (BIR withholding table)
- Loans (SSS, Pag-IBIG)
- Other (Union, Cooperative)
- Fixed amount, percentage, or tax table

### Payslips
- Generate from completed payroll runs
- Distribute individually or in bulk
- PDF generation ready (to be implemented)

### Reports
- Payroll Summary
- Payslip Register
- Deductions Summary
- Government Contributions (remittance reports)
- Tax Withholding (BIR 1601-C/2316 data)
- Department Cost Analysis
- Overtime Report
- Leave Liability
- Year-End (13th Month, 2316)

### Employees & Departments
- Full CRUD with soft delete
- Department budgets and headcount
- Role-based access (ADMIN/HR_MANAGER for writes)

### Settings
- Appearance: dark/light theme, font scale, UI scale
- Notifications: in-app toggles per category
- Security: password change, session management
- HRMS Integration: base URL, API key, webhook secret (AES-GCM encrypted)
- System: data export/import, cache clearing

## RBAC

| Role | Payroll | Payslips | Deductions | Employees | Departments | Reports | Settings |
|------|---------|----------|------------|-----------|-------------|---------|----------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| HR_MANAGER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PAYROLL_MANAGER | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| DEPARTMENT_HEAD | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| AUDITOR | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (self) |

## Design System

Same token system as LGU-HRMS/LGU-Attendance:
- Light: bg `#f4f6fb`, surface `#ffffff`, accent `#1d4ed8`
- Dark: bg `#0b1120`, surface `#111a2e`, accent `#60a5fa`
- Fonts: Inter Variable (UI), Sora Variable (display), JetBrains Mono Variable (mono)
- Components: `.btn`, `.input`, `.card`, `.badge`, `.data-table`, `.sidebar-link`, `.modal-*`, `.toast`, `.tab`, `.dropdown-*`, `.skeleton`

## Production Build

```bash
cd frontend && npm run build
cd ../backend && npm run start
```

## License

LGU Internal Use Only — Data Privacy Act (RA 10173) Compliant