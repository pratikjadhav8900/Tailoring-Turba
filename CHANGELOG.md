# Tailoring Turba — Engineering Changelog

All meaningful architectural and functional changes to this repository are documented chronologically in this file. The newest entries appear at the top.

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
