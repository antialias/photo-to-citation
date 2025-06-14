export { dynamic } from "./cases/page";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const ua = headers().get("user-agent") ?? "";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  redirect(isMobile ? "/point" : "/cases");
}
