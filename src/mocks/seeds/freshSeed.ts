import type { User, Category } from "@/types";

export const freshUser: User = {
  _id: "u-fresh",
  name: "Pengguna Baru",
  email: "fresh@monage.demo",
  preferences: {
    currency: "IDR",
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    budgetNotification: {
      enabled: true,
      warnThreshold: 75,
      overThreshold: 100,
    },
  },
  onboardedAt: null,
  createdAt: "2026-10-23T00:00:00.000Z",
};

export const defaultSystemCategories: Category[] = [
  {
    _id: "c-fresh-salary",
    userId: "u-fresh",
    bookId: "book-fresh-default",
    name: "Gaji",
    kind: "income",
    icon: "Briefcase",
    tone: "emerald",
    order: 1,
    isDefault: true,
    subcategories: [],
  },
  {
    _id: "c-fresh-food",
    userId: "u-fresh",
    bookId: "book-fresh-default",
    name: "Makan & Minum",
    kind: "expense",
    icon: "Utensils",
    tone: "rose",
    order: 1,
    isDefault: true,
    subcategories: [],
  },
  {
    _id: "c-fresh-bills",
    userId: "u-fresh",
    bookId: "book-fresh-default",
    name: "Tagihan",
    kind: "expense",
    icon: "Receipt",
    tone: "amber",
    order: 2,
    isDefault: true,
    subcategories: [],
  },
];
