import { useEffect, useRef, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

interface FabMenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  onClick: () => void;
  onLongPress?: () => void;
  icon?: ReactNode;
  label?: string;
  menuItems?: FabMenuItem[];
  className?: string;
}

const LONG_PRESS_MS = 450;

export function FloatingActionButton({
  onClick,
  onLongPress,
  icon,
  label = "Tambah transaksi",
  menuItems,
  className = "",
}: FloatingActionButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const triggered = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const startPress = () => {
    triggered.current = false;
    timer.current = window.setTimeout(() => {
      triggered.current = true;
      if (menuItems?.length) setMenuOpen(true);
      else onLongPress?.();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const handleClick = () => {
    if (triggered.current) {
      triggered.current = false;
      return;
    }
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    onClick();
  };

  return (
    <div
      ref={wrapperRef}
      className={`fixed bottom-20 right-4 z-40 sm:bottom-8 sm:right-8 ${className}`}
    >
      {menuOpen && menuItems && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                item.onClick();
              }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-lg ring-1 ring-neutral-200 hover:bg-neutral-50"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label={label}
        onClick={handleClick}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-200 transition hover:bg-emerald-600 active:scale-95"
      >
        {icon ?? <Plus size={24} aria-hidden />}
      </button>
    </div>
  );
}
