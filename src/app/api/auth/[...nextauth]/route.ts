import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sendEmail } from "@/lib/email";
import { orm } from "@/lib/orm";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

const verFile = path.join(os.tmpdir(), "verification-url.txt");

export const runtime = "nodejs";

export const authOptions = {
  adapter: DrizzleAdapter(orm),
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        if (process.env.CI === "1") {
          fs.writeFileSync(verFile, url, "utf8");
          return;
        }
        await sendEmail({ to: identifier, subject: "Sign in", body: url });
      },
      from: process.env.SMTP_FROM,
    }),
  ],
  pages: { signIn: "/signin" },
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
