# Tailoring Turba - Troubleshooting & Cache Recovery Guide

This guide explains how to fix site recovery issues, missing Navbar/Footer layouts, CSS rendering issues, or `MODULE_NOT_FOUND` errors if they ever occur again.

---

## 1. Fast Fix: Next.js Cache & Module Not Found Errors

### Symptoms
* Pages load blank, missing Navbar or Footer.
* Terminal shows `MODULE_NOT_FOUND` or failed imports like `Cannot find module './1682.js'`.
* Styling or JS functionality stops updating despite code being modified.

### Cause
Next.js stores compiled Webpack build chunks inside the local `.next` folder. When source files are updated frequently while the dev server is active or interrupted mid-build, Webpack renumbers compiled chunks. The server can get stuck referencing stale chunk IDs, resulting in module loading crashes.

### Step-by-Step Resolution

1. **Stop the Running Dev Server**
   In your terminal, press `Ctrl + C` (or kill the process running `npm run dev`).

2. **Delete the `.next` Folder**
   * **In PowerShell / Command Prompt:**
     ```powershell
     Remove-Item -Recurse -Force .next
     ```
   * **Or via File Explorer:** Delete the `.next` directory inside the project root (`Tailoring Turba/.next`).

3. **Restart the Dev Server Fresh**
   ```bash
   npm run dev
   ```

4. **Refresh the Browser**
   Wait ~30 seconds for the initial Next.js compilation to complete (`✓ Ready in ...`), then refresh your browser page at `http://localhost:3000`.

---

## 2. Core Architecture Rules & Guards

To prevent pages from breaking or going blank during future code changes, strictly follow these structural rules:

### A. Client-Side Hydration Guard (`src/app/LayoutWrapper.tsx`)
* **Never remove the `mounted` state check in `LayoutWrapper.tsx`.**
* **Why?** Context providers like `useSession()`, `useCart()`, and `useWishlist()` rely on client-side browser storage and state. If components try to render on the server during initial HTML SSR without the `mounted` guard, React encounters a hydration mismatch error, causing the entire layout (Navbar/Footer) to crash.

**Correct Implementation in `LayoutWrapper.tsx`:**
```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return null; // Prevents SSR hydration mismatch crash
}
```

### B. Global CSS Overrides (`src/app/globals.css`)
* **Never add aggressive global selector overrides.**
* **Example of problematic rule:**
  ```css
  /* DO NOT ADD THIS - Breaks Next.js Image fill layout across all pages */
  img[data-nimg="fill"] {
    position: static !important;
    height: 100% !important;
  }
  ```
* Next.js `<Image fill />` components depend on standard absolute positioning. Overriding this globally collapses hero sections and product image grids across the site. Use component-specific CSS Modules (`.module.css`) for layout changes instead.

---

## 3. Command Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Start Dev Server** | `npm run dev` |
| **Clear Next Build Cache** | `Remove-Item -Recurse -Force .next` |
| **Check TypeScript Errors** | `npx tsc --noEmit` |
| **Run E2E Tests** | `npx playwright test` |

---
*Keep this document saved in the root of the workspace for future reference.*
