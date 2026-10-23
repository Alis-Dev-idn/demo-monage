import type { FC } from "react";
import type { MetricItemProps } from "../types";

/**
 * MetricItem — pair label uppercase + nilai mono. Untuk grid mini metrics
 * di dalam card device (POWER IN / POWER OUT).
 */
export const MetricItem: FC<MetricItemProps> = ({
  label,
  value,
  unit,
  align = "left",
  className = "",
}) => {
  const justify = align === "right" ? "items-end text-right" : "items-start text-left";
  return (
    <div className={`flex flex-col ${justify} ${className}`}>
      <span className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-[var(--crd-text-dim)]">
        {label}
      </span>
      <span className="mt-0.5 inline-flex items-baseline gap-1 font-mono text-[1.05rem] text-[var(--crd-text)]">
        <span className="font-semibold tabular-nums">{value}</span>
        {unit && (
          <span className="text-[0.78rem] font-normal text-[var(--crd-text-muted)]">{unit}</span>
        )}
      </span>
    </div>
  );
};
