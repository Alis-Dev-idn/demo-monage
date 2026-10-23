import { Button } from '@dep/ui/button';
import type { LandingHeroConfig, LandingTheme } from '../types';

interface LandingHeroProps {
  hero: LandingHeroConfig;
  theme?: LandingTheme;
}

const badgeClasses = {
  light: 'bg-blue-100 text-blue-700 border-blue-200',
  dark: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
};

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const descClasses = {
  light: 'text-gray-600',
  dark: 'text-gray-400',
};

const statValueClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const statLabelClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

/**
 * Hero section — large headline + CTAs + optional stats.
 * The decorative glow background is handled by the variant wrapper, not here.
 */
export const LandingHero = ({ hero, theme = 'dark' }: LandingHeroProps) => (
  <section className="relative">
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-20 lg:py-28 text-center">
      {hero.badge && (
        <div
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border mb-6 ${badgeClasses[theme]}`}
        >
          {hero.badge}
        </div>
      )}

      <h1
        className={`text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-6 ${titleClasses[theme]}`}
      >
        {hero.title}
      </h1>

      {hero.description && (
        <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10 ${descClasses[theme]}`}>
          {hero.description}
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={hero.primaryCta.onClick}
          leftIcon={hero.primaryCta.icon}
        >
          {hero.primaryCta.label}
        </Button>
        {hero.secondaryCta && (
          <Button
            variant="outline"
            size="lg"
            onClick={hero.secondaryCta.onClick}
            leftIcon={hero.secondaryCta.icon}
          >
            {hero.secondaryCta.label}
          </Button>
        )}
      </div>

      {hero.stats && hero.stats.length > 0 && (
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {hero.stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`text-2xl sm:text-3xl font-semibold ${statValueClasses[theme]}`}>{s.value}</div>
              <div className={`text-xs sm:text-sm ${statLabelClasses[theme]}`}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);
