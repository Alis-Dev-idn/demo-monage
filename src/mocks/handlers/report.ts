import { http, HttpResponse } from "msw";
import type { Account, Category, DashboardSummary, ReportData, Tone, Transaction } from "@/types";
import { endpoint } from "../baseUrl";
import { matchesBook } from "./book";
import { storageAdapter } from "../storage/adapter";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function buildSummary(bookId: string | null): Promise<DashboardSummary> {
  const allAccounts = await storageAdapter.getAll<Account>("accounts");
  const allTransactions = await storageAdapter.getAll<Transaction>("transactions");
  const allCategories = await storageAdapter.getAll<Category>("categories");

  const accounts = allAccounts.filter((a) => matchesBook(a.bookId, bookId));
  const transactions = allTransactions.filter((t) => matchesBook(t.bookId, bookId));

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthTxs = transactions.filter((t) => t.occurredAt >= monthStart);

  let income = 0;
  let expense = 0;
  for (const t of monthTxs) {
    if (t.type === "in") income += t.amount;
    if (t.type === "out") expense += t.amount;
  }

  const totalBalance = accounts
    .filter((a) => !a.archived)
    .reduce((s, a) => s + a.currentBalance, 0);

  const dayMap = new Map<string, { income: number; expense: number }>();
  for (const t of monthTxs) {
    const key = t.occurredAt.slice(0, 10);
    const slot = dayMap.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "in") slot.income += t.amount;
    if (t.type === "out") slot.expense += t.amount;
    dayMap.set(key, slot);
  }
  const cashflowDaily = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const catMap = new Map<string, number>();
  for (const t of monthTxs) {
    if (t.type !== "out") continue;
    catMap.set((t as any).categoryId, (catMap.get((t as any).categoryId) ?? 0) + t.amount);
  }
  const totalExpense = expense || 1;
  const expenseByCategory = Array.from(catMap.entries())
    .map(([categoryId, amount]) => {
      const cat = allCategories.find((c) => c._id === categoryId);
      return {
        categoryId,
        categoryName: cat?.name ?? "—",
        icon: cat?.icon ?? "Tag",
        tone: (cat?.tone ?? "neutral") as Tone,
        amount,
        percent: Math.round((amount / totalExpense) * 100),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const recentTransactions = [...transactions]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 5);

  return {
    totalBalance,
    monthSummary: { income, expense, net: income - expense },
    cashflowDaily,
    expenseByCategory,
    recentTransactions,
    accounts: [...accounts].sort((a, b) => a.order - b.order),
  };
}

async function buildReport(from: string, to: string, bookId: string | null): Promise<ReportData> {
  const allTransactions = await storageAdapter.getAll<Transaction>("transactions");
  const txs = allTransactions
    .filter((t) => matchesBook(t.bookId, bookId))
    .filter((t) => t.occurredAt >= from && t.occurredAt <= to);

  const dayMap = new Map<string, { income: number; expense: number }>();
  for (const t of txs) {
    const key = t.occurredAt.slice(0, 10);
    const slot = dayMap.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "in") slot.income += t.amount;
    if (t.type === "out") slot.expense += t.amount;
    dayMap.set(key, slot);
  }

  const catMap = new Map<string, number>();
  let totalExpense = 0;
  for (const t of txs) {
    if (t.type !== "out") continue;
    catMap.set((t as any).categoryId, (catMap.get((t as any).categoryId) ?? 0) + t.amount);
    totalExpense += t.amount;
  }

  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const t of txs) {
    const d = new Date(t.occurredAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const slot = monthMap.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "in") slot.income += t.amount;
    if (t.type === "out") slot.expense += t.amount;
    monthMap.set(key, slot);
  }

  return {
    period: { from, to },
    cashflow: Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v })),
    expenseByCategory: Array.from(catMap.entries()).map(([categoryId, amount]) => ({
      categoryId,
      amount,
      percent: totalExpense ? Math.round((amount / totalExpense) * 100) : 0,
    })),
    monthlyTrend: Array.from(monthMap.entries()).map(([key, v]) => {
      const [y, m] = key.split("-").map(Number);
      return { year: y, month: m, ...v };
    }),
    topExpenses: [...txs]
      .filter((t) => t.type === "out")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
  };
}

export const reportHandlers = [
  http.get(endpoint("/dashboard/summary"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = url.searchParams.get("bookId");
    const summary = await buildSummary(bookId);
    return HttpResponse.json(summary);
  }),
  http.get(endpoint("/reports"), async ({ request }) => {
    const url = new URL(request.url);
    const from =
      url.searchParams.get("from") ?? new Date(Date.now() - 30 * 86400_000).toISOString();
    const to = url.searchParams.get("to") ?? new Date().toISOString();
    const bookId = url.searchParams.get("bookId");
    const report = await buildReport(from, to, bookId);
    return HttpResponse.json(report);
  }),
];
