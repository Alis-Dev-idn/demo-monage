import { SectionHead } from '../components/SectionHead';
import type { FeatureIconColor, LandingFeaturesConfig, LandingTheme } from '../types';

interface LandingFeaturesProps {
  features: LandingFeaturesConfig;
  theme?: LandingTheme;
}

const cardClasses = {
  light: 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md',
  dark: 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10',
};

const featureTitleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const featureDescClasses = {
  light: 'text-gray-600',
  dark: 'text-gray-400',
};

/* Per-color icon background (consistent across themes). */
const iconColorMap: Record<FeatureIconColor, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-400',
  purple: 'bg-purple-500/15 text-purple-400',
  green: 'bg-green-500/15 text-green-400',
  orange: 'bg-orange-500/15 text-orange-400',
  yellow: 'bg-yellow-500/15 text-yellow-400',
  blue: 'bg-blue-500/15 text-blue-500',
  pink: 'bg-pink-500/15 text-pink-400',
};

export const LandingFeatures = ({ features, theme = 'dark' }: LandingFeaturesProps) => (
  <section className="py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <SectionHead
        eyebrow={features.eyebrow}
        title={features.title}
        description={features.description}
        theme={theme}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.items.map((f, i) => (
          <article
            key={i}
            className={`p-6 rounded-xl border transition-all duration-200 ${cardClasses[theme]}`}
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                iconColorMap[f.iconColor ?? 'cyan']
              }`}
            >
              {f.icon}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${featureTitleClasses[theme]}`}>{f.title}</h3>
            <p className={`text-sm leading-relaxed ${featureDescClasses[theme]}`}>{f.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
