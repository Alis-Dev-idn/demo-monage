import type { ReactNode } from 'react';
import type { TimelineStatus, TimelineTheme } from '../types';
import { getStatusTokens } from './statusTokens';

interface TimelineBadgeProps {
  status: TimelineStatus;
  theme?: TimelineTheme;
  children: ReactNode;
}

const badgeBgBorder = {
  light: {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    danger: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    neutral: 'bg-gray-100 border-gray-200',
  },
  dark: {
    success: 'bg-green-500/10 border-green-500/30',
    warning: 'bg-orange-500/10 border-orange-500/30',
    danger: 'bg-red-500/10 border-red-500/30',
    info: 'bg-cyan-500/10 border-cyan-500/30',
    neutral: 'bg-white/5 border-white/10',
  },
} as const;

/**
 * Pill badge used to flag the "current" status of a timeline item.
 * Includes a small filled dot at the leading edge for emphasis.
 */
export const TimelineBadge = ({ status, theme = 'light', children }: TimelineBadgeProps) => {
  const tokens = getStatusTokens(status, theme);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${badgeBgBorder[theme][status]} ${tokens.textAccent}`}
    >
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full ${tokens.iconFg.replace('text-', 'bg-')}`}
      />
      {children}
    </span>
  );
};
