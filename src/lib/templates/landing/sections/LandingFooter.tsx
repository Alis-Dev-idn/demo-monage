import { BrandMark } from '../components/BrandMark';
import type { LandingBrand, LandingFooterConfig, LandingTheme } from '../types';

interface LandingFooterProps {
  brand: LandingBrand;
  footer?: LandingFooterConfig;
  theme?: LandingTheme;
}

const footerClasses = {
  light: 'bg-white border-gray-200',
  dark: 'bg-[#07090f] border-white/5',
};

const copyClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-500',
};

const linkClasses = {
  light: 'text-gray-600 hover:text-gray-900',
  dark: 'text-gray-400 hover:text-gray-100',
};

export const LandingFooter = ({ brand, footer, theme = 'dark' }: LandingFooterProps) => (
  <footer className={`border-t ${footerClasses[theme]}`}>
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <BrandMark brand={brand} theme={theme} size="sm" />
          {footer?.copyright && (
            <span className={`text-xs ${copyClasses[theme]}`}>© {footer.copyright}</span>
          )}
        </div>

        {footer?.links && footer.links.length > 0 && (
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footer.links.map((l) =>
              l.href ? (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={l.onClick}
                  className={`text-sm transition-colors ${linkClasses[theme]}`}
                >
                  {l.label}
                </a>
              ) : (
                <button
                  key={l.label}
                  type="button"
                  onClick={l.onClick}
                  className={`text-sm transition-colors ${linkClasses[theme]}`}
                >
                  {l.label}
                </button>
              ),
            )}
          </nav>
        )}
      </div>
    </div>
  </footer>
);
