import React from 'react';

type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';
type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface ProgressBarProps {
  /** Nilai progress 0-100 */
  value: number;
  /** Nilai max (default: 100) */
  max?: number;
  /** Ukuran tinggi bar */
  size?: ProgressBarSize;
  /** Warna variant */
  variant?: ProgressBarVariant;
  /** Tampilkan label persentase */
  showLabel?: boolean;
  /** Custom label (override default percentage) */
  label?: string;
  /** Posisi label */
  labelPosition?: 'inside' | 'right' | 'top';
  /** Animasi striped */
  striped?: boolean;
  /** Animasi striped bergerak */
  animated?: boolean;
  /** Indeterminate mode (loading tanpa value pasti) */
  indeterminate?: boolean;
  className?: string;
}

const sizeClasses: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-5',
};

const variantColors: Record<ProgressBarVariant, string> = {
  default: 'bg-blue-600',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-cyan-500',
};

const variantBgColors: Record<ProgressBarVariant, string> = {
  default: 'bg-blue-100',
  success: 'bg-green-100',
  warning: 'bg-amber-100',
  danger: 'bg-red-100',
  info: 'bg-cyan-100',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  labelPosition = 'right',
  striped = false,
  animated = false,
  indeterminate = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label ?? `${Math.round(percentage)}%`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && labelPosition === 'top' && (
        <div className="w-full">
          <span className="text-xs font-medium text-gray-600 mb-1 block">{displayLabel}</span>
        </div>
      )}
      <div className={`w-full ${showLabel && labelPosition === 'top' ? '' : 'flex items-center gap-2'}`}>
        <div
          className={`w-full rounded-full overflow-hidden ${variantBgColors[variant]} ${sizeClasses[size]}`}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={[
              'h-full rounded-full transition-all duration-500 ease-out',
              variantColors[variant],
              indeterminate ? 'animate-progress-indeterminate' : '',
              striped || animated ? 'bg-striped' : '',
              animated ? 'animate-striped' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              width: indeterminate ? '40%' : `${percentage}%`,
            }}
          />
        </div>
        {showLabel && labelPosition === 'right' && (
          <span className="text-xs font-medium text-gray-600 whitespace-nowrap min-w-[3ch]">
            {displayLabel}
          </span>
        )}
      </div>
      <style>{`
        .bg-striped {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          background-size: 1rem 1rem;
        }
        .animate-striped {
          animation: progress-striped 1s linear infinite;
        }
        @keyframes progress-striped {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s ease-in-out infinite;
        }
        @keyframes progress-indeterminate {
          0% { margin-left: -40%; width: 40%; }
          50% { margin-left: 30%; width: 40%; }
          100% { margin-left: 100%; width: 40%; }
        }
      `}</style>
    </div>
  );
};
