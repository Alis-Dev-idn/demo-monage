import type { ReactNode } from 'react';

/**
 * Visual variant of the whole timeline.
 * Add new variants by registering a styleset in `Timeline.tsx`.
 */
export type TimelineVariant = 'default' | 'compact' | 'bordered';

/**
 * Status colors. Maps to icon background + ring + accent text.
 *
 * - `success`  green   — approved, completed
 * - `warning`  orange  — pending, waiting
 * - `danger`   red     — rejected, failed
 * - `info`     blue    — draft, in progress
 * - `neutral`  gray    — generic / no semantic meaning
 */
export type TimelineStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type TimelineTheme = 'light' | 'dark';

export interface TimelineAvatar {
  /** Image URL. If absent, `initials` is rendered inside a colored circle. */
  src?: string;
  /** Initials shown when no `src` (max 2 chars recommended). */
  initials?: string;
  /** Alt text for the image. */
  alt?: string;
}

export interface TimelineDetail {
  /** Optional small avatar at the left of the detail card. */
  avatar?: TimelineAvatar;
  /** Primary line — typically the actor's name + role. */
  name: ReactNode;
  /** Secondary line — action description (e.g. "Menunggu Persetujuan SRM"). */
  description?: ReactNode;
  /**
   * Color tone for the description text. Defaults to the item's status color
   * if omitted, so it auto-matches the icon color.
   */
  descriptionTone?: TimelineStatus | 'default';
}

export interface TimelineNote {
  /** Label / text content of the note. */
  label: ReactNode;
  /** Color tone. Defaults to `"danger"` (e.g. rejection reason). */
  tone?: TimelineStatus | 'default';
}

export interface TimelineEntry {
  /** Stable ID — used as React key. */
  id: string;
  /** Status drives icon color when no custom icon is provided. */
  status?: TimelineStatus;
  /** Main title shown next to the icon. */
  title: ReactNode;
  /** Timestamp string. Pass a pre-formatted string for full control. */
  timestamp?: ReactNode;
  /**
   * Custom icon. When provided, overrides the default status icon.
   * Wrapped automatically in a colored circle (color from `status`).
   */
  icon?: ReactNode;
  /** Show the "Status saat ini" pill below the title. */
  isCurrent?: boolean;
  /** Label for the "current" badge. Defaults to "Status saat ini". */
  currentLabel?: string;
  /** Optional detail card rendered below title (avatar + name + desc). */
  detail?: TimelineDetail;
  /** Optional note (e.g. rejection reason) rendered below the detail card. */
  note?: TimelineNote;
  /** Fully custom content placed inside the item's content slot. */
  children?: ReactNode;
}

export interface TimelineProps {
  /** Section title (e.g. "Log Mutasi"). Set to `null`/omit to hide. */
  title?: ReactNode;
  /** Subtitle below the title. */
  subtitle?: ReactNode;
  /** Visual variant. */
  variant?: TimelineVariant;
  /** Light or dark surface. */
  theme?: TimelineTheme;
  /** Declarative list of entries. Mutually exclusive with `children`. */
  items?: TimelineEntry[];
  /**
   * Compositional API. When provided, `items` is ignored. Render
   * `<TimelineItem>` children yourself for full control.
   */
  children?: ReactNode;
  className?: string;
}
