import { http, HttpResponse } from "msw";
import type { Saving, SavingMovement } from "@/types";
import { endpoint } from "../baseUrl";
import { __accountsStore } from "./account";
import { DEFAULT_BOOK_ID } from "../data/seed";
import { matchesBook } from "./book";
import { checkSavingQuota } from "./subscription";

const savings: Saving[] = [
  {
    _id: "s1",
    userId: "u1",
    name: "Dana Darurat",
    icon: "ShieldCheck",
    tone: "blue",
    goalAmount: 30_000_000,
    currentAmount: 4_500_000,
    monthlyDeposit: 2_000_000,
    targetDate: "2026-12-31T00:00:00.000Z",
    note: "3-6× pengeluaran bulanan.",
    archived: false,
    order: 1,
    createdAt: "2026-04-15T00:00:00.000Z",
  },
  {
    _id: "s2",
    userId: "u1",
    name: "Liburan Bali",
    icon: "Plane",
    tone: "amber",
    goalAmount: 8_000_000,
    currentAmount: 1_200_000,
    monthlyDeposit: 800_000,
    targetDate: "2026-09-01T00:00:00.000Z",
    note: "Honeymoon 5 hari.",
    archived: false,
    order: 2,
    createdAt: "2026-04-20T00:00:00.000Z",
  },
];

const movements: SavingMovement[] = [
  {
    _id: "sm1",
    savingId: "s1",
    type: "deposit",
    amount: 1_000_000,
    accountId: "a1",
    note: "Setoran awal",
    occurredAt: "2026-04-20T00:00:00.000Z",
  },
];

function nextSavingId(): string {
  return `s-${Date.now()}`;
}
function nextMovementId(): string {
  return `sm-${Date.now()}`;
}

export const savingHandlers = [
  http.get(endpoint("/savings"), ({ request }) => {
    const url = new URL(request.url);
    const bookId = url.searchParams.get("bookId");
    return HttpResponse.json(
      [...savings]
        .filter((s) => matchesBook(s.bookId, bookId))
        .sort((a, b) => a.order - b.order),
    );
  }),

  http.get(endpoint("/savings/summary"), ({ request }) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const totalGoal = savings.reduce((s, x) => s + x.goalAmount, 0);
    const totalCurrent = savings.reduce((s, x) => s + x.currentAmount, 0);
    const totalMonthlyDepositTarget = savings.reduce(
      (s, x) => s + (x.monthlyDeposit ?? 0),
      0,
    );
    const totalDepositedThisMonth = movements.reduce((s, m) => {
      if (m.type !== "deposit") return s;
      const d = new Date(m.occurredAt);
      if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return s;
      return s + m.amount;
    }, 0);
    return HttpResponse.json({
      totalGoal,
      totalCurrent,
      totalMonthlyDepositTarget,
      totalDepositedThisMonth,
      period: { year, month },
    });
  }),

  http.get(endpoint("/savings/:id"), ({ params }) => {
    const s = savings.find((x) => x._id === params.id);
    if (!s) return HttpResponse.json({ message: "Tabungan tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(s);
  }),

  http.get(endpoint("/savings/:id/movements"), ({ params }) => {
    const filtered = movements
      .filter((m) => m.savingId === params.id)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return HttpResponse.json(filtered);
  }),

  http.post(endpoint("/savings"), async ({ request }) => {
    const body = (await request.json()) as Partial<Saving>;
    const targetBookId = body.bookId ?? DEFAULT_BOOK_ID;
    const activeCount = savings.filter(
      (s) => !s.archived && (s.bookId ?? DEFAULT_BOOK_ID) === targetBookId,
    ).length;
    const check = checkSavingQuota(targetBookId, activeCount);
    if (!check.allowed) {
      return HttpResponse.json(
        {
          statusCode: 422,
          code: "QUOTA_EXCEEDED",
          message: check.message,
          details: check.details,
        },
        { status: 422 },
      );
    }
    const fresh: Saving = {
      _id: nextSavingId(),
      userId: "u1",
      bookId: targetBookId,
      name: body.name ?? "Tabungan Baru",
      icon: body.icon ?? "PiggyBank",
      tone: body.tone ?? "emerald",
      goalAmount: body.goalAmount ?? 0,
      currentAmount: 0,
      targetDate: body.targetDate ?? undefined,
      note: body.note,
      archived: false,
      order: savings.length + 1,
      createdAt: new Date().toISOString(),
    };
    savings.push(fresh);
    return HttpResponse.json(fresh, { status: 201 });
  }),

  http.patch(endpoint("/savings/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Partial<Saving>;
    const idx = savings.findIndex((s) => s._id === params.id);
    if (idx === -1) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    savings[idx] = { ...savings[idx], ...body };
    return HttpResponse.json(savings[idx]);
  }),

  http.delete(endpoint("/savings/:id"), ({ params }) => {
    const idx = savings.findIndex((s) => s._id === params.id);
    if (idx === -1) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    savings.splice(idx, 1);
    return HttpResponse.json({ ok: true });
  }),

  http.post(endpoint("/savings/:id/deposit"), async ({ params, request }) => {
    const body = (await request.json()) as { amount: number; accountId: string; note?: string };
    const idx = savings.findIndex((s) => s._id === params.id);
    if (idx === -1) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    const acc = __accountsStore.find((a) => a._id === body.accountId);
    if (!acc) {
      return HttpResponse.json({ message: "Dompet tidak ditemukan" }, { status: 422 });
    }
    if (acc.currentBalance < body.amount) {
      return HttpResponse.json(
        { message: "Saldo dompet tidak cukup" },
        { status: 422 },
      );
    }
    acc.currentBalance -= body.amount;
    savings[idx] = {
      ...savings[idx],
      currentAmount: savings[idx].currentAmount + body.amount,
    };
    movements.push({
      _id: nextMovementId(),
      savingId: savings[idx]._id,
      type: "deposit",
      amount: body.amount,
      accountId: body.accountId,
      note: body.note,
      occurredAt: new Date().toISOString(),
    });
    return HttpResponse.json(savings[idx]);
  }),

  http.post(endpoint("/savings/:id/withdraw"), async ({ params, request }) => {
    const body = (await request.json()) as { amount: number; accountId: string; note?: string };
    const idx = savings.findIndex((s) => s._id === params.id);
    if (idx === -1) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    if (savings[idx].currentAmount < body.amount) {
      return HttpResponse.json(
        { message: "Saldo tabungan tidak cukup" },
        { status: 422 },
      );
    }
    const acc = __accountsStore.find((a) => a._id === body.accountId);
    if (!acc) {
      return HttpResponse.json({ message: "Dompet tidak ditemukan" }, { status: 422 });
    }
    acc.currentBalance += body.amount;
    savings[idx] = {
      ...savings[idx],
      currentAmount: savings[idx].currentAmount - body.amount,
    };
    movements.push({
      _id: nextMovementId(),
      savingId: savings[idx]._id,
      type: "withdraw",
      amount: body.amount,
      accountId: body.accountId,
      note: body.note,
      occurredAt: new Date().toISOString(),
    });
    return HttpResponse.json(savings[idx]);
  }),
];

/** Dipakai /subscription/usage untuk hitung tabungan aktif per book. */
export function __getSavingCountByBook(bookId: string): number {
  return savings.filter(
    (s) => !s.archived && (s.bookId ?? DEFAULT_BOOK_ID) === bookId,
  ).length;
}
