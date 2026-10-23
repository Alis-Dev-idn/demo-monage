/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { resolveIcon } from "@/constants/iconRegistry";
import { ActivityRow, IconChip } from "@dep/ui/card";
import { CurrencyText } from "@/components/common/CurrencyText";
import { useAccountById, useCategoryById, useSavingById } from "@/hooks/useLookup";
import { TO_LIB_TONE } from "@/constants/tones";
import { formatRelativeTime } from "@/utils/format";
import type { Transaction } from "@/types";

interface TransactionRowProps {
  transaction: Transaction;
  showAccount?: boolean;
  onClick?: (tx: Transaction) => void;
}

export function TransactionRow({
  transaction,
  showAccount = true,
  onClick,
}: TransactionRowProps) {
  const category = useCategoryById(
    transaction.type !== "transfer" ? transaction.categoryId : null,
  );
  const account = useAccountById(
    transaction.type === "transfer" ? transaction.fromAccountId : transaction.accountId,
  );
  const toAccount = useAccountById(
    transaction.type === "transfer" ? transaction.toAccountId : null,
  );

  // Setor/tarik tabungan = transaksi cermin ber-`savingId` (transfer internal).
  const savingId =
    transaction.type !== "transfer" ? transaction.savingId : undefined;
  const saving = useSavingById(savingId);
  const isSaving = !!savingId;
  // Setor → uang keluar dompet (out); tarik → uang masuk dompet (in).
  const isDeposit = transaction.type === "out";

  const iconName = isSaving
    ? "PiggyBank"
    : transaction.type === "transfer"
    ? "ArrowLeftRight"
    : category?.icon ?? "Tag";
  const Icon = resolveIcon(iconName, "Tag");
  const tone = isSaving
    ? "accent"
    : transaction.type === "transfer"
    ? "accent"
    : TO_LIB_TONE[category?.tone ?? "neutral"];

  const pending = (transaction as { __pending?: boolean }).__pending === true;

  // Transaksi dari Perencanaan (#2.3): tampilkan item/bahan sebagai judul dan
  // grup + dompet sebagai subjudul, bukan catatan string lurus lama.
  const planRef = transaction.source === "plan" ? transaction.planRef : undefined;
  const isPlan = !!planRef;

  const title = isPlan
    ? [planRef!.itemName, planRef!.ingredientName].filter(Boolean).join(" · ") ||
      planRef!.planName
    : isSaving
    ? `${isDeposit ? "Setor ke" : "Tarik dari"} ${saving?.name ?? "Tabungan"}`
    : transaction.type === "transfer"
    ? "Transfer"
    : category?.name ?? "Tanpa kategori";

  const subtitle = isPlan
    ? [planRef!.groupName, account?.name].filter(Boolean).join(" · ") ||
      planRef!.planName
    : isSaving
    ? `${isDeposit ? "Dari" : "Ke"} ${account?.name ?? "—"}${
        transaction.note ? ` · ${transaction.note}` : ""
      }`
    : transaction.type === "transfer"
    ? `${account?.name ?? "—"} → ${toAccount?.name ?? "—"}`
    : showAccount
    ? account?.name ?? "—"
    : transaction.note ?? "";

  return (
    <ActivityRow
      icon={
        <IconChip tone={tone} size="md">
          <Icon size={18} aria-hidden />
        </IconChip>
      }
      title={
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
            {title}
            {pending && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                Menunggu sinkron
              </span>
            )}
          </span>
          <span className="text-xs text-neutral-500">{subtitle}</span>
        </div>
      }
      time={
        <div className="flex flex-col items-end">
          <CurrencyText amount={transaction.amount} type={transaction.type} size="sm" />
          <span className="text-[11px] text-neutral-400">
            {formatRelativeTime(transaction.occurredAt)}
          </span>
        </div>
      }
      onClick={onClick ? () => onClick(transaction) : undefined}
    />
  );
}
