import type { TransactionType, UserPreferences } from "@/types";

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "decimal",
  maximumFractionDigits: 0,
});

interface FormatCurrencyOptions {
  signed?: boolean;
  sign?: "+" | "-" | "";
  withPrefix?: boolean;
  /**
   * Compact rendering: pakai suffix K/M/Mrd/T untuk angka besar agar tidak
   * overflow di card sempit. Default `false` — full digit dengan thousand
   * separator. Set `true` untuk header card, badge nominal, atau column
   * yang sempit.
   */
  compact?: boolean;
}

const COMPACT_UNITS: Array<{ threshold: number; suffix: string }> = [
  { threshold: 1_000_000_000_000, suffix: "T" }, // triliun
  { threshold: 1_000_000_000, suffix: "M" }, // miliar
  { threshold: 1_000_000, suffix: "jt" }, // juta
  { threshold: 1_000, suffix: "rb" }, // ribu
];

function compactDigit(value: number): string {
  const abs = Math.abs(value);
  for (const { threshold, suffix } of COMPACT_UNITS) {
    if (abs >= threshold) {
      const scaled = value / threshold;
      const absScaled = Math.abs(scaled);

      // Maksimal 3 desimal, lalu strip trailing zero
      // 10.000.000 → 10.000 → "10jt"
      // 10.050.000 → 10.050 → "10,05jt"
      // 10.001.000 → 10.001 → "10,001jt"
      const formatted = absScaled
          .toFixed(3)
          .replace(/\.?0+$/, "")   // hapus trailing zero
          .replace(".", ",");      // desimal → koma

      return `${value < 0 ? "-" : ""}${formatted}${suffix}`;
    }
  }
  return IDR_FORMATTER.format(value);
}

export function formatCurrency(amount: number, opts: FormatCurrencyOptions = {}): string {
  const { signed = false, sign, withPrefix = true, compact = false } = opts;
  const abs = Math.abs(amount);
  const formatted = compact ? compactDigit(abs) : IDR_FORMATTER.format(abs);
  const prefix = withPrefix ? "Rp" : "";
  const resolvedSign = sign ?? (signed ? (amount < 0 ? "-" : "+") : "");
  return `${resolvedSign}${prefix}${formatted}`.trim();
}

/**
 * Compact-mode convenience. Pakai di tempat yang sempit (card, badge,
 * tabel padat) supaya nominal besar (mis. 25.000.000) tidak overflow jadi
 * "Rp 25.000.000" yang nimpa kolom sebelah.
 */
export function formatCurrencyCompact(
  amount: number,
  opts: Omit<FormatCurrencyOptions, "compact"> = {},
): string {
  return formatCurrency(amount, { ...opts, compact: true });
}

export function formatCurrencyForType(amount: number, type: TransactionType): string {
  if (type === "in") return formatCurrency(amount, { sign: "+" });
  if (type === "out") return formatCurrency(amount, { sign: "-" });
  return formatCurrency(amount);
}

const DATE_FORMATTERS: Record<UserPreferences["dateFormat"], (d: Date) => string> = {
  "DD/MM/YYYY": (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
  "MM/DD/YYYY": (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`,
  "YYYY-MM-DD": (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export type DateFormatVariant = "short" | "long" | "relative" | "datetime";

export function formatDate(
  iso: string,
  variant: DateFormatVariant = "short",
  pref: UserPreferences["dateFormat"] = "DD/MM/YYYY",
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  if (variant === "relative") return formatRelativeTime(iso);

  if (variant === "long") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  if (variant === "datetime") {
    return `${DATE_FORMATTERS[pref](d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return DATE_FORMATTERS[pref](d);
}

const RELATIVE_FMT = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const target = new Date(iso).getTime();
  const diff = target - now.getTime();
  const abs = Math.abs(diff);

  if (abs < MINUTE) return RELATIVE_FMT.format(Math.round(diff / SECOND), "second");
  if (abs < HOUR) return RELATIVE_FMT.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return RELATIVE_FMT.format(Math.round(diff / HOUR), "hour");
  if (abs < WEEK) return RELATIVE_FMT.format(Math.round(diff / DAY), "day");
  return formatDate(iso, "long");
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}
