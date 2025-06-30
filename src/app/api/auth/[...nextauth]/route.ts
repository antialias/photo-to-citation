import { getAuthOptions } from "@/lib/authOptions";
import NextAuth from "next-auth";
import type { RouteHandlerContext } from "next-auth/next";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest, ctx: RouteHandlerContext) {
  return NextAuth(req, ctx, getAuthOptions());
}

export function POST(req: NextRequest, ctx: RouteHandlerContext) {
  return NextAuth(req, ctx, getAuthOptions());
}
