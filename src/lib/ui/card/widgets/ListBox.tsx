import type { FC } from "react";
import { Card } from "../Card/Card";
import type { ListBoxProps } from "../types";

/**
 * ListBox — section container dengan header (icon + title + counter + action)
 * dan body untuk daftar / konten lain.
 */
export const ListBox: FC<ListBoxProps> = ({
  title,
  icon,
  count,
  action,
  tabs,
  variant = "elevated",
  pad = "none",
  className = "",
  bodyClassName = "",
  children,
}) => {
  return (
    <Card variant={variant} pad={pad} className={className}>
      {(title || icon || count !== undefined || action || tabs) && (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-[var(--crd-border)]">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="inline-flex items-center justify-center text-[var(--crd-text-muted)]" aria-hidden="true">
                {icon}
              </span>
            )}
            {title && (
              <h3 className="m-0 text-[0.95rem] font-semibold text-[var(--crd-text)] truncate">
                {title}
              </h3>
            )}
            {count !== undefined && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[0.68rem] font-semibold bg-[var(--crd-border)] text-[var(--crd-text-muted)]">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {tabs}
            {action && (
              <button
                type="button"
                className="text-[0.78rem] font-medium text-[var(--tone-text,#3b82f6)] hover:underline bg-transparent border-none cursor-pointer"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`p-3 ${bodyClassName}`}>{children}</div>
    </Card>
  );
};
