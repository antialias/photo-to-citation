import { writeFile } from "node:fs/promises";
import { authAdapter, seedSuperAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import NextAuth, {
  type NextAuthOptions,
  type Session,
  type User,
} from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";

seedSuperAdmin().catch(() => {});

const authOptions: NextAuthOptions = {
  adapter: authAdapter() as Adapter,
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        if (process.env.TEST_APIS) {
          (global as Record<string, unknown>).verificationUrl = url;
          await writeFile("/tmp/verification-url.txt", url);
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
    async session({
      session,
      user,
    }: { session: Session; user: User & { role?: string } }) {
      if (session.user) {
        (session.user as User & { role?: string }).role = user.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await seedSuperAdmin({ id: user.id, email: user.email ?? null });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
