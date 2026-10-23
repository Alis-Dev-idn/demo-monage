import { useEffect, useState } from 'react';
import { Button } from '@dep/ui/button';
import { BrandMark } from '../components/BrandMark';
import type { LandingBrand, LandingNavConfig, LandingTheme } from '../types';

interface LandingHeaderProps {
  brand: LandingBrand;
  nav?: LandingNavConfig;
  theme?: LandingTheme;
}

const headerBaseClasses = {
  light: 'bg-white/80 backdrop-blur border-gray-200',
  dark: 'bg-[#07090f]/70 backdrop-blur border-white/5',
};

const headerScrolledClasses = {
  light: 'bg-white/95 border-gray-200 shadow-sm',
  dark: 'bg-[#07090f]/90 border-white/10',
};

const navLinkClasses = {
  light: 'text-gray-600 hover:text-gray-900',
  dark: 'text-gray-400 hover:text-gray-100',
};

/**
 * Sticky landing header with brand, optional nav, sign-in, and get-started.
 * Becomes more opaque on scroll for readability.
 */
export const LandingHeader = ({ brand, nav, theme = 'dark' }: LandingHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
        scrolled ? headerScrolledClasses[theme] : headerBaseClasses[theme]
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <BrandMark brand={brand} theme={theme} />

          {nav?.items && nav.items.length > 0 && (
            <nav className="hidden md:flex items-center gap-8">
              {nav.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`text-sm font-medium transition-colors ${navLinkClasses[theme]}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {nav?.signIn && (
              <Button variant="ghost" size="sm" onClick={nav.signIn.onClick}>
                {nav.signIn.label}
              </Button>
            )}
            {nav?.getStarted && (
              <Button variant="primary" size="sm" onClick={nav.getStarted.onClick}>
                {nav.getStarted.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
