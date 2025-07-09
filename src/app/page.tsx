export { dynamic } from "./cases/page";
import { withBasePath } from "@/basePath";
import { log } from "@/lib/logger";
import isMobile from "is-mobile";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoggedOutLanding from "./LoggedOutLanding";
import { SessionContext } from "./server-context";

export default async function Home() {
  const session = SessionContext.read();
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
