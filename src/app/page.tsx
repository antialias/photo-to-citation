export { dynamic } from "./cases/page";
import { withBasePath } from "@/basePath";
import { authOptions } from "@/lib/authOptions";
import { log } from "@/lib/logger";
import isMobile from "is-mobile";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoggedOutLanding from "./LoggedOutLanding";

export default async function Home() {
  const session = await getServerSession(authOptions);
  log("home session", !!session);
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobileBrowser = isMobile({ ua });
  if (!session) {
    if (isMobileBrowser) {
      redirect(withBasePath("/point"));
    }
    return <LoggedOutLanding />;
  }
  redirect(withBasePath(isMobileBrowser ? "/point" : "/cases"));
}
