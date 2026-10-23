import { http, HttpResponse } from "msw";
import type { Budget, BudgetComparisonRow, BudgetStatus, Tone, Transaction, Category } from "@/types";
import { DEFAULT_BOOK_ID, mockBudgets } from "../data/seed";
import { __transactionsStore } from "./transaction";
import { __categoriesStore } from "./category";
import { endpoint } from "../baseUrl";
import { matchesBook } from "./book";

/**
 * Storage anggaran sebagai TEMPLATE per kategori (recurring lintas bulan).
 * 1 entry per (userId, categoryId). `period` di response selalu di-echo dari
 * parameter query — bukan stored field.
 */
interface BudgetTemplate {
  _id: string;
  userId: string;
  bookId: string;
  categoryId: string;
  amount: number;
}

const budgetTemplates: BudgetTemplate[] = mockBudgets.map((b) => ({
  _id: b._id,
  userId: b.userId,
  bookId: b.bookId ?? DEFAULT_BOOK_ID,
  categoryId: b.categoryId,
  amount: b.amount,
}));

function nextId(): string {
  return `b-${Date.now()}`;
}

function computeStatus(percent: number): BudgetStatus {
  if (percent >= 100) return "over";
  if (percent >= 75) return "warn";
  return "safe";
}

function spentForCategoryInMonth(
  categoryId: string,
  year: number,
  month: number,
  bookId: string | null = null,
): number {
  return (__transactionsStore as Transaction[]).reduce((sum: number, t: Transaction) => {
    if (t.type !== "out") return sum;
    if (t.categoryId !== categoryId) return sum;
    if (!matchesBook(t.bookId, bookId)) return sum;
    const d = new Date(t.occurredAt);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return sum;
    return sum + t.amount + (t.adminFee ?? 0);
  }, 0);
}

function templateToBudgetFor(
  tpl: BudgetTemplate,
  year: number,
  month: number,
): Budget {
  const spent = spentForCategoryInMonth(tpl.categoryId, year, month, tpl.bookId);
  const remaining = tpl.amount - spent;
  const percentUsed = tpl.amount > 0 ? Math.round((spent / tpl.amount) * 100) : 0;
  return {
    _id: tpl._id,
    userId: tpl.userId,
    bookId: tpl.bookId,
    categoryId: tpl.categoryId,
    amount: tpl.amount,
    period: { year, month },
    spent,
    remaining,
    percentUsed,
    status: computeStatus(percentUsed),
  };
}

function parseYM(s: string): { year: number; month: number } | null {
  const m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

export const budgetHandlers = [
  http.get(endpoint("/budgets/comparison"), ({ request }) => {
    const url = new URL(request.url);
    const from = parseYM(url.searchParams.get("from") ?? "");
    const to = parseYM(url.searchParams.get("to") ?? "");
    const bookId = url.searchParams.get("bookId");
    if (!from || !to) {
      return HttpResponse.json(
        { message: "Parameter from/to wajib (YYYY-MM)." },
        { status: 400 },
      );
    }

    const months: Array<{ year: number; month: number }> = [];
    let y = from.year;
    let m = from.month;
    while (y < to.year || (y === to.year && m <= to.month)) {
      months.push({ year: y, month: m });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      if (months.length > 36) break;
    }

    // Sertakan SEMUA kategori expense pada pembukuan aktif (bukan cuma yang
    // punya anggaran di bulan tertentu), supaya tabel lengkap dan user bisa
    // lihat kategori yang belum dianggarkan.
    const expenseCategoryIds = (__categoriesStore as Category[])
      .filter((c: Category) => c.kind === "expense" && matchesBook(c.bookId, bookId))
      .map((c: Category) => c._id);

    const rows: BudgetComparisonRow[] = expenseCategoryIds.map((catId: string) => {
      const cat = (__categoriesStore as Category[]).find((c: Category) => c._id === catId);
      const tpl = budgetTemplates.find(
        (b) => b.categoryId === catId && matchesBook(b.bookId, bookId),
      );
      const cells = months.map((mo) => {
        const spent = spentForCategoryInMonth(catId, mo.year, mo.month, bookId);
        const amount = tpl?.amount ?? 0;
        let status: BudgetStatus | "none" = "none";
        if (amount > 0) {
          const percent = (spent / amount) * 100;
          status = percent >= 100 ? "over" : percent >= 75 ? "warn" : "safe";
        }
        return { year: mo.year, month: mo.month, amount, spent, status };
      });
      return {
        categoryId: catId,
        categoryName: cat?.name ?? "—",
        icon: cat?.icon ?? "Tag",
        tone: (cat?.tone ?? "neutral") as Tone,
        cells,
      };
    });

    return HttpResponse.json({
      period: { from, to },
      months,
      rows,
    });
  }),

  http.get(endpoint("/budgets"), ({ request }) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const bookId = url.searchParams.get("bookId");
    if (!year || !month) {
      return HttpResponse.json(
        { message: "Parameter year/month wajib." },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      budgetTemplates
        .filter((tpl) => matchesBook(tpl.bookId, bookId))
        .map((tpl) => templateToBudgetFor(tpl, year, month)),
    );
  }),

  http.post(endpoint("/budgets"), async ({ request }) => {
    const body = (await request.json()) as {
      categoryId: string;
      period: { year: number; month: number };
      amount: number;
      bookId?: string;
    };
    const existing = budgetTemplates.find((b) => b.categoryId === body.categoryId);
    if (existing) {
      existing.amount = body.amount;
      return HttpResponse.json(
        templateToBudgetFor(existing, body.period.year, body.period.month),
      );
    }
    const tpl: BudgetTemplate = {
      _id: nextId(),
      userId: "u1",
      bookId: body.bookId ?? DEFAULT_BOOK_ID,
      categoryId: body.categoryId,
      amount: body.amount,
    };
    budgetTemplates.push(tpl);
    return HttpResponse.json(
      templateToBudgetFor(tpl, body.period.year, body.period.month),
      { status: 201 },
    );
  }),

  http.patch(endpoint("/budgets/:id"), async ({ params, request }) => {
    const body = (await request.json()) as { amount: number };
    const idx = budgetTemplates.findIndex((b) => b._id === params.id);
    if (idx === -1)
      return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    budgetTemplates[idx] = { ...budgetTemplates[idx], amount: body.amount };
    const now = new Date();
    return HttpResponse.json(
      templateToBudgetFor(
        budgetTemplates[idx],
        now.getFullYear(),
        now.getMonth() + 1,
      ),
    );
  }),

  http.delete(endpoint("/budgets/:id"), ({ params }) => {
    const idx = budgetTemplates.findIndex((b) => b._id === params.id);
    if (idx === -1)
      return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    budgetTemplates.splice(idx, 1);
    return HttpResponse.json({ ok: true });
  }),
];
