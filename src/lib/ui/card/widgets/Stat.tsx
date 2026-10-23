import type { FC } from "react";
import {Card, CardHeader, CardLabel} from "../Card/Card";
import { IconChip } from "./IconChip";
import type { StatProps } from "../types";

/**
 * Stat — kartu metric pendek: label uppercase + nilai besar + caption + icon chip.
 * Style "DEVICES ONLINE / 4 / 50% live".
 */
export const Stat: FC<StatProps> = ({
  label,
  value,
  unit,
  caption,
  trend,
  icon,
  tone = "accent",
  variant = "elevated",
  pad = "md",
  className = "",
}) => {
  return (
    <Card variant={variant} pad={pad} tone={tone} className={className}>
      <CardHeader>
        <CardLabel>{label}</CardLabel>
        {icon && (
          <IconChip tone={tone} size="md" rounded="md">
            {icon}
          </IconChip>
        )}
      </CardHeader>

      <div className="mt-3 flex items-baseline gap-1.5 leading-none">
        <span className="text-[2.25rem] font-extrabold tracking-tight text-[var(--crd-text)]">
          {value}
        </span>
        {unit && (
          <span className="text-[0.95rem] font-semibold text-[var(--crd-text-muted)]">{unit}</span>
        )}
      </div>

      {(caption || trend) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[0.78rem]">
          {caption && <span className="text-[var(--crd-text-muted)]">{caption}</span>}
          {trend && (
            <span className="text-[var(--tone-text,var(--crd-text-muted))] font-medium">
              {trend}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
