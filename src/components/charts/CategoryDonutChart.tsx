import { resolveIcon } from "@/constants/iconRegistry";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TONE_HEX } from "@/constants/tones";
import { formatCurrency } from "@/utils/format";
import type { ID, Tone } from "@/types";

export interface CategoryDonutDatum {
  categoryId: ID;
  categoryName: string;
  icon: string;
  tone: Tone;
  amount: number;
  percent: number;
}

interface CategoryDonutChartProps {
  data: CategoryDonutDatum[];
  height?: number;
  onSliceClick?: (categoryId: ID) => void;
}

export function CategoryDonutChart({
  data,
  height = 260,
  onSliceClick,
}: CategoryDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-neutral-50 text-sm text-neutral-500">
        Belum ada pengeluaran bulan ini.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex-1" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="categoryName"
              innerRadius={Math.max(40, Math.round(height * 0.28))}
              outerRadius={Math.max(70, Math.round(height * 0.45))}
              paddingAngle={2}
              onClick={(slice) => {
                if (onSliceClick && slice && "categoryId" in slice) {
                  onSliceClick((slice as unknown as CategoryDonutDatum).categoryId);
                }
              }}
            >
              {data.map((d, idx) => (
                <Cell
                  key={d.categoryId}
                  fill={TONE_HEX[d.tone].fg}
                  stroke="white"
                  strokeWidth={1}
                  cursor={onSliceClick ? "pointer" : undefined}
                  data-idx={idx}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.slice(0, 8).map((d) => {
          const Icon = resolveIcon(d.icon, "Tag");
          return (
            <li
              key={d.categoryId}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: TONE_HEX[d.tone].bg, color: TONE_HEX[d.tone].fg }}
              >
                <Icon size={16} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {d.categoryName}
                </p>
                <p className="text-xs text-neutral-500">{d.percent}%</p>
              </div>
              <span className="text-sm font-medium text-neutral-700">
                {formatCurrency(d.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
