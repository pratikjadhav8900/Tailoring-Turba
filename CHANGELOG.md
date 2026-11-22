# Tailoring Turba — Engineering Changelog

All meaningful architectural and functional changes to this repository are documented chronologically in this file. The newest entries appear at the top.

---

## 2026-11-18 — 23:45 IST

### Turba CRM — Added "Closed" Pipeline Stage

Added a 6th stage, `CLOSED`, after `CONVERTED` (migration `20261118150000_add_closed_lead_stage`, purely additive — `ALTER TYPE ... ADD VALUE`, no data remap needed). Represents a deal fully wrapped up after conversion. Doesn't change the "Convert to Customer" trigger (still `CONVERTED`). Dashboard "won"/"qualified" metrics, the overdue-follow-up exclusion, and the per-rep stats on the Settings page now treat `CONVERTED` and `CLOSED` together as `WON_STAGES` (new shared constant in `src/types/crm.ts`) so a lead doesn't drop out of "won" reporting just because it was marked fully closed.

Verified: `tsc`/`eslint` clean, migration applied to the Neon `vercel-dev` branch, live-tested (stage set to Closed, dashboard funnel shows it as its own bucket, still counted in won/qualified totals), all CRM pages return 200.

---

## 2026-11-18 — 23:10 IST

### Turba CRM — Pipeline Simplified to 5 Stages (user-requested)

### What Changed

- Replaced the 12-stage `LeadStage` enum with a lean 5-stage telecalling pipeline, at the user's explicit request: `NEW_LEAD → DNP (Did Not Pick) → INTERESTED → NOT_INTERESTED → CONVERTED`. Migration `20261118140000_simplify_lead_stage_pipeline` remaps existing data (`WON`→`CONVERTED`, `LOST`/`DISQUALIFIED`→`NOT_INTERESTED`, everything else→`INTERESTED`/`DNP`/`NEW_LEAD` as appropriate).
- **Removed the mandatory reason requirement**: moving a lead to `NOT_INTERESTED` no longer blocks on a reason (the Lost Reason modal and its `LOST_REASONS` list were removed from the UI; `Lead.lostReason` stays as an optional column — historical data from before this change is preserved and still displayed).
- "Convert to Customer" now triggers off `status === "CONVERTED"` (previously `WON`).
- Dashboard's "qualified leads" / funnel / conversion-rate metrics recomputed against the new 5 stages (`INTERESTED`+`CONVERTED` counts as "qualified+").
- `/crm/help` content rewritten for the new 5-stage pipeline.
- Lead quality (Hot/Warm/Cold, derived from score) is unchanged — it was already independent of stage.

### Verification

`tsc --noEmit` and `eslint` both clean (0 errors). Migration applied to the Neon `vercel-dev` branch and verified live: data remap confirmed by query (all 7 seeded leads landed on the expected new stage), stage change to `NOT_INTERESTED` with no reason now returns `200` (previously would have been blocked), all CRM pages (`/crm`, `/crm/leads`, `/crm/leads/[id]`, `/crm/tasks`, `/crm/help`, `/crm/settings`) return `200`.

---

## 2026-11-18 — 20:35 IST

### Turba CRM Phase 1 — 12-Stage Pipeline, Tasks, Tags, Advanced Filters

### What Changed

- **Database (Migration `20261118130000_crm_phase1_pipeline_tasks_tags`)**:
  - `Lead.status` migrated from the old flat 8-value `LeadStatus` enum to a new 12-stage `LeadStage` enum matching a standard B2B pipeline: `NEW → ATTEMPTING_CONTACT → CONTACTED → QUALIFIED → REQUIREMENT_CAPTURED → QUOTATION_IN_PROGRESS → QUOTATION_SENT → NEGOTIATION → WON/LOST/NURTURE/DISQUALIFIED`. Existing data remapped (`HOT`→`QUALIFIED`, `JUNK`→`DISQUALIFIED`); "Hot" is no longer a pipeline stage — lead quality (Hot ≥8 / Warm 4–7 / Cold <4) is now derived from `score` everywhere (table, badges, filters, "Hot" tab).
  - `Lead` additions: `productCategory`, `expectedValue`, `lostReason` (now required by the API whenever a lead moves to `LOST`).
  - New `LeadTask` model (+ `LeadTaskType`/`Priority`/`Status` enums) — a distinct entity from `LeadActivity`, matching the activity-vs-task distinction in the spec.
  - New `LeadTag` + `LeadTagAssignment` models for tagging.
- **API**: duplicate detection on lead creation (phone/email match → `409` with the existing lead, `force: true` to proceed anyway); advanced multi-condition filtering on `GET /api/crm/leads` (stage[], source[], quality, owner, date range, min quantity, min expected value, "no activity in N days"); `/api/crm/leads/[id]/tasks`, `/api/crm/leads/[id]/tasks/[taskId]`, `/api/crm/tasks` (cross-lead today/overdue/upcoming/completed views); `/api/crm/tags`, `/api/crm/leads/[id]/tags`; dashboard stats now include a full stage funnel, pipeline/won value, 30-day conversion rate, and task counts.
- **UI**: Manage Leads table gained Stage + Quality (separate badges now), Interested In, Expected Value, Next Follow-up columns and an "Open tasks" indicator; new Advanced Filters slide-over; Lead Detail page restructured into tabs (Overview / Activity / Tasks / Notes / Audit History — Notes and Audit History are filtered views over the same activity log rather than new tables, reusing existing infrastructure); inline tag editor; a Lost Reason modal gates any move to `LOST`; new `/crm/tasks` "Tasks & Follow-ups" page and sidebar entry.

### Explicitly Deferred (see PROJECT_CONTEXT.md for the full phase breakdown)

Opportunities/Quotations, the automation/notification engine, the reporting suite beyond the dashboard funnel, admin-configurable stages (still enum-based, not DB rows), a saved "Smart Views" model (filters are session-only, not persisted), lead merge, CSV import column-mapping wizard, and granular per-field RBAC. Not stubbed — left out of the API/UI entirely so nothing fakes functionality that isn't there.

### Verification

- `npx tsc --noEmit`: 0 errors. `npx eslint` on all CRM files: 0 errors (pre-existing-style `no-explicit-any` warnings only).
- Migration applied to the Neon `vercel-dev` branch (not production) and smoke-tested live: stage data remap verified by query, duplicate detection (`409`), lost-reason enforcement (`400` without reason, `200` with), tag create/assign, task create/list/complete, dashboard funnel — all exercised via curl against the running dev server and all behaved as expected.

---

## 2026-11-18 — 18:00 IST

### Turba CRM — Sales Lead Management (`/crm`)

### What Changed

- **Database Schema (Migration `20261118120000_add_turba_crm`)**:
  - New `Lead` model: contact info, `LeadSource` (`META_ADS`, `GOOGLE_ADS`, `WEBSITE`, `REFERRAL`, `OLD_CUSTOMER_DATA`, `WALK_IN`, `PHONE_INQUIRY`, `WHATSAPP`, `INSTAGRAM`, `OTHER`), `LeadStatus` (`NEW` → `CONTACTED` → `QUALIFIED` → `HOT`/`NEGOTIATION` → `WON`/`LOST`/`JUNK`), 0–10 lead score, favourite flag, assignment, next-follow-up date, and `convertedUserId` linking a won lead to a real `User`.
  - New `LeadActivity` model: timestamped, employee-attributed timeline (calls, notes, WhatsApp, email, meetings, status changes, assignment changes, imports, conversions).
  - `Employee.department` (nullable, additive): set to `SALES` to grant non-admin staff access to `/crm`; `ADMIN`/`SUPER_ADMIN` always have full access, same equal-authority pattern as Turba Ops.
  - `Lead.externalLeadId` + `@@unique([source, externalLeadId])` for idempotent ad-platform webhook intake.
- **Sales Auth (`src/lib/crm/auth.ts`)**: reuses the existing NextAuth + `Employee` record from Turba Ops; `requireCrmAuth()` additionally requires `department === "SALES"` unless the account is `ADMIN`/`SUPER_ADMIN`.
- **API Routes (`src/app/api/crm/*`)**:
  - `leads` (list with tab/status/source/search filters + pagination, create), `leads/[id]` (get/patch/delete), `leads/[id]/activity` (timeline logging), `leads/[id]/convert` (creates/links a real `User` customer record from a won lead), `leads/bulk` (assign/status/favourite/delete for selected rows), `leads/import` (CSV import for the owner's old customer list, no new dependency — hand-rolled RFC4180 parser in `src/lib/crm/csv.ts`), `employees` (sales rep directory for assignment dropdowns), `dashboard/stats`.
  - `webhooks/meta` and `webhooks/google`: functional intake endpoints for Meta Lead Ads (`hub.challenge` verification + Graph API lead fetch) and Google Ads Lead Form webhook delivery (security-key verification). Both need production credentials (`META_WEBHOOK_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN`, `GOOGLE_LEAD_FORM_KEY`) configured in the ad platforms before they'll receive real traffic.
- **UI (`/crm`, coral/orange theme — `src/styles/crm.theme.css` — to stay visually distinct from the emerald Ops station)**:
  - `/crm/login` — sales rep login (same credentials as Ops).
  - `/crm` — dashboard: new/qualified/hot lead counts, 7-day sparkline, overdue follow-ups, won-last-30-days, avg response time, recent leads.
  - `/crm/leads` — LeadSquared/Zoho-style leads table: tabs (All/Favourite/New/Assigned to me/Overdue/Hot), search, Import/Export/Add Lead actions, floating bulk-action bar (assign/status/favourite/delete) on multi-select.
  - `/crm/leads/[id]` — lead detail: contact card, inline status/assignment/score editing, activity timeline with logged calls/notes/WhatsApp/email/meetings, "Convert to Customer" action.
- **Middleware (`src/middleware.ts`)**: added `/crm` path-based auth guard (session + staff role), mirroring the existing `/ops` gate.

### Why

Sales reps need a single place to work leads coming from Meta/Google ad campaigns alongside the owner's old customer list, with leads that convert cleanly into real `User`/`Order` records rather than living in a disconnected system.

### Verification

- `npx tsc --noEmit`: 0 errors.
- `npx eslint` on all new CRM files: 0 errors (pre-existing-style `no-explicit-any` warnings only, consistent with the rest of the codebase).
- Migration SQL written by hand (matches Prisma's generated format) since no local `DATABASE_URL` was available in this environment; **not yet applied to any database** — run `npx prisma migrate deploy` against a real `DATABASE_URL` before going live, and set an `Employee.department = "SALES"` for each sales rep.

---

## 2026-10-19 — 19:50 IST

### Turba Ops Feature Expansion — Account, Settings, Help Center & Team Chat

### What Changed

- **Staff Account & Identity Module (`/ops/account`)**:
  - Implemented `src/app/ops/account/page.tsx` and `src/app/api/ops/account/route.ts`.
  - Displays authenticated employee details, employee code (`TT001`–`TT005`), role title, and system role.
  - Summarizes real-time operational statistics (active in-flight tasks, completed stages, authored notes).
  - Provides editable contact information (phone, display name) with validation and instant synchronization.
  - Lists live assigned tasks with priority tags, item quantities, and direct links to inspect orders.
  - Highlights the Equal Operational Authority policy across all 5 team members with transparent audit trails.
- **Workstation Settings & Preferences (`/ops/settings`)**:
  - Implemented `src/app/ops/settings/page.tsx`.
  - Configures audio chimes with volume slider and interactive "Test Chime" synthesizer.
  - Customizes notification triggers (New Orders, Urgent/Rush 24h/48h Orders, QC Rework Flagged, Ready for Dispatch).
  - Workstation floor defaults: Table vs. Kanban pipeline view, and My Tasks vs. All Floor Tasks.
  - Streamlined UI strictly focused on operator preferences without developer diagnostics.
- **Manufacturing Help Center & SOP Rulebook (`/ops/help`)**:
  - Implemented `src/app/ops/help/page.tsx`.
  - Interactive 11-stage manufacturing pipeline stepper detailing entrance conditions, station responsibilities, and mandatory exit gates.
  - Step-by-step QC rework guide: defect flagging, audit notes, iteration incrementing, and rollback targeting.
  - Priority matrix rules (Normal vs. Urgent 48h vs. Rush 24h).
  - Internal escalation directory with direct call links for all 5 team members.
- **Floor Team Broadcast & Real-Time Chat (`/ops/chat`)**:
  - Implemented `src/app/ops/chat/page.tsx` and `src/app/api/ops/chat/route.ts`.
  - Four internal production channels: `#general-floor`, `#urgent-alerts`, `#order-queries`, `#dispatch-handover`.
  - Real-time message feed with employee code badges, role titles, and order tagging (`#1048`).
  - Priority broadcasting for `URGENT FLOOR ALERT` and `OFFICIAL ANNOUNCEMENT`.
  - Multi-user presence directory showing online status for all 5 team members.
- **Sidebar Integration (`src/components/ops/layout/OpsSidebar.tsx`)**:
  - Wired up all 4 routes (`/ops/chat`, `/ops/account`, `/ops/settings`, `/ops/help`) with active emerald pill styling.
  - Auto-cleared placeholder fallback counts and enabled live notifications badge.

---

## 2026-10-08 — 20:30 IST

### Turba Ops Phase 3 — Integration, Subdomain Routing & QA

**Commit:**
`090bac6`

### What Changed

- **Subdomain Routing (`ops.tailoringturba.com`)**:
  - Enhanced `src/middleware.ts` to inspect incoming hostnames (`ops.tailoringturba.com`, `ops.localhost`, `ops-*`).
  - Rewrites public ops paths into the internal `/ops` route directory (`/` -> `/ops`, `/orders` -> `/ops/orders`, `/orders/[id]` -> `/ops/orders/[id]`).
  - Rewrites `/login` to `/ops/login` on the ops domain.
  - Ensures API routes (`/api/*`) pass directly through without modification.
  - Enforces authentication: unauthenticated users accessing protected Ops routes on `ops.tailoringturba.com` are safely redirected to `/login` (which rewrites to `/ops/login`).
  - Protects the public customer platform (`tailoringturba.com`) from any routing disruption, maintaining normal customer authentication, cart, and checkout flows.
- **Layout & Storefront Isolation**:
  - Updated `src/app/LayoutWrapper.tsx` with dynamic hostname detection (`window.location.hostname.startsWith("ops.") || window.location.hostname.startsWith("ops-")`).
  - Completely hides customer navigation, marquee ticker, footer, WhatsApp floating button, Turba AI launcher, Turba AI modal, and mobile navigation bar when on the Ops domain or `/ops` routes.
- **Equal Operational Authority Model**:
  - Verified and confirmed that all 5 employees hold equal operational authority across all manufacturing stages.
  - Explicitly rephrased "Supervisor Override" in `StageActionModal.tsx` and `src/lib/ops/workflow.ts` to "Workflow Sequencing Override (Equal Authority — Requires Audit Reason)".
  - Confirmed no restrictive RBAC or hidden manager roles exist; audit accountability is recorded via employee identity, timestamps, previous stage, new stage, and mandatory override reason.
- **Historical Orders Backward Compatibility**:
  - Confirmed that `opsStage`, `orderSource`, and `dueDate` remain nullable in all queries and components.
  - Historical customer orders created prior to Turba Ops render with initial status and display clean empty/fallback badges without runtime exceptions.
- **Customer Order Creation Source Tracking**:
  - Confirmed `src/app/api/razorpay/order/route.ts` explicitly assigns `opsStage: "NEW_ORDER"` and tags `orderSource: "WEBSITE"` or `orderSource: "TURBA_AI"`.
  - Confirmed `src/app/api/razorpay/verify/route.ts` advances `NEW_ORDER` to `ORDER_CONFIRMED` upon payment capture, creates initial stage execution, and emits an Ops notification without altering historical orders with null `opsStage`.
- **SSR / Static Build Optimization**:
  - Wrapped `useSearchParams()` consumers in `<Suspense>` boundaries across `src/app/ops/login/page.tsx`, `src/app/ops/orders/page.tsx`, `src/app/ops/page.tsx`, and `src/components/ops/layout/OpsSidebar.tsx` to resolve Next.js 14 CSR bailout requirements during static generation.

### Why

- To integrate the Turba Ops manufacturing platform with production subdomain routing, verify system stability, enforce the equal authority model, and validate that the public storefront and ops portal both operate with complete isolation.

### Files / Areas Affected

- `src/middleware.ts`
- `src/app/LayoutWrapper.tsx`
- `src/app/ops/login/page.tsx`
- `src/app/ops/orders/page.tsx`
- `src/app/ops/page.tsx`
- `src/components/ops/layout/OpsSidebar.tsx`
- `src/components/ops/stages/StageActionModal.tsx`
- `src/lib/ops/workflow.ts`
- `PROJECT_CONTEXT.md`
- `CHANGELOG.md`

### Testing & Verification Results

- **TypeScript Compilation**: `npx tsc --noEmit` — **PASS** (0 errors)
- **Automated Test Suite**: `npx vitest run` — **PASS** (81/81 tests passed across 6 test suites)
- **Production Build**: `npm run build` (`node scripts/build.js`) — **PASS** (55/55 static and dynamic pages generated successfully, Exit Code: 0)
- **HTTP Routing Checks (Node.js test suite)**:
  - `http://localhost:3000/` (Host: `tailoringturba.com`) -> **200 OK**
  - `http://localhost:3000/products` (Host: `tailoringturba.com`) -> **200 OK**
  - `http://localhost:3000/ops/login` (Host: `tailoringturba.com`) -> **200 OK**
  - `http://localhost:3000/ops` (Host: `tailoringturba.com`, Unauth) -> **307 Redirect** to `/ops/login?callbackUrl=%2Fops`
  - `http://localhost:3000/` (Host: `ops.tailoringturba.com`, Unauth) -> **307 Redirect** to `/login?callbackUrl=%2F`
  - `http://localhost:3000/login` (Host: `ops.tailoringturba.com`) -> **200 OK** (Rewritten internally to `/ops/login`)
  - `http://localhost:3000/orders` (Host: `ops.tailoringturba.com`, Unauth) -> **307 Redirect** to `/login?callbackUrl=%2Forders`

### Deployment Status

Code pushed to origin/main; production deployment triggered/awaiting verification.

### Current Status

`Completed & Released` (Turba Ops V1 integration verified, committed, and pushed to origin/main).

---

## 2026-10-08 — 19:38 IST

### Turba Ops Phase 2: Parallel UI Implementation (App Shell, Orders, Kanban, Single Source of Truth Order Detail, Activity & Notifications)

**Commit:**
`Pending`

### What Changed

- **Agent 2 (UI / App Shell / Theme / Login)**:
  - Created `src/styles/ops.theme.css`: Clean, production-focused design system tokens, high-density table formatting, and dark surface palette.
  - Created reusable UI primitives in `src/components/ops/ui/*` (`OpsBadge`, `OpsButton`, `OpsCard`, `OpsEmptyState`, `OpsLoadingState`).
  - Created responsive shell in `src/components/ops/layout/*` (`OpsSidebar`, `OpsHeader`, `OpsLayout`) with active employee identity display, fast search shortcut, and notification bell trigger.
  - Implemented employee authentication UI in `src/app/ops/login/page.tsx`, directly authenticating via NextAuth credentials.
  - Built the manufacturing operations dashboard in `src/app/ops/page.tsx` with live KPI stats, stage breakdown matrix, and active jobs list.
- **Agent 3 (Orders / Kanban / Single Source of Truth Order Detail)**:
  - Built the Orders Directory in `src/app/ops/orders/page.tsx` supporting multi-parameter search, stage/priority filters, pagination, and instantaneous view toggling between tabular list and 11-stage Kanban board.
  - Built the production Kanban board in `src/components/ops/kanban/OpsKanbanBoard.tsx` covering all 11 stages (`NEW_ORDER` through `CLOSED`) without a fake rework column (rework is represented via `FLAGGED_REWORK` status badge).
  - Built the **Single Source of Truth Order Detail Page** in `src/app/ops/orders/[id]/page.tsx` combining:
    - Customer information & shipping address.
    - Garment product specifications and Cutting Size Breakdown matrix (e.g. S, M, L, XL, XXL).
    - Front, back, and sleeve mockups with high-resolution print files and download links.
    - Bigship Logistics card (Courier partner, AWB tracking, and shipping label download).
    - Inline editable priority selector and target due date picker.
  - Built production stage action modals in `src/components/ops/stages/*` (`StageProgressBar`, `StageActionModal`, `ReworkModal`, `ResourceAllocationModal`).
- **Agent 4 (Activity / Notes / Notifications)**:
  - Built `src/components/ops/notes/InternalNotesPanel.tsx`: Internal team notes with pinning support.
  - Built `src/components/ops/activity/ActivityTimeline.tsx`: Chronological accountability feed detailing WHO, WHAT, WHEN, and WHY.
  - Built `src/components/ops/notifications/NotificationDrawer.tsx`: Slide-over notification drawer with employee-specific unread state tracking (`readBy: String[]`) and "Mark All Read" action.
- **Storefront Isolation & Routing**:
  - Updated `src/app/LayoutWrapper.tsx` to completely suppress customer navbar, footer, WhatsApp floating button, Turba AI chat modal, and compare tray on `/ops/*` routes.
  - Updated `src/middleware.ts` to redirect unauthenticated requests on `/ops/*` to `/ops/login`.

### Why

- To fulfill Phase 2 requirements of the Turba Ops project, delivering an intuitive, high-density, production-ready internal tool for the 5-person Tailoring Turba team without disrupting public customer traffic on `tailoringturba.com`.

### Files / Areas Affected

- `src/styles/ops.theme.css`
- `src/components/ops/ui/OpsBadge.tsx`
- `src/components/ops/ui/OpsButton.tsx`
- `src/components/ops/ui/OpsCard.tsx`
- `src/components/ops/ui/OpsEmptyState.tsx`
- `src/components/ops/ui/OpsLoadingState.tsx`
- `src/components/ops/layout/OpsSidebar.tsx`
- `src/components/ops/layout/OpsHeader.tsx`
- `src/components/ops/layout/OpsLayout.tsx`
- `src/components/ops/notifications/NotificationDrawer.tsx`
- `src/components/ops/notes/InternalNotesPanel.tsx`
- `src/components/ops/activity/ActivityTimeline.tsx`
- `src/components/ops/stages/StageProgressBar.tsx`
- `src/components/ops/stages/StageActionModal.tsx`
- `src/components/ops/stages/ReworkModal.tsx`
- `src/components/ops/stages/ResourceAllocationModal.tsx`
- `src/components/ops/kanban/OpsKanbanBoard.tsx`
- `src/app/ops/layout.tsx`
- `src/app/ops/page.tsx`
- `src/app/ops/login/page.tsx`
- `src/app/ops/orders/page.tsx`
- `src/app/ops/orders/[id]/page.tsx`
- `src/app/LayoutWrapper.tsx`
- `src/middleware.ts`
- `PROJECT_CONTEXT.md`
- `CHANGELOG.md`

### Testing

- `npx tsc --noEmit` — PASS (0 TypeScript errors across the entire application)
- `npx vitest run` — PASS (All 6 test files, 81/81 tests passed)
- HTTP Verification `/ops/login` — PASS (Status: 200 OK)
- HTTP Verification Public Storefront `/` — PASS (Status: 200 OK)

### Current Status

`Completed` (Phase 2 UI implementation complete and verified).

### Next Steps

- Await user review and authorization before proceeding to Phase 3 (Domain routing for `ops.tailoringturba.com`, production deployment preparation, and final QA pass).

---

## 2026-10-08 — 19:24 IST

### Turba Ops Phase 1: Migration Deployment, Shared Contracts & Core APIs

**Commit:**
`Pending`

### What Changed

- Deployed migration `20261008190000_add_turba_ops` to the Neon PostgreSQL database via `npx prisma migrate deploy`.
- Generated updated Prisma Client (v5.22.0) with all new models (`Employee`, `ProductionStageExecution`, `InternalOrderNote`, `OpsNotification`) and enums (`OpsProductionStage`, `OpsStageStatus`, `Role.EMPLOYEE`, `EventActorRole.EMPLOYEE`).
- Created shared TypeScript contracts in `src/types/ops.ts`.
- Implemented authenticated employee session resolver in `src/lib/ops/auth.ts`, linking NextAuth user sessions to active `Employee` profiles and auto-provisioning management profiles.
- Implemented production stage workflow state machine and validation engine in `src/lib/ops/workflow.ts` (enforcing sequential forward progress, controlled rework return loops, and override validation).
- Implemented core Turba Ops Route Handlers:
  - `GET /api/ops/auth/session`: Authenticated employee session info.
  - `GET /api/ops/dashboard/stats`: Production dashboard statistics (active orders, stage counts, due soon, rework count).
  - `GET /api/ops/orders`: Search, filter by stage/priority, and paginate orders.
  - `POST /api/ops/orders`: Manual order creation explicitly setting `opsStage: "NEW_ORDER"` and `orderSource: "MANUAL_OPS"`.
  - `GET /api/ops/orders/[id]`: Single source of truth order detail (customer, specs, size breakdown, print files, executions, notes, timeline).
  - `PATCH /api/ops/orders/[id]`: Update order settings (due date, priority) with audit logging.
  - `POST /api/ops/orders/[id]/stage`: Controlled stage transition and rework loop.
  - `POST /api/ops/orders/[id]/resource`: Record fabric allocation, batch number, meters, and trims.
  - `GET / POST /api/ops/orders/[id]/notes`: Internal employee notes with pin support.
  - `GET /api/ops/orders/[id]/activity`: Unified activity timeline and stage execution history.
  - `GET / POST /api/ops/notifications`: Team notifications with per-employee read state tracking.
- Updated customer order creation (`src/app/api/razorpay/order/route.ts` and `src/app/api/razorpay/verify/route.ts`) so new orders explicitly receive `opsStage: "NEW_ORDER"` and `orderSource: "WEBSITE"` / `"TURBA_AI"`, leaving historical orders untouched as `NULL`.
- Created unit tests in `src/__tests__/ops-workflow.test.ts` for workflow transitions and rework logic.

### Why

- To execute Phase 1 of Turba Ops, establishing the backend contracts, data structures, and APIs required for parallel UI development (Agents 2, 3, and 4) without data conflicts.
- To enforce equal operational authority across all 5 team members while guaranteeing absolute accountability on every mutation.

### Files / Areas Affected

- `prisma/migrations/20261008190000_add_turba_ops/migration.sql`
- `src/types/ops.ts`
- `src/lib/ops/auth.ts`
- `src/lib/ops/workflow.ts`
- `src/app/api/ops/auth/session/route.ts`
- `src/app/api/ops/dashboard/stats/route.ts`
- `src/app/api/ops/orders/route.ts`
- `src/app/api/ops/orders/[id]/route.ts`
- `src/app/api/ops/orders/[id]/stage/route.ts`
- `src/app/api/ops/orders/[id]/resource/route.ts`
- `src/app/api/ops/orders/[id]/notes/route.ts`
- `src/app/api/ops/orders/[id]/activity/route.ts`
- `src/app/api/ops/notifications/route.ts`
- `src/app/api/razorpay/order/route.ts`
- `src/app/api/razorpay/verify/route.ts`
- `src/__tests__/ops-workflow.test.ts`
- `PROJECT_CONTEXT.md`
- `CHANGELOG.md`

### Database Changes

- Applied migration `20261008190000_add_turba_ops` via `npx prisma migrate deploy`.
- Verified 0 historical orders were modified or given defaults.

### API Changes

- Added `/api/ops/*` suite (11 route operations).
- Updated `/api/razorpay/order` and `/api/razorpay/verify` to tag new orders.

### Testing

- `npx prisma migrate deploy` — PASS (All migrations successfully applied)
- `npx prisma generate` — PASS (Client v5.22.0 generated in 446ms)
- `npx tsc --noEmit` — PASS (0 TypeScript errors)
- `npx vitest run src/__tests__/ops-workflow.test.ts` — PASS (6/6 tests passed)
- `npx vitest run` — PASS (All 6 test files, 81/81 tests passed)

### Current Status

`Completed` (Phase 1 backend foundation is live, verified, and ready for parallel UI work).

### Next Steps

- Phase 2 (Agent 2): Ops App Shell, design system theme (`src/styles/ops.theme.css`), reusable components, and login interface (`/ops/login`).
- Phase 2 (Agent 3): Single Source of Truth Order detail page (`/ops/orders/[id]`), Kanban board, and stage execution UI.
- Phase 2 (Agent 4): Internal notes panel, activity timeline, and notification center.
- Phase 3 (Agent 5): Next.js subdomain middleware routing for `ops.tailoringturba.com` and end-to-end integration QA.

---

## 2026-10-08 — 19:10 IST

### Turba Ops Schema Architecture & Additive Migration Preparation

**Commit:**
`Pending`

### What Changed

- Prepared the Prisma schema extension for **Turba Ops** (`ops.tailoringturba.com`) in `prisma/schema.prisma`.
- Created the additive migration SQL file `prisma/migrations/20261008190000_add_turba_ops/migration.sql`.
- Added new models: `Employee`, `ProductionStageExecution`, `InternalOrderNote`, `OpsNotification`.
- Extended the `Order` model with purely additive, nullable fields: `opsStage`, `dueDate`, `orderSource`, and `priority`.
- Added `EMPLOYEE` to the `Role` and `EventActorRole` enums.
- Added production stage enums: `OpsProductionStage` and `OpsStageStatus`.
- Established `PROJECT_CONTEXT.md` and `CHANGELOG.md` as permanent repository engineering memory infrastructure.

### Why

- To build **Turba Ops**, an internal production management web application for the 5-person Tailoring Turba team to track orders from receipt through cutting, stitching, printing, QC, packing, and dispatch.
- To guarantee that existing production customer orders remain 100% unaffected (no default values retroactively converting historical orders into new production jobs).
- To establish a safe, reviewed migration process that completely avoids dangerous `npx prisma db push` commands against production.

### Files / Areas Affected

- `prisma/schema.prisma`
- `prisma/migrations/20261008190000_add_turba_ops/migration.sql`
- `PROJECT_CONTEXT.md`
- `CHANGELOG.md`

### Database Changes

- **Models Added**:
  - `Employee` (Staff profile linked 1-to-1 to `User`)
  - `ProductionStageExecution` (Audit record for each stage attempt, including rework iterations)
  - `InternalOrderNote` (Internal team communication on orders)
  - `OpsNotification` (Broadcast alerts with per-employee read state tracking)
- **Fields Added to Existing `Order` Table**:
  - `opsStage`: `OpsProductionStage?` (Nullable, NO default)
  - `dueDate`: `DateTime?` (Nullable, NO default)
  - `priority`: `String? @default("NORMAL")`
  - `orderSource`: `String?` (Nullable, NO default)
- **Enums Changed / Created**:
  - `Role`: Appended `EMPLOYEE`
  - `EventActorRole`: Appended `EMPLOYEE`
  - `OpsProductionStage`: Created (`NEW_ORDER`, `ORDER_CONFIRMED`, `RESOURCE_FABRIC`, `CUTTING`, `STITCHING`, `BRANDING_PRINTING`, `QUALITY_CHECK`, `PACKING`, `READY_FOR_DISPATCH`, `DISPATCHED`, `CLOSED`)
  - `OpsStageStatus`: Created (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FLAGGED_REWORK`)
- **Migration Name**: `20261008190000_add_turba_ops`
- **Whether Existing Records Were Affected**: No historical records were modified or reclassified. All added columns are nullable or have safe defaults. Destructive drop statements were audited and excluded.
- **Migration Deployment Status**: **REVIEWED / NOT DEPLOYED** (Pending explicit authorization).

### API Changes

`None` (Scheduled for Phase 1).

### UI Changes

`None` (Scheduled for Phase 2).

### Bug Fixes

`None`

### Important Decisions

- **Zero Historical Default**: `opsStage` and `orderSource` are intentionally nullable without defaults so existing historical orders in Neon PostgreSQL do not appear as active Turba Ops jobs or assumed website checkouts.
- **Rework Model Simplification**: Rework is modeled as a status condition (`OpsStageStatus.FLAGGED_REWORK`), not as an independent production stage. Rework events return the order to previous stages (`BRANDING_PRINTING`, `STITCHING`, `CUTTING`, `RESOURCE_FABRIC`) with an incremented iteration count and audit rationale.
- **Equal 5-Employee Operational Authority**: No restrictive RBAC for V1; all 5 team members have equal permissions to update stages. Accountability is enforced via employee session logging on every action.
- **Safe Migration Execution**: Generated SQL was audited using `prisma migrate diff` to ensure zero `DROP TABLE`, `DROP COLUMN`, or `DROP CONSTRAINT` statements.

### Testing

- `npx prisma validate` — PASS (Prisma schema valid and formatted)
- `npx prisma migrate status` — PASS (Detected pending unapplied migration `20261008190000_add_turba_ops`)
- Codebase audit for `Role` and `EventActorRole` — PASS (Confirmed adding `EMPLOYEE` causes zero regressions in admin authorization checks)

### Current Status

`In Progress` (Database architecture prepared and reviewed; migration awaiting deployment authorization).

### Next Steps

1. Await user authorization to deploy migration `20261008190000_add_turba_ops`.
2. Run `npx prisma generate` to refresh client types.
3. Implement `src/types/ops.ts` shared contracts.
4. Build core Ops API endpoints under `src/app/api/ops/*`.
