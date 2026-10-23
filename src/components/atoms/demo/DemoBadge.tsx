import { Sparkles } from "lucide-react";

interface DemoBadgeProps {
  className?: string;
  onClick?: () => void;
}

export function DemoBadge({ className = "", onClick }: DemoBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Simulasi Data Offline Aktif (MSW + IndexedDB)"
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-500/10 px-2.5 py-1 text-xs font-medium tracking-wide text-amber-700 transition hover:bg-amber-500/20 ${className}`}
    >
      <Sparkles size={12} className="shrink-0 text-amber-600 animate-pulse" />
      <span>Mode Demo Mandiri</span>
    </button>
  );
}
