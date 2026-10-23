import { forwardRef, type ReactNode } from "react";
import type { CardPad, CardProps, CardRadius, CardVariant, Tone } from "../types";
import "../card.css";

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

const VARIANT: Record<CardVariant, string> = {
  elevated:
    "bg-[var(--crd-bg-elev)] border border-[var(--crd-border)] shadow-[var(--crd-shadow)]",
  outlined: "bg-[var(--crd-bg)] border border-[var(--crd-border)]",
  ghost: "bg-transparent border border-transparent",
  filled: "bg-[var(--tone-soft,var(--crd-bg-elev))] border border-transparent",
};

/**
 * Card — container dengan compound API: `.Header`, `.Body`, `.Footer`,
 * `.Title`, `.Subtitle`, `.Label`.
 *
 * Data datang dari `children` / props — komponen tidak hardcode konten.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = "elevated",
    pad = "md",
    radius = "md",
    tone,
    accentBar,
    interactive,
    onClick,
    className = "",
    style,
    children,
  },
  ref
) {
  const base = "relative text-[var(--crd-text)] transition-colors overflow-hidden";
  const clickable = interactive || onClick ? "crd-interactive" : "";

  return (
    <div
      ref={ref}
      data-tone={tone}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${base} ${VARIANT[variant]} ${RADIUS[radius]} ${PAD[pad]} ${clickable} ${className}`}
      style={style}
    >
      {accentBar && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[var(--tone-bar,var(--tone,#3b82f6))]"
        />
      )}
      {children}
    </div>
  );
});

/* ── Sub-components ──────────────────────────────────── */

interface SectionProps {
  className?: string;
  children?: ReactNode;
}

const CardHeader = ({ className = "", children }: SectionProps) => (
  <div className={`flex items-start justify-between gap-3 ${className}`}>{children}</div>
);

const CardBody = ({ className = "", children }: SectionProps) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ className = "", children }: SectionProps) => (
  <div
    className={`mt-3 pt-3 border-t border-[var(--crd-border)] flex items-center justify-between gap-2 text-[0.78rem] text-[var(--crd-text-muted)] ${className}`}
  >
    {children}
  </div>
);

const CardTitle = ({
  className = "",
  children,
  size = "md",
}: SectionProps & { size?: "sm" | "md" | "lg" | "xl" }) => {
  const sizeCls =
    size === "sm" ? "text-sm"
      : size === "md" ? "text-base"
      : size === "lg" ? "text-lg"
      : "text-2xl";
  return (
    <h3 className={`m-0 font-semibold leading-tight ${sizeCls} ${className}`}>{children}</h3>
  );
};

const CardSubtitle = ({ className = "", children }: SectionProps) => (
  <p className={`m-0 text-[0.82rem] text-[var(--crd-text-muted)] ${className}`}>{children}</p>
);

const CardLabel = ({ className = "", children, tone }: SectionProps & { tone?: Tone }) => (
  <span
    data-tone={tone}
    className={`text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-[var(--crd-text-dim)] ${className}`}
  >
    {children}
  </span>
);

type CardComponent = typeof Card & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Title: typeof CardTitle;
  Subtitle: typeof CardSubtitle;
  Label: typeof CardLabel;
};

(Card as CardComponent).Header = CardHeader;
(Card as CardComponent).Body = CardBody;
(Card as CardComponent).Footer = CardFooter;
(Card as CardComponent).Title = CardTitle;
(Card as CardComponent).Subtitle = CardSubtitle;
(Card as CardComponent).Label = CardLabel;

export default Card as CardComponent;
export { CardHeader, CardBody, CardFooter, CardTitle, CardSubtitle, CardLabel };
