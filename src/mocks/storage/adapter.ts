import { getDB, type StoreName } from "./db";
import { getFullDemoSnapshot } from "../seeds";
import type { Transaction } from "@/types";
import type { Sale, StockMovement } from "@/types/business";

const SEED_VERSION_KEY = "monage:seededVersion";
const CURRENT_SEED_VERSION = "2026-10-23-v1";

export class DemoStorageAdapter {
  async init(): Promise<void> {
    const isReady = await this.isSeeded();
    if (!isReady) {
      await this.seedAll(true);
    }
  }

  async isSeeded(): Promise<boolean> {
    try {
      const db = await getDB();
      const meta = await db.get("appMeta", SEED_VERSION_KEY);
      return meta?.value === CURRENT_SEED_VERSION;
    } catch (e) {
      console.warn("[DemoStorageAdapter] Failed to check seed status:", e);
      return false;
    }
  }

  async seedAll(force = false): Promise<void> {
    const db = await getDB();
    if (!force) {
      const alreadySeeded = await this.isSeeded();
      if (alreadySeeded) return;
    }

    const snapshot = getFullDemoSnapshot();

    const tx = db.transaction(
      [
        "users",
        "books",
        "accounts",
        "categories",
        "transactions",
        "budgets",
        "savings",
        "products",
        "stockMovements",
        "sales",
        "businessSettings",
        "appMeta",
      ],
      "readwrite",
    );

    await Promise.all([
      tx.objectStore("users").clear(),
      tx.objectStore("books").clear(),
      tx.objectStore("accounts").clear(),
      tx.objectStore("categories").clear(),
      tx.objectStore("transactions").clear(),
      tx.objectStore("budgets").clear(),
      tx.objectStore("savings").clear(),
      tx.objectStore("products").clear(),
      tx.objectStore("stockMovements").clear(),
      tx.objectStore("sales").clear(),
      tx.objectStore("businessSettings").clear(),
      tx.objectStore("appMeta").clear(),
    ]);

    for (const item of snapshot.users) await tx.objectStore("users").put(item);
    for (const item of snapshot.books) await tx.objectStore("books").put(item);
    for (const item of snapshot.accounts) await tx.objectStore("accounts").put(item);
    for (const item of snapshot.categories) await tx.objectStore("categories").put(item);
    for (const item of snapshot.transactions) await tx.objectStore("transactions").put(item);
    for (const item of snapshot.budgets) await tx.objectStore("budgets").put(item);
    for (const item of snapshot.savings) await tx.objectStore("savings").put(item);
    for (const item of snapshot.products) await tx.objectStore("products").put(item);
    for (const item of snapshot.stockMovements) await tx.objectStore("stockMovements").put(item);
    for (const item of snapshot.sales) await tx.objectStore("sales").put(item);
    for (const item of snapshot.businessSettings) await tx.objectStore("businessSettings").put(item);

    await tx.objectStore("appMeta").put({
      key: SEED_VERSION_KEY,
      value: CURRENT_SEED_VERSION,
    });

    await tx.done;
  }

  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await getDB();
    return (await db.getAll(storeName as any)) as unknown as T[];
  }

  async getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    const db = await getDB();
    return (await db.get(storeName as any, id)) as unknown as T | undefined;
  }

  async insert<T extends { _id?: string; bookId?: string; key?: string }>(
    storeName: StoreName,
    item: T,
  ): Promise<T> {
    const db = await getDB();
    await db.put(storeName as any, item as any);
    return item;
  }

  async update<T extends { _id?: string; bookId?: string; key?: string }>(
    storeName: StoreName,
    id: string,
    patch: Partial<T>,
  ): Promise<T> {
    const db = await getDB();
    const existing = await db.get(storeName as any, id);
    if (!existing) {
      throw new Error(`Item with id ${id} not found in store ${storeName}`);
    }
    const updated = { ...existing, ...patch };
    await db.put(storeName as any, updated as any);
    return updated as unknown as T;
  }

  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await getDB();
    await db.delete(storeName as any, id);
  }

  async clearStore(storeName: StoreName): Promise<void> {
    const db = await getDB();
    await db.clear(storeName as any);
  }

  // ── Domain-Specific Atomic Mutators with Strict Numerical Hygiene ─────────

  async createTransactionWithBalance(tx: Transaction): Promise<Transaction> {
    const db = await getDB();
    const t = db.transaction(["transactions", "accounts"], "readwrite");
    const txStore = t.objectStore("transactions");
    const accountStore = t.objectStore("accounts");

    const amount = Math.max(0, Number(tx.amount) || 0);
    const fee = Math.max(0, Number(tx.adminFee) || 0);
    const sanitizedTx = { ...tx, amount, adminFee: fee };

    await txStore.put(sanitizedTx);

    if (sanitizedTx.type === "in" || sanitizedTx.type === "out") {
      const account = await accountStore.get(sanitizedTx.accountId);
      if (account) {
        const curBal = Number(account.currentBalance) || 0;
        if (sanitizedTx.type === "in") {
          account.currentBalance = curBal + amount - fee;
        } else {
          account.currentBalance = curBal - amount - fee;
        }
        await accountStore.put(account);
      }
    } else if (sanitizedTx.type === "transfer") {
      const from = await accountStore.get(sanitizedTx.fromAccountId);
      if (from) {
        const curFrom = Number(from.currentBalance) || 0;
        from.currentBalance = curFrom - amount - fee;
        await accountStore.put(from);
      }
      const to = await accountStore.get(sanitizedTx.toAccountId);
      if (to) {
        const curTo = Number(to.currentBalance) || 0;
        to.currentBalance = curTo + amount;
        await accountStore.put(to);
      }
    }

    await t.done;
    return sanitizedTx;
  }

  async deleteTransactionWithBalance(txId: string): Promise<void> {
    const db = await getDB();
    const t = db.transaction(["transactions", "accounts"], "readwrite");
    const txStore = t.objectStore("transactions");
    const accountStore = t.objectStore("accounts");

    const tx = await txStore.get(txId);
    if (!tx) {
      await t.done;
      return;
    }

    const amount = Math.max(0, Number(tx.amount) || 0);
    const fee = Math.max(0, Number(tx.adminFee) || 0);

    if (tx.type === "in" || tx.type === "out") {
      const account = await accountStore.get(tx.accountId);
      if (account) {
        const curBal = Number(account.currentBalance) || 0;
        if (tx.type === "in") {
          account.currentBalance = curBal - (amount - fee);
        } else {
          account.currentBalance = curBal + (amount + fee);
        }
        await accountStore.put(account);
      }
    } else if (tx.type === "transfer") {
      const from = await accountStore.get(tx.fromAccountId);
      if (from) {
        const curFrom = Number(from.currentBalance) || 0;
        from.currentBalance = curFrom + amount + fee;
        await accountStore.put(from);
      }
      const to = await accountStore.get(tx.toAccountId);
      if (to) {
        const curTo = Number(to.currentBalance) || 0;
        to.currentBalance = curTo - amount;
        await accountStore.put(to);
      }
    }

    await txStore.delete(txId);
    await t.done;
  }

  async processSaleWithStockDeduction(sale: Sale): Promise<Sale> {
    const db = await getDB();
    const t = db.transaction(["sales", "products", "stockMovements", "accounts"], "readwrite");
    const salesStore = t.objectStore("sales");
    const productsStore = t.objectStore("products");
    const movementsStore = t.objectStore("stockMovements");
    const accountsStore = t.objectStore("accounts");

    const saleTotal = Math.max(0, Number(sale.total) || 0);
    await salesStore.put(sale);

    for (const item of sale.items) {
      const product = await productsStore.get(item.productId);
      if (product) {
        const itemQty = Math.max(0, Number(item.qty) || 0);
        if (product.trackStock) {
          const curStock = Number(product.stockQty) || 0;
          product.stockQty = Math.max(0, curStock - itemQty);
          await productsStore.put(product);
        }

        const movement: StockMovement = {
          _id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          bookId: sale.bookId,
          productId: item.productId,
          type: "sale",
          qty: itemQty,
          unitCost: Math.max(0, Number(item.unitCost) || 0),
          reason: `Penjualan POS #${sale.code}`,
          occurredAt: sale.occurredAt,
        };
        await movementsStore.put(movement);
      }
    }

    if (sale.paymentStatus === "paid" && sale.accountId) {
      const account = await accountsStore.get(sale.accountId);
      if (account) {
        const curBal = Number(account.currentBalance) || 0;
        account.currentBalance = curBal + saleTotal;
        await accountsStore.put(account);
      }
    }

    await t.done;
    return sale;
  }

  async voidSaleWithStockReversal(saleId: string): Promise<Sale> {
    const db = await getDB();
    const t = db.transaction(["sales", "products", "stockMovements", "accounts"], "readwrite");
    const salesStore = t.objectStore("sales");
    const productsStore = t.objectStore("products");
    const movementsStore = t.objectStore("stockMovements");
    const accountsStore = t.objectStore("accounts");

    const sale = await salesStore.get(saleId);
    if (!sale) {
      throw new Error(`Sale with id ${saleId} not found`);
    }

    if (sale.paymentStatus === "void") {
      await t.done;
      return sale;
    }

    sale.paymentStatus = "void";
    await salesStore.put(sale);

    for (const item of sale.items) {
      const product = await productsStore.get(item.productId);
      if (product) {
        const itemQty = Math.max(0, Number(item.qty) || 0);
        if (product.trackStock) {
          const curStock = Number(product.stockQty) || 0;
          product.stockQty = curStock + itemQty;
          await productsStore.put(product);
        }

        const movement: StockMovement = {
          _id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          bookId: sale.bookId,
          productId: item.productId,
          type: "return",
          qty: itemQty,
          unitCost: Math.max(0, Number(item.unitCost) || 0),
          reason: `Pembatalan Void POS #${sale.code}`,
          occurredAt: new Date().toISOString(),
        };
        await movementsStore.put(movement);
      }
    }

    if (sale.accountId) {
      const account = await accountsStore.get(sale.accountId);
      if (account) {
        const saleTotal = Math.max(0, Number(sale.total) || 0);
        const curBal = Number(account.currentBalance) || 0;
        account.currentBalance = Math.max(0, curBal - saleTotal);
        await accountsStore.put(account);
      }
    }

    await t.done;
    return sale;
  }
}

export const storageAdapter = new DemoStorageAdapter();
