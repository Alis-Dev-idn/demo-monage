/**
 * Public surface for the Timeline component.
 *
 * Recommended usage:
 * ```ts
 * import { Timeline } from "@dep/ui/timeline";
 * <Timeline title="Log Mutasi" items={[...]} />
 * ```
 *
 * Or compositional:
 * ```ts
 * import { Timeline, TimelineItem } from "@dep/ui/timeline";
 * <Timeline title="Log">
 *   <TimelineItem status="warning" title="Pending" isCurrent />
 * </Timeline>
 * ```
 */

export { Timeline } from './Timeline';
export { TimelineItem } from './TimelineItem';
export type { TimelineItemProps } from './TimelineItem';

// Sub-primitives — useful for fully custom item rendering.
export { TimelineIcon } from './components/TimelineIcon';
export { TimelineBadge } from './components/TimelineBadge';
export { TimelineDetail } from './components/TimelineDetail';
export { TimelineNote } from './components/TimelineNote';

// Status color helpers — share with adjacent UI if needed.
export { getStatusTokens, resolveToneTextColor } from './components/statusTokens';
export type { StatusTokens } from './components/statusTokens';

// Types
export type {
  TimelineProps,
  TimelineEntry,
  TimelineStatus,
  TimelineVariant,
  TimelineTheme,
  TimelineAvatar,
  TimelineDetail as TimelineDetailModel,
  TimelineNote as TimelineNoteModel,
} from './types';
