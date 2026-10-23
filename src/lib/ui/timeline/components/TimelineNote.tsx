import type { TimelineNote as TimelineNoteModel, TimelineTheme } from '../types';
import { resolveToneTextColor } from './statusTokens';

interface TimelineNoteProps {
  note: TimelineNoteModel;
  theme?: TimelineTheme;
}

/**
 * Footnote-style line below the detail card. Default tone is `danger`
 * (rejection reason). Pass `tone="default"` for a neutral note.
 */
export const TimelineNote = ({ note, theme = 'light' }: TimelineNoteProps) => {
  const tone = note.tone ?? 'danger';
  const color = resolveToneTextColor(tone, theme);
  return <div className={`text-sm ${color}`}>{note.label}</div>;
};
