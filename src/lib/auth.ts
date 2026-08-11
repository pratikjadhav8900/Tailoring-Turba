import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";

const prismaAdapter = PrismaAdapter(prisma);
let lastGoogleAccount: { providerAccountId: string; time: number } | null = null;

const customAdapter = {
  ...prismaAdapter,
  async getUserByAccount(providerAndId: { provider: string; providerAccountId: string }) {
    if (providerAndId.provider === "google") {
      lastGoogleAccount = {
        providerAccountId: providerAndId.providerAccountId,
        time: Date.now(),
      };
    }
    return prismaAdapter.getUserByAccount(providerAndId);
  },
  async getUserByEmail(email: string) {
    const user = await prismaAdapter.getUserByEmail(email);
    
    if (user && lastGoogleAccount && (Date.now() - lastGoogleAccount.time < 3000)) {
      try {
        const existingAccount = await prisma.account.findFirst({
          where: {
            provider: "google",
            providerAccountId: lastGoogleAccount.providerAccountId,
          },
        });
        
        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: user.id,
              type: "oidc",
              provider: "google",
              providerAccountId: lastGoogleAccount.providerAccountId,
            },
          });
          console.log(`Auto-linked Google account (${lastGoogleAccount.providerAccountId}) to existing credentials user: ${email}`);
        }
      } catch (err) {
        console.error("Failed to auto-link account in custom getUserByEmail adapter:", err);
      }
      lastGoogleAccount = null;
    }
    
    return prismaAdapter.getUserByEmail(email);
  },
};

/**
 * Full auth config — Node.js only (includes Prisma adapter + providers).
 * Do NOT import this in middleware.ts; use auth.config.ts there instead.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: customAdapter as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account && account.provider === "google" && user.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          if (dbUser) {
            // Check if Google account is already linked
            const hasGoogleLink = dbUser.accounts.some(
              (acc) => acc.provider === "google"
            );

            if (!hasGoogleLink) {
              // Manually link the Google account to the existing credentials user
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
              console.log(`Manually linked Google account for existing user: ${user.email}`);
            }
          }
        } catch (error) {
          console.error("Error linking Google account to existing user:", error);
        }
      }

      if (user.email === "tailoringturba@gmail.com") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser && dbUser.role !== "SUPER_ADMIN") {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: "SUPER_ADMIN" },
            });
            console.log("Database: Promoted tailoringturba@gmail.com to SUPER_ADMIN");
          }
        } catch (error) {
          console.error("Error promoting admin in database:", error);
        }
      }
      return true;
    },
  },
});
