import type { FC } from "react";
import type { StatusPillProps, StatusVariant, Tone } from "../types";

const VARIANT_TONE: Record<StatusVariant, Tone> = {
  online: "emerald",
  warning: "amber",
  offline: "slate",
  error: "rose",
  info: "accent",
  neutral: "slate",
};

/** StatusPill — pill kecil dot + label dengan variant warna. */
export const StatusPill: FC<StatusPillProps> = ({
  variant = "info",
  label,
  pulse,
  className = "",
}) => {
  const tone = VARIANT_TONE[variant];
  const text = label ?? variant;
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)] text-[0.72rem] font-medium leading-tight whitespace-nowrap ${className}`}
    >
      <span className={`crd-status-dot ${pulse ? "crd-status-dot--pulse" : ""}`} />
      <span className="capitalize">{text}</span>
    </span>
  );
};
