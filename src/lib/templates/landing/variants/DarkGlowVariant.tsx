import type { LandingVariantProps } from '../types';
import './landing-variants.css';

/**
 * "Dark Glow" variant — dark background with cyan + purple glows and a
 * subtle grid overlay near the hero. Premium / product launch feel.
 *
 * Sections inside should be rendered with `theme="dark"` so their inner
 * styles (text colors, card backgrounds) match.
 */
export const DarkGlowVariant = ({ children }: LandingVariantProps) => (
  <div className="min-h-screen bg-[#07090f] text-gray-100 relative overflow-hidden">
    {/* Decorative effects — non-trivial in pure Tailwind */}
    <div className="landing-grid-overlay" aria-hidden="true" />
    <div className="landing-glow landing-glow--cyan" aria-hidden="true" />
    <div className="landing-glow landing-glow--purple" aria-hidden="true" />

    <div className="relative z-10">{children}</div>
  </div>
);
