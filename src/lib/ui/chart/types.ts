import type { ReactNode } from "react";

export type ChartType = "line" | "area" | "bar";

export interface ChartSeries {
  /** Property key in each data row. */
  key: string;
  /** Display name in tooltip/legend. */
  name?: string;
  /** Line color. Defaults to palette by index. */
  color?: string;
  /** Per-series override of chart type (mix line + bar etc.). */
  type?: ChartType;
  /** For line/area: stroke width. */
  strokeWidth?: number;
  /** For area: fill opacity. */
  fillOpacity?: number;
  /** Stack ID — series with the same id are stacked. */
  stackId?: string;
  /** Dashed line. */
  dashed?: boolean;
  /** Hide from chart but keep in legend. */
  hidden?: boolean;
}

export interface PanConfig {
  /** Enable horizontal pan (drag along x-axis). */
  x?: boolean;
  /** Enable vertical pan (drag along y-axis). */
  y?: boolean;
  /** Number of data points visible at once on x-axis. Default: all. */
  windowSize?: number;
  /**
   * Fixed Y-axis window size — controls how much of the y-domain is visible.
   * Required when `y: true`. If not set, vertical pan is disabled.
   */
  yWindowSize?: number;
  /** Total y-domain. Pan is clamped to [yMin, yMax]. Auto-computed if omitted. */
  yMin?: number;
  yMax?: number;
  /** Allow scroll-wheel to zoom in/out windowSize (x-axis only). */
  wheelZoom?: boolean;
  /** Reset button label. If set, renders a small "Reset" control overlay. */
  resetLabel?: string;
}

export interface ChartProps<Row extends Record<string, unknown> = Record<string, unknown>> {
  /** Dataset rows. */
  data: Row[];
  /** Key in each row for the x-axis (categorical or numeric). */
  xKey: string;
  /** Series definitions. */
  series: ChartSeries[];
  /** Default chart type for series without `type`. */
  type?: ChartType;
  /** Pan / fixed view config. Omit → fixed view (no drag). */
  pan?: PanConfig;
  /** Height in px. Default 280. */
  height?: number;
  /** Width — number (px) or "100%" string. Default "100%". */
  width?: number | string;
  /** Show grid. Default true. */
  grid?: boolean;
  /** Show legend. Default true. */
  legend?: boolean;
  /** Show tooltip. Default true. */
  tooltip?: boolean;
  /** Format function for tooltip / axis values. */
  valueFormatter?: (value: number, key: string) => string;
  /** Format function for x-axis tick labels. */
  xTickFormatter?: (value: unknown, index: number) => string;
  /** Custom palette. */
  palette?: string[];
  /** Background fill — usually transparent so card shows through. */
  background?: string;
  /** Optional header / title slot on top of the chart. */
  header?: ReactNode;
  /** Optional footer slot below the chart. */
  footer?: ReactNode;
  className?: string;
  /** Margin around plot area. */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}
