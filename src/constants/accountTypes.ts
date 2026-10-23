import type { AccountType, Tone } from "@/types";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
  investment: "Investasi",
  other: "Lainnya",
};

export const ACCOUNT_TYPE_ICON: Record<AccountType, string> = {
  cash: "Wallet",
  bank: "Landmark",
  ewallet: "Smartphone",
  investment: "TrendingUp",
  other: "Coins",
};

export const ACCOUNT_TYPE_TONE: Record<AccountType, Tone> = {
  cash: "amber",
  bank: "blue",
  ewallet: "emerald",
  investment: "violet",
  other: "neutral",
};

export const ACCOUNT_TYPES: AccountType[] = [
  "cash",
  "bank",
  "ewallet",
  "investment",
  "other",
];
