import { http, HttpResponse } from "msw";
import type { Transaction, TransactionType } from "@/types";
import { endpoint } from "../baseUrl";
import { matchesBook } from "./book";
import { storageAdapter } from "../storage/adapter";
import { mockTransactions } from "../data/seed";

function nextId(): string {
  return `t-${Date.now()}`;
}

export const transactionHandlers = [
  http.get(endpoint("/transactions"), async ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") as TransactionType | null;
    const accountId = url.searchParams.get("accountId");
    const categoryId = url.searchParams.get("categoryId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const search = url.searchParams.get("search")?.toLowerCase();
    const bookId = url.searchParams.get("bookId");
    const page = Number(url.searchParams.get("page") ?? "1");
    const size = Number(url.searchParams.get("size") ?? "20");

    const allTx = await storageAdapter.getAll<Transaction>("transactions");
    let filtered = allTx.filter((t) => matchesBook(t.bookId, bookId));

    if (type) filtered = filtered.filter((t) => t.type === type);
    if (accountId) {
      filtered = filtered.filter((t) =>
        t.type === "transfer"
          ? (t as any).fromAccountId === accountId || (t as any).toAccountId === accountId
          : (t as any).accountId === accountId,
      );
    }
    if (categoryId) {
      filtered = filtered.filter((t) => t.type !== "transfer" && (t as any).categoryId === categoryId);
    }
    if (from) filtered = filtered.filter((t) => t.occurredAt >= from);
    if (to) filtered = filtered.filter((t) => t.occurredAt <= to);
    if (search) {
      filtered = filtered.filter((t) => t.note?.toLowerCase().includes(search));
    }

    filtered.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    const total = filtered.length;
    const start = (page - 1) * size;
    const slice = filtered.slice(start, start + size);

    return HttpResponse.json({
      data: slice,
      meta: { page, size, total, totalPages: Math.ceil(total / size) || 1 },
    });
  }),

  http.get(endpoint("/transactions/:id"), async ({ params }) => {
    const tx = await storageAdapter.getById<Transaction>("transactions", params.id as string);
    if (!tx) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(tx);
  }),

  http.post(endpoint("/transactions"), async ({ request }) => {
    const body = (await request.json()) as Partial<Transaction>;
    const targetBookId = body.bookId || "book-personal";
    const now = new Date().toISOString();

    const amount = Math.max(0, Number(body.amount) || 0);
    const fee = Math.max(0, Number(body.adminFee) || 0);

    const newTx = {
      ...body,
      amount,
      adminFee: fee,
      bookId: targetBookId,
      _id: nextId(),
      userId: body.userId || "u-personal",
      occurredAt: body.occurredAt || now,
      createdAt: now,
      updatedAt: now,
    } as Transaction;

    await storageAdapter.createTransactionWithBalance(newTx);
    return HttpResponse.json(newTx, { status: 201 });
  }),

  http.patch(endpoint("/transactions/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Partial<Transaction>;
    const existing = await storageAdapter.getById<Transaction>("transactions", params.id as string);
    if (!existing) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

    // Reverse old balance, apply new balance
    await storageAdapter.deleteTransactionWithBalance(existing._id);
    const patchAmount = body.amount !== undefined ? Math.max(0, Number(body.amount) || 0) : existing.amount;
    const patchFee = body.adminFee !== undefined ? Math.max(0, Number(body.adminFee) || 0) : (existing.adminFee ?? 0);

    const updated = {
      ...existing,
      ...body,
      amount: patchAmount,
      adminFee: patchFee,
      updatedAt: new Date().toISOString(),
    } as Transaction;
    await storageAdapter.createTransactionWithBalance(updated);

    return HttpResponse.json(updated);
  }),

  http.delete(endpoint("/transactions/:id"), async ({ params }) => {
    await storageAdapter.deleteTransactionWithBalance(params.id as string);
    return HttpResponse.json({ ok: true });
  }),
];

export const __transactionsStore: Transaction[] = mockTransactions;
