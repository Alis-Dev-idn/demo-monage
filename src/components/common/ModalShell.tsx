import type { ReactNode } from "react";

interface ModalShellProps {
  title: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Override max height. Default `90vh` (lihat Modal lib). */
  maxHeight?: string;
}

/**
 * Wrapper standar untuk konten Modal: header sticky di atas, body scroll
 * vertikal, footer sticky di bawah. Mencegah tombol "hilang" di mobile
 * ketika form panjang melebihi viewport.
 *
 * Pakai bersama <Modal isOpen={..} onClose={..} size="md"> dari `@dep/ui/modal`.
 */
export function ModalShell({
  title,
  icon,
  subtitle,
  children,
  footer,
  maxHeight = "90vh",
}: ModalShellProps) {
  return (
    <div className="flex flex-col" style={{ maxHeight }}>
      <header className="flex flex-shrink-0 items-start gap-3 border-b border-neutral-100 px-5 py-4">
        {icon && (
          <span className="mt-0.5 text-emerald-600" aria-hidden>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-neutral-900 sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">{subtitle}</p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

      {footer && (
        <footer className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-neutral-100 bg-white px-5 py-3">
          {footer}
        </footer>
      )}
    </div>
  );
}
