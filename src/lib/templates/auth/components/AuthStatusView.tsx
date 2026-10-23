import type { ReactNode } from 'react';
import type { AuthFormTheme } from '../types';

interface AuthStatusViewProps {
  icon: ReactNode;
  iconVariant?: 'success' | 'error' | 'info';
  title: string;
  description?: ReactNode;
  email?: string;
  theme?: AuthFormTheme;
  children?: ReactNode;
}

const iconWrapperClasses = {
  light: {
    success: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  },
  dark: {
    success: 'bg-green-500/15 text-green-300',
    error: 'bg-red-500/15 text-red-300',
    info: 'bg-cyan-500/15 text-cyan-300',
  },
} as const;

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const descClasses = {
  light: 'text-gray-600',
  dark: 'text-gray-400',
};

const emailClasses = {
  light: 'text-gray-900 bg-gray-100',
  dark: 'text-gray-100 bg-white/5',
};

/**
 * Centered status panel used by Forgot/Reset/Verify modes after success or
 * when the token is invalid.
 */
export const AuthStatusView = ({
  icon,
  iconVariant = 'info',
  title,
  description,
  email,
  theme = 'light',
  children,
}: AuthStatusViewProps) => (
  <div className="flex flex-col items-center text-center gap-3">
    <div
      className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${iconWrapperClasses[theme][iconVariant]}`}
      aria-hidden="true"
    >
      {icon}
    </div>
    <h2 className={`text-2xl font-semibold ${titleClasses[theme]}`}>{title}</h2>
    {description && <p className={`text-sm ${descClasses[theme]}`}>{description}</p>}
    {email && (
      <p
        className={`text-sm font-medium px-3 py-1.5 rounded-md ${emailClasses[theme]}`}
      >
        {email}
      </p>
    )}
    {children && <div className="w-full mt-2 flex flex-col gap-2">{children}</div>}
  </div>
);
