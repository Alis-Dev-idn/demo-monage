import type { ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FilePlus,
  XCircle,
} from 'lucide-react';
import type { TimelineStatus, TimelineTheme } from '../types';
import { getStatusTokens } from './statusTokens';

interface TimelineIconProps {
  status: TimelineStatus;
  theme?: TimelineTheme;
  /** Custom icon — overrides the default per-status icon. */
  icon?: ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Default icon for each status. Override via `icon` prop on the item.
 */
const DEFAULT_ICONS: Record<TimelineStatus, ReactNode> = {
  success: <CheckCircle2 size={18} strokeWidth={2} />,
  warning: <Clock size={18} strokeWidth={2} />,
  danger: <XCircle size={18} strokeWidth={2} />,
  info: <FilePlus size={18} strokeWidth={2} />,
  neutral: <AlertCircle size={18} strokeWidth={2} />,
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
};

/**
 * Colored circle that holds the timeline item's status icon.
 * The ring + background + icon color all derive from `status × theme`.
 */
export const TimelineIcon = ({
  status,
  theme = 'light',
  icon,
  size = 'md',
}: TimelineIconProps) => {
  const tokens = getStatusTokens(status, theme);
  return (
    <span
      aria-hidden="true"
      className={`relative z-10 inline-flex items-center justify-center rounded-full ring-2 ${sizeClasses[size]} ${tokens.iconBg} ${tokens.iconRing} ${tokens.iconFg}`}
    >
      {icon ?? DEFAULT_ICONS[status]}
    </span>
  );
};
