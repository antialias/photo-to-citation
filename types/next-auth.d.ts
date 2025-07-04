import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      role: string;
      language?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    language?: string | null;
  }
}
