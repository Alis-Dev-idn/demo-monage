import type { FC, ReactNode } from "react";

export interface SectionProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  toolbar?: ReactNode;
  divider?: boolean;
  gap?: "none" | "sm" | "md" | "lg";
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

const GAP = { none: "mt-0", sm: "mt-2", md: "mt-4", lg: "mt-6" };

/**
 * Section — wrapper halaman: header (title+subtitle+icon+toolbar) → body.
 * Tanpa background sendiri.
 */
export const Section: FC<SectionProps> = ({
  title,
  subtitle,
  icon,
  toolbar,
  divider,
  gap = "md",
  className = "",
  bodyClassName = "",
  children,
}) => {
  const hasHeader = !!(title || subtitle || toolbar || icon);
  return (
    <section className={className}>
      {hasHeader && (
        <header
          className={`flex items-end justify-between gap-3 flex-wrap ${
            divider ? "pb-3 border-b border-[var(--crd-border)]" : ""
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {icon && (
                <span className="inline-flex text-[var(--crd-text-muted)]" aria-hidden="true">
                  {icon}
                </span>
              )}
              {title && (
                <h2 className="m-0 text-lg font-semibold text-[var(--crd-text)] truncate">
                  {title}
                </h2>
              )}
            </div>
            {subtitle && (
              <p className="m-0 mt-1 text-[0.85rem] text-[var(--crd-text-muted)]">{subtitle}</p>
            )}
          </div>
          {toolbar && <div className="flex items-center gap-2 flex-shrink-0">{toolbar}</div>}
        </header>
      )}
      <div className={`${hasHeader ? GAP[gap] : ""} ${bodyClassName}`}>{children}</div>
    </section>
  );
};
