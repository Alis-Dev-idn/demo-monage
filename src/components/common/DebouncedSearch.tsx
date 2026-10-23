import { Search, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";

interface DebouncedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export function DebouncedSearch({
  value,
  onChange,
  placeholder = "Cari…",
  delay = 300,
  className = "",
}: DebouncedSearchProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const t = window.setTimeout(() => onChange(draft), delay);
    return () => window.clearTimeout(t);
  }, [draft, value, delay, onChange]);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value);

  return (
    <div
      className={`flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 ${className}`}
    >
      <Search size={16} className="mr-2 text-neutral-400" aria-hidden />
      <input
        type="search"
        value={draft}
        onChange={handleInput}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm outline-none"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label="Hapus pencarian"
          className="ml-1 rounded p-1 text-neutral-400 hover:text-neutral-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
