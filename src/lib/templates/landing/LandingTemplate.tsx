import { LandingHeader } from './sections/LandingHeader';
import { LandingHero } from './sections/LandingHero';
import { LandingPreview } from './sections/LandingPreview';
import { LandingFeatures } from './sections/LandingFeatures';
import { LandingUseCases } from './sections/LandingUseCases';
import { LandingPricing } from './sections/LandingPricing';
import { LandingCta } from './sections/LandingCta';
import { LandingFooter } from './sections/LandingFooter';
import { DarkGlowVariant } from './variants/DarkGlowVariant';
import { LightCleanVariant } from './variants/LightCleanVariant';
import type {
  LandingTemplateProps,
  LandingTheme,
  LandingVariant,
  LandingVariantProps,
} from './types';

/**
 * Mapping from variant name to (Wrapper component + theme used by sections).
 *
 * Add a new variant by:
 *   1. Creating `variants/<Name>Variant.tsx` matching `LandingVariantProps`
 *   2. Registering it here with the right section theme
 *   3. Adding the key to `LandingVariant` in `./types.ts`
 */
const VARIANTS: Record<
  LandingVariant,
  { Wrapper: React.FC<LandingVariantProps>; theme: LandingTheme }
> = {
  'dark-glow': { Wrapper: DarkGlowVariant, theme: 'dark' },
  'light-clean': { Wrapper: LightCleanVariant, theme: 'light' },
};

/**
 * Single entry-point for landing pages.
 *
 * The shape is fully data-driven — pass `brand`, `hero`, and any
 * optional sections (`preview`, `features`, `useCases`, `cta`, `footer`)
 * and the component arranges the page in canonical order.
 *
 * Visual style is picked by the `variant` prop:
 *   - `"dark-glow"`  (default) — dark background with cyan/purple glows
 *   - `"light-clean"`          — light background, soft top gradient
 *
 * @example
 * ```tsx
 * <LandingTemplate
 *   brand={{ name: "Monage" }}
 *   nav={{ items: [...], signIn: {...}, getStarted: {...} }}
 *   hero={{ title: "Manage your money mindfully", primaryCta: {...} }}
 *   features={{ title: "Why Monage?", items: [...] }}
 * />
 * ```
 */
export const LandingTemplate = ({
  variant = 'dark-glow',
  brand,
  nav,
  hero,
  preview,
  features,
  useCases,
  pricing,
  cta,
  footer,
}: LandingTemplateProps) => {
  const { Wrapper, theme } = VARIANTS[variant] ?? VARIANTS['dark-glow'];

  return (
    <Wrapper>
      <LandingHeader brand={brand} nav={nav} theme={theme} />
      <LandingHero hero={hero} theme={theme} />
      <LandingPreview preview={preview ?? false} theme={theme} />
      {features && <LandingFeatures features={features} theme={theme} />}
      {useCases && <LandingUseCases useCases={useCases} theme={theme} />}
      {pricing && <LandingPricing pricing={pricing} theme={theme} />}
      {cta && <LandingCta cta={cta} theme={theme} />}
      <LandingFooter brand={brand} footer={footer} theme={theme} />
    </Wrapper>
  );
};
