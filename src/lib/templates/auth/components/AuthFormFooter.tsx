import type { ReactNode } from 'react';
import type { AuthFormTheme } from '../types';

interface AuthFormFooterProps {
  theme?: AuthFormTheme;
  children: ReactNode;
}

const footerClasses = {
  light: 'text-gray-600',
  dark: 'text-gray-400',
};

/** Small bottom-of-form helper text (e.g. "Don't have an account? Sign up"). */
export const AuthFormFooter = ({ theme = 'light', children }: AuthFormFooterProps) => (
  <p className={`text-sm text-center ${footerClasses[theme]}`}>{children}</p>
);

interface AuthLinkProps {
  theme?: AuthFormTheme;
  onClick?: () => void;
  type?: 'button' | 'submit';
  children: ReactNode;
}

const linkClasses = {
  light: 'text-blue-600 hover:text-blue-700',
  dark: 'text-cyan-400 hover:text-cyan-300',
};

/** Inline link button used inside footer / row content. */
export const AuthLink = ({ theme = 'light', onClick, type = 'button', children }: AuthLinkProps) => (
  <button
    type={type}
    onClick={onClick}
    className={`font-medium underline-offset-2 hover:underline transition-colors ${linkClasses[theme]}`}
  >
    {children}
  </button>
);
