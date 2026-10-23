import type { FC } from "react";
import type { TooltipProps } from "recharts";

export type ValueFormatter = (value: number, key: string) => string;
export type LabelFormatter = (label: unknown) => string;

export interface ChartTooltipProps extends TooltipProps<number, string> {
  valueFormatter?: ValueFormatter;
  /** Format label (sumbu X) di header tooltip. Nama `x` agar tak bentrok
   *  dengan `labelFormatter` bawaan recharts pada `TooltipProps`. */
  xLabelFormatter?: LabelFormatter;
}

/**
 * Tooltip kustom dengan label di atas dan baris swatch + name + value.
 *
 * Dipakai sebagai fungsi render di `<Tooltip content={...} />`. Signature
 * `(props) => ReactNode` sesuai kontrak Recharts, jadi tidak perlu inline
 * arrow yang membuat type-inference lemah.
 */
export const ChartTooltip: FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
  xLabelFormatter,
}) => {
  if (!active || !payload?.length) return null;
  const labelText = xLabelFormatter ? xLabelFormatter(label) : String(label ?? "");
  return (
    <div className="cht-tooltip">
      <div className="cht-tooltip__label">{labelText}</div>
      {payload.map((p, i) => {
        const value = typeof p.value === "number" ? p.value : Number(p.value);
        const display =
          valueFormatter && Number.isFinite(value)
            ? valueFormatter(value, String(p.dataKey ?? ""))
            : String(p.value ?? "");
        return (
          <div key={i} className="cht-tooltip__row">
            <span className="cht-tooltip__swatch" style={{ background: p.color }} />
            <span className="cht-tooltip__name">{p.name}</span>
            <span className="cht-tooltip__value">{display}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Helper: bangun render-prop untuk `<Tooltip content={...} />` dengan
 * `valueFormatter` ter-bind. Mengembalikan fungsi yang signature-nya tepat
 * cocok dengan Recharts (`(props: TooltipProps<...>) => ReactNode`).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function makeTooltipContent(
  valueFormatter?: ValueFormatter,
  xLabelFormatter?: LabelFormatter,
) {
  return function TooltipContent(props: TooltipProps<number, string>) {
    return (
      <ChartTooltip
        {...props}
        valueFormatter={valueFormatter}
        xLabelFormatter={xLabelFormatter}
      />
    );
  };
}
