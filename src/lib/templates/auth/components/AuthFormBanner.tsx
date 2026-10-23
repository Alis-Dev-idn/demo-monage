import type { ReactNode } from 'react';
import type { AuthFormTheme } from '../types';

interface AuthFormBannerProps {
  variant: 'error' | 'success' | 'info';
  theme?: AuthFormTheme;
  children: ReactNode;
}

const styles = {
  light: {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  dark: {
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
    info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
  },
} as const;

/** Inline banner used for server-side errors / success states inside forms. */
export const AuthFormBanner = ({ variant, theme = 'light', children }: AuthFormBannerProps) => (
  <div
    role={variant === 'error' ? 'alert' : 'status'}
    className={`text-sm px-3 py-2.5 rounded-md border ${styles[theme][variant]}`}
  >
    {children}
  </div>
);
