import type { LandingBrand, LandingTheme } from '../types';

interface BrandMarkProps {
  brand: LandingBrand;
  size?: 'sm' | 'md';
  theme?: LandingTheme;
  className?: string;
}

const logoBg = {
  light: 'bg-blue-100 text-blue-600',
  dark: 'bg-cyan-500/15 text-cyan-300',
};

const nameColor = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

/**
 * Brand logo + name. Renders as a button when `brand.onClick` is provided.
 * Theme-aware so it works on both light and dark variants.
 */
export const BrandMark = ({ brand, size = 'md', theme = 'dark', className = '' }: BrandMarkProps) => {
  const logoSize = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-base';
  const nameSize = size === 'sm' ? 'text-sm' : 'text-base';

  const inner = (
    <>
      <span
        className={`inline-flex items-center justify-center font-bold rounded-lg ${logoSize} ${logoBg[theme]}`}
        aria-hidden="true"
      >
        {brand.logo ?? brand.name.charAt(0).toUpperCase()}
      </span>
      <span className={`font-semibold tracking-wide ${nameSize} ${nameColor[theme]}`}>
        {brand.name}
      </span>
    </>
  );

  const wrapperClasses = `inline-flex items-center gap-2 ${className}`;

  if (brand.onClick) {
    return (
      <button type="button" className={wrapperClasses} onClick={brand.onClick}>
        {inner}
      </button>
    );
  }
  return <span className={wrapperClasses}>{inner}</span>;
};
