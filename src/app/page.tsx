export { dynamic } from "./cases/page";
import { withBasePath } from "@/basePath";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoggedOutLanding from "./LoggedOutLanding";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <LoggedOutLanding />;
  }
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  redirect(withBasePath(isMobile ? "/point" : "/cases"));
}
