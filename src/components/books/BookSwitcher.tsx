/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Plus, Settings, Users } from "lucide-react";
import { resolveIcon } from "@/constants/iconRegistry";
import { useBooks } from "@/hooks/useBooks";
import { TONE_HEX } from "@/constants/tones";
import {useDashboard} from "@dep/templates/dashboard";

interface BookSwitcherProps {
  className?: string;
}

export function BookSwitcher({ className = "" }: BookSwitcherProps) {
  const { books, activeBook, setActiveBook } = useBooks();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { closeDrawer } = useDashboard();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!activeBook) return null;

  const ActiveIcon = resolveIcon(activeBook.icon, "Book");
  const palette = TONE_HEX[activeBook.tone];

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left transition hover:border-emerald-300"
      >
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: palette.bg, color: palette.fg }}
        >
          <ActiveIcon size={14} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-neutral-900">
            <span className="truncate">{activeBook.name}</span>
            {!activeBook.isOwner && (
              <span
                className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700"
                title="Pembukuan ini dibagikan dari orang lain"
              >
                <Users size={9} aria-hidden /> Dibagikan
              </span>
            )}
          </p>
          <p className="truncate text-[10px] text-neutral-500">
            {activeBook.isOwner
              ? "Pembukuan aktif"
              : `Dari pembukuan orang lain · ${activeBook.myRole}`}
          </p>
        </div>
        <ChevronDown
          size={14}
          // Saat tertutup: chevron mengarah ke atas (panah naik) supaya cue
          // visual jelas bahwa dropdown akan muncul ke atas.
          className={`flex-shrink-0 text-neutral-400 transition ${open ? "" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          // Drop-up: dropdown muncul ke ATAS karena posisi switcher di footer
          // sidebar — kalau drop-down akan overflow ke luar viewport. Tinggi
          // dibatasi `max-h-[min(60vh,360px)]` + scroll supaya tetap muat.
          className="absolute left-0 right-0 bottom-[calc(100%+6px)] z-[300] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl"
        >
          <div className="max-h-[min(60vh,360px)] overflow-y-auto py-1">
            {books.map((b) => {
              const Icon = resolveIcon(b.icon, "Book");
              const isActive = b._id === activeBook._id;
              const p = TONE_HEX[b.tone];
              return (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    setActiveBook(b._id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-neutral-50 ${
                    isActive ? "bg-emerald-50" : ""
                  }`}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md"
                    style={{ background: p.bg, color: p.fg }}
                  >
                    <Icon size={12} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  {!b.isOwner && (
                    <span
                      className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700"
                      title="Dibagikan oleh orang lain"
                    >
                      <Users size={9} aria-hidden /> Shared
                    </span>
                  )}
                  {isActive && (
                    <Check size={14} className="text-emerald-600" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
          <div className="border-t border-neutral-100 py-1">
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                setOpen(false);
                navigate("/dashboard/books");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <Plus size={14} /> Buat Pembukuan
            </button>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                setOpen(false);
                navigate("/dashboard/books");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-neutral-600 transition hover:bg-neutral-50"
            >
              <Settings size={14} /> Kelola Pembukuan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
