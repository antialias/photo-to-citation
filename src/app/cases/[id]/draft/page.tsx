import { authOptions } from "@/lib/authOptions";
import { getAuthorizedCase } from "@/lib/caseAccess";
import { draftEmail } from "@/lib/caseReport";
import { reportModules } from "@/lib/reportModules";
import { getServerSession } from "next-auth/next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import DraftEditor from "./DraftEditor";

export const dynamic = "force-dynamic";

export default async function DraftPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  const reportModule = reportModules["oak-park"];
  const session = await getServerSession(authOptions);
  const sender = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : undefined;
  const cookieStore = await cookies();
  let lang = cookieStore.get("language")?.value;
  if (!lang) {
    const headerList = await headers();
    const accept = headerList.get("accept-language") ?? "";
    const supported = ["en", "es", "fr"];
    for (const part of accept.split(",")) {
      const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
      if (supported.includes(code)) {
        lang = code;
        break;
      }
    }
    lang = lang ?? "en";
  }
  const email = await draftEmail(c, reportModule, sender, lang);
  return (
    <DraftEditor
      caseId={id}
      initialDraft={email}
      attachments={c.photos}
      module={reportModule}
      action="report"
    />
  );
}
