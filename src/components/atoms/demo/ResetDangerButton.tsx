import { RotateCcw } from "lucide-react";

interface ResetDangerButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ResetDangerButton({
  onClick,
  isLoading = false,
  disabled = false,
  className = "",
}: ResetDangerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <RotateCcw size={15} className={isLoading ? "animate-spin" : ""} />
      <span>{isLoading ? "Mengembalikan Data..." : "Reset Semua Data"}</span>
    </button>
  );
}
