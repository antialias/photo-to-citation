import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";

const verFile = path.join(os.tmpdir(), "verification-url.txt");

export const runtime = "nodejs";

export async function GET() {
  if (process.env.CI !== "1") {
    return new NextResponse(null, { status: 404 });
  }
  const url = fs.existsSync(verFile)
    ? fs.readFileSync(verFile, "utf8")
    : undefined;
  return NextResponse.json({ url });
}
