import { withAuthorization } from "@/lib/authz";
import { SessionContext } from "../server-context";
import SnailMailPageClient from "./SnailMailPageClient";

export const dynamic = "force-dynamic";

const handler = withAuthorization({ obj: "cases" }, async () => {
  return <SnailMailPageClient />;
});

export default async function SnailMailPage() {
  const session = SessionContext.read();
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({}),
    session: session ?? undefined,
  });
}
