import type { TransactionType } from "@/types";

interface TransactionTypeMeta {
  label: string;
  icon: string;
  colorVar: string;
  bgVar: string;
  sign: "+" | "-" | "";
  textClass: string;
  bgClass: string;
}

export const TRANSACTION_TYPE: Record<TransactionType, TransactionTypeMeta> = {
  in: {
    label: "Uang Masuk",
    icon: "ArrowDownLeft",
    colorVar: "var(--color-in)",
    bgVar: "var(--color-in-bg)",
    sign: "+",
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  out: {
    label: "Uang Keluar",
    icon: "ArrowUpRight",
    colorVar: "var(--color-out)",
    bgVar: "var(--color-out-bg)",
    sign: "-",
    textClass: "text-orange-600",
    bgClass: "bg-orange-50",
  },
  transfer: {
    label: "Transfer",
    icon: "ArrowLeftRight",
    colorVar: "var(--color-transfer)",
    bgVar: "var(--color-transfer-bg)",
    sign: "",
    textClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
};

export const TRANSACTION_TYPES: TransactionType[] = ["in", "out", "transfer"];
