import { useMemo, useState } from "react";
import { ICON_COMPONENTS } from "@/constants/iconRegistry";
import { Search } from "lucide-react";
import {
  ALL_ICON_NAMES,
  ICON_LIBRARY,
  type IconLibraryGroup,
} from "@/constants/iconLibrary";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  /**
   * Override icon library. Untuk kasus khusus dimana caller hanya ingin
   * sub-set icon tertentu (mis. modal pembukuan: hanya Bank/Wallet group).
   * Default: full library.
   */
  groups?: IconLibraryGroup[];
  /** Default tab aktif saat dibuka. */
  defaultGroupIndex?: number;
  className?: string;
  /** Max tinggi grid icon. */
  maxHeightClass?: string;
}

/**
 * Picker icon yang dipakai di seluruh app — kategori, dompet, tabungan,
 * pembukuan, perencanaan. Layout: tab grup di atas (cepat browse per tema)
 * + search bar (jika user tahu nama icon).
 *
 * Saat user mengetik di search, mode berubah ke "semua icon yang match" —
 * tab disembunyikan supaya hasil tidak terbatas ke grup aktif.
 */
export function IconPicker({
  value,
  onChange,
  groups = ICON_LIBRARY,
  defaultGroupIndex = 0,
  className = "",
  maxHeightClass = "max-h-60",
}: IconPickerProps) {
  const [activeGroup, setActiveGroup] = useState(defaultGroupIndex);
  const [query, setQuery] = useState("");

  const visibleIcons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      // Cross-group search dari semua icon library, tidak terikat tab aktif.
      return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
    }
    return groups[activeGroup]?.icons ?? [];
  }, [groups, activeGroup, query]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari ikon (ketik bahasa Inggris)…"
          aria-label="Cari ikon"
          className="w-full rounded-lg border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {!query && (
        <div className="flex flex-wrap gap-1">
          {groups.map((g, idx) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setActiveGroup(idx)}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                idx === activeGroup
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Pilih ikon"
        className={`grid grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2 ${maxHeightClass}`}
      >
        {visibleIcons.map((name) => {
          const Icon = ICON_COMPONENTS[name];
          if (!Icon) return null;
          const isActive = name === value;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={name}
              title={name}
              onClick={() => onChange(name)}
              className={`flex h-9 items-center justify-center rounded-md border transition ${
                isActive
                  ? "border-emerald-500 bg-white text-emerald-700 shadow-sm"
                  : "border-transparent bg-white text-neutral-500 hover:border-neutral-300"
              }`}
            >
              <Icon size={16} aria-hidden />
            </button>
          );
        })}
        {visibleIcons.length === 0 && (
          <p className="col-span-8 py-6 text-center text-xs text-neutral-500">
            Tidak ada ikon cocok dengan "{query}".
          </p>
        )}
      </div>
    </div>
  );
}
