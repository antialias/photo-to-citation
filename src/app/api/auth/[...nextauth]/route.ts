import { getAuthOptions } from "@/lib/authOptions";
import NextAuth from "next-auth";

export function GET(req: Request, ctx: { params: { nextauth: string[] } }) {
  return NextAuth(req, ctx, getAuthOptions());
}

export function POST(req: Request, ctx: { params: { nextauth: string[] } }) {
  return NextAuth(req, ctx, getAuthOptions());
}
