import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { withAuthorization } from "@/lib/authz";
import { analyzeCaseInBackground } from "@/lib/caseAnalysis";
import { fetchCaseLocationInBackground } from "@/lib/caseLocation";
import { addCasePhoto, createCase, getCase, updateCase } from "@/lib/caseStore";
import { extractGps, extractTimestamp } from "@/lib/exif";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  "upload",
  "create",
  async (
    req: Request,
    {
      session,
      params,
    }: {
      params: Promise<Record<string, string>>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const form = await req.formData();
    const file = form.get("photo") as File | null;
    const clientId = form.get("caseId") as string | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const gps = extractGps(buffer);
    const takenAt = extractTimestamp(buffer);
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(file.name || "jpg") || ".jpg";
    const filename = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    const existing = clientId ? getCase(clientId) : null;
    if (existing) {
      const updated = addCasePhoto(
        existing.id,
        `/uploads/${filename}`,
        takenAt,
        gps,
      );
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
      analyzeCaseInBackground(p || updated);
      return NextResponse.json({ caseId: updated.id });
    }
    const newCase = createCase(
      `/uploads/${filename}`,
      gps,
      clientId || undefined,
      takenAt,
      session?.user?.id ?? null,
    );
    const p = updateCase(newCase.id, {
      analysisStatus: "pending",
      analysisProgress: {
        stage: "upload",
        index: 0,
        total: newCase.photos.length,
      },
    });
    analyzeCaseInBackground(p || newCase);
    fetchCaseLocationInBackground(newCase);
    return NextResponse.json({ caseId: newCase.id });
  },
);
