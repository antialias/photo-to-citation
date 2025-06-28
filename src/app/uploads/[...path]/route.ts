import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await params;
  const uploads = path.join(process.cwd(), "uploads");
  const full = path.join(uploads, ...segments);
  if (!full.startsWith(uploads)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
