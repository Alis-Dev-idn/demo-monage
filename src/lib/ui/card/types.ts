import type { ReactNode } from "react";

export type Tone =
  | "accent"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "slate";

export type CardVariant = "elevated" | "outlined" | "ghost" | "filled";
export type CardPad = "none" | "sm" | "md" | "lg";
export type CardRadius = "sm" | "md" | "lg";

export type StatusVariant =
  | "online"
  | "warning"
  | "offline"
  | "error"
  | "info"
  | "neutral";

export interface CardProps {
  variant?: CardVariant;
  pad?: CardPad;
  radius?: CardRadius;
  tone?: Tone;
  /** Render a colored left bar in the given tone. */
  accentBar?: boolean;
  /** Apply hover/active affordance and call onClick. */
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

export interface StatProps {
  /** Small uppercase label (e.g. "DEVICES ONLINE"). */
  label: string;
  /** Main value (number or string). */
  value: ReactNode;
  /** Suffix after the value (e.g. "/8", "kW", "kWh"). */
  unit?: string;
  /** Caption below (e.g. "50% live", "Healthy"). */
  caption?: ReactNode;
  /** Trend marker (e.g. "+4.2% vs avg" or "↑ on track"). */
  trend?: ReactNode;
  /** Optional decorative icon shown top-right in a tone-colored chip. */
  icon?: ReactNode;
  tone?: Tone;
  variant?: CardVariant;
  pad?: CardPad;
  className?: string;
}

export interface MetricItemProps {
  label: string;
  value: ReactNode;
  unit?: string;
  align?: "left" | "right";
  className?: string;
}

export interface StatusPillProps {
  /** Style preset. Maps to tone + dot label. */
  variant?: StatusVariant;
  /** Override displayed label. Defaults to the variant name. */
  label?: ReactNode;
  /** Show a pulsing dot. */
  pulse?: boolean;
  className?: string;
}

export interface GroupRowProps {
  title: string;
  /** Secondary line (e.g. "3 devices · 3 members"). */
  meta?: ReactNode;
  /** Color of the left vertical bar. */
  barColor?: string;
  /** Trailing content, right-aligned before the chevron (e.g. amount totals). */
  trailing?: ReactNode;
  /** Show chevron right. */
  showArrow?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface IconChipProps {
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  rounded?: "md" | "lg" | "full";
  children?: ReactNode;
  className?: string;
}

export interface ListBoxAction {
  label: string;
  onClick: () => void;
}

export interface ListBoxProps {
  /** Title shown in the header. */
  title?: ReactNode;
  icon?: ReactNode;
  /** Optional counter pill next to the title (e.g. unread count). */
  count?: number | string;
  /** Optional trailing action — e.g. "View all →". */
  action?: ListBoxAction;
  /** Tabs / chips rendered next to the title. */
  tabs?: ReactNode;
  /** Container variant. */
  variant?: CardVariant;
  pad?: CardPad;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

export interface ActivityRowProps {
  icon?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  time?: ReactNode;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
}
