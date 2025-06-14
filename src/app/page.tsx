export { dynamic } from "./cases/page";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  redirect(isMobile ? "/point" : "/cases");
}
