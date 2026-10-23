/**
 * Shared responsive breakpoints used across the lib. Prefer importing
 * these constants over hardcoding pixel values in components / CSS-in-JS.
 *
 * CSS files can stay aligned via the corresponding `--breakpoint-*` custom
 * properties exposed by `_shared/breakpoints.css`.
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Builds a max-width media query string for use with `window.matchMedia`.
 *
 * @example
 *   const mql = window.matchMedia(maxWidth("mobile"));
 */
export function maxWidth(name: BreakpointName): string {
  return `(max-width: ${BREAKPOINTS[name]}px)`;
}
