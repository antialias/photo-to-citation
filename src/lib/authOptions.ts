import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { authAdapter, seedSuperAdmin } from "./auth";
import { config } from "./config";
import { sendEmail } from "./email";
import { log } from "./logger";

if (
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !config.NEXTAUTH_SECRET
) {
  console.error(
    "NEXTAUTH_SECRET environment variable must be set to preserve sessions",
  );
}

export const authOptions: NextAuthOptions = {
  adapter: authAdapter() as Adapter,
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        log("sendVerificationRequest", identifier);
        if (config.TEST_APIS) {
          (global as Record<string, unknown>).verificationUrl = url;
          const filePath = path.join(os.tmpdir(), "verification-url.txt");
          await writeFile(filePath, url);
          return;
        }
        await sendEmail({ to: identifier, subject: "Sign in", body: url });
        log("Verification email sent", identifier);
      },
      from: config.SMTP_FROM,
    }),
    GoogleProvider({
      clientId: config.GOOGLE_CLIENT_ID ?? "",
      clientSecret: config.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: config.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: config.FACEBOOK_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: { signIn: "/signin" },
  session: { strategy: "database" as const },
  callbacks: {
    async session({
      session,
      user,
    }: { session: Session; user: User & { role?: string } }) {
      log("session callback", user.id);
      if (session.user) {
        (session.user as User & { role?: string }).role = user.role;
        (session.user as User & { id: string }).id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      log("new user", user.id);
      try {
        await seedSuperAdmin({ id: user.id, email: user.email ?? null });
      } catch (err) {
        console.error("Failed to assign super admin role", err);
      }
    },
  },
  secret: config.NEXTAUTH_SECRET,
};
