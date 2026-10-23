/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { ArrowDownLeft, ArrowUpRight, TrendingDown } from "lucide-react";
import { resolveIcon } from "@/constants/iconRegistry";
import { Card, IconChip } from "@dep/ui/card";
import { CurrencyText } from "@/components/common/CurrencyText";
import { ACCOUNT_TYPE_LABEL } from "@/constants/accountTypes";
import { TO_LIB_TONE } from "@/constants/tones";
import type { Account, AccountMonthlySummary } from "@/types";

interface AccountCardProps {
  account: Account;
  variant?: "list" | "horizontal";
  onClick?: (account: Account) => void;
  /** Ringkasan bulanan in/out. Opsional — kalau tidak diberikan, chip disembunyikan. */
  summary?: AccountMonthlySummary;
  /** Sorot kartu dengan border merah lembut (mis. dompet dengan expense terbesar). */
  highlight?: boolean;
  /** Dipanggil saat user klik chip "Masuk". Default: tidak ada (chip jadi pasif). */
  onIncomeClick?: (account: Account) => void;
  /** Dipanggil saat user klik chip "Keluar". */
  onExpenseClick?: (account: Account) => void;
}

export function AccountCard({
  account,
  variant = "list",
  onClick,
  summary,
  highlight,
  onIncomeClick,
  onExpenseClick,
}: AccountCardProps) {
  const Icon = resolveIcon(account.icon, "Wallet");
  const libTone = TO_LIB_TONE[account.tone];

  return (
    <Card
      variant="outlined"
      pad="md"
      radius="md"
      interactive={!!onClick}
      onClick={onClick ? () => onClick(account) : undefined}
      className={[
        variant === "horizontal" ? "min-w-[260px]" : "",
        highlight ? "ring-2 ring-rose-200 border-rose-300" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <IconChip tone={libTone} size="md">
          <Icon size={18} aria-hidden />
        </IconChip>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {account.name}
            {highlight && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                <TrendingDown size={10} /> Terbesar
              </span>
            )}
          </p>
          <p className="text-xs text-neutral-500">{ACCOUNT_TYPE_LABEL[account.type]}</p>
        </div>
        <CurrencyText
          amount={account.currentBalance}
          type="neutral"
          size="lg"
          // compact
          className="flex-shrink-0"
        />
      </div>

      {summary && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3">
          <SummaryChip
            label="Masuk bulan ini"
            amount={summary.income}
            type="income"
            onClick={onIncomeClick ? () => onIncomeClick(account) : undefined}
          />
          <SummaryChip
            label="Keluar bulan ini"
            amount={summary.expense}
            type="expense"
            onClick={onExpenseClick ? () => onExpenseClick(account) : undefined}
          />
        </div>
      )}
    </Card>
  );
}

interface SummaryChipProps {
  label: string;
  amount: number;
  type: "income" | "expense";
  onClick?: () => void;
}

function SummaryChip({ label, amount, type, onClick }: SummaryChipProps) {
  const Icon = type === "income" ? ArrowDownLeft : ArrowUpRight;
  const colors =
    type === "income"
      ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      : "bg-orange-50 text-orange-800 hover:bg-orange-100";

  const inner = (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${
          type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
        }`}
      >
        <Icon size={12} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
        <CurrencyText
          amount={amount}
          type="neutral"
          size="sm"
          compact
          className={`block truncate ${type === "income" ? "text-emerald-900" : "text-orange-900"}`}
        />
      </div>
    </div>
  );

  if (!onClick) {
    return <div className={`rounded-lg px-2.5 py-1.5 ${colors}`}>{inner}</div>;
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-lg px-2.5 py-1.5 transition ${colors}`}
    >
      {inner}
    </button>
  );
}
