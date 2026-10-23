import type { FC } from "react";
import type { IconChipProps } from "../types";

const SIZE = {
  sm: "w-7 h-7 text-sm",
  md: "w-9 h-9 text-base",
  lg: "w-11 h-11 text-lg",
};
const ROUND = {
  md: "rounded-md",
  lg: "rounded-xl",
  full: "rounded-full",
};

/**
 * IconChip — kotak rounded berlatar tone-soft + ikon. Cocok untuk pojok kanan-atas stat card.
 */
export const IconChip: FC<IconChipProps> = ({
  tone = "accent",
  size = "md",
  rounded = "lg",
  children,
  className = "",
}) => {
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center justify-center flex-shrink-0 bg-[var(--tone-soft)] text-[var(--tone-text)] ${SIZE[size]} ${ROUND[rounded]} ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
};
