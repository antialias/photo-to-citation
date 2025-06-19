import { writeFile } from "node:fs/promises";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import { authAdapter } from "./auth";
import { getConfig } from "./config";
import { sendEmail } from "./email";

export const authOptions: NextAuthOptions = {
  adapter: authAdapter() as Adapter,
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        console.log("sendVerificationRequest", identifier);
        const config = getConfig();
        if (config.TEST_APIS) {
          (global as Record<string, unknown>).verificationUrl = url;
          await writeFile("/tmp/verification-url.txt", url);
          return;
        }
        await sendEmail({ to: identifier, subject: "Sign in", body: url });
        console.log("Verification email sent", identifier);
      },
      from: getConfig().SMTP_FROM,
    }),
  ],
  pages: { signIn: "/signin" },
  session: { strategy: "database" as const },
  callbacks: {
    async session({
      session,
      user,
    }: { session: Session; user: User & { role?: string } }) {
      console.log("session callback", user.id);
      if (session.user) {
        (session.user as User & { role?: string }).role = user.role;
        (session.user as User & { id: string }).id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("new user", user.id);
      try {
        await seedSuperAdmin({ id: user.id, email: user.email ?? null });
      } catch (err) {
        console.error("Failed to assign super admin role", err);
      }
    },
  },
  secret: getConfig().NEXTAUTH_SECRET,
};
