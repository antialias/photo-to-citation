import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAnonymousSessionId } from "@/lib/anonymousSession";
import { getSessionDetails, withAuthorization } from "@/lib/authz";
import {
  analyzeCaseInBackground,
  cancelCaseAnalysis,
} from "@/lib/caseAnalysis";
import { fetchCaseLocationInBackground } from "@/lib/caseLocation";
import {
  addCasePhoto,
  createCase,
  getCase,
  setCaseSessionId,
  updateCase,
} from "@/lib/caseStore";
import { config } from "@/lib/config";
import { extractGps, extractTimestamp } from "@/lib/exif";
import { generateThumbnailsInBackground } from "@/lib/thumbnails";

export const POST = withAuthorization(
  { obj: "upload" },
  async (
    req: Request,
    {
      session,
      params: _params,
    }: {
      params: Promise<Record<string, string>>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    let storedLang: string | undefined;
    let anonId: string | undefined;
    try {
      const store = await cookies();
      anonId = store.get("anonSession")?.value;
      storedLang = store.get("language")?.value;
    } catch {
      anonId = getAnonymousSessionId(req);
    }
    let setSessionCookie = false;
    if (!anonId) {
      anonId = crypto.randomUUID();
      setSessionCookie = true;
    }
    if (!storedLang) {
      const headerList = await headers();
      const accept = headerList.get("accept-language") ?? "";
      const supported = ["en", "es", "fr"];
      for (const part of accept.split(",")) {
        const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
        if (supported.includes(code)) {
          storedLang = code;
          break;
        }
      }
      storedLang = storedLang ?? "en";
    }
    const form = await req.formData();
    const file = form.get("photo") as File | null;
    const clientId = form.get("caseId") as string | null;
    const { userId } = getSessionDetails({ session }, "user");
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const gps = extractGps(buffer);
    const takenAt = extractTimestamp(buffer);
    const uploadDir = config.UPLOAD_DIR;
    fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(file.name || "jpg") || ".jpg";
    const filename = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    generateThumbnailsInBackground(buffer, filename);
    const existing = clientId ? getCase(clientId) : null;
    if (existing) {
      cancelCaseAnalysis(existing.id);
      const updated = addCasePhoto(existing.id, filename, takenAt, gps);
      if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (!updated.gps && gps) {
        updateCase(updated.id, { gps });
        fetchCaseLocationInBackground({ ...updated, gps });
      }
      const p = updateCase(updated.id, {
        analysisStatus: "pending",
        analysisProgress: {
          stage: "upload",
          index: 0,
          total: updated.photos.length,
        },
      });
      analyzeCaseInBackground(p || updated, storedLang);
      const res = NextResponse.json({ caseId: updated.id });
      if (!userId && setSessionCookie) {
        res.cookies.set("anonSession", anonId, { httpOnly: true, path: "/" });
      }
      return res;
    }
    const newCase = createCase(
      filename,
      gps,
      clientId || (!userId ? anonId : undefined),
      takenAt,
      userId ?? null,
    );
    if (!userId) {
      const cookieAnon = getAnonymousSessionId(req);
      setCaseSessionId(newCase.id, cookieAnon ?? anonId);
    }
    const p = updateCase(newCase.id, {
      analysisStatus: "pending",
      analysisProgress: {
        stage: "upload",
        index: 0,
        total: newCase.photos.length,
      },
    });
    analyzeCaseInBackground(p || newCase, storedLang);
    fetchCaseLocationInBackground(newCase);
    const res = NextResponse.json({ caseId: newCase.id });
    if (!userId && setSessionCookie) {
      res.cookies.set("anonSession", anonId, { httpOnly: true, path: "/" });
    }
    return res;
  },
);
