import { formatCurrency, formatCurrencyCompact, formatCurrencyForType } from "@/utils/format";
import { TRANSACTION_TYPE } from "@/constants/transactionTypes";

interface CurrencyTextProps {
  amount: number;
  type: "in" | "out" | "transfer" | "neutral";
  size?: "sm" | "md" | "lg";
  showSign?: boolean;
  className?: string;
  /**
   * Render compact (Rp 25jt / 1.2M) untuk tempat sempit (card, badge, list
   * item dense). Tooltip native menampilkan nominal penuh agar tidak hilang
   * presisi. Default `false`.
   */
  compact?: boolean;
}

const SIZE_CLASS: Record<NonNullable<CurrencyTextProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl font-semibold",
};

const COLOR_CLASS: Record<CurrencyTextProps["type"], string> = {
  in: "text-emerald-600",
  out: "text-orange-600",
  transfer: "text-blue-600",
  neutral: "text-neutral-800",
};

export function CurrencyText({
  amount,
  type,
  size = "md",
  showSign,
  className = "",
  compact = false,
}: CurrencyTextProps) {
  const useSign = showSign ?? (type === "in" || type === "out");
  const sign = useSign
    ? type === "in"
      ? "+"
      : type === "out"
        ? "-"
        : ""
    : "";
  const text = compact
    ? formatCurrencyCompact(Math.abs(amount), { sign: sign as "+" | "-" | "" })
    : type === "neutral"
      ? formatCurrency(Math.abs(amount))
      : useSign
        ? formatCurrencyForType(amount, type as "in" | "out" | "transfer")
        : formatCurrency(Math.abs(amount));
  // Tooltip selalu pakai nominal penuh — kalau user butuh angka presisi
  // hover saja, tidak hilang karena disingkat.
  const fullText = `${sign}${formatCurrency(Math.abs(amount))}`;

  return (
    <span
      title={compact ? fullText : undefined}
      className={`font-medium tabular-nums whitespace-nowrap ${SIZE_CLASS[size]} ${COLOR_CLASS[type]} ${className}`}
      aria-label={`${TRANSACTION_TYPE[type === "neutral" ? "transfer" : type].label}: ${fullText}`}
    >
      {text}
    </span>
  );
}
