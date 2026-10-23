import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  min?: Date;
  max?: Date;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** Bandingkan hanya bagian tanggal (abaikan jam) di zona lokal. */
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function sameDay(a: Date | null, b: Date): boolean {
  return !!a && startOfDay(a) === startOfDay(b);
}

function formatLabel(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * DatePicker kalender custom (#6) — menggantikan `<input type="date">` native
 * agar tampilan konsisten & estetik di semua browser. Props identik dengan versi
 * lama (value: Date lokal, onChange) supaya consumer tidak perlu diubah.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Pilih tanggal",
  disabled,
  id,
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => {
    const base = value ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(new Date((value ?? new Date()).getFullYear(), (value ?? new Date()).getMonth(), 1));
  }, [open, value]);

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

  const minDay = min ? startOfDay(min) : null;
  const maxDay = max ? startOfDay(max) : null;

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: Array<Date | null> = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    return arr;
  }, [view]);

  const isDisabledDay = (d: Date): boolean => {
    const t = startOfDay(d);
    if (minDay !== null && t < minDay) return true;
    if (maxDay !== null && t > maxDay) return true;
    return false;
  };

  const today = new Date();

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-50"
      >
        <Calendar size={16} className="mr-2 text-neutral-400" aria-hidden />
        <span className={`flex-1 text-sm ${value ? "text-neutral-800" : "text-neutral-400"}`}>
          {value ? formatLabel(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Bulan sebelumnya"
              onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-neutral-800">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              aria-label="Bulan berikutnya"
              onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-neutral-400">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) =>
              d === null ? (
                <span key={`e-${i}`} />
              ) : (
                <button
                  key={d.getTime()}
                  type="button"
                  disabled={isDisabledDay(d)}
                  onClick={() => {
                    onChange(d);
                    setOpen(false);
                  }}
                  className={`flex h-8 items-center justify-center rounded-lg text-sm transition ${
                    sameDay(value, d)
                      ? "bg-emerald-500 font-semibold text-white"
                      : sameDay(today, d)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-neutral-700 hover:bg-neutral-100"
                  } disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent`}
                >
                  {d.getDate()}
                </button>
              ),
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                if (!isDisabledDay(t)) {
                  onChange(t);
                  setOpen(false);
                }
              }}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Hari ini
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-xs text-neutral-500 hover:underline"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
