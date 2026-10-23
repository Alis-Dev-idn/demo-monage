import type { FC } from "react";
import type { ActivityRowProps } from "../types";
import { IconChip } from "./IconChip";

/**
 * ActivityRow — baris kompak icon chip + title + meta + time. Untuk feed activity.
 */
export const ActivityRow: FC<ActivityRowProps> = ({
  icon,
  title,
  meta,
  time,
  tone = "accent",
  onClick,
  className = "",
}) => {
  const interactive = !!onClick;
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick!();
              }
            }
          : undefined
      }
      className={`flex items-start gap-3 px-3 py-2.5 rounded-[var(--crd-radius-sm)] ${
        interactive ? "cursor-pointer transition-colors hover:bg-[var(--crd-border)]/30" : ""
      } ${className}`}
    >
      {icon && (
        <IconChip tone={tone} size="sm" rounded="full">
          {icon}
        </IconChip>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[0.85rem] text-[var(--crd-text)] leading-snug">{title}</div>
        {meta && <div className="text-[0.72rem] text-[var(--crd-text-muted)]">{meta}</div>}
      </div>
      {time && (
        <span className="text-[0.7rem] text-[var(--crd-text-dim)] flex-shrink-0 whitespace-nowrap">
          {time}
        </span>
      )}
    </div>
  );
};
