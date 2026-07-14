# 👕 Tailoring Turba — Codebase Architecture & Guidelines

This document provides a clean overview of the Tailoring Turba project architecture, directory structure, naming conventions, component guidelines, and development workflows.

---

## 1. Project Structure Overview

```
Tailoring Turba/
├── prisma/                 # Database schema and seed scripts
│   ├── schema.prisma       # Prisma DB schema
│   ├── seeds/              # Database seed files
│   └── seed.ts             # Main seed runner
├── public/                 # Static assets (images, fonts, vector mockups)
│   ├── catalogue/          # Digital catalog page images
│   ├── illustrations/      # Empty states & illustrations
│   └── mockups/            # Transparent base and overlay files for customizer
├── src/
│   ├── app/                # Next.js App Router (pages & API routes)
│   │   ├── (auth)/         # Login, Registration, Forgot Password
│   │   ├── admin/          # Admin control panel and order management
│   │   ├── api/            # API Route handlers
│   │   ├── booking/        # Visit scheduler and showroom bookings
│   │   ├── cart/           # User shopping cart page
│   │   ├── checkout/       # Checkout flow & partial payments
│   │   ├── customizer/     # Canvas-based shirt design customizer
│   │   ├── dashboard/      # Customer order tracking & history
│   │   └── products/       # Public catalog and categories
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Shell-level elements (Navbar, MobileNav, Footer)
│   │   ├── ui/             # Atomic components (Skeleton, EmptyState, etc.)
│   │   ├── shared/         # Interactive elements (WhatsAppButton, CompareTray)
│   │   ├── admin/          # Dashboard sub-views and tables
│   │   ├── auth/           # OAuth & standard credential forms
│   │   ├── customizer/     # Customizer toolbar, tool panels, canvas
│   │   └── landing/        # Sections on the landing page
│   ├── contexts/           # Global React state providers (Cart, Wishlist, Compare)
│   ├── lib/                # Third-party integrations & core business logic
│   ├── types/              # Static TypeScript type definitions
│   └── middleware.ts       # Security headers and route-guard middleware
├── tests/                  # Playwright e2e/integration test files
├── vitest.config.ts        # Vitest configuration file
└── tailwind.config.ts      # Tailwind CSS style configuration
```

---

## 2. Folder Explanation

* **`src/app`**: Contains the route definitions and route handlers for the website using Next.js App Router. Pages are organized by feature area (e.g. `/cart`, `/checkout`, `/customizer`).
* **`src/components`**: All UI components. Divided into:
  * `layout`: Global structure (header, footer, navs)
  * `ui`: Pure presentational or loading items
  * `shared`: Utility widgets used across routes
  * Feature folders (`admin`, `auth`, `customizer`, `landing`) to house route-specific React views.
* **`src/contexts`**: State providers wrapping the page tree to handle volatile state (e.g. current shopping cart items, comparison tray elements, and wishlist status).
* **`src/lib`**: Third-party wrapper scripts and shared utilities (e.g. PDF generation, nodemailer setup, BigShip shipping integration, Cloudinary, and fabric database definitions).
* **`src/types`**: Declared types and interfaces for the customizer options and next-auth extensions.

---

## 3. Architecture Explanation

Tailoring Turba is structured around **feature modularity** and **separation of concerns**:
* **Frontend**: Next.js 14 App Router, built with client-side state hydration, lazy loading, and dynamic components where appropriate. Styling utilizes HSL brand tokens defined in `globals.css` combined with custom Tailwind CSS utility configurations.
* **Backend Services**: Serverless database interactions with a PostgreSQL backend mediated by Prisma client.
* **Logistics & Payments**: Integrated with Razorpay for secure multi-stage payments and BigShip APIs for outbound courier booking and automated tracking.
* **Customizer Logic**: Utilizes high-performance client-side rendering with canvas layouts, custom color layers, and fabric specifications, completely free of bulky or legacy libraries.

---

## 4. Naming Conventions Guide

To keep the project easily understandable for new developers, we adhere to the following rules:

* **React Components**: CamelCase with `.tsx` extension (e.g., `ProductCardSkeleton.tsx`, `WhatsAppButton.tsx`).
* **Stylesheets**: Matching naming with `.module.css` suffix (e.g., `Navbar.module.css`).
* **Utilities & Scripts**: kebab-case with `.ts` extension (e.g., `customizer-utils.ts`, `auth.config.ts`).
* **CSS Variable Tokens**: Prefixed with `--color-` or `--tth-` (e.g. `--color-primary-500`, `--tth-olive-dark`).

---

## 5. Reusable Component Guide

Key reusable components that you can import directly:

* **`Skeleton`** (`@/components/ui/Skeleton`): Renders a loading block with customizable width, height, and border-radius.
* **`EmptyState`** (`@/components/ui/EmptyState`): Renders standard empty-state messages for cart, orders, or search results.
* **`WhatsAppButton`** (`@/components/shared/WhatsAppButton`): Pulse-animated support chat button that sticks to the bottom corner.
* **`CompareTray`** (`@/components/shared/CompareTray`): The overlay comparison panel showing chosen items to compare specifications.

---

## 6. Setup Instructions

1. **Verify Prerequisites**:
   * Node.js v18 or later.
   * PostgreSQL database running locally or via a cloud provider.

2. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="postgresql://user:pass@host/db"
   NEXTAUTH_SECRET="your_nextauth_jwt_secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Initialize Database Schema**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Seed the database**:
   ```bash
   npx prisma db seed
   ```

6. **Start local development**:
   ```bash
   npm run dev
   ```

---

## 7. Development Workflow Notes

* **Running Production Builds**: Before deploying, always check that the site compiles without compilation or typecheck errors:
  ```bash
  npm run build
  ```
* **Testing E2E Flows**: Playwright tests are defined under `e2e/`. You can trigger them with:
  ```bash
  npm run test:e2e
  ```
* **Code Styling**: Run `npm run lint` regularly to inspect your files for styling and syntax violations.
