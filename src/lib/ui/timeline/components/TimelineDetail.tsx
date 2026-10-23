import type { TimelineDetail as TimelineDetailModel, TimelineStatus, TimelineTheme } from '../types';
import { getStatusTokens, resolveToneTextColor } from './statusTokens';

interface TimelineDetailProps {
  detail: TimelineDetailModel;
  /** Owning item's status — used as default tone for description. */
  status: TimelineStatus;
  theme?: TimelineTheme;
  bordered?: boolean;
}

const cardClasses = {
  light: 'bg-white border-gray-200',
  dark: 'bg-white/[0.03] border-white/10',
};

const nameClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

/**
 * The boxed detail row inside a timeline item:
 *   [avatar]  Actor name + role
 *             Action description (tinted by status)
 */
export const TimelineDetail = ({
  detail,
  status,
  theme = 'light',
  bordered = true,
}: TimelineDetailProps) => {
  const tokens = getStatusTokens(status, theme);
  const descColor = resolveToneTextColor(detail.descriptionTone ?? status, theme);

  const wrapperClasses = bordered
    ? `flex items-start gap-3 p-3 rounded-lg border ${cardClasses[theme]}`
    : 'flex items-start gap-3';

  return (
    <div className={wrapperClasses}>
      {detail.avatar && (
        <div
          aria-hidden={detail.avatar.alt ? undefined : 'true'}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${tokens.avatarBg} ${tokens.avatarFg} overflow-hidden`}
        >
          {detail.avatar.src ? (
            <img
              src={detail.avatar.src}
              alt={detail.avatar.alt ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            (detail.avatar.initials ?? '?').slice(0, 2).toUpperCase()
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${nameClasses[theme]}`}>{detail.name}</div>
        {detail.description && (
          <div className={`text-sm mt-0.5 ${descColor}`}>{detail.description}</div>
        )}
      </div>
    </div>
  );
};
