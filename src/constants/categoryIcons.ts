import type { CategoryKind, Tone } from "@/types";

export interface CategorySeed {
  name: string;
  icon: string;
  tone: Tone;
}

export const DEFAULT_EXPENSE_CATEGORIES: CategorySeed[] = [
  { name: "Makanan & Minuman", icon: "Utensils", tone: "amber" },
  { name: "Transportasi", icon: "Car", tone: "cyan" },
  { name: "Belanja", icon: "ShoppingCart", tone: "violet" },
  { name: "Tagihan & Utilitas", icon: "Receipt", tone: "rose" },
  { name: "Hiburan", icon: "Gamepad2", tone: "accent" },
  { name: "Kesehatan", icon: "Pill", tone: "emerald" },
  { name: "Pendidikan", icon: "BookOpen", tone: "cyan" },
  { name: "Rumah", icon: "Home", tone: "orange" },
  { name: "Hewan Peliharaan", icon: "Cat", tone: "amber" },
  { name: "Hadiah", icon: "Gift", tone: "rose" },
  { name: "Donasi", icon: "HandHeart", tone: "violet" },
  { name: "Lainnya", icon: "MoreHorizontal", tone: "neutral" },
];

export const DEFAULT_INCOME_CATEGORIES: CategorySeed[] = [
  { name: "Gaji", icon: "Banknote", tone: "emerald" },
  { name: "Bonus", icon: "BadgePercent", tone: "amber" },
  { name: "Freelance", icon: "Laptop", tone: "cyan" },
  { name: "Investasi", icon: "TrendingUp", tone: "violet" },
  { name: "Hadiah", icon: "Gift", tone: "rose" },
  { name: "Lainnya", icon: "MoreHorizontal", tone: "neutral" },
];

export function defaultCategoriesFor(kind: CategoryKind): CategorySeed[] {
  return kind === "income"
    ? DEFAULT_INCOME_CATEGORIES
    : DEFAULT_EXPENSE_CATEGORIES;
}

export const ICON_PICKER_DEFAULTS: string[] = [
  "Utensils", "Car", "ShoppingCart", "Receipt", "Gamepad2", "Pill",
  "BookOpen", "Home", "Cat", "Gift", "HandHeart", "MoreHorizontal",
  "Banknote", "BadgePercent", "Laptop", "TrendingUp", "Wallet", "Landmark",
  "Smartphone", "Coins", "Bus", "Train", "Plane", "Coffee",
  "Pizza", "Beer", "Music", "Camera", "Film", "Heart",
  "Stethoscope", "Dumbbell", "Bike", "Fuel", "Shirt", "Scissors",
  "Briefcase", "GraduationCap", "Baby", "Building", "MapPin", "Wifi",
  "Tv", "Phone", "Mail", "ShoppingBag", "Tag", "Sparkles",
  "Sun", "Cloud", "Leaf", "Flower", "Star", "Bookmark",
  "Calendar", "Clock", "Bell", "Flag", "Package", "Truck",
];
