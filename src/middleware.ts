import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://challenges.cloudflare.com https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://plus.unsplash.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://api.razorpay.com https://challenges.cloudflare.com https://accounts.google.com",
    "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://challenges.cloudflare.com https://res.cloudinary.com https://api.cloudinary.com https://api.bigship.direct https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.hubapi.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const rawHostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host || "";
  const host = rawHostHeader.split(",")[0].trim();
  const hostname = host.split(":")[0].toLowerCase();
  const isOpsDomain = hostname.startsWith("ops.") || hostname.startsWith("ops-");
  const proto = req.headers.get("x-forwarded-proto") || (hostname.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // Allow QR phone upload without separate mobile login
  if (pathname === "/customizer/upload-phone") {
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return response;
  }

  // ==========================================
  // OPS SUBDOMAIN ROUTING (ops.tailoringturba.com)
  // ==========================================
  if (isOpsDomain) {
    // 1. Pass API routes directly through to /api/*
    if (pathname.startsWith("/api")) {
      return applySecurityHeaders(NextResponse.next());
    }

    const isOpsLogin = pathname === "/login" || pathname === "/ops/login";
    const userRole = (session?.user as { role?: string })?.role;
    const isAuthorizedOpsUser = userRole === "EMPLOYEE" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    // 2. Unauthenticated check for Ops Domain
    if (!session) {
      if (pathname === "/ops/login") {
        return applySecurityHeaders(NextResponse.next());
      }
      if (pathname === "/login") {
        const rewriteUrl = new URL(`/ops/login${req.nextUrl.search}`, origin);
        return applySecurityHeaders(NextResponse.rewrite(rewriteUrl));
      }
      // Redirect to dedicated Ops login station on this same subdomain
      const redirectUrl = new URL("/ops/login", origin);
      if (pathname !== "/" && pathname !== "/ops") {
        redirectUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
      }
      return NextResponse.redirect(redirectUrl);
    }

    // 3. User is authenticated with a non-staff/customer role
    if (!isAuthorizedOpsUser) {
      if (isOpsLogin) {
        return applySecurityHeaders(NextResponse.next());
      }
      return NextResponse.redirect(new URL("/ops/login?error=UnauthorizedRole", origin));
    }

    // 4. Authenticated staff accessing login page -> redirect to Ops Dashboard
    if (isOpsLogin) {
      return NextResponse.redirect(new URL("/ops", origin));
    }

    // 5. If path already starts with /ops, let it proceed directly
    if (pathname.startsWith("/ops")) {
      return applySecurityHeaders(NextResponse.next());
    }

    // 6. Rewrite public ops paths into internal /ops directory
    // Examples:
    //   / -> /ops
    //   /orders -> /ops/orders
    //   /tasks -> /ops/tasks
    const internalPath = pathname === "/" ? "/ops" : `/ops${pathname}`;
    const rewriteUrl = new URL(`${internalPath}${req.nextUrl.search}`, origin);
    return applySecurityHeaders(NextResponse.rewrite(rewriteUrl));
  }

  // ==========================================
  // PUBLIC DOMAIN ROUTING (tailoringturba.com)
  // ==========================================

  // Customer Protected Routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/customizer") ||
    pathname.startsWith("/create")
  ) {
    if (!session) {
      const fullPath = req.nextUrl.pathname + req.nextUrl.search;
      const callbackUrl = encodeURIComponent(fullPath);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, origin));
    }
  }

  // Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", origin));
    const role = (session.user as { role?: string })?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", origin));
    }
  }

  // Ops Routes accessed directly on Public Domain (e.g. /ops, /ops/orders)
  if ((pathname === "/ops" || pathname.startsWith("/ops/")) && !pathname.startsWith("/ops/login")) {
    if (!session) {
      const fullPath = req.nextUrl.pathname + req.nextUrl.search;
      const callbackUrl = encodeURIComponent(fullPath);
      return NextResponse.redirect(new URL(`/ops/login?callbackUrl=${callbackUrl}`, origin));
    }
    const role = (session.user as { role?: string })?.role;
    if (role !== "EMPLOYEE" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/ops/login?error=UnauthorizedRole", origin));
    }
  }

  // Sales CRM Routes (e.g. /crm, /crm/leads). Only a session + staff role gate here;
  // the finer-grained department === "SALES" check happens in requireCrmAuth() (needs Prisma, Edge middleware can't).
  if ((pathname === "/crm" || pathname.startsWith("/crm/")) && !pathname.startsWith("/crm/login")) {
    if (!session) {
      const fullPath = req.nextUrl.pathname + req.nextUrl.search;
      const callbackUrl = encodeURIComponent(fullPath);
      return NextResponse.redirect(new URL(`/crm/login?callbackUrl=${callbackUrl}`, origin));
    }
    const role = (session.user as { role?: string })?.role;
    if (role !== "EMPLOYEE" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/crm/login?error=UnauthorizedRole", origin));
    }
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset folders
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
