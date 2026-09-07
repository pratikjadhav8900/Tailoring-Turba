import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

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

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    const role = (session.user as { role?: string })?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const response = NextResponse.next();

  // 1. Core Browser Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // 2. Tailored Content Security Policy (Non-breaking for Razorpay, Cloudinary, Fonts, Turnstile, Firebase)
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
