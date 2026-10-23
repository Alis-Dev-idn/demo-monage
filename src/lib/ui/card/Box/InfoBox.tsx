import type { FC, ReactNode } from "react";
import { Box, type BoxProps, type BoxSurface } from "./Box";
import type { StatusVariant, Tone } from "../types";

const VARIANT_TONE: Record<InfoVariant, Tone> = {
  info: "accent",
  success: "emerald",
  warning: "amber",
  error: "rose",
  neutral: "slate",
};

export type InfoVariant = "info" | "success" | "warning" | "error" | "neutral";

export interface InfoBoxProps extends Omit<BoxProps, "tone" | "children"> {
  variant?: InfoVariant | StatusVariant;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  action?: {
    label: string;
    onClick: () => void;
    placement?: "right" | "bottom";
  };
  surface?: BoxSurface;
}

/**
 * InfoBox — callout/alert ringan dengan variant info/success/warning/error/neutral.
 */
export const InfoBox: FC<InfoBoxProps> = ({
  variant = "info",
  title,
  description,
  icon,
  onClose,
  closeLabel = "Dismiss",
  action,
  surface = "soft",
  pad = "md",
  radius = "md",
  accent = "left",
  className = "",
  ...rest
}) => {
  const mappedVariant: InfoVariant =
    variant === "online"
      ? "success"
      : variant === "offline"
        ? "neutral"
        : (variant as InfoVariant);
  const tone = VARIANT_TONE[mappedVariant];
  const placement = action?.placement ?? "right";

  return (
    <Box
      {...rest}
      tone={tone}
      surface={surface}
      pad={pad}
      radius={radius}
      accent={accent}
      className={className}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[var(--tone-soft)] text-[var(--tone-text)] flex-shrink-0"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="text-[0.9rem] font-semibold text-[var(--crd-text)] leading-tight">
              {title}
            </div>
          )}
          {description && (
            <div className="mt-1 text-[0.82rem] text-[var(--crd-text-muted)] leading-snug">
              {description}
            </div>
          )}
          {action && placement === "bottom" && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-[0.78rem] font-medium bg-[var(--tone-soft)] text-[var(--tone-text)] hover:opacity-90 cursor-pointer border-none"
            >
              {action.label}
            </button>
          )}
        </div>
        {action && placement === "right" && (
          <button
            type="button"
            onClick={action.onClick}
            className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-[0.78rem] font-medium bg-[var(--tone-soft)] text-[var(--tone-text)] hover:opacity-90 cursor-pointer border-none"
          >
            {action.label}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex-shrink-0 -mr-1 -mt-1 inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--crd-text-muted)] hover:bg-[var(--crd-border)]/40 cursor-pointer bg-transparent border-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </Box>
  );
};
