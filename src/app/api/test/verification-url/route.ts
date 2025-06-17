import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "test") {
    return new NextResponse(null, { status: 404 });
  }
  const url = (global as Record<string, unknown>).verificationUrl;
  return NextResponse.json({ url });
}
