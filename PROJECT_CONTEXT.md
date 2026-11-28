# Tailoring Turba — Project Context

## Last Updated
- Date: 2026-11-28
- Timezone: IST
- Current Branch: feature/sales-crm
- Latest Commit: (pending — pre-redesign audit/cleanup + CRM cross-department task handoff + bulk email campaigns + WhatsApp broadcasting, not yet committed)

---

## Project Overview

Tailoring Turba is an end-to-end custom apparel manufacturing and B2B/B2C direct-to-consumer e-commerce platform. It provides high-quality garment tailoring, custom printing (DTF, screen printing, embroidery), interactive 3D/2D visual customizers, and automated production fulfillment. 

The application is expanding to include **Turba Ops** (`ops.tailoringturba.com`), an internal production and order operations management system for the 5-person Tailoring Turba manufacturing team to manage custom orders from intake through cutting, stitching, branding, QC, packing, and dispatch.

It also now includes **Turba CRM** (`/crm`), an internal LeadSquared/Zoho-style sales lead management system for the Tailoring Turba sales team: leads sourced from Meta Ads, Google Ads, and the owner's old customer list are worked through a pipeline (New → Contacted → Qualified → Hot/Negotiation → Won/Lost) and a won lead converts directly into a real `User` customer record.

---

## Current Architecture

- **Frontend Framework**: Next.js 14.2.35 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS + CSS Modules + Lucide React icons
- **State Management**: React Context + Hooks (`src/contexts/*`) — `zustand` is a declared dependency but is not imported anywhere in the codebase
- **Backend / API**: Next.js App Router Route Handlers (`src/app/api/*`)
- **Database**: PostgreSQL hosted on Neon Database (`ep-winter-base-awcv21vu-pooler.c-12.us-east-1.aws.neon.tech`)
- **ORM**: Prisma 5.22.0 (`@prisma/client`, plain `PrismaClient` — `@prisma/adapter-neon`/`@neondatabase/serverless` are declared dependencies but not wired up anywhere; `src/lib/prisma.ts` connects directly via `DATABASE_URL`)
- **Authentication**: NextAuth.js v5 beta (`@auth/prisma-adapter`, JWT session strategy) supporting Email/Password (bcryptjs), Phone OTP, Google OAuth, and Apple Sign-In
- **File & Media Storage**: Cloudinary (mockups, print assets, logos)
- **Payments**: Razorpay (standard orders, split 50/50 payments, balance payments, webhooks)
- **Shipping & Logistics**: Bigship Courier Integration (`api.bigship.direct`), AWB tracking, shipment labels/manifests
- **AI Systems**: Turba AI Concierge powered by Google Gemini (`@google/genai` v2.27.0) for conversational ordering and product recommendations
- **Hosting**: Vercel (Edge network, Serverless Node.js runtime)
- **Domains & Routing**:
  - `tailoringturba.com` — Public customer platform
  - `ops.tailoringturba.com` — Internal operations platform (rewritten via Next.js middleware to `/ops/*`)

---

## Application Structure

### 1. `tailoringturba.com` (Customer Facing — Production Active)
- **Landing & Catalog**: Home, category browsing, product detail pages (`/products`, `/tt-luxe`, `/catalogue`)
- **Customizer / Design Studio**: Interactive 2D garment customizer (`/customizer`), sleeve/front/back print placements, mobile photo upload via QR (`/customizer/upload-phone`)
- **Turba AI**: Conversational shopping assistant floating modal & launcher (`TurbaAiChatModal`, `TurbaAiLauncher`, `/api/ai/chat`)
- **Cart & Checkout**: Multi-item cart, custom size breakdowns (S, M, L, XL, XXL, etc.), full payment or 50% split advance via Razorpay (`/cart`, `/checkout`)
- **Customer Account & Tracking**: User dashboard (`/dashboard`), order tracking (`/track-order`, `/api/orders/track-public`), order feedback (`/feedback`), appointment booking (`/booking`)
- **Admin Portal**: Backoffice portal (`/admin`) for product catalog management, job postings, customer inquiries, and legacy order tracking

### 2. `/crm` (Internal Sales Team — Phase 1 Implemented)
LeadSquared-style sales CRM, built in-repo (not a separate app) so leads convert directly into real `User`/`Order` records. Implementation follows an explicit phase plan (full spec: a 28-section "Manage Leads" brief modeled on LeadSquared, delivered 2026-11-18):
- **Phase 1 (Core Lead Management) — Done**: lead quality (Hot/Warm/Cold) derived from score rather than conflated with stage, advanced multi-condition filters, duplicate detection on create, Tasks module (distinct from Activities), Tags, audit trail (reuses the activity log, filtered — no separate audit table), dashboard sales funnel.
- **Pipeline (`LeadStage`) — simplified 2026-11-18 per explicit user request**: a 6-stage telecalling pipeline `NEW_LEAD → DNP (Did Not Pick) → INTERESTED → NOT_INTERESTED → CONVERTED → CLOSED` (migrations `20261118140000_simplify_lead_stage_pipeline` + `20261118150000_add_closed_lead_stage`), replacing an initial 12-stage B2B pipeline that was built first and then deliberately cut down. `CONVERTED` is what unlocks "Convert to Customer" (previously `WON`); `CLOSED` is a terminal stage after conversion (order fully wrapped up) and is grouped with `CONVERTED` under `WON_STAGES` (`src/types/crm.ts`) for all "won"/"qualified" reporting. Moving to `NOT_INTERESTED` does **not** require a reason (`Lead.lostReason` stays as an optional, non-blocking column).
- **Phase 2a (Cross-department task handoff, attachments, targeted notifications) — Done (2026-11-28)**: a `LeadTask` can now be assigned to **any active employee**, not just Sales reps (e.g. a BDA handing a `SEND_QUOTATION` task to an Accounts employee who has no `/crm` access at all). Completing a `SEND_QUOTATION` task requires an uploaded file first (Cloudinary-backed `LeadTask.attachments: String[]` — never local disk, which silently loses files on Vercel). The assignee is notified when the task is created and the requester is notified when it's completed, via two new **targeted** notification types (`CRM_TASK_ASSIGNED`/`CRM_TASK_COMPLETED`) on the existing `OpsNotification` table — unlike Ops's broadcast notifications, these are visible only to the one addressed employee (see `isCrmTaskNotificationRelevant` in `src/lib/crm/tasks.ts`), independent of the worker/management split. Surfaces in a new CRM notification bell (`/api/crm/notifications`) for Sales/Admin staff, and in a new `/ops/sales-tasks` page for employees who can't access `/crm`.
- **Phase 2b (Bulk/promotional email campaigns) — Done (2026-11-28)**: `/crm/campaigns` — compose an HTML email, pick an audience (Leads filtered by stage/source, and/or all existing customers), see a live recipient count, then send immediately or save as a draft to send later. Built on the existing Resend integration (`RESEND_API_KEY`) rather than a new vendor: each campaign resolves its own audience from `Lead`/`User`, syncs those people into a one-off Resend Segment (Resend's global-Contacts model — see `src/lib/crm/campaigns.ts`), and sends via a Resend Broadcast targeting that segment. Resend's own per-contact `unsubscribed` flag handles suppression automatically going forward (no separate opt-out field needed on `Lead`/`User`); every campaign's HTML must include the `{{{RESEND_UNSUBSCRIBE_URL}}}` tag (enforced server-side) before it can send. New `EmailCampaign` table is the CRM's own send-history/audit trail (who sent what, to how many, from which filter) — Resend's own broadcast record doesn't carry that.
- **Phase 2c (WhatsApp broadcasting) — Done (2026-11-28)**: `/crm/whatsapp` — a template-based broadcast to a filtered list of leads, via Meta's WhatsApp Cloud API directly (no BSP). Business-initiated WhatsApp messages MUST use a pre-approved template (no free-text bulk send is possible on WhatsApp at all — this is a Meta/WhatsApp platform rule, not a limitation of this build); the composer lists only APPROVED templates fetched live from the Graph API and lets a rep fill in `{{1}}`/`{{2}}`... body variables (literal text, or "use the lead's name" for basic per-recipient personalization). There is no bulk-send endpoint on Meta's side either, so sending is batched: the first ~40 recipients send synchronously when the broadcast is created, a "Send more now" button on the broadcast detail page lets a rep continue a larger list on demand, and a daily Vercel Cron (`vercel.json`, new file — none existed before) is the safety net for anything left over — sized for Vercel's **Hobby-plan cron limit of once/day** (a per-minute cron would fail to deploy on Hobby), not a real-time queue. A delivery-status webhook (`/api/crm/webhooks/whatsapp`, same HMAC pattern as the Lead Ads webhook) updates each recipient to DELIVERED/READ/FAILED as Meta reports it. New `Lead.whatsappOptOut` flag (toggle on the Lead Detail page) is the CRM's own consent tracking — WhatsApp, unlike Resend email, has **no platform-level unsubscribe/suppression list**, so this is the only thing standing between a careless rep and a real risk of the business's WhatsApp number getting banned for unsolicited messaging.
- **Phase 2d (full Opportunities/Quotations module, automation engine, deep reporting, admin-configurable stages, Smart Views persistence, lead merge, import column-mapping wizard, granular RBAC) — Not started.** These are substantial enough to need their own sessions; nothing in the UI fakes them.
- **App Shell & Theme**: Coral/orange design system (`src/styles/crm.theme.css`) mirroring the Ops station's structure but visually distinct
- **CRM Authentication**: Reuses NextAuth + `Employee` records from Turba Ops (`/crm/login`); requires `Employee.department === "SALES"` unless `ADMIN`/`SUPER_ADMIN`
- **Dashboard** (`/crm`): new/qualified/hot lead counts, 7-day new-lead sparkline, overdue follow-ups, won/lost last 30 days + conversion rate, pipeline value, won value, avg response time, full stage funnel, overdue/due-today task counts
- **Leads Pipeline** (`/crm/leads`): tabbed table (All/Favourite/New/Assigned to me/Overdue/Hot) + Advanced Filters drawer (stage/source/quality/owner/date range/min quantity/min expected value/no-activity-in-N-days), search, CSV import (old customer list), CSV export, multi-select bulk actions (assign/status/favourite/delete)
- **Lead Detail** (`/crm/leads/[id]`): contact card, inline stage/assignment/score/follow-up editing, tag editor, tabs for Overview / Activity / Tasks / Notes / Audit History, one-click "Convert to Customer" (shown once a lead is Converted)
- **Tasks & Follow-ups** (`/crm/tasks`): cross-lead task list (Today/Overdue/Upcoming/Completed), filterable by sales rep
- **Ad Platform Intake**: `/api/crm/webhooks/meta` and `/api/crm/webhooks/google` — functional but need production credentials (`META_WEBHOOK_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN`, `GOOGLE_LEAD_FORM_KEY`) configured in Meta/Google Ads before real leads will land

### 3. `ops.tailoringturba.com` (Internal Team — Under Implementation)
- **App Shell & Theme**: Clean, low-latency, density-focused UI inspired by Go GST Bill's information hierarchy with modern components
- **Ops Authentication**: Unified NextAuth login using employee credentials (`/ops/login`), resolving the authenticated `Employee` record
- **Operations Dashboard**: Active order counts by stage, urgent alerts, due-date warnings (`/ops/dashboard`)
- **Orders Directory & Kanban**: Dual-view production list and kanban board (`/ops/orders`)
- **Single Source of Truth Order Detail**: Complete manufacturing order view combining customer info, product specs, size breakdowns, print files, stage history, internal notes, activity timeline, QC, and dispatch details (`/ops/orders/[id]`)
- **Controlled Production Workflow**: Strict stage progression with rework iteration tracking
- **Team Activity & Notes**: Timestamped employee audit logs and internal communications (`InternalOrderNote`, `OrderTimelineEvent`)
- **Team Notifications**: Global broadcast alerts with employee-specific read state tracking (`OpsNotification`)

---

## Database Architecture

### Existing Production Models (Unchanged & Preserved)
- `User`: Customers, Admins, Super Admins, and Employees (`id`, `name`, `email`, `role`, `phone`, `password`, `companyName`, `gstNumber`)
- `Order`: Core order entity (`id`, `orderNumber` autoincrement integer e.g. 1048, `userId`, `totalAmount`, `status`, `amountPaid`, `remainingAmount`, `shippingAddressId`, `bigshipTrackingId`, etc.)
- `OrderItem`: Products in order (`id`, `orderId`, `productId`, `quantity`, `price`, `customStateJson` with size counts & customization details, `printFiles`, `mockupUrl`, `mockupUrlBack`, `mockupUrlLeft`, `mockupUrlRight`)
- `Product`: Catalog garments (`id`, `name`, `basePrice`, `fabric`, `gsm`, `fit`, `sizes`, `colorsJson`)
- `OrderTimelineEvent`: Customer & admin event logging (`orderId`, `eventType`, `title`, `actorName`, `actorRole`, `isCustomerVisible`, `metadata`)
- `Shipment`: Bigship package records (`orderId`, `awbNumber`, `courierName`, `status`, `labelUrl`, `manifestUrl`)
- `PaymentTransaction`: Payment records for Razorpay capture, split balance, and manual transfers
- `Address`: Shipping and billing addresses

### Turba Ops Schema Additions (Successfully Deployed in Migration `20261008190000_add_turba_ops`)
- **`Order` Extensions (Purely Additive & Nullable)**:
  - `opsStage`: `OpsProductionStage?` (Nullable with **NO default**; existing historical orders remain `NULL`)
  - `dueDate`: `DateTime?` (Explicitly set/overridden by admin/operator; no hardcoded day assumption)
  - `priority`: `String? @default("NORMAL")` (`NORMAL`, `URGENT`, `RUSH`)
  - `orderSource`: `String?` (Nullable with **NO default**; new orders set `WEBSITE`, `TURBA_AI`, or `MANUAL_OPS`)
- **`Employee`**:
  - Internal staff profile (`id`, `employeeCode` unique, `name`, `email` unique, `phone`, `roleTitle`, `isActive`, `userId` unique 1-to-1 link to `User`)
- **`ProductionStageExecution`**:
  - Granular stage execution record (`id`, `orderId`, `stage`, `status`, `iteration`, `employeeId`, `employeeName`, `notes`, `metadata`, `attachments`, `startedAt`, `completedAt`)
- **`InternalOrderNote`**:
  - Employee internal communication (`id`, `orderId`, `employeeId`, `employeeName`, `note`, `isPinned`, `createdAt`)
- **`OpsNotification`**:
  - Broadcast notification (`id`, `orderId`, `orderNumber`, `type`, `title`, `message`, `actorName`, `readBy` string array of employee IDs, `metadata`, `createdAt`)
- **Enums**:
  - `Role`: Appended `EMPLOYEE`
  - `EventActorRole`: Appended `EMPLOYEE`
  - `OpsProductionStage`: `NEW_ORDER`, `ORDER_CONFIRMED`, `RESOURCE_FABRIC`, `CUTTING`, `STITCHING`, `BRANDING_PRINTING`, `QUALITY_CHECK`, `PACKING`, `READY_FOR_DISPATCH`, `DISPATCHED`, `CLOSED`
  - `OpsStageStatus`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FLAGGED_REWORK`

### Turba CRM Schema Additions (Migrations `20261118120000_add_turba_crm` + `20261118130000_crm_phase1_pipeline_tasks_tags` + `20261118140000_simplify_lead_stage_pipeline` + `20261118150000_add_closed_lead_stage` + `20261128120000_add_crm_task_attachments` + `20261128130000_add_email_campaigns` + `20261128140000_add_whatsapp_broadcasting`. The first four are applied and smoke-tested on the Neon `vercel-dev` branch; **none are yet applied to the `production` branch**. The last three (task attachments, email campaigns, WhatsApp broadcasting) are written and the Prisma client regenerated against them, but as of this session **not yet applied to any database** — the user approved running `prisma migrate deploy` against the dev branch, but every attempt from this sandbox was blocked (either `P1001` — no network path to Neon at all — or, once connectivity briefly returned, the auto-mode permission classifier itself denying the command each time it's invoked, regardless of the earlier approval in conversation). Run `npx prisma migrate deploy` against the dev branch first, then production, before relying on `LeadTask.attachments`, `EmailCampaign`, or any `WhatsAppBroadcast*` model anywhere)
- **`Employee` Extension (Purely Additive & Nullable)**:
  - `department`: `String?` — set to `"SALES"` to grant a non-admin employee `/crm` access
- **`Lead`**:
  - Contact fields (`name`, `email`, `phone`, `companyName`, `city`), `source` (`LeadSource`), `sourceDetail`, `externalLeadId` (ad-platform id, unique per source for webhook idempotency), `status` (`LeadStatus`), `score` (0–10), `isFavourite`, `requirements`, `quantity`, `notes`, `assignedToId`/`createdById` (→ `Employee`), `convertedUserId` (→ `User`, unique, set when a lead becomes a real customer), `nextFollowUpAt`, `lastContactedAt`
- **`LeadActivity`**:
  - Timeline entries (`type`: `NOTE`/`CALL`/`EMAIL`/`WHATSAPP`/`MEETING`/`STATUS_CHANGE`/`ASSIGNED`/`FOLLOW_UP`/`IMPORTED`/`CONVERTED`), `note`, `employeeId`/`employeeName`, `metadata`
- **`LeadTask`**: distinct from `LeadActivity` — actionable follow-ups (`type`: `FOLLOW_UP_CALL`/`SEND_QUOTATION`/`SEND_WHATSAPP`/`SEND_EMAIL`/`SCHEDULE_MEETING`/`REQUIREMENT_COLLECTION`/`PRICE_NEGOTIATION`/`SAMPLE_FOLLOW_UP`/`PAYMENT_FOLLOW_UP`/`ORDER_CONFIRMATION`/`CUSTOM`), `priority`, `status`, `dueAt`, `assignedToId`/`createdById` (→ `Employee`, **any active employee** — not department-restricted, so a task can be handed to another team), `completionNotes`/`completedAt`, `attachments` (`String[]`, Cloudinary URLs, added 2026-11-28 — completing a `SEND_QUOTATION` task requires at least one)
- **`LeadTag` / `LeadTagAssignment`**: free-form tagging, many-to-many via join table
- **`EmailCampaign`** (added 2026-11-28): bulk/promotional email send record — `name`, `subject`, `bodyHtml`, `audienceFilter` (Json, the Lead stage/source + customers filter used), `recipientCount`, `resendSegmentId`/`resendBroadcastId` (the Resend-side objects it created), `status` (`DRAFT`/`SENDING`/`SENT`/`FAILED`), `errorMessage`, `createdById` (→ `Employee`), `sentAt`
- **`WhatsAppBroadcast` / `WhatsAppBroadcastRecipient`** (added 2026-11-28): a template-based WhatsApp send and its per-recipient rows. Broadcast: `templateName`/`templateLanguage`/`templateCategory`, `variables` (Json `string[]` for `{{1}},{{2}}`..., a literal or the `"{{lead_name}}"` personalization token), `audienceFilter`, `recipientCount`, `status` (`SENDING`/`SENT`/`PARTIAL`/`FAILED`), `createdById` (→ `Employee`). Recipient: `leadId` (→ `Lead`, nullable), `name`, `phone` (E.164), `status` (`PENDING`/`SENT`/`DELIVERED`/`READ`/`FAILED`), `waMessageId` (Meta's message id, correlates delivery-status webhooks back to a row)
- **`Lead.whatsappOptOut`** (added 2026-11-28): `Boolean @default(false)` — the CRM's own WhatsApp consent flag (WhatsApp has no platform-level suppression list the way Resend does for email), toggled on the Lead Detail page, always excluded from broadcast audiences
- **Enums**: `LeadSource` (`META_ADS`, `GOOGLE_ADS`, `WEBSITE`, `REFERRAL`, `OLD_CUSTOMER_DATA`, `WALK_IN`, `PHONE_INQUIRY`, `WHATSAPP`, `INSTAGRAM`, `OTHER`), `LeadStage` (`NEW_LEAD`, `DNP`, `INTERESTED`, `NOT_INTERESTED`, `CONVERTED`, `CLOSED` — see Pipeline note above), `LeadActivityType`, `LeadTaskType`, `LeadTaskPriority`, `LeadTaskStatus`, `EmailCampaignStatus`, `WhatsAppBroadcastStatus`, `WhatsAppRecipientStatus`

---

## Authentication & Authorization

- **Underlying Auth Engine**: NextAuth.js v5 beta JWT strategy (`src/lib/auth.ts`, `src/lib/auth.config.ts`)
- **User Roles**: `USER` (customer), `ADMIN` (founder/manager), `SUPER_ADMIN`, and `EMPLOYEE` (Turba Ops staff)
- **Employee Session Resolution**:
  - Employee logs in using their own credentials (`/ops/login` or `/login`).
  - NextAuth authenticates against `User` and attaches the user ID & role to the JWT session token.
  - Ops routes resolve the associated `Employee` record by querying `prisma.employee.findUnique({ where: { userId } })`.
- **Operational Authority in V1**:
  - **All 5 team members have equal operational authority.**
  - No restrictive RBAC in V1 (any employee can advance stages, request rework, record fabric notes, or dispatch).
  - `roleTitle` is strictly informational for display, badges, and communication.
  - **Strict Accountability**: Every single action records the executing employee's ID, name, and timestamp. Browser-provided employee IDs are never trusted directly.

---

## Turba Ops Production Workflow

### Standard Production Pipeline:
1. `NEW_ORDER` — Order received from website, Turba AI, or manual entry.
2. `ORDER_CONFIRMED` — Order specifications, sizing, payment terms, and artwork verified.
3. `RESOURCE_FABRIC` — Raw fabric rolls, thread, trims, and accessories allocated.
4. `CUTTING` — Fabric patterns cut according to size breakdown.
5. `STITCHING` — Garment assembled and stitched.
6. `BRANDING_PRINTING` — Printing (DTF, screen) or embroidery applied.
7. `QUALITY_CHECK` — Garment inspection, measurement check, and defect evaluation.
8. `PACKING` — Ironing, tagging, folding, poly-packing, and box packaging.
9. `READY_FOR_DISPATCH` — Packed parcel weighed, dimensions recorded, courier booking requested.
10. `DISPATCHED` — Handed over to courier, AWB generated, tracking active.
11. `CLOSED` — Delivery confirmed by customer or courier.

### Controlled Rework Loop:
- Rework is **NOT** a standalone linear production stage. It is represented as a condition via `OpsStageStatus.FLAGGED_REWORK`.
- When an order fails Quality Check:
  1. The stage status becomes `FLAGGED_REWORK`.
  2. The employee selects the defective stage (`BRANDING_PRINTING`, `STITCHING`, `CUTTING`, or `RESOURCE_FABRIC`) and enters the required rework rationale and defect photos.
  3. The order returns to that stage with an incremented `iteration` count.
  4. Once reworked and completed, the flow returns directly to `QUALITY_CHECK`.
- Arbitrary skipping (e.g. `CUTTING` directly to `DISPATCHED`) is blocked by default and requires explicit override authorization and rationale.

---

## Important Architecture Decisions

1. **Reusing Existing User & NextAuth System**: Rather than creating a separate authentication database for employees, employees have standard `User` accounts linked 1-to-1 to an `Employee` profile. This preserves edge-compatible NextAuth middleware and avoids auth fragmentation.
2. **Nullable `opsStage` & `orderSource` (Zero Historical Default)**: Historical customer orders must NOT be automatically turned into new Ops production jobs or assumed to be website checkouts. They remain `NULL` until intentionally backfilled or operated upon.
3. **Equal Operational Authority for 5-Person Team in V1**: Building complex role-permission matrices (e.g., locking cutting from stitchers) would slow down a lean 5-person factory team. Accountability is achieved by logging employee identity on every action rather than locking actions.
4. **Decoupled Turba AI**: Turba AI is an order creation channel, not a dependency of Turba Ops. Orders from Website, Turba AI, and manual Ops all converge into the canonical `Order` model.
5. **Per-Employee Notification Read State**: Team notifications are broadcast globally, but read tracking uses an array of employee IDs (`readBy: String[]`) so each employee has their own unread badges without creating 5 rows per event.
6. **Delivery Date Calculation**: Delivery due dates are explicitly set or overridden by the order/admin. The system does not assume a rigid 4–7 business day rule; initial placeholders adapt from `src/lib/delivery.ts` based on quantity tier.
7. **Strict Migration Review (No Blind DB Push)**: Production order and customer data is critical. `npx prisma db push` is forbidden on production. All changes must be reviewed as plain SQL migrations.
8. **Subdomain Isolation**: `ops.tailoringturba.com` is isolated via Next.js middleware and `LayoutWrapper.tsx` so the public customer platform at `tailoringturba.com` experiences zero visual or functional disruption.

---

## Current Features

- ✅ Responsive Customer E-commerce Storefront (`tailoringturba.com`)
- ✅ 2D Garment Customizer with Multi-View Mockups (Front, Back, Left, Right)
- ✅ Size Breakdown Sync (S, M, L, XL, XXL) with Dynamic Quantities in Customizer
- ✅ Turba AI Chat Concierge with Gemini API Integration
- ✅ Split 50/50 Payments & Razorpay Payment Webhooks
- ✅ Bigship Logistics API Integration (AWB Generation, Manifest, Tracking)
- ✅ Admin Dashboard for Product Catalog and Inquiry Management
- ✅ Turba Ops Database Migration (`20261008190000_add_turba_ops` — Successfully Deployed)
- ✅ Turba Ops Prisma Client Generation (v5.22.0)
- ✅ Turba Ops Shared TypeScript Contracts (`src/types/ops.ts`)
- ✅ Turba Ops Authenticated Employee Session Resolver (`src/lib/ops/auth.ts`)
- ✅ Turba Ops Workflow State Machine & Validation Engine (`src/lib/ops/workflow.ts`)
- ✅ Turba Ops Core API Routes (`/api/ops/auth/session`, `/api/ops/dashboard/stats`, `/api/ops/orders`, `/api/ops/orders/[id]`, `/api/ops/orders/[id]/stage`, `/api/ops/orders/[id]/resource`, `/api/ops/orders/[id]/notes`, `/api/ops/orders/[id]/activity`, `/api/ops/notifications`)
- ✅ New Order Explicit Classification (`opsStage: "NEW_ORDER"`, `orderSource: "WEBSITE"` / `"MANUAL_OPS"` / `"TURBA_AI"`)
- ✅ Turba Ops Design System & Theme (`src/styles/ops.theme.css`) — Phase 2 (Agent 2)
- ✅ Turba Ops App Shell, Sidebar, Header & Login (`/ops/login`, `/ops`) — Phase 2 (Agent 2)
- ✅ Turba Ops Orders Directory & Kanban Board (`/ops/orders`, `?view=kanban`) — Phase 2 (Agent 3)
- ✅ Turba Ops Single Source of Truth Order Detail Page (`/ops/orders/[id]`) — Phase 2 (Agent 3)
- ✅ Turba Ops Production Stage Transitions & Rework Modals (`StageProgressBar`, `StageActionModal`, `ReworkModal`, `ResourceAllocationModal`) — Phase 2 (Agent 3)
- ✅ Turba Ops Activity Timeline Feed (`ActivityTimeline.tsx`) — Phase 2 (Agent 4)
- ✅ Turba Ops Internal Notes Panel with Pin Support (`InternalNotesPanel.tsx`) — Phase 2 (Agent 4)
- ✅ Turba Ops Team Notification Center & Drawer (`NotificationDrawer.tsx`) — Phase 2 (Agent 4)
- ✅ Customer Storefront Isolation via `LayoutWrapper.tsx` & `middleware.ts` (Public `tailoringturba.com` remains 100% unaffected)
- ⏳ Subdomain routing configuration & Production Deployment — Phase 3 (Agent 5)
- ✅ Turba CRM Database Schema (`Lead`, `LeadActivity`, `Employee.department`) — migration written, not yet applied to a database
- ✅ Turba CRM Sales Auth (`src/lib/crm/auth.ts`, reuses Ops `Employee`/NextAuth, gated by `department === "SALES"`)
- ✅ Turba CRM API Routes (`/api/crm/leads`, `/api/crm/leads/[id]`, `/api/crm/leads/[id]/activity`, `/api/crm/leads/[id]/convert`, `/api/crm/leads/bulk`, `/api/crm/leads/import`, `/api/crm/employees`, `/api/crm/dashboard/stats`)
- ✅ Turba CRM Ad Platform Webhook Intake (`/api/crm/webhooks/meta`, `/api/crm/webhooks/google`) — functional, needs production credentials
- ✅ Turba CRM UI: Login, Dashboard, Leads Pipeline (tabs/search/import/export/bulk actions), Lead Detail with activity timeline and convert-to-customer
- ✅ Turba CRM Phase 1: score-derived lead quality (Hot/Warm/Cold), Tasks module, Tags, duplicate detection, Advanced Filters, tabbed Lead Detail (Overview/Activity/Tasks/Notes/Audit History), dashboard sales funnel — applied + smoke-tested on Neon `vercel-dev` branch
- ✅ Turba CRM pipeline simplified to 5 stages (`NEW_LEAD`/`DNP`/`INTERESTED`/`NOT_INTERESTED`/`CONVERTED`) per explicit user request, replacing the initial 12-stage design; no mandatory reason on `NOT_INTERESTED`
- ✅ Turba CRM cross-department task handoff (2026-11-28): any active employee (not just Sales) can be assigned a `LeadTask`; `SEND_QUOTATION` completion requires a Cloudinary-uploaded attachment; targeted `CRM_TASK_ASSIGNED`/`CRM_TASK_COMPLETED` notifications (new CRM notification bell at `/api/crm/notifications`; new `/ops/sales-tasks` page for employees without `/crm` access) — see `src/lib/crm/tasks.ts`
- ✅ Turba CRM bulk/promotional email campaigns (2026-11-28): `/crm/campaigns` + `/crm/campaigns/new` — compose, filter audience (Leads by stage/source, and/or all customers), live recipient-count preview, send-now or save-as-draft, built on Resend Segments + Broadcasts (no new vendor) — see `src/lib/crm/campaigns.ts`
- ✅ Turba CRM WhatsApp broadcasting (2026-11-28): `/crm/whatsapp` + `/crm/whatsapp/new` + `/crm/whatsapp/[id]` — template-based broadcast to filtered Leads via Meta WhatsApp Cloud API direct (no BSP), batched send (first ~40 synchronous, "Send more now" button, daily cron safety net), delivery-status webhook, `Lead.whatsappOptOut` consent flag — see `src/lib/whatsapp.ts` + `src/lib/crm/whatsapp-broadcasts.ts`. **Inert until the owner finishes Meta's own WhatsApp Business setup** (WABA, phone number, ≥1 approved template) and the `META_WHATSAPP_*` env vars are set — nothing can send before that, by design of WhatsApp's platform rules, not a gap in this build.
- ⏳ Turba CRM: apply migrations (`add_crm_task_attachments`, `add_email_campaigns`, `add_whatsapp_broadcasting`, plus the still-pending `add_order_orderitem_otp_indexes` from the audit pass) to the dev branch then production, assign `department` values (e.g. `"SALES"`, or an Accounts-style tag) to real employees — there is still no "add employee" / "edit department" UI, only the hardcoded seed script, configure Meta/Google webhook credentials, complete Meta's WhatsApp Business Cloud API setup (WABA + phone number + ≥1 approved template) and set the `META_WHATSAPP_*` env vars
- ⏳ Turba CRM Phase 2d (not started): full Opportunities/Quotations module, automation engine, deep reporting suite, admin-configurable stages, persisted Smart Views, lead merge, import column-mapping wizard, granular RBAC

---

## Known Issues

Build health (2026-11-27, after the third fix pass): `npx tsc --noEmit` 0 errors, `next lint` 0 errors, 81 vitest cases pass across 6 suites (the 7th, `vendor-assignment.test.ts`, needs a live DB), `next build` succeeds (68 pages). `public/sitemap.xml`/`robots.txt` live-verified by serving the build.

**Full-repo audit now complete (24 of 24 code slices reviewed across three passes, 2026-11-27).** See CHANGELOG.md for what was fixed in each pass, including a privilege-escalation bug independently found in 4 different route files by 4 separate reviewers (all fixed) and a critical product-status-toggle data-loss bug (fixed). Findings were reported by independent reviewers and spot-checked by the implementer, not all independently re-verified by a second reviewer — treat "certain/likely" confidence markers below as the reviewer's own assessment.

**Remaining open items, by area** (not fixed in this pass; each needs a product/design decision or more work than a local patch):

*Security / data:*
- Staff default passwords were published in `public/ops-user-manual.html` + the two manual PDFs (now scrubbed in the working tree) and remain in git history. **Rotate all 5 passwords** — the seed no longer resets them on re-run, but the leaked values are still valid until changed.
- `/verify` vs the Razorpay webhook race can still drop the order-confirmation email/notification (needs an idempotency/locking change).
- Several vendor-CRUD routes (`/api/ops/vendors*`) have no management-only gating, unlike their sibling assignment/task routes — confirm intent before restricting.
- CRM lead CSV import has no duplicate detection (unlike manual lead creation) and processes rows sequentially (risk of Vercel timeout on large files).
- Ops quotation-upload file persistence (`/api/ops/quotation/parse`) silently no-ops on Vercel's read-only filesystem — uploaded supplier quotation PDFs are never actually retained in production.
- CRM avatar upload has the same local-filesystem-fallback issue as the (already-known) admin product upload fallback.

*Money / order state:*
- Catalogue "Add to Cart" and the home product rail (`/products/<numeric id>`) use ids that do not exist in the `Product` table, so checkout cannot price them.
- CreateOrderModal (manual Ops order creation) accepts client-supplied `amountPaid` with no server-side clamp to the order total, and records it with no corresponding `PaymentTransaction` audit row (unlike the dedicated payment-recording endpoint).
- Admin orders list "dispatch-gating" override dialog: the client expects a `dispatchGated` field the API never sends, so the dialog never opens.
- A full outbox retry worker/cron does not exist; the fix applied is "attempt immediately when queued", so a row that fails that immediate attempt still needs a manual resend.

*Ops UI/UX:*
- **Cancelled orders are visually indistinguishable from active ones everywhere in the Ops UI** (order detail badge, orders list, dashboard, activity timeline all still show the generic "in progress" state) — the backend now excludes them from the "active" filter and logs the cancellation, but staff reading the screen can't tell.
- The Ops stage-advance route only allows ADMIN/SUPER_ADMIN to advance production stages, contradicting this document's own "Equal Operational Authority in V1" policy (rule below); the client-side "isManager" gate used to decide whether to even show the Advance/Complete buttons was itself based on the same insecure name/code check (now fixed to be consistent with the backend, but the underlying policy question — should all 5 have this authority? — is still open). The override mechanism also has no real UI-driven "enter a reason" input.
- The Ops Settings page (`/ops/settings`) persists preferences to `localStorage` that nothing in the app reads — a fully non-functional placeholder presented as working ("applied immediately").
- The Ops "Equal Operational Authority" claim was corrected in Help/Account copy to reflect the actual role split (see Security above for the unresolved policy question itself).
- Material-requirement planning calculator (`/ops/planning`) silently picks an arbitrary GSM variant when the reference data has multiple rows for the same product/fabric/size — no GSM selector, no indication which was used, can be off by 20%+.
- Hardcoded staff directories in Ops chat/help pages go stale against the live, editable employee data; the chat page's "5 online" presence indicator is always-on fake data.

*CRM timezone bugs:* lead follow-up/task due dates and "Today"/"Overdue" boundaries are computed in the server's UTC time, not IST — tasks and follow-ups land in the wrong day bucket by up to ~5.5 hours. Affects `/crm/tasks`, lead detail follow-up dates, Advanced Filters date range, and the dashboard's 7-day sparkline.

*CRM cross-department task handoff (added 2026-11-28):* there is still no UI to add a new employee or edit `Employee.department` (e.g. tagging someone "ACCOUNTS") — only the hardcoded `prisma/seeds/employees.ts` seed script touches those fields today, so the task-assignee picker will only ever show the 5 seeded employees with whatever department they already have until that's built or someone edits the DB directly.

*Pending migrations, not yet applied anywhere as of 2026-11-28 end of session:* `20261127180000_add_order_orderitem_otp_indexes` (from the audit pass), `20261128120000_add_crm_task_attachments`, `20261128130000_add_email_campaigns`, `20261128140000_add_whatsapp_broadcasting`. All four are additive/reviewed. The user explicitly approved running `npx prisma migrate deploy` against the dev branch mid-session, but every attempt still failed — this sandbox's network path to Neon is intermittent (worked briefly for a `vitest` run, failed for every `prisma` CLI call before and after), and separately, Claude Code's own auto-mode permission classifier denies the `prisma migrate deploy` command itself every time it's invoked, regardless of the user's in-conversation approval — it does not treat that approval as standing permission. Someone running this from a normal terminal (not this sandbox) should have no trouble with either issue.

*Bulk email campaigns (added 2026-11-28):* no opt-out/suppression field was added to `Lead`/`User` — deliberately, since Resend's own global per-contact `unsubscribed` flag is the single source of truth once a campaign has been sent through it (confirmed against Resend's current Segments/Contacts/Broadcasts API, which replaced the older Audiences API). If a future change ever sends bulk email through a path that bypasses Resend Broadcasts, it would need its own suppression check — don't assume `Lead`/`User` carry one.

*WhatsApp broadcasting (added 2026-11-28):* Leads-only audience (no customers option, unlike email campaigns) — a deliberate scope cut, not a technical limit; add a `User.whatsappOptOut` field and a customers toggle in the composer if that's ever wanted. No two-way inbox — inbound replies from customers are not surfaced anywhere in the CRM yet, only outbound delivery status (sent/delivered/read/failed); the webhook receiver ignores `value.messages[]` entirely. The "Send more now" / daily-cron batching (40 and 100 recipients per tick respectively) is untested against Meta's actual per-number rate limits and message-pacing behavior for a brand-new/unverified number — the real throughput ceiling for a first-time sender is Meta's quality-based tier system, not anything in this code, and the first real broadcast should be watched closely rather than trusted at full size.

*Customer-facing:* phone-registered customers cannot log in again (login field is `type=email`; no phone recovery).

*Tests:* `e2e/auth.spec.ts` is entirely broken against the current `AuthForm` (targets ids/headings that no longer exist); `e2e/whatsapp-sample.spec.ts`'s catalog-page half targets a removed hover-action-bar/SAMPLE button. No test covers the new order-cancellation flow (`cancellationOutcome`, timeline event, notification). `vendor-assignment.test.ts` has no guard against being run without a live DB.

*Documentation:* `README.md` describes a stack that doesn't match the app (Stripe/GitHub OAuth vs. the real Razorpay/Google+Apple) and should be rewritten from this document. This document's own header timestamp and its Zustand/adapter-neon claims (both declared-but-unused dependencies) were stale as of the second pass — now corrected above.

---

## Current Status

1. **Phase 1**: Completed & Verified (Database schema, Prisma migration `20261008190000_add_turba_ops`, NextAuth integration, Workflow state engine, Ops APIs).
2. **Phase 2**: Completed & Verified (App Shell, Theme, Ops Login, Ops Dashboard, Orders Directory & Kanban, Single Source of Truth Order Detail, Stage Progression/Rework Modals, Resource Allocation, Internal Notes, Activity Timeline, Notification Center, Customer UI Isolation).
3. **Phase 3**: Completed & Verified (Subdomain routing for `ops.tailoringturba.com`, Middleware rewrite logic, Equal 5-employee authority model, Historical order backward compatibility, Customer order creation source tagging, Suspense SSR boundaries, Full production build verification, HTTP route verification).
4. **Release Status**: Code pushed to `origin/main`; production deployment triggered/awaiting verification in Vercel.

---

## Deployment Information

- **Production URL**: `https://tailoringturba.com`
- **Ops Production URL**: `https://ops.tailoringturba.com`
- **Hosting Platform**: Vercel
- **Database**: Neon Serverless PostgreSQL
- **Build Command**: `node scripts/build.js` (`npm run build`)
- **Migration Command**: `npx prisma migrate deploy`
- **Required Environment Variables (Names Only)**:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXTAUTH_SECRET` / `AUTH_SECRET`
  - `NEXTAUTH_URL`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `BIGSHIP_API_KEY`
  - `BIGSHIP_API_URL`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `GEMINI_API_KEY`
  - `RESEND_API_KEY`
  - `FIREBASE_*` (Client & Admin SDK configs)
  - `META_WEBHOOK_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN` (Turba CRM — Meta Lead Ads webhook, not yet configured)
  - `GOOGLE_LEAD_FORM_KEY` (Turba CRM — Google Ads Lead Form webhook security key, not yet configured)
  - `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `META_WHATSAPP_APP_SECRET` (Turba CRM — WhatsApp Cloud API, not yet configured; see `.env.example` section 15)
  - `CRON_SECRET` (authenticates Vercel's own invocation of `/api/cron/whatsapp-sender`, defined in `vercel.json` — not yet configured)

---

## Important Development Rules

1. **Production Data Protection**: Never run `npx prisma db push` against the production database. Every schema change must have a reviewed migration file.
2. **Customer Site Isolation**: `tailoringturba.com` MUST continue operating flawlessly. Never introduce global CSS, shared layout modifications, or routing changes that alter the customer experience.
3. **No Hallucinated Implementations**: Never mark a task or test as completed without actually executing and verifying the code.
4. **Strict Pre-Execution Review**: Always read `PROJECT_CONTEXT.md` and `CHANGELOG.md` before starting substantial work.
5. **Equal Operational Authority in V1**: Do not add role-based locks preventing employees from updating stages. Capture accountability through employee identity logs instead.
6. **Update Engineering Memory**: Maintain `PROJECT_CONTEXT.md` and `CHANGELOG.md` after every meaningful feature, bugfix, or migration.
