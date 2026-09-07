import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { checkRateLimit } from "@/lib/rate-limit";

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified"
}

export class PhoneNotVerifiedError extends CredentialsSignin {
  code = "phone_not_verified"
}

export class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials"
}

export class RateLimitExceededError extends CredentialsSignin {
  code = "rate_limit_exceeded"
}

const prismaAdapter = PrismaAdapter(prisma);
let lastSocialAccount: { provider: string; providerAccountId: string; time: number } | null = null;

const customAdapter = {
  ...prismaAdapter,
  async getUserByAccount(providerAndId: { provider: string; providerAccountId: string }) {
    if (providerAndId.provider === "google" || providerAndId.provider === "apple") {
      lastSocialAccount = {
        provider: providerAndId.provider,
        providerAccountId: providerAndId.providerAccountId,
        time: Date.now(),
      };
    }
    const res = await (prismaAdapter as any).getUserByAccount(providerAndId);
    return res;
  },
  async getUserByEmail(email: string) {
    const user = await (prismaAdapter as any).getUserByEmail(email);
    
    if (user && lastSocialAccount && (Date.now() - lastSocialAccount.time < 5000)) {
      // SECURITY: If credentials account is NOT verified, reject linking
      if ((user as any).password && !(user as any).emailVerified) {
        lastSocialAccount = null;
        throw new Error("VerificationRequiredToLink");
      }

      try {
        const existingAccount = await prisma.account.findFirst({
          where: {
            provider: lastSocialAccount.provider,
            providerAccountId: lastSocialAccount.providerAccountId,
          },
        });
        
        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: user.id,
              type: "oidc",
              provider: lastSocialAccount.provider,
              providerAccountId: lastSocialAccount.providerAccountId,
            },
          });
        }
      } catch (err: any) {
        console.error("[ADAPTER] failed to auto-link account in custom getUserByEmail:", err.message);
        throw err;
      }
      lastSocialAccount = null;
    }
    
    const finalUser = await (prismaAdapter as any).getUserByEmail(email);
    return finalUser;
  },
  async createUser(user: any) {
    const res = await (prismaAdapter as any).createUser(user);
    return res;
  },
  async linkAccount(account: any) {
    // SECURITY: Double guard, verify user email is verified before linking
    const user = await prisma.user.findUnique({
      where: { id: account.userId },
    });
    if (user && user.password && !user.emailVerified) {
      throw new Error("VerificationRequiredToLink");
    }
    const res = await (prismaAdapter as any).linkAccount(account);
    return res;
  }
};

const providersList: any[] = [
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
      if (!credentials?.email || !credentials?.password) {
        throw new InvalidCredentialsError();
      }

      let searchIdentifier = (credentials.email as string).trim().toLowerCase();

      // Rate limit credential attempts: Max 10 attempts per 15 minutes per identifier
      const rateLimit = checkRateLimit(`login_attempt_${searchIdentifier}`, 10, 15 * 60 * 1000);
      if (!rateLimit.allowed) {
        console.warn(`[AUTH] Login rate limit exceeded for identifier`);
        throw new RateLimitExceededError();
      }

      const parsedPhone = parsePhoneNumberFromString(searchIdentifier, "IN");
      if (parsedPhone && parsedPhone.isValid()) {
        searchIdentifier = parsedPhone.number;
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: searchIdentifier, mode: "insensitive" } },
            { phone: searchIdentifier }
          ]
        }
      });

      if (!user || !user.password) {
        throw new InvalidCredentialsError();
      }

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (!isValid) {
        throw new InvalidCredentialsError();
      }

      // SECURITY: Block unverified login attempts
      if (user.email && !user.emailVerified) {
        throw new EmailNotVerifiedError();
      }
      if (user.phone && !user.phoneVerified && !user.email) {
        throw new PhoneNotVerifiedError();
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
];

const isAppleConfigured = !!(
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_TEAM_ID !== "YOUR_APPLE_TEAM_ID" &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_KEY_ID !== "YOUR_APPLE_KEY_ID" &&
  process.env.APPLE_PRIVATE_KEY &&
  process.env.APPLE_PRIVATE_KEY !== "YOUR_APPLE_PRIVATE_KEY"
);

if (isAppleConfigured) {
  providersList.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: {
        appleId: process.env.APPLE_CLIENT_ID || "",
        teamId: process.env.APPLE_TEAM_ID || "",
        keyId: process.env.APPLE_KEY_ID || "",
        privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
      } as any,
      allowDangerousEmailAccountLinking: true,
    } as any)
  );
} else {
  console.warn("[AUTH] Apple Sign In is not fully configured in environment variables. Skipping AppleProvider initialization.");
}

/**
 * Full auth config — Node.js only (includes Prisma adapter + providers).
 * Do NOT import this in middleware.ts; use auth.config.ts there instead.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: customAdapter as any,
  providers: providersList,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account && (account.provider === "google" || account.provider === "apple") && user.email) {
        // Enforce Google email_verified validation
        if (account.provider === "google") {
          const googleProfile = profile as { email_verified?: boolean } | undefined;
          const isGoogleVerified = googleProfile?.email_verified === true;
          if (!isGoogleVerified) {
            console.log(`[AUTH] Rejecting Google sign-in: email is not verified.`);
            return `/login?error=OAuthSignin`;
          }
        }

        // Validate Apple identity
        if (account.provider === "apple") {
          if (!user.email) {
            console.log(`[AUTH] Rejecting Apple sign-in: email is missing.`);
            return `/login?error=OAuthSignin`;
          }
        }

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          if (dbUser) {
            // Check if this provider is already linked
            const hasLink = dbUser.accounts.some(
              (acc) => acc.provider === account.provider
            );

            if (!hasLink) {
              // SECURITY: If credentials account is NOT verified, block account linking
              if (dbUser.password && !dbUser.emailVerified) {
                console.log(`[AUTH] Rejecting auto-link of ${account.provider} because user ${user.email} is unverified credentials user.`);
                return `/login?error=VerificationRequiredToLink`;
              }

              // Manually link the social account to the existing verified user
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
                  session_state: (account.session_state as string) ?? null,
                },
              });
              console.log(`Manually linked ${account.provider} account for existing user: ${user.email}`);
            }
          }
        } catch (error) {
          console.error(`Error linking ${account.provider} account to existing user:`, error);
          if (error instanceof Error && error.message === "VerificationRequiredToLink") {
            return `/login?error=VerificationRequiredToLink`;
          }
        }
      }

      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (user.email && superAdminEmails.length > 0 && superAdminEmails.includes(user.email.toLowerCase())) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser && dbUser.role !== "SUPER_ADMIN") {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: "SUPER_ADMIN" },
            });
            console.log(`Configured bootstrap: Promoted ${user.email} to SUPER_ADMIN`);
          }
        } catch (error) {
          console.error("Error promoting admin in database:", error);
        }
      }
      return true;
    },
  },
});
