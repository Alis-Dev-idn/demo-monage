import type { AuthFormTheme } from '../types';

interface AuthFormHeaderProps {
  title: string;
  subtitle?: string;
  theme?: AuthFormTheme;
}

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const subtitleClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

/** Title + subtitle pair rendered above auth forms. */
export const AuthFormHeader = ({ title, subtitle, theme = 'light' }: AuthFormHeaderProps) => (
  <div className="flex flex-col gap-1.5">
    <h2 className={`text-2xl font-semibold ${titleClasses[theme]}`}>{title}</h2>
    {subtitle && <p className={`text-sm ${subtitleClasses[theme]}`}>{subtitle}</p>}
  </div>
);
