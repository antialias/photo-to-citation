import { authOptions } from "@/lib/authOptions";
import { withAuthorization } from "@/lib/authz";
import { getServerSession } from "next-auth/next";
import SnailMailPageClient from "./SnailMailPageClient";

export const dynamic = "force-dynamic";

const handler = withAuthorization({ obj: "cases" }, async () => {
  return <SnailMailPageClient />;
});

export default async function SnailMailPage() {
  const session = await getServerSession(authOptions);
  return handler(new Request("http://localhost"), {
    params: Promise.resolve({}),
    session: session ?? undefined,
  });
}
