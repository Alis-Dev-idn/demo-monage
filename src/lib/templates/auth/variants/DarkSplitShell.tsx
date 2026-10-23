import { ArrowLeft, Check } from 'lucide-react';
import type { AuthShellProps } from '../types';
import './auth-variants.css';

/**
 * "Dark Split" variant — branding/marketing panel on the left, form on the right.
 * Dark theme with subtle glow + grid background.
 *
 * Forms rendered inside expect a `theme="dark"` on form primitives so
 * inputs & banners blend in with the dark surface.
 */
export const DarkSplitShell = ({
  brand,
  onBackHome,
  backHomeLabel = 'Back to home',
  children,
}: AuthShellProps) => {
  const logoChar = typeof brand.name === 'string' ? brand.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#07090f] text-gray-100 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Decorative background effects (pure CSS — non-trivial in Tailwind) */}
      <div className="auth-grid-overlay" aria-hidden="true" />
      <div className="auth-glow auth-glow--cyan" aria-hidden="true" />
      <div className="auth-glow auth-glow--purple" aria-hidden="true" />

      {/* ── Left: branding panel ────────────────────────────── */}
      <aside className="hidden lg:flex relative z-10 flex-col justify-center px-16 py-12 border-r border-white/5">
        <div className="flex items-center gap-3 mb-12">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/15 text-cyan-300 font-bold text-lg">
            {brand.logo ?? logoChar}
          </span>
          <span className="text-base font-semibold tracking-wide">{brand.name}</span>
        </div>

        <h1 className="text-4xl font-semibold leading-tight max-w-md">{brand.headline}</h1>

        {brand.description && (
          <p className="mt-4 text-sm text-gray-400 max-w-md leading-relaxed">{brand.description}</p>
        )}

        {brand.features && brand.features.length > 0 && (
          <ul className="mt-8 flex flex-col gap-3 max-w-md">
            {brand.features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Right: form panel ───────────────────────────────── */}
      <section className="relative z-10 flex flex-col">
        {onBackHome && (
          <div className="px-8 pt-6 lg:px-10 lg:pt-8">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={14} />
              {backHomeLabel}
            </button>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-md">
            {/* Mobile brand banner — only visible on small screens */}
            <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500/15 text-cyan-300 font-bold">
                {brand.logo ?? logoChar}
              </span>
              <span className="text-sm font-semibold">{brand.name}</span>
            </div>

            {children}
          </div>
        </div>
      </section>
    </div>
  );
};
