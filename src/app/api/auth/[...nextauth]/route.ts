import { authAdapter, seedSuperAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

seedSuperAdmin().catch(() => {});

const authOptions = {
  adapter: authAdapter(),
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
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // biome-ignore lint/suspicious/noExplicitAny: next-auth types
        (session.user as any).role = (user as any).role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await seedSuperAdmin({ id: user.id, email: user.email });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
