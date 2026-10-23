/**
 * Public surface for the landing template.
 *
 * Recommended usage:
 * ```ts
 * import { LandingTemplate } from "@dep/templates/landing";
 * <LandingTemplate variant="dark-glow" brand={...} hero={...} features={...} />
 * ```
 *
 * Add a new visual variant by creating a wrapper under `variants/` and
 * registering it inside `LandingTemplate.tsx` — no version bump needed.
 */

export { LandingTemplate } from './LandingTemplate';

// Types
export type {
  LandingTemplateProps,
  LandingVariant,
  LandingTheme,
  LandingBrand,
  LandingNavItem,
  LandingNavConfig,
  LandingCta,
  LandingStat,
  LandingHeroConfig,
  LandingFeatureItem,
  LandingFeaturesConfig,
  LandingUseCaseItem,
  LandingUseCasesConfig,
  LandingPricingItem,
  LandingPricingConfig,
  LandingPreviewConfig,
  LandingPreviewDemo,
  LandingPreviewDemoSidebarItem,
  LandingPreviewDemoSidebarSection,
  LandingPreviewDemoStat,
  LandingPreviewDemoChart,
  LandingCtaConfig,
  LandingFooterConfig,
  LandingVariantProps,
  FeatureIconColor,
} from './types';

// Variants — exported so consumers can build a custom dispatcher.
export { DarkGlowVariant } from './variants/DarkGlowVariant';
export { LightCleanVariant } from './variants/LightCleanVariant';

// Individual sections — exported so consumers can compose a page manually.
export { LandingHeader } from './sections/LandingHeader';
export { LandingHero } from './sections/LandingHero';
export { LandingPreview } from './sections/LandingPreview';
export { LandingFeatures } from './sections/LandingFeatures';
export { LandingUseCases } from './sections/LandingUseCases';
export { LandingPricing } from './sections/LandingPricing';
// Renamed on export to avoid collision with the `LandingCta` *type*
// (the small button config). The section is the CTA *section*.
export { LandingCta as LandingCtaSection } from './sections/LandingCta';
export { LandingFooter } from './sections/LandingFooter';

// Smaller primitives — reusable inside / outside landing context.
export { BrandMark } from './components/BrandMark';
export { SectionHead } from './components/SectionHead';
export { BrowserFrame } from './components/BrowserFrame';
export { DemoDashboard } from './components/DemoDashboard';

// Backward-compatibility alias — `LandingTemplateV1` was the original name.
// It now resolves to `LandingTemplate` with the default variant ("dark-glow").
export { LandingTemplate as LandingTemplateV1 } from './LandingTemplate';
export type { LandingTemplateProps as LandingTemplateV1Props } from './types';
