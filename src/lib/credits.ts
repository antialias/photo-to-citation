import crypto from "node:crypto";
import { db } from "./db";

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  createdAt: string;
}

const insertTx = db.prepare(
  "INSERT INTO credit_transactions (id, user_id, amount, created_at) VALUES (?, ?, ?, ?)",
);
const updateBalance = db.prepare(
  "UPDATE user SET credits = credits + ? WHERE id = ?",
);
const selectBalance = db.prepare("SELECT credits FROM user WHERE id = ?");

const txAdd = db.transaction(((userId: string, amount: number) => {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  insertTx.run(id, userId, amount, createdAt);
  updateBalance.run(amount, userId);
  const row = selectBalance.get(userId) as { credits: number } | undefined;
  return row?.credits ?? 0;
}) as (userId: string, amount: number) => unknown) as (
  userId: string,
  amount: number,
) => number;

export function addCredits(userId: string, amount: number): number {
  return txAdd(userId, amount);
}

export function getCreditBalance(userId: string): number {
  const row = selectBalance.get(userId) as { credits: number } | undefined;
  return row?.credits ?? 0;
}
