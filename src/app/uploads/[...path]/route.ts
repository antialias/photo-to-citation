import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getAnonymousSessionId } from "@/lib/anonymousSession";
import { authorize, loadAuthContext } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { findCaseIdForFile, getCase } from "@/lib/caseStore";

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
  const caseId = findCaseIdForFile(filename);
  if (caseId) {
    const c = getCase(caseId);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { role, userId } = await loadAuthContext({ session });
    const anonId = getAnonymousSessionId(req);
    const sessionMatch = anonId && c.sessionId && c.sessionId === anonId;
    const authRole = sessionMatch ? "user" : role;
    if (!(await authorize(authRole, "cases", "read"))) {
      return new Response(null, { status: 403 });
    }
    if (!c.public && role !== "admin" && role !== "superadmin") {
      if (!(sessionMatch || (userId && isCaseMember(caseId, userId)))) {
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
