import type { ReactNode } from "react";
import { Area, Bar, Line } from "recharts";
import type { ChartSeries, ChartType } from "../types";

/**
 * Render satu series (Line/Area/Bar) berdasarkan kombinasi `series[].type`
 * (override) dan `defaultType` dari prop chart.
 */
export function renderSeries(
  s: ChartSeries,
  i: number,
  defaultType: ChartType,
  palette: string[]
): ReactNode {
  const color = s.color ?? palette[i % palette.length];
  const t = s.type ?? defaultType;
  const name = s.name ?? s.key;

  if (t === "bar") {
    return (
      <Bar
        key={s.key}
        dataKey={s.key}
        name={name}
        fill={color}
        radius={[4, 4, 0, 0]}
        stackId={s.stackId}
        isAnimationActive={false}
      />
    );
  }
  if (t === "area") {
    return (
      <Area
        key={s.key}
        type="monotone"
        dataKey={s.key}
        name={name}
        stroke={color}
        fill={color}
        fillOpacity={s.fillOpacity ?? 0.18}
        strokeWidth={s.strokeWidth ?? 2}
        strokeDasharray={s.dashed ? "4 4" : undefined}
        stackId={s.stackId}
        dot={false}
        activeDot={{ r: 4 }}
        isAnimationActive={false}
      />
    );
  }
  // line (default)
  return (
    <Line
      key={s.key}
      type="monotone"
      dataKey={s.key}
      name={name}
      stroke={color}
      strokeWidth={s.strokeWidth ?? 2}
      strokeDasharray={s.dashed ? "4 4" : undefined}
      dot={false}
      activeDot={{ r: 4 }}
      isAnimationActive={false}
    />
  );
}

/**
 * Render seluruh series — filter `hidden`, lalu map → renderSeries.
 */
export function renderAllSeries(
  series: ChartSeries[],
  defaultType: ChartType,
  palette: string[]
): ReactNode[] {
  return series
    .filter((s) => !s.hidden)
    .map((s, i) => renderSeries(s, i, defaultType, palette));
}
