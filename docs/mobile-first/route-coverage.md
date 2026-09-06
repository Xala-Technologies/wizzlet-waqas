# Route coverage (Wave 1)

Status: `PASS` | `FAIL` | `NOT_RUN` | `NOT_APPLICABLE` | `IN_PROGRESS`

Evidence: source review + browser where noted. Physical device = `NOT_RUN`.

| Route | Role | Layout | Critical actions | Mobile (360) | Desktop (1440) | Notes |
|-------|------|--------|------------------|--------------|----------------|-------|
| `/` | public | landing | CTA, nav | NOT_RUN | NOT_RUN | Wave 1 verify |
| `/login` | public | auth | sign in | NOT_RUN | NOT_RUN | |
| `/signup` | public | auth | sign up | NOT_RUN | NOT_RUN | |
| `/creators` | public | landing | search, apply | NOT_RUN | NOT_RUN | recent polish |
| `/network` | public | landing | apply | NOT_RUN | NOT_RUN | |
| `/todays-events` | public | landing | browse | NOT_RUN | NOT_RUN | |
| `/dashboard` | member | DashboardLayout | feed | NOT_RUN | NOT_RUN | shell fix |
| `/dashboard/results` | member | DashboardLayout | tracker CRUD | FAIL | PASS | Wave 1 target |
| `/dashboard/subscriptions-billing` | member | DashboardLayout | cancel/sub | NOT_RUN | NOT_RUN | |
| `/dashboard/discover` | member | DashboardLayout | search | FAIL | PASS | toolbar min-width |
| `/creator` | creator | DashboardLayout | overview | NOT_RUN | NOT_RUN | shell fix |
| `/creator/performance-tracker` | creator | DashboardLayout | picks CRUD | FAIL | PASS | Wave 1 target |
| `/creator/onboarding` | creator | bare | exit, launch | PASS | PASS | recent fix |
| `/admin` | admin | DashboardLayout | KPIs | NOT_RUN | NOT_RUN | |
| `/admin/transactions` | admin | DashboardLayout | filter/export | FAIL | PASS | Wave 1 target |
| `/c/:username` via `/:username` | public | profile | subscribe | NOT_RUN | NOT_RUN | |
| Demo routes | none | demo shells | presentation | NOT_RUN | NOT_RUN | Wave 2+ |

## Layout families

| Family | Shell files | Breakpoint |
|--------|-------------|------------|
| landing | Navbar, Footer | nav `lg` |
| DashboardLayout | MobileTopBar, *Sidebar | drawer `<md` |
| auth / onboarding | centered max-w-md | stacked |
| demo | DemoAdminLayout / DemoMemberShell | mirror dash `md` |
