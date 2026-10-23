import type { TimelineStatus, TimelineTheme } from '../types';

/**
 * Per-(status × theme) color tokens used by TimelineIcon, TimelineDetail,
 * and TimelineNote. Centralised so changing palette in one place affects
 * the whole timeline consistently.
 */

export interface StatusTokens {
  /** Background of the icon circle */
  iconBg: string;
  /** Border ring around the icon circle */
  iconRing: string;
  /** Icon foreground color */
  iconFg: string;
  /** Accent text (used for tinted description / note) */
  textAccent: string;
  /** Avatar circle bg (for detail card) */
  avatarBg: string;
  /** Avatar text color */
  avatarFg: string;
}

/* ── Light theme tokens ───────────────────────────────────────────── */
const light: Record<TimelineStatus, StatusTokens> = {
  success: {
    iconBg: 'bg-green-50',
    iconRing: 'ring-green-200',
    iconFg: 'text-green-600',
    textAccent: 'text-green-700',
    avatarBg: 'bg-green-50',
    avatarFg: 'text-green-600',
  },
  warning: {
    iconBg: 'bg-orange-50',
    iconRing: 'ring-orange-200',
    iconFg: 'text-orange-500',
    textAccent: 'text-orange-600',
    avatarBg: 'bg-orange-50',
    avatarFg: 'text-orange-600',
  },
  danger: {
    iconBg: 'bg-red-50',
    iconRing: 'ring-red-200',
    iconFg: 'text-red-500',
    textAccent: 'text-red-600',
    avatarBg: 'bg-red-50',
    avatarFg: 'text-red-600',
  },
  info: {
    iconBg: 'bg-blue-50',
    iconRing: 'ring-blue-200',
    iconFg: 'text-blue-500',
    textAccent: 'text-blue-600',
    avatarBg: 'bg-blue-50',
    avatarFg: 'text-blue-600',
  },
  neutral: {
    iconBg: 'bg-gray-100',
    iconRing: 'ring-gray-200',
    iconFg: 'text-gray-500',
    textAccent: 'text-gray-700',
    avatarBg: 'bg-gray-100',
    avatarFg: 'text-gray-600',
  },
};

/* ── Dark theme tokens ────────────────────────────────────────────── */
const dark: Record<TimelineStatus, StatusTokens> = {
  success: {
    iconBg: 'bg-green-500/10',
    iconRing: 'ring-green-500/30',
    iconFg: 'text-green-400',
    textAccent: 'text-green-400',
    avatarBg: 'bg-green-500/15',
    avatarFg: 'text-green-300',
  },
  warning: {
    iconBg: 'bg-orange-500/10',
    iconRing: 'ring-orange-500/30',
    iconFg: 'text-orange-300',
    textAccent: 'text-orange-300',
    avatarBg: 'bg-orange-500/15',
    avatarFg: 'text-orange-300',
  },
  danger: {
    iconBg: 'bg-red-500/10',
    iconRing: 'ring-red-500/30',
    iconFg: 'text-red-300',
    textAccent: 'text-red-300',
    avatarBg: 'bg-red-500/15',
    avatarFg: 'text-red-300',
  },
  info: {
    iconBg: 'bg-cyan-500/10',
    iconRing: 'ring-cyan-500/30',
    iconFg: 'text-cyan-300',
    textAccent: 'text-cyan-300',
    avatarBg: 'bg-cyan-500/15',
    avatarFg: 'text-cyan-300',
  },
  neutral: {
    iconBg: 'bg-white/5',
    iconRing: 'ring-white/10',
    iconFg: 'text-gray-400',
    textAccent: 'text-gray-300',
    avatarBg: 'bg-white/5',
    avatarFg: 'text-gray-300',
  },
};

export const STATUS_TOKENS: Record<TimelineTheme, Record<TimelineStatus, StatusTokens>> = {
  light,
  dark,
};

/** Helper: resolve tokens for a given status + theme. */
export function getStatusTokens(
  status: TimelineStatus,
  theme: TimelineTheme
): StatusTokens {
  return STATUS_TOKENS[theme][status];
}

/** Resolve a "tone" (status or 'default') to actual text color for body copy. */
export function resolveToneTextColor(
  tone: TimelineStatus | 'default' | undefined,
  theme: TimelineTheme
): string {
  if (!tone || tone === 'default') {
    return theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  }
  return STATUS_TOKENS[theme][tone].textAccent;
}
