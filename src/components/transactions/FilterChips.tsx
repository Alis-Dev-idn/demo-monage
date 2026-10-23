interface FilterChipsProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterChips({ options, value, onChange, className = "" }: FilterChipsProps) {
  return (
    <div role="radiogroup" className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              isActive
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
