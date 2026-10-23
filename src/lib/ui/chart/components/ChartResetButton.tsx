import type { FC } from "react";

export interface ChartResetButtonProps {
  label: string;
  onReset: () => void;
}

/**
 * Tombol overlay kecil di pojok kanan-atas chart, muncul ketika state pan/zoom
 * sudah berubah dari default.
 */
export const ChartResetButton: FC<ChartResetButtonProps> = ({ label, onReset }) => (
  <button
    type="button"
    onClick={onReset}
    className="absolute top-2 right-2 z-10 text-[0.7rem] font-medium px-2 py-1 rounded-md bg-[var(--cht-tooltip-bg)] text-[var(--cht-tooltip-text)] border border-[var(--cht-grid)] shadow-sm cursor-pointer hover:opacity-90"
  >
    {label}
  </button>
);
