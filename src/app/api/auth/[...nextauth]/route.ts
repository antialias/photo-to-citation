import { getAuthOptions } from "@/lib/authOptions";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  return NextAuth(req, ctx, getAuthOptions());
}

export function POST(
  req: NextRequest,
  ctx: { params: { nextauth: string[] } },
) {
  return NextAuth(req, ctx, getAuthOptions());
}
