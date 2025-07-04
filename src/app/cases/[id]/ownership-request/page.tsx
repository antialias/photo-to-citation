import { getAuthorizedCase } from "@/lib/caseAccess";
import { notFound } from "next/navigation";
import ThreadWrapper from "../ThreadWrapper";

export const dynamic = "force-dynamic";

export default async function OwnershipRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  const email = (c.sentEmails ?? []).find(
    (e) => e.subject === "Ownership information request",
  );
  if (!email) notFound();
  return <ThreadWrapper caseId={id} startId={email.sentAt} caseData={c} />;
}
