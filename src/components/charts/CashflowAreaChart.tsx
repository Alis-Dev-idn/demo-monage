import { Chart } from "@dep/ui/chart";
import { formatCurrency } from "@/utils/format";

interface CashflowDatum {
  date: string;
  income: number;
  expense: number;
  [key: string]: unknown;
}

interface CashflowAreaChartProps {
  data: CashflowDatum[];
  height?: number;
}

export function CashflowAreaChart({ data, height = 240 }: CashflowAreaChartProps) {
  return (
    <Chart<CashflowDatum>
      type="area"
      data={data}
      xKey="date"
      height={height}
      series={[
        { key: "income", name: "Uang Masuk", color: "#10b981", fillOpacity: 0.25 },
        { key: "expense", name: "Uang Keluar", color: "#f97316", fillOpacity: 0.25 },
      ]}
      valueFormatter={(value) => formatCurrency(value, {compact: true})}
      xTickFormatter={(value) => {
        const v = typeof value === "string" ? value : String(value);
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return v;
        return new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
        }).format(d);
      }}
    />
  );
}
