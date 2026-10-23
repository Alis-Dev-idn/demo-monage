import type { FC, ReactNode } from "react";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  label?: ReactNode;
  spacing?: "none" | "sm" | "md" | "lg";
  dashed?: boolean;
  className?: string;
}

const SPACE_H = { none: "my-0", sm: "my-2", md: "my-3", lg: "my-5" };
const SPACE_V = { none: "mx-0", sm: "mx-2", md: "mx-3", lg: "mx-5" };

/**
 * Divider — garis pemisah horizontal/vertical, opsional label di tengah, opsional dashed.
 */
export const Divider: FC<DividerProps> = ({
  orientation = "horizontal",
  label,
  spacing = "md",
  dashed,
  className = "",
}) => {
  if (orientation === "vertical") {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={`inline-block self-stretch w-px bg-[var(--crd-border)] ${SPACE_V[spacing]} ${
          dashed ? "[border-left:1px_dashed_var(--crd-border)] bg-transparent w-0" : ""
        } ${className}`}
      />
    );
  }
  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={`flex items-center gap-3 ${SPACE_H[spacing]} ${className}`}
      >
        <span
          className={`flex-1 h-px bg-[var(--crd-border)] ${
            dashed ? "[border-top:1px_dashed_var(--crd-border)] bg-transparent h-0" : ""
          }`}
        />
        <span className="text-[0.72rem] uppercase tracking-[0.08em] font-semibold text-[var(--crd-text-dim)]">
          {label}
        </span>
        <span
          className={`flex-1 h-px bg-[var(--crd-border)] ${
            dashed ? "[border-top:1px_dashed_var(--crd-border)] bg-transparent h-0" : ""
          }`}
        />
      </div>
    );
  }
  return (
    <hr
      className={`block border-0 h-px bg-[var(--crd-border)] ${SPACE_H[spacing]} ${
        dashed ? "[border-top:1px_dashed_var(--crd-border)] bg-transparent h-0" : ""
      } ${className}`}
    />
  );
};
