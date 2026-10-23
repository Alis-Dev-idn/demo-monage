import { BrowserFrame } from '../components/BrowserFrame';
import { DemoDashboard } from '../components/DemoDashboard';
import type { LandingPreviewConfig, LandingTheme } from '../types';

interface LandingPreviewProps {
  preview: LandingPreviewConfig | false;
  theme?: LandingTheme;
}

/**
 * Preview section — browser-styled frame around either:
 *   - a fully custom React node (`preview.content`), or
 *   - the data-driven `<DemoDashboard>` (`preview.demo`).
 *
 * Renders nothing when `preview` is `false` or both fields are empty.
 */
export const LandingPreview = ({ preview, theme = 'dark' }: LandingPreviewProps) => {
  if (preview === false || !preview) return null;

  const body = preview.content ?? (preview.demo ? <DemoDashboard demo={preview.demo} theme={theme} /> : null);
  if (!body) return null;

  return (
    <section className="relative -mt-8 lg:-mt-12">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <BrowserFrame url={preview.url} theme={theme}>
          {body}
        </BrowserFrame>
      </div>
    </section>
  );
};
