import { Chart } from "@dep/ui/chart";
import { formatCurrency } from "@/utils/format";

interface BalanceDatum {
  date: string;
  balance: number;
  [key: string]: unknown;
}

interface AccountBalanceChartProps {
  data: BalanceDatum[];
  height?: number;
}

export function AccountBalanceChart({ data, height = 200 }: AccountBalanceChartProps) {
  return (
    <Chart<BalanceDatum>
      type="area"
      data={data}
      xKey="date"
      height={height}
      series={[
        { key: "balance", name: "Saldo", color: "#3b82f6", fillOpacity: 0.2, strokeWidth: 2 },
      ]}
      valueFormatter={(value) => formatCurrency(value, {compact: true})}
      xTickFormatter={(value) => {
        const d = new Date(typeof value === "string" ? value : String(value));
        if (Number.isNaN(d.getTime())) return String(value);
        return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(d);
      }}
    />
  );
}
