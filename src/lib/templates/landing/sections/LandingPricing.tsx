import { Check } from 'lucide-react';
import { SectionHead } from '../components/SectionHead';
import type { LandingPricingConfig, LandingTheme } from '../types';

interface LandingPricingProps {
  pricing: LandingPricingConfig;
  theme?: LandingTheme;
}

const cardClasses = {
  light: 'bg-white border-gray-200',
  dark: 'bg-white/[0.03] border-white/5',
};

const featuredCardClasses = {
  light: 'bg-white border-emerald-400 ring-2 ring-emerald-100 shadow-md',
  dark: 'bg-white/[0.06] border-emerald-400/50 ring-2 ring-emerald-400/10',
};

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const taglineClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

const priceClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const suffixClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

const bulletClasses = {
  light: 'text-gray-700',
  dark: 'text-gray-300',
};

const checkClasses = {
  light: 'text-emerald-500',
  dark: 'text-emerald-400',
};

const ctaBaseClasses =
  'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition';

const ctaFeaturedClasses = 'bg-emerald-500 text-white hover:bg-emerald-600';
const ctaPrimaryClasses = {
  light: 'bg-gray-900 text-white hover:bg-gray-800',
  dark: 'bg-white text-gray-900 hover:bg-gray-100',
};

export const LandingPricing = ({ pricing, theme = 'dark' }: LandingPricingProps) => (
  <section id="harga" className="py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <SectionHead
        eyebrow={pricing.eyebrow}
        title={pricing.title}
        description={pricing.description}
        theme={theme}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {pricing.items.map((p, i) => {
          const cardCls = p.featured ? featuredCardClasses[theme] : cardClasses[theme];
          return (
            <article
              key={i}
              className={`relative flex flex-col rounded-2xl border p-6 ${cardCls}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Paling Populer
                </span>
              )}
              <header>
                <h3 className={`text-base font-semibold ${titleClasses[theme]}`}>
                  {p.name}
                </h3>
                {p.tagline && (
                  <p className={`mt-1 text-xs leading-snug ${taglineClasses[theme]}`}>
                    {p.tagline}
                  </p>
                )}
              </header>

              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${priceClasses[theme]}`}>
                  {p.price}
                </span>
                {p.priceSuffix && (
                  <span className={`text-xs ${suffixClasses[theme]}`}>
                    {p.priceSuffix}
                  </span>
                )}
              </div>

              <ul className="mt-5 space-y-2">
                {p.highlights.map((h, j) => (
                  <li key={j} className={`flex items-start gap-2 text-sm ${bulletClasses[theme]}`}>
                    <Check size={14} className={`mt-0.5 flex-shrink-0 ${checkClasses[theme]}`} />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              {p.cta && (
                <button
                  type="button"
                  onClick={p.cta.onClick}
                  className={`${ctaBaseClasses} ${
                    p.featured ? ctaFeaturedClasses : ctaPrimaryClasses[theme]
                  } mt-auto`}
                >
                  {p.cta.label}
                  {p.cta.icon}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  </section>
);
