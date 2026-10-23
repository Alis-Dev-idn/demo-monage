import {
  budiUser,
  personalBooks,
  personalAccounts,
  personalCategories,
  personalTransactions,
  personalBudgets,
  personalSavings,
} from "./personalSeed";
import {
  sitiUser,
  businessBooks,
  businessAccounts,
  businessCategories,
  businessProducts,
  businessSales,
  businessStockMovements,
  sitiBusinessSettings,
} from "./businessSeed";
import { freshUser, defaultSystemCategories } from "./freshSeed";
import type {
  Account,
  Book,
  Budget,
  Category,
  Saving,
  Transaction,
  User,
} from "@/types";
import type {
  BusinessSettings,
  Product,
  Sale,
  StockMovement,
} from "@/types/business";

export * from "./personalSeed";
export * from "./businessSeed";
export * from "./freshSeed";

export interface DemoSnapshot {
  users: User[];
  books: Book[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savings: Saving[];
  products: Product[];
  stockMovements: StockMovement[];
  sales: Sale[];
  businessSettings: BusinessSettings[];
}

export function getFullDemoSnapshot(): DemoSnapshot {
  return {
    users: [budiUser, sitiUser, freshUser],
    books: [...personalBooks, ...businessBooks],
    accounts: [...personalAccounts, ...businessAccounts],
    categories: [
      ...personalCategories,
      ...businessCategories,
      ...defaultSystemCategories,
    ],
    transactions: [...personalTransactions],
    budgets: [...personalBudgets],
    savings: [...personalSavings],
    products: [...businessProducts],
    stockMovements: [...businessStockMovements],
    sales: [...businessSales],
    businessSettings: [sitiBusinessSettings],
  };
}
