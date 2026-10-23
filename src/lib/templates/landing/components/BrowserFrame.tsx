import type { ReactNode } from 'react';
import type { LandingTheme } from '../types';

interface BrowserFrameProps {
  url?: string;
  theme?: LandingTheme;
  children: ReactNode;
}

const frameClasses = {
  light: 'bg-white border-gray-200 shadow-2xl shadow-gray-900/10',
  dark: 'bg-[#0a0e1a] border-white/10 shadow-2xl shadow-cyan-500/10',
};

const barClasses = {
  light: 'bg-gray-100 border-gray-200',
  dark: 'bg-white/5 border-white/10',
};

const urlClasses = {
  light: 'text-gray-500 bg-white border-gray-200',
  dark: 'text-gray-400 bg-white/5 border-white/10',
};

const dotColors = ['bg-red-400', 'bg-yellow-400', 'bg-green-400'];

/**
 * Browser-window-style frame around a piece of content. Used by the
 * preview section but reusable elsewhere (testimonial mocks, demos, etc).
 */
export const BrowserFrame = ({ url, theme = 'dark', children }: BrowserFrameProps) => (
  <div className={`rounded-xl border overflow-hidden ${frameClasses[theme]}`}>
    <div className={`flex items-center gap-3 px-4 py-3 border-b ${barClasses[theme]}`}>
      <div className="flex gap-1.5">
        {dotColors.map((c) => (
          <span key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
        ))}
      </div>
      {url && (
        <span
          className={`flex-1 mx-2 text-xs px-3 py-1 rounded border text-center font-mono truncate ${urlClasses[theme]}`}
        >
          {url}
        </span>
      )}
    </div>
    <div className="relative">{children}</div>
  </div>
);
