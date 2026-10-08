# Tailoring Turba — Project Context

## Last Updated
- Date: 2026-10-08
- Time: 20:35
- Timezone: IST
- Current Branch: main
- Latest Commit: 090bac6 (feat(ops): complete Turba Ops integration and QA)

---

## Project Overview

Tailoring Turba is an end-to-end custom apparel manufacturing and B2B/B2C direct-to-consumer e-commerce platform. It provides high-quality garment tailoring, custom printing (DTF, screen printing, embroidery), interactive 3D/2D visual customizers, and automated production fulfillment. 

The application is expanding to include **Turba Ops** (`ops.tailoringturba.com`), an internal production and order operations management system for the 5-person Tailoring Turba manufacturing team to manage custom orders from intake through cutting, stitching, branding, QC, packing, and dispatch.

---

## Current Architecture

- **Frontend Framework**: Next.js 14.2.35 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS + CSS Modules + Lucide React icons
- **State Management**: Zustand, React Hooks
- **Backend / API**: Next.js App Router Route Handlers (`src/app/api/*`)
- **Database**: PostgreSQL hosted on Neon Database (`ep-winter-base-awcv21vu-pooler.c-12.us-east-1.aws.neon.tech`)
- **ORM**: Prisma 5.22.0 (`@prisma/client`, `@prisma/adapter-neon`)
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

### 2. `ops.tailoringturba.com` (Internal Team — Under Implementation)
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

---

## Known Issues

- None. `npx tsc --noEmit` compiles with 0 errors. All 81 vitest test cases pass across 6 suites. `npm run build` generates 55/55 static and server-rendered pages with 0 errors.

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

---

## Important Development Rules

1. **Production Data Protection**: Never run `npx prisma db push` against the production database. Every schema change must have a reviewed migration file.
2. **Customer Site Isolation**: `tailoringturba.com` MUST continue operating flawlessly. Never introduce global CSS, shared layout modifications, or routing changes that alter the customer experience.
3. **No Hallucinated Implementations**: Never mark a task or test as completed without actually executing and verifying the code.
4. **Strict Pre-Execution Review**: Always read `PROJECT_CONTEXT.md` and `CHANGELOG.md` before starting substantial work.
5. **Equal Operational Authority in V1**: Do not add role-based locks preventing employees from updating stages. Capture accountability through employee identity logs instead.
6. **Update Engineering Memory**: Maintain `PROJECT_CONTEXT.md` and `CHANGELOG.md` after every meaningful feature, bugfix, or migration.
