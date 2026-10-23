import { http, HttpResponse } from "msw";
import type { Account, AccountMonthlySummary, Transaction } from "@/types";
import { endpoint } from "../baseUrl";
import { matchesBook } from "./book";
import { storageAdapter } from "../storage/adapter";
import { mockAccounts } from "../data/seed";

function nextId(): string {
  return `a-${Date.now()}`;
}

export const accountHandlers = [
  http.get(endpoint("/accounts"), async ({ request }) => {
    const url = new URL(request.url);
    const archived = url.searchParams.get("archived");
    const bookId = url.searchParams.get("bookId");

    const accounts = await storageAdapter.getAll<Account>("accounts");
    const filtered = accounts
      .filter((a) => matchesBook(a.bookId, bookId))
      .filter((a) => archived === null || a.archived === (archived === "true"));

    return HttpResponse.json([...filtered].sort((a, b) => a.order - b.order));
  }),

  http.get(endpoint("/accounts/summary"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = url.searchParams.get("bookId");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const from = fromParam ? new Date(fromParam) : monthStart;
    const to = toParam ? new Date(toParam) : monthEnd;

    const accounts = await storageAdapter.getAll<Account>("accounts");
    const scopedAccounts = accounts.filter((a) => matchesBook(a.bookId, bookId));

    const transactions = await storageAdapter.getAll<Transaction>("transactions");
    const scopedTx = transactions.filter((t) => {
      if (!matchesBook(t.bookId, bookId)) return false;
      const d = new Date(t.occurredAt);
      return d >= from && d <= to;
    });

    const summary: AccountMonthlySummary[] = scopedAccounts.map((a) => {
      let income = 0;
      let expense = 0;
      let transferIn = 0;
      let transferOut = 0;
      let txCount = 0;
      for (const t of scopedTx) {
        const fee = t.adminFee ?? 0;
        if (t.type === "in" && t.accountId === a._id) {
          income += t.amount - fee;
          txCount++;
        } else if (t.type === "out" && t.accountId === a._id) {
          expense += t.amount + fee;
          txCount++;
        } else if (t.type === "transfer") {
          if (t.fromAccountId === a._id) {
            transferOut += t.amount + fee;
            txCount++;
          }
          if (t.toAccountId === a._id) {
            transferIn += t.amount;
          }
        }
      }
      return {
        accountId: a._id,
        period: { from: from.toISOString(), to: to.toISOString() },
        income,
        expense,
        transferIn,
        transferOut,
        txCount,
      };
    });

    return HttpResponse.json(summary);
  }),

  http.get(endpoint("/accounts/:id"), async ({ params }) => {
    const acc = await storageAdapter.getById<Account>("accounts", params.id as string);
    if (!acc) return HttpResponse.json({ message: "Akun tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(acc);
  }),

  http.post(endpoint("/accounts"), async ({ request }) => {
    const body = (await request.json()) as Partial<Account>;
    const targetBookId = body.bookId || "book-personal";

    const allAccounts = await storageAdapter.getAll<Account>("accounts");
    const id = nextId();
    const newAcc: Account = {
      _id: id,
      userId: "u-personal",
      bookId: targetBookId,
      name: body.name ?? "Dompet Baru",
      type: body.type ?? "cash",
      icon: body.icon ?? "Wallet",
      tone: body.tone ?? "neutral",
      initialBalance: body.initialBalance ?? 0,
      currentBalance: body.initialBalance ?? 0,
      archived: false,
      order: allAccounts.length + 1,
      createdAt: new Date().toISOString(),
    };

    await storageAdapter.insert("accounts", newAcc);
    return HttpResponse.json(newAcc, { status: 201 });
  }),

  http.patch(endpoint("/accounts/reorder"), async ({ request }) => {
    const body = (await request.json()) as { orders: Array<{ _id: string; order: number }> };
    for (const { _id, order } of body.orders) {
      await storageAdapter.update<Account>("accounts", _id, { order });
    }
    const accounts = await storageAdapter.getAll<Account>("accounts");
    return HttpResponse.json([...accounts].sort((a, b) => a.order - b.order));
  }),

  http.patch(endpoint("/accounts/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Partial<Account>;
    try {
      const updated = await storageAdapter.update<Account>("accounts", params.id as string, body);
      return HttpResponse.json(updated);
    } catch {
      return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    }
  }),

  http.delete(endpoint("/accounts/:id"), async ({ params }) => {
    await storageAdapter.delete("accounts", params.id as string);
    return HttpResponse.json({ ok: true });
  }),
];

export const __accountsStore: Account[] = mockAccounts;
