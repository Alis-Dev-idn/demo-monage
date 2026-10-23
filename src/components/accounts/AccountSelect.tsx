import { Select, type SelectOption } from "@dep/ui/select";
import { useLookup } from "@/hooks/useLookup";
import { formatCurrency } from "@/utils/format";
import type { ID } from "@/types";

interface AccountSelectProps {
  value: ID | null;
  onChange: (id: ID) => void;
  excludeIds?: ID[];
  showBalance?: boolean;
  placeholder?: string;
  error?: string;
  inputId?: string;
}

export function AccountSelect({
  value,
  onChange,
  excludeIds = [],
  showBalance = true,
  placeholder = "Pilih dompet",
  error,
  inputId,
}: AccountSelectProps) {
  const { accounts } = useLookup();

  const options: SelectOption<ID>[] = accounts
    .filter((a) => !a.archived && !excludeIds.includes(a._id))
    .map((a) => ({
      value: a._id,
      label: showBalance ? `${a.name} · ${formatCurrency(a.currentBalance)}` : a.name,
    }));

  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <div>
      <Select<ID>
        inputId={inputId}
        value={selected}
        options={options}
        onChange={(opt) => opt && onChange(opt.value)}
        placeholder={placeholder}
        error={!!error}
        isClearable={false}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
