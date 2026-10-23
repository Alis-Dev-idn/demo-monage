import { forwardRef, type ElementType, type ReactNode, type CSSProperties } from "react";
import type { CardPad, CardRadius, Tone } from "../types";
import "../card.css";

export type BoxSurface =
  | "solid"        // bg = --crd-bg-elev
  | "soft"         // bg = --tone-soft (butuh tone)
  | "outlined"     // border only, bg transparan
  | "ghost"        // tanpa border, tanpa bg
  | "gradient";    // bg gradient lembut dari tone

export type BoxAccent = "none" | "left" | "top" | "right" | "bottom";
export type BoxShadow = "none" | "sm" | "md" | "lg";

const PAD: Record<CardPad, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};
const RADIUS: Record<CardRadius, string> = {
  sm: "rounded-[var(--crd-radius-sm)]",
  md: "rounded-[var(--crd-radius)]",
  lg: "rounded-2xl",
};
const SHADOW: Record<BoxShadow, string> = {
  none: "",
  sm: "shadow-[var(--crd-shadow)]",
  md: "shadow-[var(--crd-shadow-md)]",
  lg: "shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]",
};

const SURFACE: Record<BoxSurface, string> = {
  solid:    "bg-[var(--crd-bg-elev)] border border-[var(--crd-border)]",
  soft:     "bg-[var(--tone-soft,var(--crd-bg-elev))] border border-transparent",
  outlined: "bg-transparent border border-[var(--crd-border)]",
  ghost:    "bg-transparent border border-transparent",
  gradient:
    "border border-transparent bg-[linear-gradient(135deg,var(--tone-soft,var(--crd-bg-elev)),transparent_70%)]",
};

const ACCENT_POS: Record<Exclude<BoxAccent, "none">, string> = {
  left:   "left-0 top-2 bottom-2 w-1 rounded-r",
  right:  "right-0 top-2 bottom-2 w-1 rounded-l",
  top:    "top-0 left-2 right-2 h-1 rounded-b",
  bottom: "bottom-0 left-2 right-2 h-1 rounded-t",
};

export interface BoxProps {
  surface?: BoxSurface;
  pad?: CardPad;
  radius?: CardRadius;
  shadow?: BoxShadow;
  tone?: Tone;
  accent?: BoxAccent;
  interactive?: boolean;
  fill?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
}

/**
 * Box — primitif container ringan. Tanpa compound API (.Header/.Body/.Footer).
 *
 * - `surface`: solid / soft / outlined / ghost / gradient
 * - `accent`: garis warna 4 arah (left / top / right / bottom)
 * - `as`: render sebagai elemen apa pun (div / a / section / li / ...)
 */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box(
  {
    surface = "solid",
    pad = "md",
    radius = "md",
    shadow = "none",
    tone,
    accent = "none",
    interactive,
    fill,
    as,
    className = "",
    style,
    onClick,
    children,
  },
  ref
) {
  const Component = (as ?? "div") as ElementType;
  const clickable = interactive || onClick ? "crd-interactive" : "";
  const stretch = fill ? "h-full w-full" : "";

  return (
    <Component
      ref={ref as never}
      data-tone={tone}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative text-[var(--crd-text)] overflow-hidden ${SURFACE[surface]} ${RADIUS[radius]} ${PAD[pad]} ${SHADOW[shadow]} ${clickable} ${stretch} ${className}`}
      style={style}
    >
      {accent !== "none" && (
        <span
          aria-hidden="true"
          className={`absolute bg-[var(--tone-bar,var(--tone,#3b82f6))] ${ACCENT_POS[accent]}`}
        />
      )}
      {children}
    </Component>
  );
});
