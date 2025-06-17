import { sendEmail } from "@/lib/email";
import { orm } from "@/lib/orm";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

const authOptions = {
  adapter: DrizzleAdapter(orm),
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        if (process.env.NODE_ENV === "test") {
          (global as Record<string, unknown>).verificationUrl = url;
          return;
        }
        await sendEmail({ to: identifier, subject: "Sign in", body: url });
      },
      from: process.env.SMTP_FROM,
    }),
  ],
  pages: { signIn: "/signin" },
  session: { strategy: "database" as const },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
