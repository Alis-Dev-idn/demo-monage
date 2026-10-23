import { useMemo } from "react";
import type { ChartSeries } from "../types";

/**
 * Hitung domain Y otomatis (min, max) dari semua nilai numerik pada series
 * yang tidak `hidden`. Memberi padding kecil bila min === max agar chart
 * tidak collapse.
 */
export function useChartBounds<Row extends Record<string, unknown>>(
  data: Row[],
  series: ChartSeries[]
) {
  return useMemo(() => {
    if (!data.length) return { min: 0, max: 1 };

    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      for (const s of series) {
        if (s.hidden) continue;
        const v = Number(row[s.key]);
        if (Number.isFinite(v)) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: 0, max: 1 };
    }
    if (min === max) {
      return { min: min - 1, max: max + 1 };
    }
    return { min, max };
  }, [data, series]);
}
