import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  if (!config.TEST_APIS) {
    return new NextResponse(null, { status: 404 });
  }
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('migrations', 'casbin_rules')",
    )
    .all() as Array<{ name: string }>;
  for (const { name } of tables) {
    db.prepare(`DELETE FROM ${name}`).run();
  }
  const casbinCount = db
    .prepare("SELECT COUNT(*) as c FROM casbin_rules")
    .get() as { c: number };
  if (casbinCount.c === 0) {
    const insert = db.prepare(
      "INSERT INTO casbin_rules (ptype, v0, v1, v2) VALUES (?, ?, ?, ?)",
    );
    const seed = [
      ["p", "anonymous", "public_cases", "read"],
      ["p", "anonymous", "upload", "create"],
      ["p", "user", "upload", "create"],
      ["p", "user", "cases", "read"],
      ["p", "user", "cases", "update"],
      ["p", "user", "cases", "delete"],
      ["p", "user", "snail_mail_providers", "read"],
      ["p", "user", "vin_sources", "read"],
      ["p", "user", "credits", "read"],
      ["p", "user", "credits", "update"],
      ["p", "admin", "admin", "read"],
      ["p", "admin", "admin", "update"],
      ["p", "admin", "users", "create"],
      ["p", "admin", "users", "read"],
      ["p", "admin", "users", "update"],
      ["p", "admin", "users", "delete"],
      ["p", "admin", "cases", "update"],
      ["p", "admin", "cases", "delete"],
      ["p", "admin", "snail_mail_providers", "update"],
      ["p", "admin", "vin_sources", "update"],
      ["p", "superadmin", "superadmin", "update"],
      ["p", "superadmin", "superadmin", "read"],
      ["g", "admin", "user", null],
      ["g", "superadmin", "admin", null],
    ];
    const tx = db.transaction(() => {
      for (const r of seed) insert.run(...r);
    });
    tx();
  }
  return new NextResponse(null, { status: 200 });
}
