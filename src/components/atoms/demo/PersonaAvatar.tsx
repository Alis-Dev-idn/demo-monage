import type { ReactNode } from "react";

export type PersonaType = "personal" | "business" | "fresh";

interface PersonaAvatarProps {
  persona: PersonaType;
  icon: ReactNode;
  className?: string;
}

export function PersonaAvatar({ persona, icon, className = "" }: PersonaAvatarProps) {
  const colorMap = {
    personal: "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300",
    business: "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-300",
    fresh: "bg-sky-100 text-sky-600 ring-2 ring-sky-300",
  };

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${colorMap[persona]} ${className}`}
    >
      {icon}
    </div>
  );
}
