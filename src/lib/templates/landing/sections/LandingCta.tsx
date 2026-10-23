import { Button } from '@dep/ui/button';
import type { LandingCtaConfig, LandingTheme } from '../types';

interface LandingCtaProps {
  cta: LandingCtaConfig;
  theme?: LandingTheme;
}

const containerClasses = {
  light: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  dark: 'bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent border-cyan-500/20',
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
 * Closing CTA block — typically the last section before the footer.
 * Renders inside a soft gradient box for visual emphasis.
 */
export const LandingCta = ({ cta, theme = 'dark' }: LandingCtaProps) => (
  <section className="py-16 lg:py-20">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div
        className={`relative rounded-2xl border px-6 sm:px-12 py-12 sm:py-16 text-center overflow-hidden ${containerClasses[theme]}`}
      >
        <h2 className={`text-3xl sm:text-4xl font-semibold tracking-tight mb-3 ${titleClasses[theme]}`}>
          {cta.title}
        </h2>
        {cta.description && (
          <p className={`text-base max-w-xl mx-auto mb-8 ${descClasses[theme]}`}>{cta.description}</p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={cta.primary.onClick}
            leftIcon={cta.primary.icon}
          >
            {cta.primary.label}
          </Button>
          {cta.secondary && (
            <Button
              variant="ghost"
              size="lg"
              onClick={cta.secondary.onClick}
              leftIcon={cta.secondary.icon}
            >
              {cta.secondary.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  </section>
);
