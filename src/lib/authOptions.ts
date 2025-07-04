import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import type { Provider } from "next-auth/providers/index";
import { headers } from "next/headers";
import { authAdapter, seedSuperAdmin } from "./auth";
import { config } from "./config";
import { sendEmail } from "./email";
import { gravatarUrl } from "./gravatar";
import { log } from "./logger";
import { getOauthProviderStatuses } from "./oauthProviders";
import { orm } from "./orm";
import { users } from "./schema";

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
    ...(() => {
      const statuses = getOauthProviderStatuses();
      const googleEnabled = statuses.find((p) => p.id === "google")?.enabled;
      const facebookEnabled = statuses.find(
        (p) => p.id === "facebook",
      )?.enabled;
      const list: Provider[] = [];
      if (googleEnabled) {
        list.push(
          GoogleProvider({
            clientId: config.GOOGLE_CLIENT_ID ?? "",
            clientSecret: config.GOOGLE_CLIENT_SECRET ?? "",
            allowDangerousEmailAccountLinking: true,
          }),
        );
      }
      if (facebookEnabled) {
        list.push(
          FacebookProvider({
            clientId: config.FACEBOOK_CLIENT_ID ?? "",
            clientSecret: config.FACEBOOK_CLIENT_SECRET ?? "",
            allowDangerousEmailAccountLinking: true,
          }),
        );
      }
      return list;
    })(),
  ],
  pages: { signIn: "/signin" },
  session: { strategy: "database" as const },
  callbacks: {
    async session({ session, user }) {
      log("session callback", user.id);
      if (session.user) {
        (session.user as User & { role?: string }).role = user.role;
        (session.user as User & { id: string }).id = user.id;
        (session.user as User & { language?: string | null }).language =
          user.language ?? null;
        if (!session.user.image && user.email) {
          (session.user as User).image = gravatarUrl(user.email);
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      log("new user", user.id);
      try {
        const headerList = await headers();
        let lang: string | undefined;
        const accept = headerList.get("accept-language") ?? "";
        const supported = ["en", "es", "fr"];
        for (const part of accept.split(",")) {
          const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
          if (supported.includes(code)) {
            lang = code;
            break;
          }
        }
        orm
          .update(users)
          .set({ language: lang ?? "en" })
          .where(eq(users.id, user.id))
          .run();
        await seedSuperAdmin({ id: user.id, email: user.email ?? null });
      } catch (err) {
        console.error("Failed to assign super admin role", err);
      }
    },
  },
  secret: config.NEXTAUTH_SECRET,
};
