import type { FC } from "react";
import type { GroupRowProps } from "../types";

/**
 * GroupRow — baris accent bar di kiri + title + meta + chevron. Untuk daftar "My groups".
 */
export const GroupRow: FC<GroupRowProps> = ({
  title,
  meta,
  barColor,
  trailing,
  showArrow = true,
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
      className={`relative flex items-center gap-3 pl-4 pr-3 py-3 rounded-[var(--crd-radius-sm)] bg-[var(--crd-bg-elev)] border border-[var(--crd-border)] ${
        interactive ? "crd-interactive" : ""
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
        style={barColor ? { background: barColor } : undefined}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[0.92rem] font-semibold text-[var(--crd-text)] truncate">{title}</div>
        {meta && (
          <div className="text-[0.78rem] text-[var(--crd-text-muted)] truncate">{meta}</div>
        )}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
      {showArrow && (
        <span className="text-[var(--crd-text-dim)] flex-shrink-0" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      )}
    </div>
  );
};
