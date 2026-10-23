/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { resolveIcon } from "@/constants/iconRegistry";
import { Button } from "@dep/ui/button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  const Icon = resolveIcon(icon, "Inbox");

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm">
        <Icon size={24} aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-neutral-800">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
