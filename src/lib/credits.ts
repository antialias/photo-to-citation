import crypto from "node:crypto";
import type Database from "better-sqlite3";
import { db } from "./db";

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  createdAt: string;
}

let insertTx!: Database.Statement;
let updateBalance!: Database.Statement;
let selectBalance!: Database.Statement;
let txAdd!: (userId: string, amount: number) => number;
let inittedStatements = false;

function initStatements(): void {
  if (inittedStatements) return;
  insertTx = db.prepare(
    "INSERT INTO credit_transactions (id, user_id, amount, created_at) VALUES (?, ?, ?, ?)",
  );
  updateBalance = db.prepare(
    "UPDATE user SET credits = credits + ? WHERE id = ?",
  );
  selectBalance = db.prepare("SELECT credits FROM user WHERE id = ?");
  txAdd = db.transaction((userId: string, amount: number) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    insertTx.run(id, userId, amount, createdAt);
    updateBalance.run(amount, userId);
    const row = selectBalance.get(userId) as { credits: number } | undefined;
    return row?.credits ?? 0;
  }) as (userId: string, amount: number) => number;
  inittedStatements = true;
}

export function addCredits(userId: string, amount: number): number {
  initStatements();
  return txAdd(userId, amount);
}

export function getCreditBalance(userId: string): number {
  initStatements();
  const row = selectBalance.get(userId) as { credits: number } | undefined;
  return row?.credits ?? 0;
}
