import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Account,
  Book,
  Budget,
  Category,
  MonthlyPlan,
  Saving,
  Transaction,
  User,
} from "@/types";
import type {
  Product,
  StockMovement,
  Sale,
  BusinessSettings,
} from "@/types/business";

export const DB_NAME = "monage-demo-db";
export const DB_VERSION = 1;

export interface AppMetaItem {
  key: string;
  value: unknown;
}

export interface MonageDemoDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { email: string };
  };
  books: {
    key: string;
    value: Book;
    indexes: { userId: string; kind: string };
  };
  accounts: {
    key: string;
    value: Account;
    indexes: { bookId: string; userId: string; order: number };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { bookId: string; type: string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { bookId: string; accountId: string; occurredAt: string };
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: { bookId: string; month: string };
  };
  monthlyPlans: {
    key: string;
    value: MonthlyPlan;
    indexes: { bookId: string; month: string };
  };
  savings: {
    key: string;
    value: Saving;
    indexes: { bookId: string };
  };
  products: {
    key: string;
    value: Product;
    indexes: { bookId: string; categoryName: string; archived: number };
  };
  stockMovements: {
    key: string;
    value: StockMovement;
    indexes: { bookId: string; productId: string; occurredAt: string };
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { bookId: string; code: string; occurredAt: string };
  };
  businessSettings: {
    key: string;
    value: BusinessSettings;
  };
  appMeta: {
    key: string;
    value: AppMetaItem;
  };
}

export type StoreName =
  | "users"
  | "books"
  | "accounts"
  | "categories"
  | "transactions"
  | "budgets"
  | "monthlyPlans"
  | "savings"
  | "products"
  | "stockMovements"
  | "sales"
  | "businessSettings"
  | "appMeta";

let dbInstance: IDBPDatabase<MonageDemoDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MonageDemoDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MonageDemoDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("users")) {
        const store = db.createObjectStore("users", { keyPath: "_id" });
        store.createIndex("email", "email", { unique: true });
      }

      if (!db.objectStoreNames.contains("books")) {
        const store = db.createObjectStore("books", { keyPath: "_id" });
        store.createIndex("userId", "userId");
        store.createIndex("kind", "kind");
      }

      if (!db.objectStoreNames.contains("accounts")) {
        const store = db.createObjectStore("accounts", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("userId", "userId");
        store.createIndex("order", "order");
      }

      if (!db.objectStoreNames.contains("categories")) {
        const store = db.createObjectStore("categories", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("type", "type");
      }

      if (!db.objectStoreNames.contains("transactions")) {
        const store = db.createObjectStore("transactions", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("accountId", "accountId");
        store.createIndex("occurredAt", "occurredAt");
      }

      if (!db.objectStoreNames.contains("budgets")) {
        const store = db.createObjectStore("budgets", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("month", "month");
      }

      if (!db.objectStoreNames.contains("monthlyPlans")) {
        const store = db.createObjectStore("monthlyPlans", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("month", "month");
      }

      if (!db.objectStoreNames.contains("savings")) {
        const store = db.createObjectStore("savings", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
      }

      if (!db.objectStoreNames.contains("products")) {
        const store = db.createObjectStore("products", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("categoryName", "categoryName");
        store.createIndex("archived", "archived");
      }

      if (!db.objectStoreNames.contains("stockMovements")) {
        const store = db.createObjectStore("stockMovements", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("productId", "productId");
        store.createIndex("occurredAt", "occurredAt");
      }

      if (!db.objectStoreNames.contains("sales")) {
        const store = db.createObjectStore("sales", { keyPath: "_id" });
        store.createIndex("bookId", "bookId");
        store.createIndex("code", "code");
        store.createIndex("occurredAt", "occurredAt");
      }

      if (!db.objectStoreNames.contains("businessSettings")) {
        db.createObjectStore("businessSettings", { keyPath: "bookId" });
      }

      if (!db.objectStoreNames.contains("appMeta")) {
        db.createObjectStore("appMeta", { keyPath: "key" });
      }
    },
  });

  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
