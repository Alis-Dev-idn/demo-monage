import type { LandingVariantProps } from '../types';

/**
 * "Light Clean" variant — light theme with soft blue gradient at the top.
 * Cocok untuk landing yang ingin terkesan tenang, ramah, dan terbaca tanpa
 * efek dramatis. Pasangkan dengan sections `theme="light"`.
 */
export const LightCleanVariant = ({ children }: LandingVariantProps) => (
  <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
    {/* Soft gradient background — only at the top */}
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[640px] bg-gradient-to-b from-blue-50 via-white to-white pointer-events-none"
    />
    <div className="relative">{children}</div>
  </div>
);
