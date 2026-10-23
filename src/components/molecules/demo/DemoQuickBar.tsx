import { RotateCcw } from "lucide-react";
import { DemoBadge } from "@/components/atoms/demo/DemoBadge";

interface DemoQuickBarProps {
  onOpenResetModal: () => void;
  className?: string;
}

export function DemoQuickBar({ onOpenResetModal, className = "" }: DemoQuickBarProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DemoBadge />
      <button
        type="button"
        onClick={onOpenResetModal}
        title="Kembalikan data simulasi ke snapshot awal"
        className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-rose-600"
      >
        <RotateCcw size={12} className="shrink-0" />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
}
