import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getAnonymousSessionId } from "@/lib/anonymousSession";
import { authorize, loadAuthContext } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { getCaseForUpload } from "@/lib/caseStore";

import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  {
    params,
    session,
  }: {
    params: Promise<{ path: string[] }>;
    session?: { user?: { id?: string; role?: string } };
  },
): Promise<Response> {
  const { path: segments } = await params;
  const uploads = config.UPLOAD_DIR;
  const full = path.join(uploads, ...segments);
  if (!full.startsWith(uploads)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const filename = segments[segments.length - 1];
  const caseData = getCaseForUpload(filename);
  if (caseData) {
    const { role, userId } = await loadAuthContext({ session });
    const anonId = getAnonymousSessionId(req);
    const sessionMatch =
      anonId && caseData.sessionId && caseData.sessionId === anonId;
    const authRole = sessionMatch ? "user" : role;
    const authCtx = sessionMatch ? undefined : { caseId: caseData.id, userId };
    if (!(await authorize(authRole, "cases", "read", authCtx))) {
      return new Response(null, { status: 403 });
    }
    if (!caseData.public && role !== "admin" && role !== "superadmin") {
      if (!(sessionMatch || (userId && isCaseMember(caseData.id, userId)))) {
        return new Response(null, { status: 403 });
      }
    }
  }
  try {
    const data = await fs.readFile(full);
    const ext = path.extname(full).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream";
    return new NextResponse(data, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
