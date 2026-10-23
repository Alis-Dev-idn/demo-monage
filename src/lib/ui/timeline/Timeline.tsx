import { Children, cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { TimelineItem, type TimelineItemProps } from './TimelineItem';
import type {
  TimelineEntry,
  TimelineProps,
  TimelineTheme,
  TimelineVariant,
} from './types';

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const subtitleClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

const dividerClasses = {
  light: 'border-gray-200',
  dark: 'border-white/10',
};

const containerVariantClasses = {
  default: '',
  compact: '',
  bordered: 'rounded-xl border p-4 sm:p-6',
};

const borderedShellThemeClasses = {
  light: 'bg-white border-gray-200',
  dark: 'bg-white/[0.02] border-white/10',
};

function buildItemFromEntry(
  entry: TimelineEntry,
  index: number,
  total: number,
  theme: TimelineTheme,
  variant: TimelineVariant
) {
  return (
    <TimelineItem
      key={entry.id}
      status={entry.status}
      title={entry.title}
      timestamp={entry.timestamp}
      icon={entry.icon}
      isCurrent={entry.isCurrent}
      currentLabel={entry.currentLabel}
      detail={entry.detail}
      note={entry.note}
      theme={theme}
      variant={variant}
      isLast={index === total - 1}
    >
      {entry.children}
    </TimelineItem>
  );
}

function cloneChildrenWithMeta(
  children: ReactNode,
  theme: TimelineTheme,
  variant: TimelineVariant
): ReactNode {
  const valid = Children.toArray(children).filter(isValidElement) as ReactElement<TimelineItemProps>[];
  return valid.map((child, idx) =>
    cloneElement(child, {
      theme: child.props.theme ?? theme,
      variant: child.props.variant ?? variant,
      isLast: child.props.isLast ?? idx === valid.length - 1,
    })
  );
}

/**
 * Vertical activity / audit-log timeline.
 *
 * Two ways to render entries:
 *
 *   1. **Declarative (data-driven)** — pass `items`:
 *      ```tsx
 *      <Timeline
 *        title="Log Mutasi"
 *        subtitle="Riwayat perubahan data mutasi ini"
 *        items={[
 *          { id: "1", status: "warning", title: "Menunggu Persetujuan SRM", timestamp: "20 Mei 2026 12:38:26", isCurrent: true },
 *          { id: "2", status: "info", title: "Draft", timestamp: "20 Mei 2026 12:38:02", detail: { avatar: { initials: "MM" }, name: "Meimei MSB Fashar", description: "Draft" } },
 *          { id: "3", status: "danger", title: "Ditolak SRM Hartrans", timestamp: "20 Mei 2026 12:37:01", detail: { avatar: { initials: "SS" }, name: "Susanti SRM Hartrans", description: "Ditolak SRM Hartrans" }, note: { label: "Alasan ditolak: disesuaikan kembali" } },
 *        ]}
 *      />
 *      ```
 *
 *   2. **Compositional** — render `<TimelineItem>` children yourself:
 *      ```tsx
 *      <Timeline title="Log Mutasi">
 *        <TimelineItem status="warning" title="Menunggu" isCurrent>
 *          <MyCustomBody />
 *        </TimelineItem>
 *      </Timeline>
 *      ```
 */
export const Timeline = ({
  title,
  subtitle,
  variant = 'default',
  theme = 'light',
  items,
  children,
  className = '',
}: TimelineProps) => {
  const useChildren = children != null;
  const list = useChildren
    ? cloneChildrenWithMeta(children, theme, variant)
    : (items ?? []).map((entry, idx, arr) =>
        buildItemFromEntry(entry, idx, arr.length, theme, variant)
      );

  const shellClasses =
    variant === 'bordered'
      ? `${containerVariantClasses.bordered} ${borderedShellThemeClasses[theme]}`
      : containerVariantClasses[variant];

  return (
    <section className={`${shellClasses} ${className}`.trim()}>
      {(title || subtitle) && (
        <header className={`flex flex-col gap-1 pb-4 mb-4 border-b ${dividerClasses[theme]}`}>
          {title && (
            <h2 className={`text-xl font-semibold ${titleClasses[theme]}`}>{title}</h2>
          )}
          {subtitle && <p className={`text-sm ${subtitleClasses[theme]}`}>{subtitle}</p>}
        </header>
      )}

      <ol className="list-none m-0 p-0">{list}</ol>
    </section>
  );
};
