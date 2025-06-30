import { getAuthOptions } from "@/lib/authOptions";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> },
) => NextAuth(req, ctx, getAuthOptions());

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> },
) => NextAuth(req, ctx, getAuthOptions());
