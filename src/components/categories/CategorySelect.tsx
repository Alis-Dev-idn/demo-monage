import { useEffect, useId, useMemo, useRef, useState } from "react";
import { resolveIcon } from "@/constants/iconRegistry";
import { ChevronDown, Search } from "lucide-react";
import { IconChip } from "@dep/ui/card";
import { TO_LIB_TONE } from "@/constants/tones";
import { useCategoriesByKind } from "@/hooks/useLookup";
import type { Category, CategoryKind, ID } from "@/types";

interface CategorySelectProps {
  kind: CategoryKind;
  value: ID | null;
  onChange: (id: ID) => void;
  error?: string;
  excludeIds?: ID[];
}

function renderIcon(name: string, size = 14) {
  const Comp = resolveIcon(name);
  return <Comp size={size} aria-hidden />;
}

/**
 * Pemilih kategori ringkas berbentuk dropdown custom (#12) — alternatif dari
 * grid panjang yang memaksa user banyak menggulir. Ada kotak cari untuk daftar
 * kategori yang banyak.
 */
export function CategorySelect({
  kind,
  value,
  onChange,
  error,
  excludeIds,
}: CategorySelectProps) {
  const all = useCategoriesByKind(kind);
  const categories = useMemo(
    () =>
      excludeIds && excludeIds.length > 0
        ? all.filter((c) => !excludeIds.includes(c._id))
        : all,
    [all, excludeIds],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = categories.find((c) => c._id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  // Tutup saat klik di luar.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (all.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-center text-sm text-neutral-500">
        Belum ada kategori. Tambahkan dulu di menu Kategori.
      </p>
    );
  }

  const choose = (cat: Category) => {
    onChange(cat._id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-left transition ${
          error
            ? "border-rose-300"
            : "border-neutral-300 hover:border-neutral-400 focus:border-emerald-500"
        }`}
      >
        {selected ? (
          <>
            <IconChip tone={TO_LIB_TONE[selected.tone]} size="sm">
              {renderIcon(selected.icon)}
            </IconChip>
            <span className="flex-1 truncate text-sm text-neutral-800">
              {selected.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-neutral-400">Pilih kategori…</span>
        )}
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
            <Search size={14} className="text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kategori…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ul id={listboxId} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-neutral-400">
                Tidak ada kategori cocok.
              </li>
            ) : (
              filtered.map((cat) => {
                const isSel = cat._id === value;
                return (
                  <li key={cat._id} role="option" aria-selected={isSel}>
                    <button
                      type="button"
                      onClick={() => choose(cat)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                        isSel ? "bg-emerald-50" : ""
                      }`}
                    >
                      <IconChip tone={TO_LIB_TONE[cat.tone]} size="sm">
                        {renderIcon(cat.icon)}
                      </IconChip>
                      <span className="flex-1 truncate text-neutral-800">{cat.name}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
