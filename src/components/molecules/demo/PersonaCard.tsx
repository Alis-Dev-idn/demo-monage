import type { ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { PersonaAvatar, type PersonaType } from "@/components/atoms/demo/PersonaAvatar";

interface PersonaCardProps {
  persona: PersonaType;
  title: string;
  name: string;
  description: string;
  highlights: string;
  icon: ReactNode;
  isLoading?: boolean;
  onClick: () => void;
}

export function PersonaCard({
  persona,
  title,
  name,
  description,
  highlights,
  icon,
  isLoading = false,
  onClick,
}: PersonaCardProps) {
  const themeStyles = {
    personal: {
      card: "border-emerald-200 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50/70 text-emerald-950",
      arrow: "text-emerald-600 group-hover:translate-x-1",
      badge: "bg-emerald-100 text-emerald-700",
    },
    business: {
      card: "border-indigo-200 bg-indigo-50/40 hover:border-indigo-500 hover:bg-indigo-50/70 text-indigo-950",
      arrow: "text-indigo-600 group-hover:translate-x-1",
      badge: "bg-indigo-100 text-indigo-700",
    },
    fresh: {
      card: "border-sky-200 bg-sky-50/40 hover:border-sky-500 hover:bg-sky-50/70 text-neutral-900",
      arrow: "text-sky-600 group-hover:translate-x-1",
      badge: "bg-sky-100 text-sky-700",
    },
  };

  const style = themeStyles[persona];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`group relative flex w-full items-center justify-between gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-75 ${style.card}`}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <PersonaAvatar persona={persona} icon={icon} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base leading-tight">
              {title}
            </span>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}>
              {name}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-600 leading-normal line-clamp-1">
            {description}
          </p>
          <p className="mt-1 text-[11px] font-medium text-neutral-500 line-clamp-1">
            {highlights}
          </p>
        </div>
      </div>

      <div className="shrink-0 pl-1">
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-neutral-500" />
        ) : (
          <ArrowRight size={18} className={`transition-transform duration-200 ${style.arrow}`} />
        )}
      </div>
    </button>
  );
}
