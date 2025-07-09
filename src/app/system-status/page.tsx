import { withAuthorization } from "@/lib/authz";
import { SessionContext } from "../server-context";
import SystemStatusClient from "./SystemStatusClient";

export const dynamic = "force-dynamic";

const handler = withAuthorization(
  { obj: "superadmin" },
  async (_req: Request, _ctx: { session?: { user?: { role?: string } } }) => {
    return <SystemStatusClient />;
  },
);

export default async function SystemStatusPage() {
  const session = SessionContext.read();
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({}),
    session: session ?? undefined,
  });
}
