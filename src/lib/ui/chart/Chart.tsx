import { useMemo, type CSSProperties } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartProps } from "./types";
import { DEFAULT_PALETTE, DEFAULT_MARGIN } from "./constants";
import { useChartBounds } from "./hooks/useChartBounds";
import { usePan } from "./hooks/usePan";
import { makeTooltipContent } from "./components/ChartTooltip";
import { renderAllSeries } from "./components/ChartSeries";
import { ChartResetButton } from "./components/ChartResetButton";
import "./chart.css";

type GenericRow = Record<string, unknown>;

/**
 * Chart — wrapper Recharts dengan mode fixed (default) atau pan (drag).
 *
 * - Tanpa `pan`                       → render seluruh data, tidak bisa digeser.
 * - `pan: { x: true }`                → drag kiri-kanan menggeser jendela x.
 * - `pan: { y: true, yWindowSize }`   → drag atas-bawah menggeser jendela y.
 * - `pan: { x, y, ... }`              → keduanya.
 * - `pan: { wheelZoom: true }`        → scroll wheel zoom in/out x window.
 *
 * Semua data + series dari props — tidak ada hardcode.
 */
export function Chart<Row extends GenericRow = GenericRow>(props: ChartProps<Row>) {
  const {
    data,
    xKey,
    series,
    type = "line",
    pan,
    height = 280,
    width = "100%",
    grid = true,
    legend = true,
    tooltip = true,
    valueFormatter,
    xTickFormatter,
    palette = DEFAULT_PALETTE,
    background = "transparent",
    header,
    footer,
    className = "",
    margin,
  } = props;

  // Auto y-domain dari seluruh series.
  const autoBounds = useChartBounds(data, series);
  const yMin = pan?.yMin ?? autoBounds.min;
  const yMax = pan?.yMax ?? autoBounds.max;

  // Pan / zoom state + handlers.
  const {
    state,
    panning,
    panX,
    panY,
    panAny,
    yWindow,
    handlers,
    wrapperRef,
    reset,
    isDirty,
  } = usePan({ dataLength: data.length, pan, yMin, yMax });

  // Slice data sesuai jendela x.
  const visibleData = useMemo(() => {
    if (!panX) return data;
    return data.slice(state.xStart, state.xStart + state.windowSize);
  }, [data, panX, state.xStart, state.windowSize]);

  // Domain y berdasarkan pan / fixed.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const yDomain = useMemo<[number, number]>(() => {
    if (panY) {
      const bottom = yMin + state.yOffset;
      return [bottom, bottom + yWindow];
    }
    if (pan?.yMin !== undefined && pan?.yMax !== undefined) return [pan.yMin, pan.yMax];
    return [yMin, yMax];
  }, [panY, pan?.yMin, pan?.yMax, state.yOffset, yMin, yMax, yWindow]);

  // Tooltip content factory dengan formatter ter-bind. Label tooltip memakai
  // `xTickFormatter` yang sama dengan sumbu X (mis. format tanggal id-ID) agar
  // tidak menampilkan ISO mentah (#P6).
  const TooltipContent = useMemo(
    () =>
      makeTooltipContent(
        valueFormatter,
        xTickFormatter ? (label) => xTickFormatter(label, 0) : undefined,
      ),
    [valueFormatter, xTickFormatter],
  );

  // Series elements.
  const renderedSeries = useMemo(
    () => renderAllSeries(series, type, palette),
    [series, type, palette]
  );

  const cursorClass = panAny
    ? panX && panY
      ? "cht-pan-xy"
      : panX
        ? "cht-pan-x"
        : "cht-pan-y"
    : "";

  const wrapperStyle: CSSProperties = {
    background,
    height,
    width: typeof width === "number" ? `${width}px` : width,
  };

  return (
    <div className={`relative ${className}`}>
      {header}
      <div
        ref={wrapperRef}
        className={`relative ${cursorClass} ${panning ? "cht-panning" : ""}`}
        style={wrapperStyle}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerUp}
        onPointerLeave={handlers.onPointerUp}
        onWheel={handlers.onWheel}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={visibleData}
            margin={{
              top: margin?.top ?? DEFAULT_MARGIN.top,
              right: margin?.right ?? DEFAULT_MARGIN.right,
              bottom: margin?.bottom ?? DEFAULT_MARGIN.bottom,
              left: margin?.left ?? DEFAULT_MARGIN.left,
            }}
          >
            {grid && (
              <CartesianGrid stroke="var(--cht-grid)" strokeDasharray="3 3" vertical={false} />
            )}
            <XAxis
              dataKey={xKey}
              stroke="var(--cht-axis)"
              tickLine={false}
              axisLine={{ stroke: "var(--cht-grid)" }}
              tick={{ fill: "var(--cht-axis-strong)", fontSize: 11 }}
              tickFormatter={xTickFormatter}
              minTickGap={16}
            />
            <YAxis
              domain={yDomain}
              stroke="var(--cht-axis)"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--cht-axis-strong)", fontSize: 11 }}
              tickFormatter={
                valueFormatter ? (v: number) => valueFormatter(v, "_yAxis") : undefined
              }
              width={48}
              allowDataOverflow={panY}
            />
            {tooltip && (
              <Tooltip
                cursor={{ stroke: "var(--cht-grid)", strokeWidth: 1 }}
                content={TooltipContent}
              />
            )}
            {legend && (
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
            )}
            {renderedSeries}
          </ComposedChart>
        </ResponsiveContainer>

        {panAny && pan?.resetLabel && isDirty && (
          <ChartResetButton label={pan.resetLabel} onReset={reset} />
        )}
      </div>
      {footer}
    </div>
  );
}
