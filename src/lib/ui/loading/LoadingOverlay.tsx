import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  /** Tampilkan overlay atau tidak */
  visible: boolean;
  /** Teks di bawah spinner */
  label?: string;
  /** Ukuran spinner */
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Blur konten di belakang */
  blur?: boolean;
  /** Terapkan pada area tertentu (relative container) atau fullscreen */
  fullScreen?: boolean;
  /** Konten yang di-overlay */
  children?: React.ReactNode;
  /** Custom z-index (default: 50) */
  zIndex?: number;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  label = 'Memuat...',
  spinnerSize = 'lg',
  blur = true,
  fullScreen = false,
  children,
  zIndex = 50,
  className = '',
}) => {
  if (fullScreen) {
    return (
      <>
        {visible && (
          <div
            className={`fixed inset-0 flex items-center justify-center ${className}`}
            style={{ zIndex }}
          >
            <div
              className={[
                'absolute inset-0 bg-white/70 dark:bg-gray-900/70',
                blur ? 'backdrop-blur-sm' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            <div className="relative z-10">
              <LoadingSpinner size={spinnerSize} variant="primary" label={label} />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      {visible && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-[inherit]"
          style={{ zIndex }}
        >
          <div
            className={[
              'absolute inset-0 bg-white/70 dark:bg-gray-900/70 rounded-[inherit]',
              blur ? 'backdrop-blur-sm' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
          <div className="relative z-10">
            <LoadingSpinner size={spinnerSize} variant="primary" label={label} />
          </div>
        </div>
      )}
    </div>
  );
};
