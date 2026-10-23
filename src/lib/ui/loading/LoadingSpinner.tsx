import React from 'react';
import { Loader2 } from 'lucide-react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'default' | 'primary' | 'white' | 'success' | 'danger';

interface LoadingSpinnerProps {
  /** Ukuran spinner */
  size?: SpinnerSize;
  /** Warna variant */
  variant?: SpinnerVariant;
  /** Teks di bawah spinner */
  label?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantClasses: Record<SpinnerVariant, string> = {
  default: 'text-gray-400',
  primary: 'text-blue-600',
  white: 'text-white',
  success: 'text-green-500',
  danger: 'text-red-500',
};

const labelSizeClasses: Record<SpinnerSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label,
  className = '',
}) => {
  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]}`} />
      {label && (
        <span className={`${labelSizeClasses[size]} ${variant === 'white' ? 'text-white/80' : 'text-gray-500'}`}>
          {label}
        </span>
      )}
    </div>
  );
};
