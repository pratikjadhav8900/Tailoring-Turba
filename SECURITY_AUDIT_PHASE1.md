# TAILORING TURBA — SECURITY AUDIT REPORT
## PHASE 1: SECRET & CREDENTIAL SECURITY

**Audit Date:** September 7, 2026  
**Application Stack:** Next.js 14, React 18, TypeScript, Prisma ORM, Neon PostgreSQL  
**Audit Scope:** Full repository scan for secrets, credentials, environment configurations, git history, logging exposures, API authentication boundaries, and third-party integrations.

---

### A. Executive Summary

A comprehensive, read-only secret and credential security audit was conducted across the entire **Tailoring Turba** codebase. The audit evaluated all source code, configuration files, Git commit history, API endpoints, authentication flows, environment files, and third-party integrations (Neon PostgreSQL, Razorpay, Google OAuth, Apple Sign-In, Cloudinary, BigShip Logistics, Firebase, Nodemailer/Gmail SMTP, Resend, and HubSpot).

**Overall Security Posture:** **HIGH RISK (Immediate Remediation Required)**

While modern architectural safeguards exist (Prisma ORM parameterized queries, NextAuth v5 session guards, timing-safe HMAC payment verification), the application has critical security vulnerabilities in credential management, Git hygiene, and authentication integrity:
1. **Critical Git History Exposure:** Historical commits previously tracked a live `.env` file containing database connection strings with passwords, Google OAuth client secrets, Cloudinary API secrets, and Gmail SMTP application passwords. The Cloudinary API credentials currently in `.env` match the historically committed keys and have never been rotated.
2. **Hardcoded Fallback Secret in Phone OTP Registration:** In both `verify-otp` and `register`, `process.env.NEXTAUTH_SECRET` falls back to the hardcoded string `"fallback-secret-for-jwt-signing"`. Because `.env` defines `AUTH_SECRET` rather than `NEXTAUTH_SECRET`, this fallback secret is actively utilized in runtime, allowing any attacker to forge OTP tokens and register arbitrary verified phone numbers.
3. **Unauthenticated Logistics Webhook:** The BigShip webhook endpoint has zero signature verification or secret authentication, allowing unauthenticated attackers to spoof carrier events, trigger customer emails, and mark orders as delivered.
4. **Brute-Forceable Password Reset OTP:** The 6-digit password reset OTP generated via `Math.random()` is stored in plaintext with no rate-limiting or attempt lockout on verification, enabling password resets via automated brute-force attacks.
5. **Sensitive PII & Hash Logging:** Verbose `console.log` statements in the NextAuth custom Prisma adapter output full user records from the database—including bcrypt password hashes, email addresses, and OAuth access tokens—directly to server logs.

---

### B. Critical Findings

#### [CRIT-01] CRITICAL — SECRET MAY HAVE BEEN EXPOSED IN GIT HISTORY
* **Location:** Git commit history:
  * Commit `280959c268a9cf0debb99de4e7f5e25a3677a5c9` (May 2, 2026)
  * Removed in commit `bab661e05bd47caf07762cef2403266672d5a549` (May 6, 2026)
* **Description:** A live `.env` file was committed directly into the Git repository. While later removed from the working tree and added to `.gitignore`, Git preserves complete commit snapshots permanently.
* **Exposed Credentials in History:**
  1. **Neon PostgreSQL Database URL:** `postgresql://neondb_owner:[REDACTED]@ep-long-haze-ammpfljz-pooler.c-5.us-east-1.aws.neon.tech/neondb`
  2. **Google OAuth Client Secret:** `GOCSPX-Lyp2bn_LVXIPXLW4P4We-[REDACTED]`
  3. **Cloudinary API Secret:** `xbe-JEY5GMt8xoPo4toBtxXtscw` (Key: `462127229595489`)
  4. **Gmail SMTP App Password:** `vslfqbufznwcxepo` (Account: `tailoringturba@gmail.com`)
  5. **NextAuth Secret:** `supersecret_tailoring_turba_key_12345_change_in_production`
* **Current Status:**
  * Cloudinary API Key and Secret in the current `.env` **remain identical to the committed ones**.
  * Anyone who has cloned or has access to the repository (or if pushed to a public/shared GitHub remote) has access to these credentials.
* **Recommended Action:** Immediate rotation of Cloudinary API secret, Google OAuth client secret, and Gmail app passwords. Clean Git history using `git-filter-repo` or BFG Repo-Cleaner before open-sourcing or sharing the repo.

---

#### [CRIT-02] Hardcoded Fallback Secret Enables Phone OTP Verification Bypass
* **Location:** 
  * `src/app/api/auth/verify-otp/route.ts:84`
  * `src/app/api/register/route.ts:178`
* **Vulnerability Analysis:**
  ```typescript
  // In verify-otp/route.ts & register/route.ts
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-for-jwt-signing";
  ```
  The current `.env` defines `AUTH_SECRET` (NextAuth v5 syntax), but does **not** define `NEXTAUTH_SECRET`. As a result, `process.env.NEXTAUTH_SECRET` evaluates to `undefined`.
  The application signs and verifies `phoneVerificationToken` using the static string `"fallback-secret-for-jwt-signing"`.
* **Impact:** An attacker can generate their own valid HMAC-SHA256 signature locally with `"fallback-secret-for-jwt-signing"`, forge a `phoneVerificationToken` for any arbitrary phone number, and register accounts without receiving or verifying an SMS OTP.
* **Recommended Action:** Remove the static fallback string. Explicitly validate that `process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET` exists, or throw a 500 error.

---

#### [CRIT-03] Unauthenticated BigShip Webhook Endpoint
* **Location:** `src/app/api/webhooks/bigship/route.ts:20-63`
* **Vulnerability Analysis:**
  The BigShip webhook receives incoming POST requests and directly modifies database states (`Shipment.status`, `Order.status = "DELIVERED"`, and dispatches outbox customer emails). Unlike the Razorpay webhook, **there is no HMAC signature verification, no authorization header check, and no secret token query parameter**.
* **Impact:** Any unauthenticated third party can send JSON payloads to `/api/webhooks/bigship` with any valid AWB or order ID to prematurely transition orders to `DELIVERED` or trigger phishing/spam outbox emails to customers.
* **Recommended Action:** Require a shared secret token in the request header or query string (e.g., `X-BigShip-Webhook-Secret: ${process.env.BIGSHIP_WEBHOOK_SECRET}`) and verify it timing-safely before processing the payload.

---

### C. High Findings

#### [HIGH-01] Predictable Plaintext Password Reset OTP with No Brute-Force Rate Limiting
* **Location:**
  * `src/app/api/auth/forgot-password/route.ts:28-42`
  * `src/app/api/auth/reset-password/route.ts:18-35`
* **Vulnerability Analysis:**
  1. The OTP is generated with `Math.random()` (`Math.floor(100000 + Math.random() * 900000).toString()`), which is not cryptographically secure (`crypto.randomInt` should be used instead).
  2. The 6-digit OTP is stored in plaintext in the `PasswordResetToken` table.
  3. In `reset-password/route.ts`, there is **no attempt counter, lockout mechanism, or IP rate limiting**. An attacker can send requests trying all 1,000,000 combinations within the 15-minute validity window and take over any account.
* **Recommended Action:**
  * Use `crypto.randomInt(100000, 1000000)` for generation.
  * Store only a cryptographic hash (`crypto.createHash("sha256").update(otp).digest("hex")`) in the database.
  * Limit verification attempts (e.g., max 5 failed attempts before invalidating the token).

---

#### [HIGH-02] Fallback to RAZORPAY_KEY_SECRET in Webhook Signature Verification
* **Location:** `src/app/api/webhooks/razorpay/route.ts:13`
* **Vulnerability Analysis:**
  ```typescript
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  ```
  In `.env`, `RAZORPAY_WEBHOOK_SECRET` is not set. Razorpay webhooks use a dedicated secret configured in the Razorpay Dashboard under Webhook Settings, which is distinct from the API Key Secret. Using `RAZORPAY_KEY_SECRET` will cause signature mismatches if a proper webhook secret is configured in Razorpay, or may lead developers to configure the API key secret inside Razorpay's webhook settings.
* **Recommended Action:** Require `process.env.RAZORPAY_WEBHOOK_SECRET` explicitly and do not fall back to `RAZORPAY_KEY_SECRET`.

---

#### [HIGH-03] NextAuth Adapter Logging Exposes User Password Hashes & OAuth Tokens
* **Location:** `src/lib/auth.ts:29, 39, 45, 61, 72, 88, 101`
* **Vulnerability Analysis:**
  The custom Prisma adapter wraps calls with extensive `console.log`:
  ```typescript
  console.log("[ADAPTER] getUserByAccount returned:", JSON.stringify(res));
  console.log("[ADAPTER] getUserByEmail found user:", JSON.stringify(user));
  console.log("[ADAPTER] linkAccount called with:", JSON.stringify(account));
  ```
  `user` contains the user's `password` (bcrypt hash), `email`, and `phone`. `account` contains OAuth `access_token`, `refresh_token`, and `id_token`.
* **Impact:** In production (Vercel, AWS CloudWatch, Datadog), these statements write customer PII, password hashes, and OAuth access tokens directly into persistent application logs.
* **Recommended Action:** Remove all verbose object logging from `src/lib/auth.ts`.

---

### D. Medium Findings

#### [MED-01] Hardcoded Super Admin Email Escalation
* **Location:**
  * `src/lib/auth.ts:272-284`
  * `src/lib/auth.config.ts:22-24`
  * `src/app/api/register/route.ts:122`
* **Vulnerability Analysis:**
  The email `"tailoringturba@gmail.com"` is hardcoded across 3 separate files to automatically receive `SUPER_ADMIN` role upon login or registration. If that Google account or email address is compromised, or if an account with that email is created before verification, full administrative control is granted automatically.
* **Recommended Action:** Move administrative privileges to environment configuration (e.g., `SUPER_ADMIN_EMAILS="tailoringturba@gmail.com"`), or manage role assignments strictly via database migration/seed scripts.

---

#### [MED-02] Public Order Tracking Endpoint Lacks Rate Limiting (Enumeration Risk)
* **Location:** `src/app/api/orders/track-public/route.ts:28-63`
* **Vulnerability Analysis:**
  The public tracking route matches by `orderNumber` OR `id` OR `awbNumber`, combined with an email or phone match (`contains`). While requiring contact info mitigates blind scraping, there is no rate limiting on this public endpoint. An attacker with a phone number or email could script queries against sequential order numbers (e.g., 1001, 1002, 1003) to harvest purchase histories.
* **Recommended Action:** Implement IP-based and identifier-based rate limiting (e.g., 10 requests per minute per IP).

---

#### [MED-03] Unauthenticated Mock Mode Allows OTP Bypass in Non-Production
* **Location:**
  * `src/app/api/auth/send-otp/route.ts:95-103`
  * `src/app/api/auth/verify-otp/route.ts:70-76`
* **Vulnerability Analysis:**
  When `ENABLE_MOCK_AUTH="true"`, any OTP with value `"123456"` or any 6-digit numeric string is accepted without verifying with Firebase or any SMS provider. While gated behind `!isProduction`, if `NODE_ENV` is improperly set in staging or preview deployments, mock authentication would be active.
* **Recommended Action:** Ensure `ENABLE_MOCK_AUTH` is strictly disabled by default and cannot be activated unless `NODE_ENV === "test"`.

---

### E. Low Findings

#### [LOW-01] Docker Compose File Contains Hardcoded Default Database Password
* **Location:** `docker-compose.yml:8`
* **Details:** `POSTGRES_PASSWORD: rootpassword` is committed. This is local development configuration, but should reference an environment variable (`${POSTGRES_PASSWORD:-rootpassword}`) to prevent accidental use in production containers.

#### [LOW-02] Missing `.env.example` File
* **Location:** Repository root
* **Details:** `README.md:87` instructs developers to run `cp .env.example .env`, but `.env.example` does not exist in the repository. New developers have no reference template for required environment variables.

---

### F. Secrets & Credentials Inventory (Without Revealing Values)

| Key Name | Category | Sensitivity | Storage Location | In Git History? | Status / Action Needed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Neon Postgres URL | Critical | `.env`, `.env.local` | **YES (Past Commit)** | Active; Rotate pooler credentials |
| `POSTGRES_PASSWORD` | Neon Postgres Password | Critical | `.env`, `.env.local` | **YES (Past Commit)** | Active; Rotate password in Neon console |
| `AUTH_SECRET` | NextAuth v5 JWT Secret | Critical | `.env`, `.env.local` | No (Dev default) | Needs strong 32+ char random string |
| `NEXTAUTH_SECRET` | NextAuth v4/Custom Secret | Critical | Code Fallback | **YES (Past Commit)** | Missing in `.env`; using static fallback |
| `GOOGLE_CLIENT_SECRET`| Google OAuth Secret | High | `.env`, `.env.local` | **YES (Past Commit)** | Active; Rotate in Google Cloud Console |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Public/Safe | `.env`, `.env.local` | YES | Safe for client/server reference |
| `CLOUDINARY_API_SECRET`| Cloudinary Media Secret | High | `.env`, `.env.local` | **YES (Past Commit)** | **IDENTICAL TO HISTORICALLY COMMITTED KEY**; Rotate immediately |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Medium | `.env`, `.env.local` | YES | Rotate in Cloudinary console |
| `RAZORPAY_KEY_SECRET` | Payment Gateway Secret | Critical | `.env`, `.env.local` | No | Masked in local `.env` |
| `RAZORPAY_KEY_ID` | Payment Key ID | Public/Client | `.env`, `.env.local` | No | Masked in local `.env` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC Secret | Critical | Missing in `.env` | No | Must be configured |
| `BIGSHIP_PASSWORD` | Logistics Auth Password | High | `.env`, `.env.local` | No | Masked in local `.env` |
| `BIGSHIP_ACCESS_KEY` | Logistics API Key | High | `.env`, `.env.local` | No | Masked in local `.env` |
| `SMTP_PASS` | Gmail App Password | High | `.env`, `.env.local` | **YES (Past Commit)** | Rotated since past commit; currently active |
| `RESEND_API_KEY` | Resend Email API Key | High | Not configured | No | Optional fallback in mail.ts |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot CRM Token | High | Not configured | Placeholder in Git | Optional fallback in hubspot.ts |
| `FIREBASE_PRIVATE_KEY`| Service Account Key | Critical | `.env`, `.env.local` | No | Masked in local `.env` |
| `TURNSTILE_SECRET_KEY`| Cloudflare Turnstile | High | `.env`, `.env.local` | No | Active in local `.env` |

---

### G. Environment Variable Exposure Analysis

Next.js automatically inlines any environment variable starting with `NEXT_PUBLIC_` into client-side JavaScript bundles. Any variable **without** `NEXT_PUBLIC_` is kept server-only.

| Variable Name | Intended Scope | Current Prefix | Status |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server-only | None | **SAFE** (Not accessible in browser) |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Server-only | None | **SAFE** (Not accessible in browser) |
| `GOOGLE_CLIENT_SECRET` | Server-only | None | **SAFE** (Not accessible in browser) |
| `CLOUDINARY_API_SECRET` | Server-only | None | **SAFE** (Not accessible in browser) |
| `RAZORPAY_KEY_SECRET` | Server-only | None | **SAFE** (Not accessible in browser) |
| `BIGSHIP_PASSWORD` / `ACCESS_KEY` | Server-only | None | **SAFE** (Not accessible in browser) |
| `SMTP_PASS` | Server-only | None | **SAFE** (Not accessible in browser) |
| `FIREBASE_PRIVATE_KEY` | Server-only | None | **SAFE** (Not accessible in browser) |
| `TURNSTILE_SECRET_KEY` | Server-only | None | **SAFE** (Not accessible in browser) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client & Server | `NEXT_PUBLIC_` | **SAFE** (Required by Razorpay modal) |
| `NEXT_PUBLIC_FIREBASE_*` | Client & Server | `NEXT_PUBLIC_` | **SAFE** (Standard Firebase Client SDK config) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`| Client & Server | `NEXT_PUBLIC_` | **SAFE** (Cloudflare public widget sitekey) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`| Client & Server| `NEXT_PUBLIC_` | **SAFE** (Cloud name is public) |

**Finding:** No private server secrets are improperly prefixed with `NEXT_PUBLIC_`.

---

### H. Git History Findings

* **Finding:** Prior commits in the Git history contained active, unencrypted credentials.
* **Relevant Commits:**
  * `280959c268a9cf0debb99de4e7f5e25a3677a5c9` added `.env` with full plaintext credentials.
  * `bab661e05bd47caf07762cef2403266672d5a549` deleted `.env` and added it to `.gitignore`.
* **Current `.gitignore` State:** Lines 29, 30, and 41 of `.gitignore` correctly list `.env`, `.env*.local`, and `.env*`.
* **Residual Risk:** Anyone with clone access to this repository can run `git show 280959c2:.env` to view the historical database password, Google client secret, and Cloudinary keys.

---

### I. Logging Exposure Findings

| File & Line | Logged Item | Severity | Remediation |
| :--- | :--- | :--- | :--- |
| `src/lib/auth.ts:29, 39` | `JSON.stringify(providerAndId)` & `res` (Prisma User) | **HIGH** | Delete log statement |
| `src/lib/auth.ts:45, 82` | `JSON.stringify(user)` (Includes bcrypt password hash) | **HIGH** | Delete log statement |
| `src/lib/auth.ts:61, 72` | `JSON.stringify(account)` (Includes OAuth tokens) | **HIGH** | Delete log statement |
| `src/lib/auth.ts:88, 101` | `createUser` & `linkAccount` responses | **HIGH** | Delete log statement |
| `src/app/api/auth/send-otp/route.ts:92` | Phone number & attempt ID | **LOW** | Mask phone number (e.g. `+91*****1234`) |
| `src/app/api/auth/verify-otp/route.ts:59` | Firebase UID & Phone number | **LOW** | Mask phone number |
| `src/app/api/auth/send-otp/route.ts:103` | Mock OTP logging in non-production | **MED** | Ensure mock log is disabled in production |

---

### J. Client/Server Boundary Findings

1. **Server Utilities Imported in Client Components:** None found. Server modules (`nodemailer`, `resend`, `firebase-admin`, `@prisma/client`, `crypto`, `bcryptjs`) are isolated to API routes and `src/lib/` server files.
2. **Next.js Bundler Verification:** Client components utilize client wrappers (`"use client"`) and communicate with server logic strictly via HTTP `fetch` to `/api/*` endpoints.
3. **API Response Inspection:** 
   * `/api/razorpay/order/route.ts` returns `key_id: process.env.RAZORPAY_KEY_ID`. This is intentional and safe as the Razorpay Key ID is public.
   * Internal database error objects are caught and sanitized in most routes; however, in `api/upload/route.ts:109`, `error.message` is returned to the client, which could leak internal path structures.

---

### K. Exact Files and Line Numbers for Every Finding

1. **Git Historical Secret Exposure:**
   * Commit `280959c268a9cf0debb99de4e7f5e25a3677a5c9` (`.env`)
2. **Hardcoded Fallback Secret in OTP Verification:**
   * `src/app/api/auth/verify-otp/route.ts:84`
   * `src/app/api/register/route.ts:178`
3. **Unauthenticated BigShip Webhook:**
   * `src/app/api/webhooks/bigship/route.ts:20-33`
4. **Insecure Password Reset OTP & Missing Rate Limiting:**
   * `src/app/api/auth/forgot-password/route.ts:28-43`
   * `src/app/api/auth/reset-password/route.ts:18-35`
5. **Razorpay Webhook Secret Fallback:**
   * `src/app/api/webhooks/razorpay/route.ts:13`
6. **PII and Password Hash Console Logging:**
   * `src/lib/auth.ts:29, 36, 39, 43, 45, 61, 72, 86, 88, 91, 101`
7. **Hardcoded Admin Email:**
   * `src/lib/auth.ts:272`
   * `src/lib/auth.config.ts:22`
   * `src/app/api/register/route.ts:122`

---

### L. Recommended Fixes

1. **Remove Hardcoded Secret Fallbacks:**
   * In `verify-otp/route.ts` and `register/route.ts`, replace `process.env.NEXTAUTH_SECRET || "fallback-secret-for-jwt-signing"` with:
     ```typescript
     const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
     if (!secret) {
       console.error("[AUTH] Neither AUTH_SECRET nor NEXTAUTH_SECRET is configured.");
       return NextResponse.json({ error: "Auth configuration error." }, { status: 500 });
     }
     ```
2. **Secure the BigShip Webhook:**
   * Introduce a shared webhook token check (`x-bigship-token` header or query token) in `api/webhooks/bigship/route.ts`.
3. **Harden Password Reset:**
   * Generate OTP using `crypto.randomInt(100000, 1000000)`.
   * Store `crypto.createHash("sha256").update(otp).digest("hex")` in `PasswordResetToken`.
   * Implement a failed-attempt counter (invalidate token after 5 incorrect entries).
4. **Remove Sensitive Console Logs:**
   * Strip out `console.log` calls in `src/lib/auth.ts` that dump `user`, `account`, and `providerAndId`.
5. **Add `.env.example`:**
   * Create a standardized `.env.example` with placeholder strings only.

---

### M. Items Requiring Credential Rotation

> [!WARNING]
> Because these credentials were historically committed to Git (commit `280959c268a9cf0debb99de4e7f5e25a3677a5c9`), they should be treated as compromised.

1. **Cloudinary API Secret:**
   * *Status:* The secret in the active `.env` matches the leaked secret.
   * *Action:* Generate a new API Key/Secret pair in the Cloudinary Console; update `.env` and Vercel dashboard; revoke the old pair.
2. **Neon Database Password:**
   * *Status:* The database user `neondb_owner` password was exposed in commit `280959c2`.
   * *Action:* Reset the password for `neondb_owner` in the Neon Cloud Console and update `DATABASE_URL` in `.env` and Vercel.
3. **Google OAuth Client Secret:**
   * *Status:* Google OAuth Secret `GOCSPX-Lyp2bn_...` was committed. (A different key `GOCSPX-57z7O...` is currently in `.env`).
   * *Action:* Verify in the Google Cloud Console that the old secret (`GOCSPX-Lyp2bn_...`) is deleted.
4. **Gmail SMTP Application Password:**
   * *Status:* The password `vslfqbufznwcxepo` was committed. (A different app password is in the current `.env`).
   * *Action:* Delete the old app password in Google Account Security settings.

---

### N. Items That Are Already Secure

1. **SQL Injection Protection:** Prisma ORM is utilized for all database queries with no raw SQL queries or string concatenations (`$queryRawUnsafe` is not used).
2. **Password Hashing:** User passwords are encrypted using `bcryptjs` with salt work factor 12 during registration and 10 during reset.
3. **Razorpay Signature Verification:** Timing-safe HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) is enforced on payment verification and webhooks.
4. **Idempotent Webhook Processing:** Webhooks for Razorpay and BigShip use the `ProcessedWebhookEvent` table to prevent duplicate replay attacks.
5. **Timing-Safe Email Verification:** Email verification tokens are hashed with SHA-256 before database storage, preventing token theft from database read dumps.
6. **Dispatch Gating & Order Authorization:** Orders cannot be dispatched or manipulated by customers; role-based access control enforces `ADMIN`/`SUPER_ADMIN` restrictions on fulfillment and shipping APIs.
7. **Single-Use OTP Signup Tokens:** Registration via phone requires consuming a unique `signupAttemptId` stored in `UsedSignupAttempt` within a transactional boundary, preventing replay attacks.
