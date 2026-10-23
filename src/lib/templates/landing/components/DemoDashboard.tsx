import React from 'react';
import type { LandingPreviewDemo, LandingTheme } from '../types';

interface DemoDashboardProps {
  demo: LandingPreviewDemo;
  theme?: LandingTheme;
}

const sideClasses = {
  light: 'bg-gray-50 border-gray-200',
  dark: 'bg-white/[0.02] border-white/5',
};

const sideItemClasses = {
  light: 'text-gray-600 hover:bg-gray-100',
  dark: 'text-gray-400 hover:bg-white/5',
};

const sideItemActiveClasses = {
  light: 'bg-blue-100 text-blue-700',
  dark: 'bg-cyan-500/15 text-cyan-300',
};

const sideLabelClasses = {
  light: 'text-gray-400',
  dark: 'text-gray-500',
};

const statCardClasses = {
  light: 'bg-white border-gray-200',
  dark: 'bg-white/[0.03] border-white/5',
};

const statLabelClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

const statValueClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const chartTitleClasses = {
  light: 'text-gray-900',
  dark: 'text-gray-100',
};

const legendClasses = {
  light: 'text-gray-500',
  dark: 'text-gray-400',
};

/**
 * Data-driven dashboard mockup rendered inside the preview frame.
 * Reads all content from `demo` props — no hardcoded text.
 */
export const DemoDashboard = ({ demo, theme = 'dark' }: DemoDashboardProps) => {
  const accentColors = demo.chart?.legend?.map((l) => l.color) ?? [];
  const primaryStroke = accentColors[0] ?? (theme === 'dark' ? '#22d3ee' : '#2563eb');
  const secondaryStroke = accentColors[1];
  const gradId = React.useId();

  return (
    <div className="flex min-h-[280px]">
      {/* Sidebar */}
      {demo.sidebar && (
        <aside className={`w-44 shrink-0 border-r p-3 flex flex-col gap-1 text-xs ${sideClasses[theme]}`}>
          {demo.sidebar.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors ${
                item.active ? sideItemActiveClasses[theme] : sideItemClasses[theme]
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </div>
          ))}

          {demo.sidebar.sections?.map((section, si) => (
            <React.Fragment key={si}>
              {section.label && (
                <div
                  className={`mt-3 mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider ${sideLabelClasses[theme]}`}
                >
                  {section.label}
                </div>
              )}
              {section.items.map((it, i) => (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${sideItemClasses[theme]}`}>
                  {it.dotColor && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: it.dotColor }}
                    />
                  )}
                  <span className="truncate">{it.label}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 p-5 flex flex-col gap-4">
        {demo.stats && demo.stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {demo.stats.map((s, i) => (
              <div key={i} className={`p-3 rounded-lg border ${statCardClasses[theme]}`}>
                <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${statLabelClasses[theme]}`}>
                  {s.label}
                </div>
                <div
                  className={`text-xl font-semibold ${statValueClasses[theme]}`}
                  style={s.valueColor ? { color: s.valueColor } : undefined}
                >
                  {s.value}
                  {s.unit && (
                    <span className={`text-xs ml-1 font-normal ${statLabelClasses[theme]}`}>{s.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {demo.chart && (
          <div className={`flex-1 p-4 rounded-lg border ${statCardClasses[theme]}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${chartTitleClasses[theme]}`}>{demo.chart.title}</span>
              {demo.chart.legend && demo.chart.legend.length > 0 && (
                <span className={`flex items-center gap-3 text-xs ${legendClasses[theme]}`}>
                  {demo.chart.legend.map((l, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <i
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ background: l.color }}
                      />
                      {l.label}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <svg
              className="w-full h-32"
              viewBox="0 0 600 160"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryStroke} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={primaryStroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,90 C60,80 100,60 160,68 C220,76 260,100 320,92 C380,84 420,52 480,58 C540,64 580,72 600,68 L600,160 L0,160 Z"
                fill={`url(#${gradId})`}
              />
              <path
                d="M0,90 C60,80 100,60 160,68 C220,76 260,100 320,92 C380,84 420,52 480,58 C540,64 580,72 600,68"
                fill="none"
                stroke={primaryStroke}
                strokeWidth="2"
              />
              {secondaryStroke && (
                <path
                  d="M0,120 C60,118 100,110 160,114 C220,118 260,128 320,122 C380,116 420,108 480,112 C540,116 580,118 600,116"
                  fill="none"
                  stroke={secondaryStroke}
                  strokeWidth="2"
                />
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
