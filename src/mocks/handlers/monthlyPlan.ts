import { http, HttpResponse } from "msw";
import type {
  MonthlyPlan,
  MonthlyPlanProgress,
  PlanGroup,
  PlanIngredient,
  PlanItem,
  Transaction,
  WeekPlan,
} from "@/types";
import { endpoint } from "../baseUrl";
import { DEFAULT_BOOK_ID } from "../data/seed";

let nextNum = 1;
function nid(prefix: string): string {
  return `${prefix}-${Date.now()}-${nextNum++}`;
}

function buildEmptyWeeks(year: number, month: number): WeekPlan[] {
  const weeks: WeekPlan[] = [];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let weekNum = 1;
  let dayCursor = 1;
  while (dayCursor <= lastDay) {
    const endDay = Math.min(dayCursor + 6, lastDay);
    weeks.push({
      _id: nid("week"),
      weekNumber: weekNum,
      startDate: new Date(Date.UTC(year, month - 1, dayCursor)).toISOString(),
      endDate: new Date(Date.UTC(year, month - 1, endDay, 23, 59, 59, 999)).toISOString(),
      groups: [], // SENGAJA kosong — user yang tentukan groupnya.
    });
    dayCursor = endDay + 1;
    weekNum++;
  }
  return weeks;
}

/**
 * Seed plan demo dengan beberapa group manual supaya tester langsung bisa
 * lihat fitur lengkap (shopping + meal + auto-tx flow). Hanya plan SEED yang
 * punya groups isi — plan yang dibuat user baru akan punya weeks kosong.
 */
function seedDemoPlan(year: number, month: number, bookId: string): MonthlyPlan {
  const weeks = buildEmptyWeeks(year, month);
  if (weeks[0]) {
    weeks[0].groups = [
      {
        _id: nid("group"),
        kind: "shopping",
        name: "Belanja Bulanan",
        icon: "ShoppingCart",
        linkedCategoryId: "c3", // Belanja
        items: [
          { _id: nid("item"), name: "Beras", quantity: 5, unit: "kg", estimatedPrice: 75000, linkedAccountId: "a1", done: false, order: 1 },
          { _id: nid("item"), name: "Minyak Goreng", quantity: 2, unit: "L", estimatedPrice: 36000, linkedAccountId: "a1", done: false, order: 2 },
          { _id: nid("item"), name: "Telur", quantity: 1, unit: "kg", estimatedPrice: 28000, linkedAccountId: "a2", done: false, order: 3 },
        ],
      },
      {
        _id: nid("group"),
        kind: "meal",
        name: "Menu Masak Minggu 1",
        icon: "ChefHat",
        linkedCategoryId: "c1", // Makanan & Minuman
        items: [
          {
            _id: nid("item"),
            name: "Ayam Geprek",
            quantity: 4,
            unit: "porsi",
            linkedAccountId: "a2",
            done: false,
            order: 1,
            ingredients: [
              { _id: nid("ing"), name: "Ayam Fillet", quantity: 500, unit: "gr", estimatedPrice: 35000, done: false },
              { _id: nid("ing"), name: "Cabai Rawit", quantity: 50, unit: "gr", estimatedPrice: 5000, done: false },
              { _id: nid("ing"), name: "Bawang Putih", quantity: 5, unit: "siung", estimatedPrice: 3000, done: false },
            ],
          },
        ],
      },
    ];
    // Compute estimatedPrice for meal items dari ingredients (parent reflect sum).
    for (const g of weeks[0].groups) {
      for (const it of g.items) {
        if (it.ingredients && it.ingredients.length > 0) {
          it.estimatedPrice = sumIngredientPrice(it.ingredients);
        }
      }
    }
  }
  return {
    _id: nid("plan"),
    userId: "u1",
    bookId,
    period: { year, month },
    name: `Perencanaan ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })} ${year}`,
    totalBudget: 2_500_000,
    weeks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

function createSecondDemoPlan(year: number, month: number, bookId: string): MonthlyPlan {
  const weeks = buildEmptyWeeks(year, month);
  if (weeks[0]) {
    weeks[0].groups = [
      {
        _id: nid("group"),
        kind: "shopping",
        name: "Keperluan Rumah Tangga",
        icon: "Home",
        linkedCategoryId: "c3",
        items: [
          { _id: nid("item"), name: "Sabun Cuci & Deterjen", quantity: 2, unit: "pack", estimatedPrice: 48000, linkedAccountId: "a1", done: true, order: 1 },
          { _id: nid("item"), name: "Lampu LED Hemat Energi", quantity: 3, unit: "buah", estimatedPrice: 90000, linkedAccountId: "a1", done: false, order: 2 },
          { _id: nid("item"), name: "Sapu & Alat Pel Baru", quantity: 1, unit: "set", estimatedPrice: 65000, linkedAccountId: "a1", done: false, order: 3 },
        ],
      },
      {
        _id: nid("group"),
        kind: "shopping",
        name: "Tagihan & Langganan Digital",
        icon: "Wifi",
        linkedCategoryId: "c2",
        items: [
          { _id: nid("item"), name: "Internet Fiber 50Mbps", quantity: 1, unit: "bulan", estimatedPrice: 385000, linkedAccountId: "a1", done: true, order: 1 },
          { _id: nid("item"), name: "Langganan Spotify & Cloud", quantity: 1, unit: "bulan", estimatedPrice: 79000, linkedAccountId: "a2", done: false, order: 2 },
        ],
      },
    ];
  }
  return {
    _id: nid("plan"),
    userId: "u1",
    bookId,
    period: { year, month },
    name: `Kebutuhan Rumah & Rutin ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })} ${year}`,
    totalBudget: 1_200_000,
    weeks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createBusinessDemoPlan(year: number, month: number, bookId: string): MonthlyPlan {
  const weeks = buildEmptyWeeks(year, month);
  if (weeks[0]) {
    weeks[0].groups = [
      {
        _id: nid("group"),
        kind: "shopping",
        name: "Bahan Baku Kopi & Susu",
        icon: "Coffee",
        items: [
          { _id: nid("item"), name: "Biji Kopi House Blend 5kg", quantity: 5, unit: "kg", estimatedPrice: 450000, linkedAccountId: "a-kasir-laci", done: true, order: 1 },
          { _id: nid("item"), name: "Susu UHT Fresh 24 Liter", quantity: 24, unit: "liter", estimatedPrice: 432000, linkedAccountId: "a-kasir-laci", done: true, order: 2 },
          { _id: nid("item"), name: "Gula Aren Organik 10kg", quantity: 10, unit: "kg", estimatedPrice: 240000, linkedAccountId: "a-kasir-laci", done: false, order: 3 },
        ],
      },
      {
        _id: nid("group"),
        kind: "shopping",
        name: "Kemasan & Packaging",
        icon: "Package",
        items: [
          { _id: nid("item"), name: "Cup Sablon 16oz (1000 pcs)", quantity: 1, unit: "dus", estimatedPrice: 350000, linkedAccountId: "a-qris-bank", done: false, order: 1 },
          { _id: nid("item"), name: "Sedotan Kertas Ramah Lingkungan", quantity: 5, unit: "pack", estimatedPrice: 75000, linkedAccountId: "a-kasir-laci", done: false, order: 2 },
        ],
      },
    ];
  }
  return {
    _id: nid("plan"),
    userId: "u-business",
    bookId,
    period: { year, month },
    name: `Belanja Operasional Warung ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })} ${year}`,
    totalBudget: 3_500_000,
    weeks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const plans: MonthlyPlan[] = [
  seedDemoPlan(currentYear, currentMonth, DEFAULT_BOOK_ID),
  createSecondDemoPlan(currentYear, currentMonth, DEFAULT_BOOK_ID),
  seedDemoPlan(prevYear, prevMonth, DEFAULT_BOOK_ID),
  createBusinessDemoPlan(currentYear, currentMonth, "book-business-warung"),
];

function findPlanByPeriod(
  year: number,
  month: number,
  bookId: string,
): MonthlyPlan | undefined {
  return plans.find(
    (p) =>
      p.period.year === year &&
      p.period.month === month &&
      (p.bookId ?? DEFAULT_BOOK_ID) === bookId,
  );
}

function sumIngredientPrice(ings: PlanIngredient[]): number {
  return ings.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);
}

/**
 * Cari item by id di sepanjang plan. Return tuple (group, item) untuk
 * memudahkan caller akses ke group context (linkedCategoryId, dll).
 */
function findItem(
  plan: MonthlyPlan,
  itemId: string,
): { group: PlanGroup; item: PlanItem; week: WeekPlan } | null {
  for (const w of plan.weeks) {
    for (const g of w.groups) {
      const it = g.items.find((i) => i._id === itemId);
      if (it) return { week: w, group: g, item: it };
    }
  }
  return null;
}

function findIngredient(
  plan: MonthlyPlan,
  itemId: string,
  ingId: string,
): { group: PlanGroup; item: PlanItem; ingredient: PlanIngredient; week: WeekPlan } | null {
  const itemRef = findItem(plan, itemId);
  if (!itemRef || !itemRef.item.ingredients) return null;
  const ing = itemRef.item.ingredients.find((i) => i._id === ingId);
  if (!ing) return null;
  return { ...itemRef, ingredient: ing };
}

/**
 * Buat transaksi out otomatis di `__transactionsStore`. Return transaction id.
 * Aturan:
 * - type = "out"
 * - accountId = linkedAccountId
 * - categoryId = group.linkedCategoryId (atau fallback ke kategori "Lainnya")
 * - amount = price
 * - note = "[Plan] <itemName>" / "[Plan] <itemName> · <ingName>"
 */
async function autoCreateTx(opts: {
  accountId: string;
  categoryId?: string;
  amount: number;
  note: string;
  bookId: string;
  occurredAt?: string;
}): Promise<string> {
  const { __transactionsStore } = await import("./transaction");
  const { __accountsStore } = await import("./account");
  const acc = __accountsStore.find((a) => a._id === opts.accountId);
  const txId = `t-plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newTx: Transaction = {
    _id: txId,
    userId: "u1",
    bookId: opts.bookId,
    type: "out",
    accountId: opts.accountId,
    categoryId: opts.categoryId ?? "c12", // Lainnya kalau group tidak punya kategori
    amount: opts.amount,
    note: opts.note,
    occurredAt: opts.occurredAt ?? new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  __transactionsStore.push(newTx);
  if (acc) acc.currentBalance -= opts.amount;
  return txId;
}

async function autoDeleteTx(txId: string): Promise<void> {
  const { __transactionsStore } = await import("./transaction");
  const { __accountsStore } = await import("./account");
  const idx = __transactionsStore.findIndex((t) => t._id === txId);
  if (idx === -1) return;
  const tx = __transactionsStore[idx];
  if (tx.type === "out") {
    const acc = __accountsStore.find((a) => a._id === tx.accountId);
    if (acc) acc.currentBalance += tx.amount + (tx.adminFee ?? 0);
  }
  __transactionsStore.splice(idx, 1);
}

/** Recompute item.done & item.estimatedPrice dari ingredients. */
function syncMealItem(item: PlanItem): void {
  if (!item.ingredients || item.ingredients.length === 0) return;
  item.estimatedPrice = sumIngredientPrice(item.ingredients);
  item.done = item.ingredients.every((i) => i.done);
}

function buildProgress(plan: MonthlyPlan): MonthlyPlanProgress {
  let totalEstimated = 0;
  let totalSpent = 0;
  const weeks = plan.weeks.map((w) => {
    let weekEstimated = 0;
    let weekSpent = 0;
    const groups = w.groups.map((g) => {
      const est = g.items.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);
      const itemsTotal = g.items.length;
      const itemsDone = g.items.filter((i) => i.done).length;
      // Spent = sum estimatedPrice item/ingredient yang sudah done
      const spent = g.items.reduce((s, it) => {
        if (it.ingredients && it.ingredients.length > 0) {
          return s + it.ingredients.filter((ing) => ing.done).reduce((s2, ing) => s2 + (ing.estimatedPrice ?? 0), 0);
        }
        return s + (it.done ? it.estimatedPrice ?? 0 : 0);
      }, 0);
      weekEstimated += est;
      weekSpent += spent;
      return {
        groupId: g._id,
        kind: g.kind,
        name: g.name,
        estimated: est,
        spent: g.linkedCategoryId ? spent : null,
        itemsDone,
        itemsTotal,
      };
    });
    totalEstimated += weekEstimated;
    totalSpent += weekSpent;
    return {
      weekId: w._id,
      weekNumber: w.weekNumber,
      estimated: weekEstimated,
      spent: weekSpent,
      groups,
    };
  });
  return {
    planId: plan._id,
    totalEstimated,
    totalSpent,
    weeks,
  };
}


export const monthlyPlanHandlers = [
  http.get(endpoint("/monthly-plans"), ({ request }) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const bookId = url.searchParams.get("bookId") ?? DEFAULT_BOOK_ID;
    if (!year || !month) {
      return HttpResponse.json(
        { code: "VALIDATION_ERROR", message: "Query year & month wajib." },
        { status: 400 },
      );
    }
    const found = findPlanByPeriod(year, month, bookId);
    return HttpResponse.json(found ?? null);
  }),

  // ── Multi-Plan List Endpoint (/monthly-plans/list) ──────────────────────────
  http.get(endpoint("/monthly-plans/list"), ({ request }) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const bookId = url.searchParams.get("bookId") ?? DEFAULT_BOOK_ID;

    let matched = plans.filter((p) => (p.bookId ?? DEFAULT_BOOK_ID) === bookId);
    if (year && month) {
      matched = matched.filter(
        (p) => p.period.year === year && p.period.month === month,
      );
    }
    return HttpResponse.json(matched);
  }),

  http.get(endpoint("/monthly-plans/:id"), ({ params }) => {
    const p = plans.find((x) => x._id === params.id);
    if (!p) return HttpResponse.json({ message: "Plan tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(p);
  }),

  http.get(endpoint("/monthly-plans/:id/progress"), ({ params }) => {
    const p = plans.find((x) => x._id === params.id);
    if (!p) return HttpResponse.json({ message: "Plan tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(buildProgress(p));
  }),

  http.post(endpoint("/monthly-plans"), async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      period: { year: number; month: number };
      totalBudget?: number;
      bookId?: string;
      copyFromPlanId?: string;
      copyGroupIds?: string[];
    };
    const bookId = body.bookId ?? DEFAULT_BOOK_ID;

    const initialWeeks = buildEmptyWeeks(body.period.year, body.period.month);

    // Salin group dari plan sumber jika disediakan
    if (body.copyFromPlanId) {
      const sourcePlan = plans.find((p) => p._id === body.copyFromPlanId);
      if (sourcePlan && initialWeeks[0]) {
        const sourceGroups = sourcePlan.weeks.flatMap((w) => w.groups);
        const filteredGroups =
          body.copyGroupIds && body.copyGroupIds.length > 0
            ? sourceGroups.filter((g) => body.copyGroupIds!.includes(g._id))
            : sourceGroups;

        initialWeeks[0].groups = filteredGroups.map((g) => ({
          ...g,
          _id: nid("group"),
          items: g.items.map((it) => ({
            ...it,
            _id: nid("item"),
            done: false,
            linkedTransactionId: undefined,
            ingredients: it.ingredients?.map((ing) => ({
              ...ing,
              _id: nid("ing"),
              done: false,
              linkedTransactionId: undefined,
            })),
          })),
        }));
      }
    }

    const fresh: MonthlyPlan = {
      _id: nid("plan"),
      userId: "u1",
      bookId,
      period: body.period,
      name: body.name,
      totalBudget: body.totalBudget ?? 2_500_000,
      weeks: initialWeeks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plans.push(fresh);
    return HttpResponse.json(fresh, { status: 201 });
  }),

  http.patch(endpoint("/monthly-plans/:id"), async ({ params, request }) => {
    const idx = plans.findIndex((p) => p._id === params.id);
    if (idx === -1) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    const body = (await request.json()) as Partial<MonthlyPlan>;
    plans[idx] = {
      ...plans[idx],
      ...body,
      _id: plans[idx]._id,
      updatedAt: new Date().toISOString(),
    };
    // Sync meal items: ingredients exist → recompute estimatedPrice & done
    for (const w of plans[idx].weeks) {
      for (const g of w.groups) {
        for (const it of g.items) {
          if (it.ingredients && it.ingredients.length > 0) syncMealItem(it);
        }
      }
    }
    return HttpResponse.json(plans[idx]);
  }),

  /**
   * Toggle done / edit shallow di satu item.
   * Logic auto-tx:
   * - body.done=true & item TIDAK punya ingredients: WAJIB linkedAccountId
   *   (existing atau di body). Buat tx, set linkedTransactionId.
   * - body.done=false & ada linkedTransactionId: hapus tx, clear field.
   * - Item dengan ingredients: server SKIP auto-tx — done di-compute dari
   *   ingredient state (FE diharap PATCH ke endpoint ingredient terpisah).
   */
  http.patch(endpoint("/monthly-plans/:id/items/:itemId"), async ({ params, request }) => {
    const plan = plans.find((p) => p._id === params.id);
    if (!plan) return HttpResponse.json({ message: "Plan tidak ditemukan" }, { status: 404 });
    const ref = findItem(plan, params.itemId as string);
    if (!ref) return HttpResponse.json({ message: "Item tidak ditemukan" }, { status: 404 });
    const body = (await request.json()) as Partial<PlanItem>;
    const { item, group } = ref;
    const hasIngs = !!item.ingredients && item.ingredients.length > 0;

    // Merge field non-done dulu (name, linkedAccountId, dst).
    Object.assign(item, body, { _id: item._id });

    // Handle toggle done (hanya untuk item tanpa ingredients).
    if ("done" in body && !hasIngs) {
      if (body.done === true) {
        if (!item.linkedAccountId) {
          return HttpResponse.json(
            {
              statusCode: 422,
              code: "VALIDATION_ERROR",
              message: "Set dompet sumber dana sebelum ceklis item.",
            },
            { status: 422 },
          );
        }
        const price = item.estimatedPrice ?? 0;
        if (price > 0) {
          const txId = await autoCreateTx({
            accountId: item.linkedAccountId,
            categoryId: group.linkedCategoryId,
            amount: price,
            note: `[Plan] ${item.name}`,
            bookId: plan.bookId ?? DEFAULT_BOOK_ID,
          });
          item.linkedTransactionId = txId;
        }
        item.done = true;
      } else {
        if (item.linkedTransactionId) {
          await autoDeleteTx(item.linkedTransactionId);
          item.linkedTransactionId = undefined;
        }
        item.done = false;
      }
    }

    if (hasIngs) syncMealItem(item);
    plan.updatedAt = new Date().toISOString();
    return HttpResponse.json(plan);
  }),

  /**
   * Toggle done / edit di satu ingredient. Auto-tx mirror logic item:
   * - done=true: butuh linkedAccountId (ingredient atau parent.linkedAccountId).
   * - done=false: hapus tx terkait.
   * Setelah update, server sync parent item (done & estimatedPrice).
   */
  http.patch(
    endpoint("/monthly-plans/:id/items/:itemId/ingredients/:ingId"),
    async ({ params, request }) => {
      const plan = plans.find((p) => p._id === params.id);
      if (!plan) return HttpResponse.json({ message: "Plan tidak ditemukan" }, { status: 404 });
      const ref = findIngredient(
        plan,
        params.itemId as string,
        params.ingId as string,
      );
      if (!ref) return HttpResponse.json({ message: "Bahan tidak ditemukan" }, { status: 404 });
      const body = (await request.json()) as Partial<PlanIngredient>;
      const { item, ingredient, group } = ref;

      Object.assign(ingredient, body, { _id: ingredient._id });

      if ("done" in body) {
        if (body.done === true) {
          const accountId = ingredient.linkedAccountId ?? item.linkedAccountId;
          if (!accountId) {
            return HttpResponse.json(
              {
                statusCode: 422,
                code: "VALIDATION_ERROR",
                message: "Set dompet sumber dana (di bahan atau di item) sebelum ceklis.",
              },
              { status: 422 },
            );
          }
          const price = ingredient.estimatedPrice ?? 0;
          if (price > 0) {
            const txId = await autoCreateTx({
              accountId,
              categoryId: group.linkedCategoryId,
              amount: price,
              note: `[Plan] ${item.name} · ${ingredient.name}`,
              bookId: plan.bookId ?? DEFAULT_BOOK_ID,
            });
            ingredient.linkedTransactionId = txId;
          }
          ingredient.done = true;
        } else {
          if (ingredient.linkedTransactionId) {
            await autoDeleteTx(ingredient.linkedTransactionId);
            ingredient.linkedTransactionId = undefined;
          }
          ingredient.done = false;
        }
      }

      syncMealItem(item);
      plan.updatedAt = new Date().toISOString();
      return HttpResponse.json(plan);
    },
  ),

  http.delete(endpoint("/monthly-plans/:id"), async ({ params }) => {
    const idx = plans.findIndex((p) => p._id === params.id);
    if (idx === -1) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    // Cascade: hapus semua transaksi yang dibuat plan ini (linkedTransactionId).
    const plan = plans[idx];
    for (const w of plan.weeks) {
      for (const g of w.groups) {
        for (const it of g.items) {
          if (it.linkedTransactionId) await autoDeleteTx(it.linkedTransactionId);
          if (it.ingredients) {
            for (const ing of it.ingredients) {
              if (ing.linkedTransactionId) await autoDeleteTx(ing.linkedTransactionId);
            }
          }
        }
      }
    }
    plans.splice(idx, 1);
    return HttpResponse.json({ ok: true });
  }),
];

/** Helper untuk export bundle. */
export function __getMockMonthlyPlans(): MonthlyPlan[] {
  return plans;
}
