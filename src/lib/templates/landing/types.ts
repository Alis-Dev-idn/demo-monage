import type { ReactNode } from 'react';

/**
 * Visual variant the LandingTemplate renders with.
 *
 * Add new variants by:
 *   1. Creating `variants/<Name>Variant.tsx` that wraps `children` with the
 *      desired background / decorative effects
 *   2. Registering it inside `LandingTemplate.tsx`
 *   3. Adding the key to `LandingVariant` below
 */
export type LandingVariant = 'dark-glow' | 'light-clean';

/** Theme tag passed down to each section so primitives know their context. */
export type LandingTheme = 'light' | 'dark';

export type FeatureIconColor =
  | 'cyan'
  | 'purple'
  | 'green'
  | 'orange'
  | 'yellow'
  | 'blue'
  | 'pink';

export interface LandingBrand {
  name: string;
  logo?: ReactNode;
  onClick?: () => void;
}

export interface LandingNavItem {
  label: string;
  onClick: () => void;
}

export interface LandingCta {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

export interface LandingStat {
  value: ReactNode;
  label: string;
}

export interface LandingFeatureItem {
  icon: ReactNode;
  iconColor?: FeatureIconColor;
  title: string;
  description: string;
}

export interface LandingUseCaseItem {
  icon?: ReactNode;
  title: string;
  description: string;
}

export interface LandingPreviewDemoSidebarItem {
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface LandingPreviewDemoSidebarSection {
  label?: string;
  items: { label: string; dotColor?: string }[];
}

export interface LandingPreviewDemoStat {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Override the value color (CSS color string). */
  valueColor?: string;
}

export interface LandingPreviewDemoChart {
  title: string;
  legend?: { color: string; label: string }[];
}

export interface LandingPreviewDemo {
  sidebar?: {
    items: LandingPreviewDemoSidebarItem[];
    sections?: LandingPreviewDemoSidebarSection[];
  };
  stats?: LandingPreviewDemoStat[];
  chart?: LandingPreviewDemoChart;
}

export interface LandingNavConfig {
  items?: LandingNavItem[];
  signIn?: { label: string; onClick: () => void };
  getStarted?: { label: string; onClick: () => void };
}

export interface LandingHeroConfig {
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primaryCta: LandingCta;
  secondaryCta?: LandingCta;
  stats?: LandingStat[];
}

export interface LandingPreviewConfig {
  /** URL label rendered in the browser-style top bar. */
  url?: string;
  /** Fully custom preview body. Takes precedence over `demo`. */
  content?: ReactNode;
  /** Data-driven dashboard mockup. Used when `content` is not provided. */
  demo?: LandingPreviewDemo;
}

export interface LandingFeaturesConfig {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  items: LandingFeatureItem[];
}

export interface LandingUseCasesConfig {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  items: LandingUseCaseItem[];
}

export interface LandingCtaConfig {
  title: ReactNode;
  description?: ReactNode;
  primary: LandingCta;
  secondary?: LandingCta;
}

export interface LandingFooterConfig {
  copyright?: string;
  /**
   * Footer link. Beri `href` untuk merender anchor `<a href>` asli (wajib
   * untuk link legal seperti Kebijakan Privasi agar terdeteksi crawler
   * verifikasi OAuth Google). Pakai `onClick` untuk navigasi JS internal.
   */
  links?: { label: string; onClick?: () => void; href?: string }[];
}

export interface LandingPricingItem {
  /** Nama paket (mis. "Gratis", "Personal"). */
  name: string;
  /** Tagline pendek di bawah nama. */
  tagline?: string;
  /**
   * Harga formatted (mis. "Rp 29.000", "Gratis", "Hubungi kami"). String
   * supaya UI lib tidak ikut tahu logika mata uang.
   */
  price: ReactNode;
  /** Sub-text di samping/bawah harga (mis. "/bulan"). */
  priceSuffix?: string;
  /** Daftar bullet benefit. */
  highlights: string[];
  /** Tonjolkan kartu (border + badge "Paling Populer"). */
  featured?: boolean;
  /** Tombol CTA. Bila tidak diberikan, kartu non-clickable. */
  cta?: LandingCta;
}

export interface LandingPricingConfig {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  items: LandingPricingItem[];
}

export interface LandingTemplateProps {
  /** Visual variant. Defaults to "dark-glow". */
  variant?: LandingVariant;
  brand: LandingBrand;
  nav?: LandingNavConfig;
  hero: LandingHeroConfig;
  /** Pass `false` to hide the preview section entirely. */
  preview?: LandingPreviewConfig | false;
  features?: LandingFeaturesConfig;
  useCases?: LandingUseCasesConfig;
  pricing?: LandingPricingConfig;
  cta?: LandingCtaConfig;
  footer?: LandingFooterConfig;
}

/** Variants wrap the page content. */
export interface LandingVariantProps {
  children: ReactNode;
}
