import { getDB, type OutboxOp } from "./db";

/** Buat uuid (dipakai sebagai _id entity + Idempotency-Key operasi). */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // fallback sederhana
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function enqueue(
  op: Omit<OutboxOp, "seq" | "createdAt" | "status" | "attempts">,
): Promise<OutboxOp> {
  const db = await getDB();
  const full: OutboxOp = {
    ...op,
    createdAt: new Date().toISOString(),
    status: "pending",
    attempts: 0,
  };
  const seq = await db.add("outbox", full);
  return { ...full, seq: seq as number };
}

export async function allOps(): Promise<OutboxOp[]> {
  const db = await getDB();
  const rows = await db.getAll("outbox");
  return rows.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

export async function opsForBook(bookId: string): Promise<OutboxOp[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex("outbox", "by-book", bookId);
  return rows.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

export async function pendingCount(): Promise<number> {
  return (await allOps()).length;
}

export async function removeOp(seq: number): Promise<void> {
  const db = await getDB();
  await db.delete("outbox", seq);
}

export async function updateOp(op: OutboxOp): Promise<void> {
  if (op.seq == null) return;
  const db = await getDB();
  await db.put("outbox", op);
}
