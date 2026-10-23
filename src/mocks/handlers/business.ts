import { http, HttpResponse } from "msw";
import { endpoint } from "../baseUrl";
import { storageAdapter } from "../storage/adapter";
import type {
  Product,
  Sale,
  StockMovement,
  BusinessSettings,
  SalesReport,
  ProfitLoss,
  InventoryReport,
  BookTransfer,
  LinkableAccount,
} from "@/types/business";
import type { Account, Book } from "@/types";

function getActiveBookId(url: URL): string {
  const param = url.searchParams.get("bookId");
  if (param) return param;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("monage:activeBookId") || "book-business-warung";
  }
  return "book-business-warung";
}

export const businessHandlers = [
  // ── Produk ─────────────────────────────────────────────────────────────────
  http.get(endpoint("/products"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const archivedParam = url.searchParams.get("archived");

    const allProducts = await storageAdapter.getAll<Product>("products");
    let filtered = allProducts.filter((p) => !p.bookId || p.bookId === bookId);

    if (archivedParam !== "true") {
      filtered = filtered.filter((p) => !p.archived);
    }

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          (p.sku && p.sku.toLowerCase().includes(search)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(search)),
      );
    }

    return HttpResponse.json(filtered);
  }),

  http.get(endpoint("/products/:id"), async ({ params }) => {
    const { id } = params;
    const product = await storageAdapter.getById<Product>("products", id as string);
    if (!product) {
      return HttpResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  http.post(endpoint("/products"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const body = (await request.json()) as Partial<Product>;

    const newProduct: Product = {
      _id: `p-${Date.now()}`,
      bookId: body.bookId || bookId,
      name: body.name || "Produk Baru",
      sku: body.sku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: body.barcode,
      unit: body.unit || "Pcs",
      sellPrice: Number(body.sellPrice) || 0,
      costPrice: Number(body.costPrice) || 0,
      stockQty: Number(body.stockQty) || 0,
      trackStock: body.trackStock ?? true,
      categoryName: body.categoryName || "Umum",
      imageUrl: body.imageUrl || null,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    await storageAdapter.insert("products", newProduct);

    if (newProduct.trackStock && newProduct.stockQty > 0) {
      const movement: StockMovement = {
        _id: `sm-${Date.now()}`,
        bookId: newProduct.bookId,
        productId: newProduct._id,
        type: "in",
        qty: newProduct.stockQty,
        unitCost: newProduct.costPrice,
        reason: "Stok awal produk baru",
        occurredAt: new Date().toISOString(),
      };
      await storageAdapter.insert("stockMovements", movement);
    }

    return HttpResponse.json(newProduct, { status: 201 });
  }),

  http.patch(endpoint("/products/:id"), async ({ params, request }) => {
    const { id } = params;
    const patch = (await request.json()) as Partial<Product>;
    const updated = await storageAdapter.update<Product>("products", id as string, patch);
    return HttpResponse.json(updated);
  }),

  http.delete(endpoint("/products/:id"), async ({ params }) => {
    const { id } = params;
    await storageAdapter.update<Product>("products", id as string, { archived: true });
    return HttpResponse.json({ ok: true });
  }),

  http.post(endpoint("/products/:id/image"), async ({ params }) => {
    const { id } = params;
    const mockImageUrl = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80";
    const updated = await storageAdapter.update<Product>("products", id as string, {
      imageUrl: mockImageUrl,
    });
    return HttpResponse.json(updated);
  }),

  http.delete(endpoint("/products/:id/image"), async ({ params }) => {
    const { id } = params;
    const updated = await storageAdapter.update<Product>("products", id as string, {
      imageUrl: null,
    });
    return HttpResponse.json(updated);
  }),

  // ── Inventori & Mutasi Stok ───────────────────────────────────────────────
  http.get(endpoint("/inventory/movements"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const productId = url.searchParams.get("productId");

    const allMovements = await storageAdapter.getAll<StockMovement>("stockMovements");
    let filtered = allMovements.filter((m) => !m.bookId || m.bookId === bookId);
    if (productId) {
      filtered = filtered.filter((m) => m.productId === productId);
    }

    return HttpResponse.json(
      filtered.sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    );
  }),

  http.post(endpoint("/inventory/movements"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const body = (await request.json()) as {
      productId: string;
      type: "in" | "out" | "adjust" | "return";
      qty: number;
      unitCost?: number;
      reason?: string;
    };

    const product = await storageAdapter.getById<Product>("products", body.productId);
    if (!product) {
      return HttpResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });
    }

    const qty = Math.max(0, Number(body.qty) || 0);
    if (qty <= 0) {
      return HttpResponse.json({ message: "Kuantitas mutasi harus lebih besar dari 0." }, { status: 422 });
    }

    const curStock = Number(product.stockQty) || 0;
    let nextStock = curStock;
    if (body.type === "in" || body.type === "return") {
      nextStock = curStock + qty;
    } else if (body.type === "out") {
      nextStock = Math.max(0, curStock - qty);
    } else if (body.type === "adjust") {
      nextStock = qty;
    }

    await storageAdapter.update<Product>("products", product._id, { stockQty: nextStock });

    const movement: StockMovement = {
      _id: `sm-${Date.now()}`,
      bookId: product.bookId || bookId,
      productId: product._id,
      type: body.type,
      qty,
      unitCost: Math.max(0, Number(body.unitCost ?? product.costPrice) || 0),
      reason: body.reason ?? "Penyesuaian stok manual",
      occurredAt: new Date().toISOString(),
    };

    await storageAdapter.insert("stockMovements", movement);

    return HttpResponse.json(
      { movement, stockQty: nextStock },
      { status: 201 },
    );
  }),

  http.get(endpoint("/inventory/low-stock"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const threshold = Number(url.searchParams.get("threshold")) || 5;

    const allProducts = await storageAdapter.getAll<Product>("products");
    const lowStock = allProducts.filter(
      (p) =>
        (!p.bookId || p.bookId === bookId) &&
        !p.archived &&
        p.trackStock &&
        p.stockQty <= threshold,
    );

    return HttpResponse.json(lowStock);
  }),

  // ── Penjualan Kasir (POS) ──────────────────────────────────────────────────
  http.get(endpoint("/pos/sales"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const status = url.searchParams.get("status");

    const allSales = await storageAdapter.getAll<Sale>("sales");
    let filtered = allSales.filter((s) => !s.bookId || s.bookId === bookId);
    if (status) {
      filtered = filtered.filter((s) => s.paymentStatus === status);
    }

    return HttpResponse.json(
      filtered.sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    );
  }),

  http.get(endpoint("/pos/sales/:id"), async ({ params }) => {
    const { id } = params;
    const sale = await storageAdapter.getById<Sale>("sales", id as string);
    if (!sale) {
      return HttpResponse.json({ message: "Penjualan tidak ditemukan." }, { status: 404 });
    }
    return HttpResponse.json(sale);
  }),

  http.post(endpoint("/pos/sales"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const body = (await request.json()) as {
      items: Array<{ productId: string; qty: number; unitPrice?: number }>;
      customerName?: string;
      discount?: number;
      paymentMethod?: "cash" | "transfer" | "other";
      paymentRef?: string | null;
      accountId?: string;
    };

    const allProducts = await storageAdapter.getAll<Product>("products");
    const productMap = new Map(allProducts.map((p) => [p._id, p]));

    let subtotal = 0;
    let costTotal = 0;

    const items = body.items.map((i) => {
      const p = productMap.get(i.productId);
      const qty = Math.max(1, Number(i.qty) || 1);
      const unitPrice = Math.max(0, Number(i.unitPrice ?? p?.sellPrice ?? 0) || 0);
      const unitCost = Math.max(0, Number(p?.costPrice ?? 0) || 0);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      costTotal += unitCost * qty;

      return {
        productId: i.productId,
        nameSnapshot: p?.name || "Item",
        qty,
        unitPrice,
        unitCost,
        lineTotal,
      };
    });

    const discount = Math.max(0, Number(body.discount) || 0);
    const total = Math.max(0, subtotal - discount);
    const paymentMethod = body.paymentMethod || "cash";

    // Auto-resolve account if not provided
    let accountId = body.accountId || null;
    if (!accountId) {
      const accounts = await storageAdapter.getAll<Account>("accounts");
      const bookAccounts = accounts.filter((a) => !a.bookId || a.bookId === bookId);
      if (paymentMethod === "cash") {
        const cashAcc = bookAccounts.find((a) => a.type === "cash");
        accountId = cashAcc?._id || bookAccounts[0]?._id || null;
      } else {
        const bankAcc = bookAccounts.find((a) => a.type === "bank" || a.type === "ewallet");
        accountId = bankAcc?._id || bookAccounts[0]?._id || null;
      }
    }

    const codeDate = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const saleCode = `POS-${codeDate}-${Math.floor(100 + Math.random() * 900)}`;

    const newSale: Sale = {
      _id: `sale-${Date.now()}`,
      bookId,
      code: saleCode,
      cashierId: "u-business",
      customerName: body.customerName || "Pelanggan Umum",
      items,
      subtotal,
      discount,
      tax: 0,
      total,
      costTotal,
      paymentMethod,
      paymentStatus: "paid",
      accountId,
      paymentRef: body.paymentRef || null,
      paidAt: new Date().toISOString(),
      occurredAt: new Date().toISOString(),
    };

    const result = await storageAdapter.processSaleWithStockDeduction(newSale);
    return HttpResponse.json(result, { status: 201 });
  }),

  http.post(endpoint("/pos/sales/:id/void"), async ({ params }) => {
    const { id } = params;
    try {
      const voided = await storageAdapter.voidSaleWithStockReversal(id as string);
      return HttpResponse.json(voided);
    } catch (e: any) {
      return HttpResponse.json({ message: e.message || "Gagal membatalkan transaksi." }, { status: 400 });
    }
  }),

  http.get(endpoint("/pos/receipt/:id"), async ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);

    const sale = await storageAdapter.getById<Sale>("sales", id as string);
    if (!sale) {
      return HttpResponse.json({ message: "Penjualan tidak ditemukan." }, { status: 404 });
    }

    const settings = await storageAdapter.getById<BusinessSettings>("businessSettings", bookId);

    return HttpResponse.json({
      sale,
      receipt: {
        header: settings?.receiptHeader || "WARUNG BERKAH",
        address: settings?.address || "Jl. Margonda Raya No. 45, Depok",
        footer: settings?.receiptFooter || "Terima kasih atas kunjungan Anda!",
        logoUrl: settings?.logoUrl || null,
      },
    });
  }),

  http.post(endpoint("/pos/sales/:id/payment-proof"), async ({ params }) => {
    const { id } = params;
    const proofUrl = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80";
    const updated = await storageAdapter.update<Sale>("sales", id as string, {
      paymentProofUrl: proofUrl,
    });
    return HttpResponse.json(updated);
  }),

  // ── Laporan Bisnis ────────────────────────────────────────────────────────
  http.get(endpoint("/business-report/sales"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);

    const allSales = await storageAdapter.getAll<Sale>("sales");
    const scopedSales = allSales.filter(
      (s) => (!s.bookId || s.bookId === bookId) && s.paymentStatus === "paid",
    );

    let totalSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const byPaymentMethod = { cash: 0, transfer: 0, other: 0 };
    const dayMap = new Map<string, { sales: number; orders: number }>();
    const productSoldMap = new Map<string, { name: string; qty: number; revenue: number }>();

    for (const s of scopedSales) {
      totalSales += s.total;
      totalDiscount += s.discount;
      totalTax += s.tax;

      if (s.paymentMethod in byPaymentMethod) {
        byPaymentMethod[s.paymentMethod as keyof typeof byPaymentMethod] += s.total;
      } else {
        byPaymentMethod.other += s.total;
      }

      const dayKey = s.occurredAt.slice(0, 10);
      const curDay = dayMap.get(dayKey) || { sales: 0, orders: 0 };
      curDay.sales += s.total;
      curDay.orders += 1;
      dayMap.set(dayKey, curDay);

      for (const item of s.items) {
        const curProd = productSoldMap.get(item.productId) || {
          name: item.nameSnapshot,
          qty: 0,
          revenue: 0,
        };
        curProd.qty += item.qty;
        curProd.revenue += item.lineTotal;
        productSoldMap.set(item.productId, curProd);
      }
    }

    const byDay = Array.from(dayMap.entries())
      .map(([date, val]) => ({ date, sales: val.sales, orders: val.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topProducts = Array.from(productSoldMap.entries())
      .map(([productId, val]) => ({
        productId,
        name: val.name,
        qtySold: val.qty,
        revenue: val.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const now = new Date();
    const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
    const to = now.toISOString();

    const report: SalesReport = {
      period: { from, to },
      totalSales,
      totalOrders: scopedSales.length,
      totalDiscount,
      totalTax,
      byDay,
      byPaymentMethod,
      topProducts,
    };

    return HttpResponse.json(report);
  }),

  http.get(endpoint("/business-report/profit-loss"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);

    const allSales = await storageAdapter.getAll<Sale>("sales");
    const scopedSales = allSales.filter(
      (s) => (!s.bookId || s.bookId === bookId) && s.paymentStatus === "paid",
    );

    let revenue = 0;
    let cogs = 0;
    for (const s of scopedSales) {
      revenue += s.total;
      cogs += s.costTotal;
    }

    const grossProfit = revenue - cogs;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const operatingExpenses = 1_500_000; // Fixed simulation ops
    const netProfit = grossProfit - operatingExpenses;

    const now = new Date();
    const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
    const to = now.toISOString();

    const pl: ProfitLoss = {
      period: { from, to },
      revenue,
      cogs,
      grossProfit,
      grossMarginPct: Math.round(grossMarginPct * 10) / 10,
      operatingExpenses,
      netProfit,
    };

    return HttpResponse.json(pl);
  }),

  http.get(endpoint("/business-report/inventory"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);

    const allProducts = await storageAdapter.getAll<Product>("products");
    const scopedProducts = allProducts.filter(
      (p) => (!p.bookId || p.bookId === bookId) && !p.archived,
    );

    let stockValue = 0;
    let trackedCount = 0;
    const lowStock: Array<{ productId: string; name: string; stockQty: number }> = [];

    for (const p of scopedProducts) {
      if (p.trackStock) {
        trackedCount++;
        stockValue += p.stockQty * p.costPrice;
        if (p.stockQty <= 20) {
          lowStock.push({ productId: p._id, name: p.name, stockQty: p.stockQty });
        }
      }
    }

    const inv: InventoryReport = {
      stockValue,
      trackedCount,
      lowStock,
    };

    return HttpResponse.json(inv);
  }),

  // ── Pengaturan Bisnis ──────────────────────────────────────────────────────
  http.get(endpoint("/business-settings"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    let settings = await storageAdapter.getById<BusinessSettings>("businessSettings", bookId);

    if (!settings) {
      settings = {
        bookId,
        receiptHeader: "WARUNG BERKAH - KOPI & KULINER NUSANTARA",
        receiptFooter: "Terima kasih telah berkunjung!",
        address: "Jl. Margonda Raya No. 45, Depok",
        taxPercent: 0,
        storefrontEnabled: true,
        storefrontAccountId: "a-qris-bank",
        logoUrl: null,
      };
      await storageAdapter.insert("businessSettings", settings);
    }

    return HttpResponse.json(settings);
  }),

  http.patch(endpoint("/business-settings"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const patch = (await request.json()) as Partial<BusinessSettings>;

    let settings = await storageAdapter.getById<BusinessSettings>("businessSettings", bookId);
    if (!settings) {
      settings = {
        bookId,
        receiptHeader: "WARUNG BERKAH",
        receiptFooter: "Terima kasih!",
        address: "Jl. Margonda Raya No. 45, Depok",
        taxPercent: 0,
        storefrontEnabled: true,
        storefrontAccountId: null,
        logoUrl: null,
      };
    }

    const updated = { ...settings, ...patch, bookId };
    await storageAdapter.insert("businessSettings", updated);
    return HttpResponse.json(updated);
  }),

  http.post(endpoint("/business-settings/logo"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const logoUrl = "/logo.png";
    const settings = await storageAdapter.getById<BusinessSettings>("businessSettings", bookId);
    const updated = {
      ...(settings || { bookId, receiptHeader: "", receiptFooter: "", address: "", taxPercent: 0, storefrontEnabled: false, storefrontAccountId: null }),
      logoUrl,
    };
    await storageAdapter.insert("businessSettings", updated);
    return HttpResponse.json(updated);
  }),

  http.delete(endpoint("/business-settings/logo"), async ({ request }) => {
    const url = new URL(request.url);
    const bookId = getActiveBookId(url);
    const settings = await storageAdapter.getById<BusinessSettings>("businessSettings", bookId);
    const updated = {
      ...(settings || { bookId, receiptHeader: "", receiptFooter: "", address: "", taxPercent: 0, storefrontEnabled: false, storefrontAccountId: null }),
      logoUrl: null,
    };
    await storageAdapter.insert("businessSettings", updated);
    return HttpResponse.json(updated);
  }),

  // ── Transfer Antar-Pembukuan ───────────────────────────────────────────────
  http.get(endpoint("/book-transfers/linkable-accounts"), async ({ request }) => {
    const url = new URL(request.url);
    const excludeBookId = url.searchParams.get("excludeBookId");

    const books = await storageAdapter.getAll<Book>("books");
    const accounts = await storageAdapter.getAll<Account>("accounts");

    const linkable: LinkableAccount[] = [];
    for (const b of books) {
      if (excludeBookId && b._id === excludeBookId) continue;
      const bAccounts = accounts.filter((a) => a.bookId === b._id && !a.archived);
      for (const a of bAccounts) {
        linkable.push({
          bookId: b._id,
          bookName: b.name,
          accountId: a._id,
          accountName: a.name,
          currentBalance: a.currentBalance,
        });
      }
    }

    return HttpResponse.json(linkable);
  }),

  http.post(endpoint("/book-transfers"), async ({ request }) => {
    const body = (await request.json()) as {
      fromAccountId: string;
      toBookId: string;
      toAccountId: string;
      amount: number;
      note?: string;
    };

    const amount = Math.max(0, Number(body.amount) || 0);
    if (amount <= 0) {
      return HttpResponse.json({ message: "Nominal transfer harus lebih besar dari 0." }, { status: 422 });
    }

    const fromAcc = await storageAdapter.getById<Account>("accounts", body.fromAccountId);
    const toAcc = await storageAdapter.getById<Account>("accounts", body.toAccountId);

    if (fromAcc && toAcc) {
      const curFrom = Number(fromAcc.currentBalance) || 0;
      const curTo = Number(toAcc.currentBalance) || 0;
      await storageAdapter.update<Account>("accounts", fromAcc._id, {
        currentBalance: curFrom - amount,
      });
      await storageAdapter.update<Account>("accounts", toAcc._id, {
        currentBalance: curTo + amount,
      });
    }

    const transfer: BookTransfer = {
      _id: `bt-${Date.now()}`,
      fromBookId: fromAcc?.bookId || "",
      fromAccountId: body.fromAccountId,
      toBookId: body.toBookId,
      toAccountId: body.toAccountId,
      amount,
      note: body.note || null,
      occurredAt: new Date().toISOString(),
    };

    return HttpResponse.json(transfer, { status: 201 });
  }),

  http.get(endpoint("/book-transfers"), async () => {
    return HttpResponse.json([]);
  }),

  http.post(endpoint("/book-transfers/:id/reverse"), async ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ _id: id, ok: true });
  }),
];
