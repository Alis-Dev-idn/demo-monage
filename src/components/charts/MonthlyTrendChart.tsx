import { Chart } from "@dep/ui/chart";
import { formatCurrency, formatMonthLabel } from "@/utils/format";

interface MonthlyDatum {
  year: number;
  month: number;
  income: number;
  expense: number;
}

interface MonthlyDatumKey extends MonthlyDatum {
  label: string;
  [key: string]: unknown;
}

interface MonthlyTrendChartProps {
  data: MonthlyDatum[];
  height?: number;
}

export function MonthlyTrendChart({ data, height = 240 }: MonthlyTrendChartProps) {
  const rows: MonthlyDatumKey[] = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.year, d.month),
  }));

  return (
    <Chart<MonthlyDatumKey>
      type="bar"
      data={rows}
      xKey="label"
      height={height}
      series={[
        { key: "income", name: "Masuk", color: "#10b981" },
        { key: "expense", name: "Keluar", color: "#f97316" },
      ]}
      valueFormatter={(value) => formatCurrency(value, {compact: true})}
    />
  );
}
