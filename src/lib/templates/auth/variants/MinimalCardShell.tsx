import { ArrowLeft } from 'lucide-react';
import type { AuthShellProps } from '../types';

/**
 * "Minimal Card" variant — light theme, centered card layout. No branding panel.
 * Useful for embedded auth screens, simple internal tools, or as a fallback when
 * the brand panel content is not curated.
 *
 * Forms inside should use `theme="light"` (the default).
 */
export const MinimalCardShell = ({
  brand,
  onBackHome,
  backHomeLabel = 'Back to home',
  children,
}: AuthShellProps) => {
  const logoChar = typeof brand.name === 'string' ? brand.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col">
      {onBackHome && (
        <div className="px-6 pt-6 sm:px-8 sm:pt-8">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={14} />
            {backHomeLabel}
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 text-lg font-bold">
              {brand.logo ?? logoChar}
            </span>
            <span className="text-sm font-semibold text-gray-700">{brand.name}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
