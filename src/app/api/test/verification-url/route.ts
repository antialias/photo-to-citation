import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { config } from "../../../lib/config";

export async function GET() {
  if (!config.TEST_APIS) {
    return new NextResponse(null, { status: 404 });
  }
  let url: string | undefined;
  try {
    url = await readFile("/tmp/verification-url.txt", "utf8");
  } catch {}
  return NextResponse.json({ url });
}
