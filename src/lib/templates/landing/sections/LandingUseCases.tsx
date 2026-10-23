import { SectionHead } from '../components/SectionHead';
import type { LandingTheme, LandingUseCasesConfig } from '../types';

interface LandingUseCasesProps {
  useCases: LandingUseCasesConfig;
  theme?: LandingTheme;
}

const cardClasses = {
  light: 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-md',
  dark: 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]',
};

const iconWrapClasses = {
  light: 'bg-blue-100 text-blue-600',
  dark: 'bg-cyan-500/15 text-cyan-300',
};

const titleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const descClasses = {
  light: 'text-gray-600',
  dark: 'text-gray-400',
};

export const LandingUseCases = ({ useCases, theme = 'dark' }: LandingUseCasesProps) => (
  <section className="py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <SectionHead
        eyebrow={useCases.eyebrow}
        title={useCases.title}
        description={useCases.description}
        theme={theme}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {useCases.items.map((u, i) => (
          <article
            key={i}
            className={`p-6 rounded-xl border transition-all duration-200 ${cardClasses[theme]}`}
          >
            {u.icon && (
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${iconWrapClasses[theme]}`}>
                {u.icon}
              </div>
            )}
            <h3 className={`text-base font-semibold mb-2 ${titleClasses[theme]}`}>{u.title}</h3>
            <p className={`text-sm leading-relaxed ${descClasses[theme]}`}>{u.description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
