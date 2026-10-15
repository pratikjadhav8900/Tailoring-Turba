import type { NextAuthConfig } from "next-auth";

// Polyfill AUTH_SECRET for NextAuth v5 using the existing NEXTAUTH_SECRET
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}

/**
 * Edge-compatible auth config.
 * No Prisma, no bcrypt — safe for Next.js Middleware (Edge Runtime).
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [], // Providers are added in auth.ts (Node.js only)
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
    authorized({ auth }) {
      // Allow the middleware to proceed; route-level checks are done in middleware.ts
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};
