import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { withCaseAuthorization } from "@/lib/authz";
import { addCaseThreadImage, getCase } from "@/lib/caseStore";
import { config } from "@/lib/config";
import { ocrPaperwork } from "@/lib/openai";
import { generateThumbnailsInBackground } from "@/lib/thumbnails";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (
    req: Request,
    {
      params,
      session: _session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
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
    const uploadDir = config.UPLOAD_DIR;
    fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    generateThumbnailsInBackground(buffer, filename);
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    const cookieStore = await cookies();
    let storedLang = cookieStore.get("language")?.value;
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
    const ocr = await ocrPaperwork({ url: dataUrl }, storedLang);
    const updated = addCaseThreadImage(id, {
      id: new Date().toISOString(),
      threadParent: parent ?? null,
      url: filename,
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
