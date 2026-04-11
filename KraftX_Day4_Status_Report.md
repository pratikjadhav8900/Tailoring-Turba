# KraftX Platform — Day 4 Status Report

**Date:** April 6, 2026
**Project:** KraftX B2B2C Corporate Gifts E-Commerce Platform (Tailoring Tourba)
**Status:** Active Development — Day 4 Sprint Completed
**Sprint Theme:** Master Catalogue Integration & Product Data Overhaul

---

## 1. Executive Summary

Day 4 marked a significant milestone in the KraftX platform evolution. The primary objective was to integrate the **Master Corporate Gifts Catalogue 2026–2027** — a 69-page, 25-category product catalogue — into the platform as a permanent, database-driven feature. This involved a complete product data overhaul, new Prisma models, dedicated front-end catalogue routes, and a full API layer bridging Cloudinary-hosted catalogue imagery to the customer-facing UI.

---

## 2. Completed Work — Day 4

### A. Product Data Overhaul
- Replaced the previous placeholder mock product data (generic clothing items) across both the **Homepage Featured Products section** (`ProductsSection.tsx`) and the **Products listing page** (`/products`) with accurate corporate gift sets drawn from the Master Catalogue.
- New products include real SKU codes and descriptions across categories: Gift Sets, Drinkware, Diaries, Eco-Friendly items, and Accessories.

---

### B. Master Catalogue Database Integration

#### Prisma Schema — New Models Added
Two new database models have been added to `prisma/schema.prisma`:

| Model | Purpose |
|---|---|
| `CatalogueCategory` | Stores the 25 corporate gift categories with descriptions, HSN codes, GST rates, and an array of catalogue page numbers |
| `CatalogueProduct` | Individual product entries linked to categories with product code, name, spec, HSN/GST, and B2B flags |

Additional schema changes:
- `CATALOGUE_ENQUIRY` added to the `OrderStatus` enum for tracking catalogue-based quote enquiries.
- `isB2B: true` (default) and `minOrderQuantity: 50` (default) set on all `CatalogueProduct` records.

#### Database Migration
- Migration `add_catalogue` successfully applied against the NeonDB (PostgreSQL) instance.
- All previous data tables preserved.

---

### C. Catalogue Seed Data

| File | Purpose |
|---|---|
| `src/lib/catalogue-data.ts` | Full static data for all 25 categories and hundreds of product entries — the single source of truth |
| `prisma/seeds/catalogue.ts` | Idempotent seed script — clears and re-seeds on each run |
| `prisma/seed.ts` | Entry-point seed runner |

**Seed Outcome:** ✅ All 25 categories and their associated products successfully inserted into the database.

---

### D. Cloudinary Integration

`getCataloguePageUrl(pageNumber)` helper added to `src/lib/cloudinary.ts`. This generates the predictable URL for each of the 69 catalogue page images:
```
https://res.cloudinary.com/{CLOUD_NAME}/image/upload/q_auto,f_auto,w_1200/kraftx/catalogue/pages/page-{NN}.jpg
```
Images are expected at `kraftx/catalogue/pages/page-01.jpg` → `page-69.jpg` in Cloudinary.

---

### E. New API Routes

| Route | Method | Description |
|---|---|---|
| `/api/catalogue` | GET | Returns all 25 categories with Cloudinary-powered page image URLs |
| `/api/catalogue/[slug]` | GET | Returns a single category + all its products + all page image URLs |

---

### F. New Frontend Pages

#### 1. `/products/catalogue` — Main Catalogue Browsing Page
- Full-width hero banner: **"Corporate Gifts Catalogue 2026–2027"**
- Horizontal scrollable category filter tabs (25 categories + "All")
- Masonry grid of category cards, each showing:
  - Catalogue page thumbnail (from Cloudinary)
  - Category name and page count
  - **"View Details"** → links to category detail page
  - **"Request Quote"** → links to `/contact?category={slug}`
- Graceful error state in case DB/API is unavailable
- CSS Module styled, fully responsive

#### 2. `/products/catalogue/[slug]` — Category Detail Page
- Breadcrumb navigation: Home → Catalogue → Category Name
- Header with category name, full description, HSN/GST badges
- **"Request Bulk Quote"** CTA (links to `/contact?category={slug}`)
- **"View Raw Catalogue Page"** link (direct Cloudinary URL)
- **Catalogue Image Gallery** — grid of all pages for the category with hover zoom effect and a custom built-in Lightbox (arrow navigation)
- **Products List Grid** — displays all individual products (code, name, spec) where applicable
- CSS Module styled, responsive

---

### G. Navbar Update
- **"Corporate Gifts Catalogue 🆕"** link added to the Products mega-menu under a new "Collections" grouping — highlighted in the accent colour for maximum visibility.

---

## 3. Pending / Carry-Over Items

| Item | Status |
|---|---|
| Upload catalogue page images to Cloudinary (`page-01.jpg` → `page-69.jpg`) | ⏳ Manual step by team |
| Payment gateway sandbox testing (Razorpay) | ⏳ Pending |
| Admin catalogue management panel (`/admin/catalogue`) | 🟡 Low priority, deferred |
| Customizer SVG state extraction finalization | ⏳ Pending |
| Admin orders/users panel data tables | ⏳ Pending |

---

## 4. Technical Debt & Notes

- **Prisma Client regeneration:** When running `npx prisma migrate dev` while the Next.js dev server is running, the Prisma client DLL gets locked on Windows. Workaround: use `prisma migrate deploy` + `npx tsx prisma/seed.ts` separately, then restart the dev server.
- **yet-another-react-lightbox** was considered for the image lightbox but was replaced with a custom built-in modal to avoid npm install issues with the running dev server. Can be swapped in later.

---

## 5. File Index — Day 4 Created / Modified

| File | Action |
|---|---|
| `prisma/schema.prisma` | Modified — added `CatalogueCategory`, `CatalogueProduct`, `CATALOGUE_ENQUIRY` |
| `src/lib/catalogue-data.ts` | Created — full catalogue static data |
| `prisma/seeds/catalogue.ts` | Created — seed script |
| `prisma/seed.ts` | Created — seed entry point |
| `src/lib/cloudinary.ts` | Modified — added `getCataloguePageUrl()` |
| `src/app/api/catalogue/route.ts` | Created — GET all categories API |
| `src/app/api/catalogue/[slug]/route.ts` | Created — GET single category API |
| `src/app/products/catalogue/page.tsx` | Created — Catalogue listing page |
| `src/app/products/catalogue/page.module.css` | Created — Catalogue listing styles |
| `src/app/products/catalogue/[slug]/page.tsx` | Created — Category detail page |
| `src/app/products/catalogue/[slug]/page.module.css` | Created — Category detail styles |
| `src/components/Navbar.tsx` | Modified — added Catalogue link |
| `src/app/products/page.tsx` | Modified — replaced mock products with real catalogue data |
| `src/components/landing/ProductsSection.tsx` | Modified — replaced homepage mock with real products |

---

*End of Day 4 Status Report — KraftX Platform*
