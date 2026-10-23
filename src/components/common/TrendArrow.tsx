import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface TrendArrowProps {
  delta: number;
  size?: number;
  className?: string;
}

export function TrendArrow({ delta, size = 14, className = "" }: TrendArrowProps) {
  if (delta === 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-neutral-500 ${className}`}>
        <Minus size={size} aria-hidden />
        <span className="text-xs font-medium">0%</span>
      </span>
    );
  }
  const isUp = delta > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? "text-emerald-600" : "text-rose-600";
  const sign = isUp ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 ${color} ${className}`}>
      <Icon size={size} aria-hidden />
      <span className="text-xs font-medium">
        {sign}
        {delta.toFixed(1)}%
      </span>
    </span>
  );
}
