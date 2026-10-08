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
  const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const hostname = rawHost.toLowerCase();
  const isOpsDomain = hostname.startsWith("ops.") || hostname.startsWith("ops-");

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

    // 2. Unauthenticated check for Ops Domain
    if (!session && !isOpsLogin) {
      const fullPath = pathname + req.nextUrl.search;
      const callbackUrl = encodeURIComponent(fullPath);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }

    // 3. Login page on Ops Domain: rewrite /login to /ops/login
    if (pathname === "/login") {
      const rewriteUrl = new URL(`/ops/login${req.nextUrl.search}`, req.url);
      return applySecurityHeaders(NextResponse.rewrite(rewriteUrl));
    }

    // 4. If path already starts with /ops, let it proceed directly
    if (pathname.startsWith("/ops")) {
      return applySecurityHeaders(NextResponse.next());
    }

    // 5. Rewrite public ops paths into internal /ops directory
    // Examples:
    //   / -> /ops
    //   /orders -> /ops/orders
    //   /orders/1001 -> /ops/orders/1001
    const internalPath = pathname === "/" ? "/ops" : `/ops${pathname}`;
    const rewriteUrl = new URL(`${internalPath}${req.nextUrl.search}`, req.url);
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
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }
  }

  // Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    const role = (session.user as { role?: string })?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Ops Routes accessed directly on Public Domain (e.g. /ops, /ops/orders)
  if (pathname.startsWith("/ops") && !pathname.startsWith("/ops/login")) {
    if (!session) {
      const fullPath = req.nextUrl.pathname + req.nextUrl.search;
      const callbackUrl = encodeURIComponent(fullPath);
      return NextResponse.redirect(new URL(`/ops/login?callbackUrl=${callbackUrl}`, req.url));
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
