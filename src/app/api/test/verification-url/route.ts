import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";

const verFile = path.join(os.tmpdir(), "verification-url.txt");

export const runtime = "nodejs";

export async function GET() {
  if (!config.TEST_APIS) {
    return new NextResponse(null, { status: 404 });
  }
  const url = await readFile(verFile, "utf8");
  return NextResponse.json({ url });
}
