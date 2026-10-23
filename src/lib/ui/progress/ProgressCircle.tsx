import React from 'react';

type ProgressCircleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ProgressCircleVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface ProgressCircleProps {
  /** Nilai progress 0-100 */
  value: number;
  /** Nilai max (default: 100) */
  max?: number;
  /** Ukuran diameter lingkaran */
  size?: ProgressCircleSize;
  /** Warna variant */
  variant?: ProgressCircleVariant;
  /** Ketebalan stroke (default: 4) */
  strokeWidth?: number;
  /** Tampilkan label persentase di tengah */
  showLabel?: boolean;
  /** Custom label (override default percentage) */
  label?: string;
  /** Indeterminate mode */
  indeterminate?: boolean;
  /** Konten di tengah lingkaran */
  children?: React.ReactNode;
  className?: string;
}

const sizeDimensions: Record<ProgressCircleSize, number> = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

const labelSizeClasses: Record<ProgressCircleSize, string> = {
  xs: 'text-[8px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
};

const variantStrokeColors: Record<ProgressCircleVariant, string> = {
  default: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

const variantTrackColors: Record<ProgressCircleVariant, string> = {
  default: '#dbeafe',
  success: '#dcfce7',
  warning: '#fef3c7',
  danger: '#fee2e2',
  info: '#cffafe',
};

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  strokeWidth = 4,
  showLabel = true,
  label,
  indeterminate = false,
  children,
  className = '',
}) => {
  const dimension = sizeDimensions[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const displayLabel = label ?? `${Math.round(percentage)}%`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className={indeterminate ? 'animate-spin' : ''}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={variantTrackColors[variant]}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={variantStrokeColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ? (
          children
        ) : showLabel && !indeterminate ? (
          <span className={`font-semibold text-gray-700 ${labelSizeClasses[size]}`}>
            {displayLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
};
