import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { withAuthorization } from "@/lib/authz";
import { addCaseThreadImage, getCase } from "@/lib/caseStore";
import { ocrPaperwork } from "@/lib/openai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  "cases",
  "update",
  async (
    req: NextRequest,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { id } = await params;
    const form = await req.formData();
    const file = form.get("photo") as File | null;
    const parent = form.get("replyTo") as string | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name || "jpg") || ".jpg";
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    const ocr = await ocrPaperwork({ url: dataUrl });
    const updated = addCaseThreadImage(id, {
      id: new Date().toISOString(),
      threadParent: parent ?? null,
      url: `/uploads/${filename}`,
      uploadedAt: new Date().toISOString(),
      ocrText: ocr.text,
      ocrInfo: ocr.info ?? null,
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const c = getCase(id);
    return NextResponse.json(c);
  },
);
