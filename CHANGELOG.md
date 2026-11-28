# Tailoring Turba — Engineering Changelog

All meaningful architectural and functional changes to this repository are documented chronologically in this file. The newest entries appear at the top.

---

## 2026-11-28 — IST (third entry)

### Turba CRM Phase 2c: WhatsApp broadcasting (Meta WhatsApp Cloud API, direct — no BSP)

Last of the three pieces the owner asked for in one request (quotation task handoff, bulk email, WhatsApp broadcasting). The user chose integrating directly against Meta's own WhatsApp Cloud API over a BSP (AiSensy/Interakt/Gupshup/Twilio) when asked, since it avoids a middleman subscription fee — the tradeoff is more setup work on the user's side (Meta Business verification, WABA, phone number, template submission) and more plumbing in this codebase (no BSP dashboard to lean on for templates/delivery status).

**Researched before building, not from memory** — same discipline as the Resend research in Phase 2b: fetched Meta's current API reference pages (recently moved to a new `developers.facebook.com/documentation/business-messaging/whatsapp/...` URL structure; the old `/docs/whatsapp/cloud-api/...` paths now stub/redirect) to confirm, verbatim: the template-send request shape (`POST /{PHONE_NUMBER_ID}/messages`, `type: "template"`, `template.language.code`, `template.components[].parameters[]`), the template-listing endpoint and its `status`/`category` enums (including a newer `FREE_SERVICE` category not previously known), and the success-response shape (`messages[0].id`, the `wamid` used to correlate delivery-status webhooks). The webhook status-update payload shape (`entry[].changes[].value.statuses[]`) couldn't be fetched directly (Meta's new docs site renders that page client-side in JS), so it was cross-checked via search against Meta's own docs plus third-party implementations instead of guessing. Also confirmed Vercel Cron's actual plan limits (Hobby: once/day max, invalid cron expressions fail deployment; Pro: once/minute) before designing the batching approach around it, and confirmed Vercel's `CRON_SECRET` auto-injected-Authorization-header convention for authenticating cron-triggered requests.

**Added:**
- `prisma/schema.prisma` + migration `20261128140000_add_whatsapp_broadcasting`: `WhatsAppBroadcast` + `WhatsAppBroadcastRecipient` + two enums, plus `Lead.whatsappOptOut` (WhatsApp has no platform-level suppression list the way Resend has for email — this is the CRM's own consent flag, and the only thing standing between a careless broadcast and the business's WhatsApp number getting banned for unsolicited messaging). **Not yet applied to any database** — see the note below.
- `src/lib/whatsapp.ts`: direct Graph API client — `listApprovedTemplates()` (filters to `status: "APPROVED"`, computes each template's `{{1}},{{2}}`... body-variable count by parsing its `BODY` component text), `sendTemplateMessage()`. API version is configurable (`META_GRAPH_API_VERSION`, defaults to `v21.0`) rather than hardcoded, since Meta deprecates versions on a schedule and the exact current one couldn't be pinned down with certainty from available sources.
- `src/lib/crm/whatsapp-broadcasts.ts`: `resolveWhatsAppAudience()` (Leads only, excludes `whatsappOptOut` and unparseable phone numbers — reuses the existing `validateAndNormalizePhone()` helper rather than inventing new phone validation), `processPendingWhatsAppRecipients()` — the one function that actually sends, shared by all three triggers below.
- **Batching, designed around Vercel's real cron limits rather than assuming a Pro-plan always-on queue:** creating a broadcast sends its first ~40 recipients synchronously in the same request; a "Send more now" button on the broadcast detail page (`/crm/whatsapp/[id]`) lets a rep continue a larger list on demand; a new `vercel.json` (no prior file existed) schedules `/api/cron/whatsapp-sender` once/day as a safety net for anything still left over — deliberately NOT per-minute, since that frequency is rejected at deploy time on Vercel's Hobby plan.
- `/api/crm/whatsapp/templates` (GET), `/api/crm/whatsapp/broadcasts` (GET list, POST create-and-send-first-batch), `/api/crm/whatsapp/broadcasts/preview-audience` (POST), `/api/crm/whatsapp/broadcasts/[id]` (GET detail with recipient statuses), `/api/crm/whatsapp/broadcasts/[id]/process` (POST, the "Send more now" action), `/api/cron/whatsapp-sender` (POST/GET, `CRON_SECRET`-authenticated).
- `/api/crm/webhooks/whatsapp`: delivery-status updates (sent/delivered/read/failed), same GET-handshake + HMAC-SHA256-POST-verification pattern as the existing Meta Lead Ads webhook, correlating by `waMessageId`. Deliberately ignores inbound customer replies (`value.messages[]`) — no two-way inbox in this pass, outbound status only.
- `/crm/whatsapp`, `/crm/whatsapp/new` (template picker with live variable-count detection, audience filter by Lead stage/source, live recipient preview), `/crm/whatsapp/[id]` (per-recipient status table) — new "WhatsApp" nav item. A WhatsApp opt-out toggle was added next to the phone number on the Lead Detail page.
- `.env.example`: new section for the five `META_WHATSAPP_*` vars plus `CRON_SECRET`; also backfilled `META_WEBHOOK_VERIFY_TOKEN`/`META_PAGE_ACCESS_TOKEN`, which the Meta Lead Ads webhook has used since Phase 1 but which were missing from this file (a gap the audit pass had already flagged).

**Known gaps, by design (not fixed this pass):** Leads-only audience (no customers option, unlike email campaigns); no two-way inbox for inbound replies; the batch sizes (40 synchronous, 100/cron-tick) are reasonable defaults, not something actually load-tested against Meta's real per-number throughput tier for a brand-new sender — watch the first real broadcast closely.

**Pending migrations, not yet applied to any database, now four:** `20261127180000_add_order_orderitem_otp_indexes`, `20261128120000_add_crm_task_attachments`, `20261128130000_add_email_campaigns`, `20261128140000_add_whatsapp_broadcasting`. The user explicitly approved running `prisma migrate deploy` against the dev branch mid-session; it still couldn't be done from this sandbox — first `P1001` (no network path to Neon), and later, once connectivity briefly returned on its own, the auto-mode permission classifier denied the `prisma migrate deploy` command itself on every attempt regardless of the user's in-conversation approval (it doesn't appear to treat a prior-turn approval as standing permission for a repeated invocation of the same command). Whoever runs this outside this sandbox should hit neither problem.

**Verified:** `tsc --noEmit` 0 errors, `next lint` 0 errors (only pre-existing/consistent-with-codebase `any` warnings, none new), vitest 81/81 tests pass (same pre-existing `vendor-assignment.test.ts` DB-dependent failure as before), `next build` succeeds with all 7 new API routes and all 3 new pages present in the route table.

---

## 2026-11-28 — IST (second entry)

### Turba CRM Phase 2b: bulk/promotional email campaigns

Continuing the same owner request as Phase 2a below: bulk/promotional email sending, built on the existing Resend integration rather than a new vendor.

**Researched before building** (Resend has materially changed its contacts model since any older documentation/training knowledge): confirmed directly against the installed `resend` SDK's type definitions (`node_modules/resend/dist/index.d.mts`, v6.18.1) plus Resend's own current API docs that Audiences are deprecated in favor of **Segments** — Contacts are now global per Resend account, a Segment is just a named static container, and a Contact only receives a Broadcast if it's a member of the Segment that Broadcast targets. Also confirmed the literal unsubscribe merge tag (`{{{RESEND_UNSUBSCRIBE_URL}}}`, triple braces) and a personalization tag (`{{{contact.first_name|there}}}`) against Resend's own API reference page rather than guessing the syntax.

**Added:**
- `prisma/schema.prisma` + migration `20261128130000_add_email_campaigns`: new `EmailCampaign` table + `EmailCampaignStatus` enum — the CRM's own send-history/audit trail (who sent what, to how many, built from which filter), since Resend's own broadcast record doesn't carry our Employee identity or filter criteria. **Not yet applied to any database** — see the note on migrations below.
- `src/lib/resend.ts`: shared Resend client getter (throws clearly if `RESEND_API_KEY` isn't configured — bulk campaigns have no SMTP fallback, unlike `sendMail()`).
- `src/lib/crm/campaign-constants.ts`: the unsubscribe tag and a default footer snippet, deliberately in their own zero-import file so the client-side composer and the server-side send logic can share the exact same literal string without risking it drifting out of sync between the two.
- `src/lib/crm/campaigns.ts`: `resolveCampaignAudience` (builds the recipient list from our own `Lead`/`User` tables per a stage/source/customers filter — Resend Segments have no query/filter concept of their own, the filtering logic has to live here), `syncRecipientsToSegment` (create-or-fetch each contact in Resend's global Contacts, add to a one-off per-campaign Segment, bounded concurrency), `assertHasUnsubscribeTag`.
- `/api/crm/campaigns` (GET list, POST create-and-send-or-draft), `/api/crm/campaigns/preview-audience` (POST, live recipient count with no side effects), `/api/crm/campaigns/[id]/send` (POST, sends a previously-saved draft).
- `/crm/campaigns` (list + send-draft action) and `/crm/campaigns/new` (composer: name/subject/HTML body with a live preview, audience filter by Lead stage/source and/or all customers, live recipient count, insert-unsubscribe-link/insert-first-name helper buttons, send-now or save-as-draft) — new "Campaigns" nav item in the CRM sidebar.
- Deliberately **no new opt-out field on `Lead`/`User`** — Resend's own per-contact `unsubscribed` flag is the single source of truth for suppression once a campaign goes through Resend Broadcasts (see PROJECT_CONTEXT.md Known Issues for the caveat if that ever changes).

**Pending migrations, not yet applied to any database:** this session initially had no network path to Neon at all (every `prisma migrate status`/`migrate deploy` attempt returned `P1001`), confirmed as a sandbox limitation. Connectivity came back later in the same session (a vitest run reached the DB and hit a real constraint error, not a connection error) — confirmed the local `.env`'s `DATABASE_URL` points at `ep-blue-math-amfwsw2c-pooler`, a different host than the documented production `ep-winter-base-awcv21vu-pooler`, i.e. a dev branch. Running `prisma migrate deploy` against it was flagged by the auto-mode permission classifier as requiring explicit user approval, so it was deliberately left for the user to run rather than executed automatically. Three migrations are now pending: the audit pass's `20261127180000_add_order_orderitem_otp_indexes`, and this session's `20261128120000_add_crm_task_attachments` + `20261128130000_add_email_campaigns`.

**Verified:** `tsc --noEmit` 0 errors, `next lint` 0 errors (only pre-existing/consistent-with-codebase `any` warnings, none new), vitest 81/81 tests pass (same pre-existing `vendor-assignment.test.ts` failure as before, now a `P2003` FK error instead of `P1001` since DB connectivity returned mid-session — not a regression either way, that test still needs a live DB with its expected seed data), `next build` succeeds with `/crm/campaigns`, `/crm/campaigns/new`, and all three new API routes present in the route table.

---

## 2026-11-28 — IST

### Turba CRM Phase 2a: cross-department task handoff with attachments and targeted notifications

The owner described a concrete workflow: a BDA creates a "Send Quotation" task for an Accounts employee (who has no `/crm` access); that employee gets notified, uploads the quotation PDF when marking the task done, and the BDA is notified to retrieve it and send it to the client. `LeadTaskType.SEND_QUOTATION` already existed as an enum value from the original Phase 1 design, but the assign→notify→upload→notify-back workflow itself had never been built (explicitly listed as "Phase 2+, not started" in `PROJECT_CONTEXT.md`).

**Added:**
- `prisma/schema.prisma` + migration `20261128120000_add_crm_task_attachments`: `LeadTask.attachments String[] @default([])`, same convention as `ProductionStageExecution.attachments`/`GoodsMovement.attachments`. **Not yet applied to any database** — this session had no network path to Neon (`P1001` on every attempt); the Prisma client was regenerated against the new schema so code could be written and type-checked against it, but someone with DB access needs to run `npx prisma migrate dev` (then `migrate deploy` for production) before this field is live.
- `src/lib/crm/tasks.ts`: shared completion logic (`completeLeadTask`) used by both the CRM and Ops routes below — enforces that a `SEND_QUOTATION` task can't be marked complete without at least one attachment, logs the usual `LeadActivity`, and fires a targeted notification to the requester. Also defines the new targeted-notification primitives (`notifyCrmTaskAssigned`, `notifyCrmTaskCompleted`, `isCrmTaskNotificationRelevant`) reused by the notification routes.
- `src/lib/attachments.ts`: Cloudinary upload helper for internal-tool attachments (magic-byte validated PNG/JPEG/WebP/PDF, 15MB cap). Deliberately throws instead of falling back to local disk — PROJECT_CONTEXT.md already documents a prior bug (`/api/ops/quotation/parse`) where a local-disk fallback silently lost uploaded files on Vercel's read-only filesystem; this never repeats that pattern.
- `/api/crm/employees?scope=all`: the existing endpoint stayed Sales-only by default (used for the Lead "owner" picker); the new `scope=all` opt-in returns every active employee, used only by the task-assignee picker so a task can be hand to another department.
- `/api/crm/leads/[id]/tasks` (POST) now notifies the assignee on creation; `/api/crm/leads/[id]/tasks/[taskId]` (PATCH) now routes completion through `completeLeadTask`; new `/api/crm/leads/[id]/tasks/[taskId]/attachments` (POST) for the upload step.
- New `/api/ops/sales-tasks` (+ `/[taskId]`, `/[taskId]/attachments`): lets an employee without `/crm` access see and complete `LeadTask`s assigned to them — same `LeadTask` rows, not a parallel task system. New `/ops/sales-tasks` page + Ops sidebar entry ("Sales Tasks").
- Notifications: reused the existing `OpsNotification` table (no new table) with two new `type` values, `CRM_TASK_ASSIGNED`/`CRM_TASK_COMPLETED`. Unlike Ops's broadcast notifications (visible to all managers, filtered for shop-floor workers), these carry a `metadata.targetEmployeeId` and are visible **only** to that one employee, regardless of the worker/management split (`/api/ops/notifications` GET/POST updated accordingly). New `/api/crm/notifications` + a notification bell in the CRM header (`CrmHeader`/`CrmLayout`/`CrmNotificationDrawer`) — CRM previously had no notification UI at all.
- Shared `src/components/shared/CompleteLeadTaskModal.tsx`, used by `LeadTasksPanel` (lead detail), `/crm/tasks`, and the new `/ops/sales-tasks` page — replaces three copies of a bare `prompt()`-based completion flow with a real modal that enforces/accepts the attachment.

**Known gaps, by design (not fixed this pass):**
- No UI exists to add a new employee or set/change `Employee.department` (e.g. tagging someone "ACCOUNTS") — still seed-script-only. The owner confirmed building this generically (department-based, not a specific named person) was fine for now; a real admin UI for employee/department management is still open.
- No automatic hand-off to WhatsApp/email yet — the BDA still manually sends the retrieved quotation PDF to the client. Bulk/promotional email (planned on the existing Resend integration) and WhatsApp broadcasting (needs the owner to first set up a Meta WhatsApp Business Cloud API account + an approved message template) are separate, not-yet-started pieces of the same ask.

**Verified:** `tsc --noEmit` 0 errors, `next lint` 0 errors (only pre-existing warnings, none new), vitest 81/81 tests pass (same pre-existing `vendor-assignment.test.ts` DB-dependent failure as before — not a regression, no live DB reachable from this session), `next build` succeeds with all new routes present in the route table.

---

## 2026-11-27 — IST (third pass — remaining 13 of 24 slices reviewed)

### Full-repo audit completed; cross-cutting privilege-escalation bug found and fixed across 4 files; high-value fixes applied

13 reviewers each audited one remaining area (ops pages/components, CRM, admin, Turba AI, data layer, tests, scripts/docs), completing the audit started in the first pass. ~80 findings in total; the highest-priority ones are fixed below. Full findings, including items NOT fixed, are summarized in `PROJECT_CONTEXT.md`'s Known Issues.

**Critical security — privilege escalation (found independently by 4 reviewers in 4 different files):**
The "management" check fixed in `src/app/api/ops/orders/[id]/stage/route.ts` in the second pass (`employee.name.includes("Pratik"/"Neeraj"/"Sanjay")`, exploitable because any employee can edit their own name via `PATCH /api/ops/account`) was copy-pasted, unfixed, into 4 sibling route files: `src/app/api/ops/assignments/route.ts`, `src/app/api/ops/orders/[id]/resource/route.ts`, `src/app/api/ops/orders/[id]/route.ts`, `src/app/api/ops/tasks/route.ts`. All 4 replaced with the same session-role-only check.

**Critical — data loss:**
- `src/app/admin/products/AdminProductsClient.tsx`: the Active/Offline status-toggle button sent a 4-field payload into a PUT handler that treats every omitted field as "reset to default" — toggling a product's status silently wiped its images, description, sizes, colors, SEO fields and slug. The toggle now sends the complete current row back with only `isActive` changed.

**Critical — security:**
- `src/app/api/crm/webhooks/meta/route.ts`: the POST handler that ingests Meta Lead Ads data had **no payload signature verification at all** (the GET handshake was fine). Added HMAC-SHA256 verification against `X-Hub-Signature-256` using a new `META_APP_SECRET` env var, fails closed if unconfigured.
- `prisma/seeds/employees.ts`: re-running the seed reset all 5 staff passwords back to the hardcoded defaults on every run, undoing any rotation done after the known leak. Password is now only set on first account creation, never on update. Deleted `scripts/seed-ops-employees.ts`, a second, redundant seed script with its own different hardcoded password for the same 5 accounts.

**Fixed (money/business-logic):**
- `src/app/admin/leads/LeadsClient.tsx`: "Mark Paid" sent `status:"PROCESSING"`, a state unreachable from `PENDING` — always 422'd. Now sends `CONFIRMED`.
- `src/app/admin/page.tsx` + `AdminKpiGrid.tsx`: "Total Revenue" summed `totalAmount` across every order including unpaid (`PENDING`) and `CANCELLED` ones, and its footnote reused the same unfiltered count while calling them "confirmed". Now filtered to non-pending/non-cancelled orders, with a separate realized-order count for the footnote.
- `src/app/admin/transactions/page.tsx`: the "Financial Ledger" listed unpaid orders and rendered every row as "Completed" with the full order total. Now only lists orders with `amountPaid > 0`, labels partial payments distinctly, and shows the amount actually paid.
- Goods-movement quantity accounting (`src/app/api/ops/assignments/[id]/movement/route.ts`) had a lost-update race: totals were read outside the transaction and written back as absolute values, so two concurrent movement submissions could silently clobber each other. Now re-reads inside the transaction and writes atomic increments.
- Stage-override audit trail (`src/lib/ops/workflow.ts`, `src/app/api/ops/orders/[id]/stage/route.ts`): a sequential stage advance that only succeeded because the 60%-payment gate was bypassed was recorded identically to a routine advance — the audit log couldn't tell overrides from normal moves. `validateStageTransition` now flags this case; the route uses that flag (and the real applied reason) instead of the always-empty raw request fields.
- CRM lead-to-customer conversion (`.../leads/[id]/convert/route.ts`, `crm/leads/[id]/page.tsx`): added a transaction-level re-check (the outer guard was a stale pre-transaction read) and a client-side disabled-while-converting guard, closing a double-click path that could create two customer accounts for one lead.
- `src/components/ops/vendors/VendorModal.tsx`: GST and PAN were merged into a single input that only wrote to `gstNumber` — editing a vendor's PAN silently corrupted it into a bogus GST number and made the real PAN permanently uneditable from the UI. Split into two real inputs.

**Fixed (smaller correctness/security):**
- Open redirect: `callbackUrl` on `/ops/login` and `/crm/login` is now required to be a same-origin relative path.
- `src/app/crm/tasks/page.tsx`: the dashboard's "Overdue"/"Due Today" deep links (`?view=...`) were silently ignored — the page always showed "Today" regardless (now wrapped in a `Suspense` boundary, required for `useSearchParams()` to prerender).
- `src/app/api/crm/webhooks/google/route.ts`: shared-secret comparison switched to `crypto.timingSafeEqual`; the idempotency fallback key no longer uses `Date.now()` (which broke dedup on retries lacking `lead_id`/`gcl_id`).
- `src/app/api/admin/products/[id]/route.ts`: deleting a product with order history now returns a clear 400 instead of an opaque 500.
- Two CRM `DELETE` handlers (lead, lead task) now return 404 instead of 500 for an already-deleted record.
- CSV export of CRM leads (`crm/leads/page.tsx`) now neutralizes spreadsheet-formula-injection characters (`=`, `+`, `-`, `@`) in exported cells.
- `prisma/seeds/vendors.ts`: re-running the seed no longer forces `isActive: true` on update, which was silently reactivating vendors an Ops user had deliberately deactivated.
- Copy fix: the Ops Help Center and Account page claimed "all 5 team members have equal authority to override stages" — false, and contradicted by the route's own role gate (a prior, separate, open policy question — see Known Issues). Copy now describes the actual role split.
- Added `@@index` on `Order` (userId/status/opsStage/priority), `OrderItem` (orderId/productId) and `OtpRequestLog` (phone+createdAt, ip+createdAt) — all previously unindexed despite being the most-queried columns in the app. Shipped as a reviewed, additive migration (`prisma/migrations/20261127180000_add_order_orderitem_otp_indexes`), not applied to any database by this pass.
- `.env.example`: added `OPS_SCREENSHOT_PASSWORD`, `RAZORPAY_KEY_ID`, `META_APP_SECRET`. `docs/ARCHITECTURE.md`: setup instructions no longer tell a new developer to run `prisma db push`. `tsconfig.json`: removed a stale exclude entry for a file that no longer exists.

**Verified:** `tsc --noEmit` 0 errors, `next lint` 0 errors, vitest 6/6 suites · 81/81 tests pass, `next build` succeeds (same page count, confirmed via a full production build + route table check after every batch of changes).

**Not fixed in this pass** — see `PROJECT_CONTEXT.md` Known Issues for the full list carried over from all 13 reports (e.g. cancelled orders are still visually indistinguishable from active ones throughout the Ops UI; the Ops stage-advance role gate vs. the documented "equal authority" policy is unresolved; `e2e/auth.spec.ts` and half of `e2e/whatsapp-sample.spec.ts` are broken against the current UI; timezone (UTC vs IST) bugs in CRM task/follow-up due dates; several vendor-CRUD routes have no management-only gating unlike their sibling routes; the Ops Settings page persists to `localStorage` that nothing reads; CSV lead import has no duplicate detection; quotation-upload file persistence silently no-ops on Vercel's read-only filesystem).

---

## 2026-11-27 — IST (second pass)

### Payment/refund fixes, CSP/SEO fixes, following up on the partial audit below

**Security:**
- `src/app/api/ops/orders/[id]/stage/route.ts`: the check granting "management" override powers (bypassing the 60% advance-payment gate and stage-sequencing rules) matched on `Employee.name` containing "Pratik"/"Neeraj"/"Sanjay" or a hard-coded employee code list. Since `PATCH /api/ops/account` lets any employee edit their own display name, any worker could rename themselves to gain those powers. Replaced with a check on the session-resolved role (`ADMIN`/`SUPER_ADMIN`) only — no change to which real accounts have access.

**Fixed (payments/orders):**
- `src/lib/server-pricing.ts` (the authoritative, server-side price the customer is actually charged), plus the matching customer-facing estimates in `checkout/page.tsx`, `cart/page.tsx`, `contact/page.tsx` and `OrderSummary.tsx`: left/right sleeve print elements were never priced at all — every sleeve print shipped for free. Fixed in all five places.
- `src/lib/server-pricing.ts`: a design (`customStateJson`) that failed to parse was silently charged ₹0 for the custom print instead of rejecting the order. Now throws (converted to a 400 by the only caller, `/api/razorpay/order`).
- `src/app/api/webhooks/bigship/route.ts`: the carrier status mapping checked for `"DELIVERED"` before checking for `"RTO"`/`"UNDELIVERED"` — since carrier strings like "RTO DELIVERED" and "UNDELIVERED" both contain the substring "DELIVERED", returned/failed parcels were being marked as successfully delivered. Reordered the checks.
- `src/app/api/orders/[id]/route.ts` (customer order cancellation): a failed automatic Razorpay refund was silently swallowed while the customer was still told "a refund is being processed" (`CancelOrderButton.tsx` toast, and the cancellation email). The route now tracks the real outcome, the email (`sendOrderCancellationEmail` in `src/lib/mail.ts`) only promises a refund that actually succeeded, and the toast reflects the real outcome. Cancellation also now creates an `OrderTimelineEvent` and an `OpsNotification` (previously nothing told Ops a customer had cancelled — production work could continue on a dead order), and `/api/ops/orders?stage=ACTIVE` now excludes `CANCELLED` orders as a second line of defense.
- `src/app/api/shipping/book/route.ts` and `src/app/api/webhooks/bigship/route.ts`: `src/lib/outbox.ts` (`processOutboxNotification`) had producers queuing rows but nothing ever consumed them, so "Out for Delivery" emails and failed tax-invoice retries were queued and never sent. Both producers now call the processor immediately after queuing (fire-and-forget). This is not a full retry worker/cron — a row that fails on this immediate attempt still needs manual resending.
- `src/app/dashboard/transactions/page.tsx`: every order that wasn't `PENDING` showed as "Paid", including `CANCELLED` orders and split-payment orders still owing a balance. Now shows Cancelled / Unpaid / Partially Paid / Paid correctly. The "Export CSV" and "Invoice" buttons had no handlers at all; CSV export is now a real client-side download, and "Invoice" downloads a real PDF from a new customer-facing `GET /api/orders/[id]/invoice` (ownership-checked; previously the only invoice path was an admin-only "resend by email" action).
- `src/app/admin/orders/BigShipShipmentModal.tsx`: always reported "Booking failed" even on a successful booking (it read `data.status`; the API returns `success`/`awbNumber`). (Already fixed in the first pass below; re-verified here.)

**Fixed (SEO / CSP — the owner explicitly approved these after reviewing the tradeoffs):**
- `public/sitemap.xml` and `public/robots.txt` (static files) were shadowing the dynamic `src/app/sitemap.ts`/`robots.ts` — removed the static files so the dynamic ones (which list real, current product pages) are what's actually served. Verified by serving the production build: the sitemap now lists live product URLs with real `lastmod` dates.
- `src/app/robots.ts`: added `/ops/`, `/crm/`, `/cart/`, `/checkout/` to the disallow list (internal staff tools reachable on the main domain, and transient per-user pages, were never excluded from crawling).
- `src/middleware.ts` CSP: added `https://www.google.com` / `https://www.recaptcha.net` to `script-src`/`frame-src` (Firebase phone-OTP reCAPTCHA and the `/booking` Google Maps embed were being blocked), `https://api.fontshare.com` to `style-src` and `https://cdn.fontshare.com` to `font-src` (the brand fonts General Sans/Boska were silently falling back to system fonts), and `https://api.qrserver.com` to `img-src` (the customizer's "upload from phone" QR code image was blocked).

**Verified:** `tsc --noEmit` 0 errors, `next lint` 0 errors, vitest 6/6 suites · 81/81 tests pass, `next build` succeeds (same page count), robots.txt/sitemap.xml content verified by serving the built app.

**Not done in this pass** (flagged, not fixed — each needs a product decision or a bigger change than a bug fix): the "equal operational authority, no RBAC" policy below is itself contradicted by the ops stage route only allowing ADMIN/SUPER_ADMIN to advance stages, and that route's override mechanism has no real UI path for a human-entered override reason (it's auto-granted to admins) — changing either is a workflow-design decision, not just a security fix, so only the security hole was closed. Dispatch-gating override dialog on the Admin orders list. A full outbox retry worker/cron (vs. the immediate-attempt fix above). Left/right sleeve pricing rates were assumed equal to front/back via the existing `getElementDetails` sleeve logic — not a new pricing model.

---

## 2026-11-27 — IST (first pass)

### Pre-redesign audit & cleanup (partial audit: 11 of 24 code slices reviewed)

**Removed (each verified unreferenced by three independent reviewers; recoverable from git history):**
- Orphaned landing sections: `CuratedProducts`, `EditorialWelcome`, `FinalResolution`, `GarmentJourney`, `HeroSection`, `LuxeShowcase`, `MaterialSection` (+ their CSS modules). None were imported by any page.
- `ui/ProductCard` (+ CSS), `customizer/FormattingToolbar`, `dashboard/SignOutButton` — never imported.
- `POST /api/generate-mockup` — no caller anywhere (its SSRF helper `src/lib/ssrf.ts` and tests are kept).
- Unused exports: `TAG_COLORS` (fabric-data), `STAGE_SHORT_NAMES` (ops/workflow), `CATEGORIZED_PRESETS` (presets/index).
- Stale one-off scripts: `scripts/{categorize-vendors,check-all-vendors-detail,check-uncat,check-vendors}.ts`, `scripts/{preview-test,verify-final,verify-page-images}.js`; `tests/customizer-logic.spec.ts` (never executed by vitest or playwright).

**Fixed:**
- Admin BigShip booking modal always reported "Booking failed" even when the shipment was booked (it read `data.status`; the API returns `success`/`awbNumber`).
- Customer dashboard "Track Order Details" linked to a non-existent `/dashboard/orders/<id>` page (404) — now links to `/dashboard/orders`.
- Ops orders search returned HTTP 500 when the search text contained a long digit string (e.g. a phone number): the value overflowed the 32-bit `orderNumber` filter.
- `POST /api/contact`: `email` is now format-validated and `quantity` reduced to a bounded integer before being interpolated into HTML emails / subject line.

**Security:**
- Staff default passwords had been published in `public/ops-user-manual.html`, `public/Turba_Ops_Employee_Manual.pdf` and `public/Turba_Ops_Mobile_Manual.pdf`. The HTML was scrubbed and both PDFs regenerated from it (`scripts/generate-manual-pdf.js`). The screenshot scripts now read the login password from `OPS_SCREENSHOT_PASSWORD`. Credential values were also redacted from `SECURITY_AUDIT_PHASE1.md`. **These credentials remain in git history and in `prisma/seeds/employees.ts` — every affected account password must be rotated.**

**Verified:** `tsc --noEmit` 0 errors, `next lint` 0 errors, vitest 6 suites / 81 tests pass (the 7th suite needs a live DB), `next build` succeeds.

**Open findings from the partial audit are NOT fixed here** (payments, auth, CSP, order cancellation/refund, outbox worker, sitemap/robots shadowing, Fontshare fonts blocked by CSP, etc.) — see the audit report delivered with this change.

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
