import type { ReactNode } from 'react';
import type { LandingTheme } from '../types';

interface SectionHeadProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  theme?: LandingTheme;
  align?: 'left' | 'center';
}

const eyebrowClasses = {
  light: 'text-blue-600 bg-blue-100',
  dark: 'text-cyan-300 bg-cyan-500/15',
};

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const descClasses = {
  light: 'text-gray-600',
  dark: 'text-gray-400',
};

/**
 * Standardized section header used by Features, UseCases, and any other
 * landing section that needs an eyebrow + title + description block.
 */
export const SectionHead = ({
  eyebrow,
  title,
  description,
  theme = 'dark',
  align = 'center',
}: SectionHeadProps) => (
  <div
    className={`flex flex-col gap-3 mb-12 max-w-2xl ${
      align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left'
    }`}
  >
    {eyebrow && (
      <span
        className={`inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full ${eyebrowClasses[theme]}`}
      >
        {eyebrow}
      </span>
    )}
    <h2 className={`text-3xl sm:text-4xl font-semibold leading-tight ${titleClasses[theme]}`}>
      {title}
    </h2>
    {description && (
      <p className={`text-base leading-relaxed ${descClasses[theme]}`}>{description}</p>
    )}
  </div>
);
