import { ArrowRight } from "lucide-react";
import { AccountSelect } from "@/components/accounts/AccountSelect";
import type { ID } from "@/types";

interface TransferAccountPairProps {
  fromAccountId: ID | null;
  toAccountId: ID | null;
  onFromChange: (id: ID) => void;
  onToChange: (id: ID) => void;
  error?: { from?: string; to?: string };
}

export function TransferAccountPair({
  fromAccountId,
  toAccountId,
  onFromChange,
  onToChange,
  error,
}: TransferAccountPairProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Dari</label>
        <AccountSelect
          value={fromAccountId}
          onChange={onFromChange}
          excludeIds={toAccountId ? [toAccountId] : []}
          error={error?.from}
        />
      </div>
      <div className="flex h-full items-center pt-6 text-blue-500">
        <ArrowRight size={20} aria-hidden />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Ke</label>
        <AccountSelect
          value={toAccountId}
          onChange={onToChange}
          excludeIds={fromAccountId ? [fromAccountId] : []}
          error={error?.to}
        />
      </div>
    </div>
  );
}
