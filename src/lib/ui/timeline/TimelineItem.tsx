import type { ReactNode } from 'react';
import { TimelineIcon } from './components/TimelineIcon';
import { TimelineBadge } from './components/TimelineBadge';
import { TimelineDetail } from './components/TimelineDetail';
import { TimelineNote } from './components/TimelineNote';
import type {
  TimelineDetail as TimelineDetailModel,
  TimelineNote as TimelineNoteModel,
  TimelineStatus,
  TimelineTheme,
  TimelineVariant,
} from './types';

export interface TimelineItemProps {
  status?: TimelineStatus;
  title: ReactNode;
  timestamp?: ReactNode;
  icon?: ReactNode;
  isCurrent?: boolean;
  currentLabel?: string;
  detail?: TimelineDetailModel;
  note?: TimelineNoteModel;
  /** Inserted between detail and note for fully custom content. */
  children?: ReactNode;

  /* ── Cascaded from parent <Timeline> — usually you don't set these. ── */
  theme?: TimelineTheme;
  variant?: TimelineVariant;
  /** Hide the connector below this item — set by Timeline for the last item. */
  isLast?: boolean;
}

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const timestampClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

/**
 * Single timeline row: icon (with vertical connector) on the left, content
 * (title + timestamp + optional badge + optional detail/note/children)
 * on the right.
 *
 * Can be used standalone inside a custom `<Timeline>` composition, or
 * (more commonly) driven from `Timeline.items[]`.
 */
export const TimelineItem = ({
  status = 'neutral',
  title,
  timestamp,
  icon,
  isCurrent,
  currentLabel = 'Status saat ini',
  detail,
  note,
  children,
  theme = 'light',
  variant = 'default',
  isLast = false,
}: TimelineItemProps) => {
  const isCompact = variant === 'compact';
  const isBordered = variant === 'bordered';
  const itemGap = isCompact ? 'gap-3 pb-4' : 'gap-4 pb-6';
  const contentGap = isCompact ? 'gap-1.5' : 'gap-2';

  const connectorColor = theme === 'dark' ? 'bg-white/10' : 'bg-gray-200';

  return (
    <li className={`relative flex ${itemGap}`}>
      {/* Icon column with vertical connector */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        <TimelineIcon
          status={status}
          theme={theme}
          icon={icon}
          size={isCompact ? 'sm' : 'md'}
        />
        {!isLast && (
          <span
            aria-hidden="true"
            className={`absolute top-10 bottom-0 w-px ${connectorColor}`}
            style={{ top: isCompact ? '2rem' : '2.5rem' }}
          />
        )}
      </div>

      {/* Content column */}
      <div className={`flex-1 min-w-0 flex flex-col ${contentGap}`}>
        <div className="flex flex-col gap-0.5">
          <div className={`text-base font-semibold leading-tight ${titleClasses[theme]}`}>
            {title}
          </div>
          {timestamp && (
            <div className={`text-xs ${timestampClasses[theme]}`}>{timestamp}</div>
          )}
        </div>

        {isCurrent && (
          <div>
            <TimelineBadge status={status} theme={theme}>
              {currentLabel}
            </TimelineBadge>
          </div>
        )}

        {detail && (
          <TimelineDetail
            detail={detail}
            status={status}
            theme={theme}
            bordered={!isCompact && isBordered ? true : !isCompact}
          />
        )}

        {note && <TimelineNote note={note} theme={theme} />}

        {children}
      </div>
    </li>
  );
};
