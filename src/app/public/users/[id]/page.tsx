import { getUser } from "@/lib/userStore";
import { notFound } from "next/navigation";
import PublicProfileClient from "./PublicProfileClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = getUser(id);
  if (!user) {
    notFound();
  }
  return <PublicProfileClient user={user} />;
}
