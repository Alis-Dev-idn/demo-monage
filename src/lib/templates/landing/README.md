# Landing Template

> Komponen template untuk **halaman landing / marketing**: header, hero, preview (dengan dashboard mockup data-driven), features, use cases, CTA penutup, dan footer. Satu komponen `<LandingTemplate>` menyusun semuanya, dengan tampilan yang bisa di-swap lewat prop `variant`.

**Import:** `import { LandingTemplate } from "@dep/templates/landing";`

---

## Daftar Isi

1. [Filosofi Desain](#filosofi-desain)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Section Order](#section-order)
5. [Props API](#props-api)
   - [Common](#common)
   - [`brand` — `LandingBrand`](#brand--landingbrand)
   - [`nav` — `LandingNavConfig`](#nav--landingnavconfig)
   - [`hero` — `LandingHeroConfig`](#hero--landingheroconfig)
   - [`preview` — `LandingPreviewConfig | false`](#preview--landingpreviewconfig--false)
   - [`features` — `LandingFeaturesConfig`](#features--landingfeaturesconfig)
   - [`useCases` — `LandingUseCasesConfig`](#usecases--landingusecasesconfig)
   - [`cta` — `LandingCtaConfig`](#cta--landingctaconfig)
   - [`footer` — `LandingFooterConfig`](#footer--landingfooterconfig)
6. [Variants](#variants)
7. [Membuat Variant Baru](#membuat-variant-baru)
8. [Custom Composition](#custom-composition)
9. [Komponen Primitif](#komponen-primitif)
10. [Backward Compatibility](#backward-compatibility)
11. [FAQ / Resep](#faq--resep)

---

## Filosofi Desain

1. **Data-driven** — Tidak ada hardcoded copy. Semua isi datang dari props.
2. **Section per file** — Tiap section adalah file independen di `sections/`. Maintain & test mudah.
3. **Variant via prop, bukan versioning** — `LandingTemplateV1` → `LandingTemplate` dengan prop `variant`. Tidak ada V2/V3.
4. **Pakai UI library internal** — Tombol pakai `<Button>` dari `@dep/ui/button` agar konsisten dengan sisa app.
5. **Tailwind first** — Hampir semua styling adalah Tailwind utility class. CSS murni hanya untuk efek visual yang sulit di-Tailwind-kan (glow blur, grid overlay).

---

## Struktur Folder

```
src/lib/templates/landing/
├── index.ts                            # public exports
├── LandingTemplate.tsx                 # dispatcher (variant)
├── types.ts                            # semua types (LandingBrand, hero, …)
│
├── components/                         # primitif kecil, theme-aware
│   ├── BrandMark.tsx                   # logo + nama brand
│   ├── SectionHead.tsx                 # eyebrow + title + desc
│   ├── BrowserFrame.tsx                # frame ala browser (untuk preview)
│   └── DemoDashboard.tsx               # data-driven dashboard mockup
│
├── sections/                           # 1 file per section
│   ├── LandingHeader.tsx               # sticky header (brand, nav, sign-in)
│   ├── LandingHero.tsx                 # judul besar + CTA + stats
│   ├── LandingPreview.tsx              # browser frame + DemoDashboard / custom
│   ├── LandingFeatures.tsx             # grid fitur (3 kolom)
│   ├── LandingUseCases.tsx             # grid use case
│   ├── LandingCta.tsx                  # CTA penutup
│   └── LandingFooter.tsx               # brand + copyright + links
│
└── variants/                           # full-page wrappers
    ├── DarkGlowVariant.tsx             # dark + cyan/purple glow
    ├── LightCleanVariant.tsx           # light + soft top gradient
    └── landing-variants.css            # CSS minimal (glow + grid)
```

**Aturan:**
- Sections di `sections/` **tidak boleh tahu** variant apa yang sedang aktif. Mereka hanya menerima `theme: "light" | "dark"` dan styling Tailwind responsif.
- Variants di `variants/` **tidak boleh tahu** section apa yang sedang di-render. Mereka hanya membungkus `children` dengan dekorasi/background.
- Hanya `LandingTemplate.tsx` yang tahu mapping `variant → (Wrapper, theme)`.

---

## Quick Start

```tsx
import { LandingTemplate } from "@dep/templates/landing";
import { useNavigate } from "react-router-dom";
import { Rocket, Zap, Shield, BarChart3, ArrowRight, Play } from "lucide-react";

export default function HomePage() {
  const nav = useNavigate();

  return (
    <LandingTemplate
      variant="dark-glow"     // atau "light-clean"
      brand={{ name: "Monage", onClick: () => nav("/") }}

      nav={{
        items: [
          { label: "Features",  onClick: () => scrollTo("features") },
          { label: "Use cases", onClick: () => scrollTo("use-cases") },
          { label: "Pricing",   onClick: () => nav("/pricing") },
        ],
        signIn:     { label: "Sign in",     onClick: () => nav("/login") },
        getStarted: { label: "Get started", onClick: () => nav("/register") },
      }}

      hero={{
        badge: <><Zap size={12}/> v1.0 just launched</>,
        title: <>Manage your money <span className="text-cyan-400">mindfully</span></>,
        description: "All your accounts in one quiet place. No noise, no ads, just clarity.",
        primaryCta:   { label: "Get started", icon: <ArrowRight size={16}/>, onClick: () => nav("/register") },
        secondaryCta: { label: "Watch demo",  icon: <Play size={16}/>,       onClick: () => openVideo() },
        stats: [
          { value: "10k+",  label: "Active users" },
          { value: "99.9%", label: "Uptime" },
          { value: "4.9★",  label: "Rating" },
          { value: "24/7",  label: "Support" },
        ],
      }}

      preview={{
        url: "app.monage.id/dashboard",
        demo: { /* lihat seksi `preview` di bawah */ },
      }}

      features={{
        eyebrow: "Features",
        title: "Everything you need",
        description: "Tools yang fokus, tidak overwhelming.",
        items: [
          { icon: <Rocket  size={20}/>, iconColor: "cyan",   title: "Fast",    description: "..." },
          { icon: <Shield  size={20}/>, iconColor: "purple", title: "Secure",  description: "..." },
          { icon: <BarChart3 size={20}/>, iconColor: "green", title: "Insightful", description: "..." },
        ],
      }}

      cta={{
        title: "Ready to start?",
        description: "Gratis selamanya untuk akun personal.",
        primary:   { label: "Create account", icon: <ArrowRight size={16}/>, onClick: () => nav("/register") },
        secondary: { label: "Contact sales",  onClick: () => nav("/contact") },
      }}

      footer={{
        copyright: "2026 Monage. All rights reserved.",
        links: [
          { label: "Privacy",  onClick: () => nav("/privacy") },
          { label: "Terms",    onClick: () => nav("/terms") },
          { label: "Contact",  onClick: () => nav("/contact") },
        ],
      }}
    />
  );
}
```

---

## Section Order

`<LandingTemplate>` selalu merender sections dalam urutan ini:

```
┌─────────────────────────────┐
│ Header  (sticky)            │ ← always rendered
├─────────────────────────────┤
│ Hero                        │ ← always rendered
├─────────────────────────────┤
│ Preview  (browser frame)    │ ← optional — only if `preview` ada
├─────────────────────────────┤
│ Features                    │ ← optional
├─────────────────────────────┤
│ Use cases                   │ ← optional
├─────────────────────────────┤
│ CTA (penutup)               │ ← optional
├─────────────────────────────┤
│ Footer                      │ ← always rendered
└─────────────────────────────┘
```

Skip section dengan tidak meneruskan prop-nya (atau `preview={false}`).

---

## Props API

### Common

| Prop | Type | Wajib | Default | Keterangan |
|---|---|---|---|---|
| `variant` | `"dark-glow" \| "light-clean"` | — | `"dark-glow"` | Visual variant |
| `brand` | `LandingBrand` | ✓ | — | Identitas |
| `nav` | `LandingNavConfig` | — | — | Header navigation |
| `hero` | `LandingHeroConfig` | ✓ | — | Section hero |
| `preview` | `LandingPreviewConfig \| false` | — | — | Preview/screenshot section |
| `features` | `LandingFeaturesConfig` | — | — | Grid fitur |
| `useCases` | `LandingUseCasesConfig` | — | — | Grid use case |
| `cta` | `LandingCtaConfig` | — | — | CTA penutup |
| `footer` | `LandingFooterConfig` | — | — | Footer |

---

### `brand` — `LandingBrand`

```ts
interface LandingBrand {
  name: string;             // "Monage"
  logo?: ReactNode;         // override huruf pertama, e.g. <SVGLogo />
  onClick?: () => void;     // klik logo → biasanya ke "/"
}
```

---

### `nav` — `LandingNavConfig`

```ts
interface LandingNavConfig {
  items?: { label: string; onClick: () => void }[];   // nav links tengah (hidden < md)
  signIn?:     { label: string; onClick: () => void }; // ghost button
  getStarted?: { label: string; onClick: () => void }; // primary button
}
```

---

### `hero` — `LandingHeroConfig`

```ts
interface LandingHeroConfig {
  badge?: ReactNode;          // pill kecil di atas judul (e.g. "v1.0 just launched")
  title: ReactNode;           // judul utama — bisa string atau JSX (untuk highlight)
  description?: ReactNode;    // paragraf di bawah judul
  primaryCta:   LandingCta;   // tombol utama (variant="primary", size="lg")
  secondaryCta?: LandingCta;  // tombol outline
  stats?: LandingStat[];      // baris stats di bawah CTA
}

interface LandingCta {
  label: string;
  icon?: ReactNode;     // diletakkan di kiri label (leftIcon)
  onClick: () => void;
}

interface LandingStat {
  value: ReactNode;     // "10k+"
  label: string;        // "Active users"
}
```

---

### `preview` — `LandingPreviewConfig | false`

Section ini merender browser-style frame dengan konten di dalamnya. Ada **dua mode**:

**1) Custom content** — paling fleksibel:

```tsx
preview={{
  url: "app.monage.id",
  content: <MyCustomScreenshot />,    // ReactNode apa pun
}}
```

**2) Data-driven dashboard demo** — built-in mockup dengan sidebar, stats cards, dan SVG chart:

```tsx
preview={{
  url: "app.monage.id/dashboard",
  demo: {
    sidebar: {
      items: [
        { label: "Overview",     icon: <Home size={14}/>, active: true },
        { label: "Transactions", icon: <List size={14}/> },
        { label: "Settings",     icon: <Cog  size={14}/> },
      ],
      sections: [
        { label: "Accounts", items: [
          { label: "Main", dotColor: "#22d3ee" },
          { label: "Savings", dotColor: "#a78bfa" },
        ]},
      ],
    },
    stats: [
      { label: "Balance", value: "Rp 12.5", unit: "jt", valueColor: "#22c55e" },
      { label: "This month", value: "+3.2", unit: "%" },
      { label: "Goals",   value: "4/6" },
      { label: "Streak",  value: "21d" },
    ],
    chart: {
      title: "Cashflow",
      legend: [
        { color: "#22d3ee", label: "Income" },
        { color: "#a78bfa", label: "Expense" },
      ],
    },
  },
}}
```

Jika kedua disediakan, `content` menang. Set `preview={false}` (atau jangan kirim props ini) untuk tidak merender section ini.

---

### `features` — `LandingFeaturesConfig`

```ts
interface LandingFeaturesConfig {
  eyebrow?: string;             // pill kecil di atas title (uppercase)
  title: ReactNode;
  description?: ReactNode;
  items: LandingFeatureItem[];  // 3-kolom grid (lg)
}

interface LandingFeatureItem {
  icon: ReactNode;              // Lucide icon biasanya
  iconColor?: FeatureIconColor; // "cyan" | "purple" | "green" | "orange" | "yellow" | "blue" | "pink"
  title: string;
  description: string;
}
```

`iconColor` mengontrol background + warna icon. Default `"cyan"`.

---

### `useCases` — `LandingUseCasesConfig`

```ts
interface LandingUseCasesConfig {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  items: { icon?: ReactNode; title: string; description: string }[];
}
```

---

### `cta` — `LandingCtaConfig`

```ts
interface LandingCtaConfig {
  title: ReactNode;
  description?: ReactNode;
  primary:   LandingCta;
  secondary?: LandingCta;
}
```

Diletakkan dalam container dengan soft gradient background.

---

### `footer` — `LandingFooterConfig`

```ts
interface LandingFooterConfig {
  copyright?: string;     // "© 2026 Monage. All rights reserved."
  links?: { label: string; onClick: () => void }[];
}
```

Brand + copyright di kiri, links di kanan.

---

## Variants

### `dark-glow` (default)

Dark theme. Background `#07090f`, dengan dua glow blur (cyan + purple) di sudut dan grid overlay halus dekat hero. **Premium / product-launch feel**.

```tsx
<LandingTemplate variant="dark-glow" ... />
```

### `light-clean`

Light theme. Background putih dengan gradient halus biru di atas (640px) yang fade ke putih. **Calm / approachable feel**.

```tsx
<LandingTemplate variant="light-clean" ... />
```

| Variant | Background | Section card | Text |
|---|---|---|---|
| `dark-glow` | `#07090f` + glow | `bg-white/[0.03]` border `border-white/5` | `text-gray-100/400` |
| `light-clean` | `white` + blue gradient top | `bg-white` border `border-gray-200` | `text-gray-900/600` |

---

## Membuat Variant Baru

3 langkah, sama dengan auth template:

**1. Buat file variant**

```tsx
// variants/SunsetGradientVariant.tsx
import type { LandingVariantProps } from "../types";

export const SunsetGradientVariant = ({ children }: LandingVariantProps) => (
  <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white">
    {children}
  </div>
);
```

**2. Daftarkan di `LandingTemplate.tsx`**

```tsx
import { SunsetGradientVariant } from "./variants/SunsetGradientVariant";

const VARIANTS = {
  "dark-glow":   { Wrapper: DarkGlowVariant,        theme: "dark"  },
  "light-clean": { Wrapper: LightCleanVariant,      theme: "light" },
  "sunset":      { Wrapper: SunsetGradientVariant,  theme: "dark"  }, // ← baru
};
```

**3. Tambah key ke `LandingVariant` type**

```ts
// types.ts
export type LandingVariant = "dark-glow" | "light-clean" | "sunset";
```

Selesai. Pakai:

```tsx
<LandingTemplate variant="sunset" ... />
```

**Kontrak variant:**

```ts
interface LandingVariantProps {
  children: ReactNode;   // semua section yang akan dirender
}
```

Variant **tidak menerima** `brand`/`hero`/dll — itu di-handle oleh sections. Variant hanya bertanggung jawab atas:
- Background color/gradient/pattern
- Z-index containment (decorative elements harus di belakang `children`)
- Min-height + text default color

---

## Custom Composition

Bila variant bawaan tidak cocok dan tidak ingin bikin variant baru, susun manual:

```tsx
import {
  DarkGlowVariant,
  LandingHeader,
  LandingHero,
  LandingFeatures,
  LandingFooter,
} from "@dep/templates/landing";

export const MyCustomLanding = () => (
  <DarkGlowVariant>
    <LandingHeader brand={brand} nav={nav} theme="dark" />
    <LandingHero hero={hero} theme="dark" />

    {/* Section custom di antara hero dan features */}
    <section className="py-20">
      <MyTestimonialBlock />
    </section>

    <LandingFeatures features={features} theme="dark" />
    <LandingFooter brand={brand} footer={footer} theme="dark" />
  </DarkGlowVariant>
);
```

Atau tanpa variant sama sekali, render section di dalam layout app:

```tsx
<div className="my-custom-shell">
  <LandingHero hero={...} theme="light" />
</div>
```

---

## Komponen Primitif

Semua diekspos di `index.ts` dan menerima `theme: "light" | "dark"`. Reusable di luar konteks landing:

| Komponen | Fungsi |
|---|---|
| `<BrandMark brand size theme>` | Logo + nama brand. Bisa clickable (kalau `brand.onClick`). |
| `<SectionHead eyebrow title description theme>` | Header section standar dengan eyebrow pill + judul + deskripsi. |
| `<BrowserFrame url theme>` | Browser-window-style frame. Letakkan ReactNode apa pun di dalamnya. |
| `<DemoDashboard demo theme>` | Dashboard mockup data-driven (sidebar + stats + SVG chart). |

Contoh pakai `<BrowserFrame>` di luar landing:

```tsx
import { BrowserFrame } from "@dep/templates/landing";

<BrowserFrame url="example.com/preview" theme="dark">
  <img src="/screenshot.png" alt="Preview" />
</BrowserFrame>
```

---

## Backward Compatibility

`LandingTemplateV1` masih di-export sebagai alias ke `LandingTemplate`:

```ts
// Old code — tetap jalan
import { LandingTemplateV1 } from "@dep/templates/landing";
<LandingTemplateV1 brand={...} hero={...} ... />   // ← default variant="dark-glow"
```

Tipe `LandingTemplateV1Props` juga alias ke `LandingTemplateProps`.

**File lama yang dihapus** (jangan diimport lagi):
- `LandingTemplateV1.tsx` (587 lines) — replaced by `LandingTemplate.tsx` + sections + variants
- `landing.css` (723 lines) — replaced by `variants/landing-variants.css` (~50 lines) + Tailwind di komponen

**Migration:**
1. Replace `LandingTemplateV1` → `LandingTemplate` (drop-in)
2. Tambah `variant="dark-glow"` (atau hilangkan — itu defaultnya)
3. Atau set `variant="light-clean"` jika ingin tampilan light

---

## FAQ / Resep

### 1. Ingin override warna brand (mis. tidak cyan)

Warna brand utama di-handle oleh `<Button>` dari `@dep/ui/button` (default `primary` = blue). Jika ingin cyan/teal di landing:
- Ubah theme Tailwind project — `primary` blue → cyan (mempengaruhi seluruh app)
- Atau fork section spesifik dan pakai `<button>` HTML dengan class custom
- Atau bikin variant baru yang wrap `<Button>` dengan class override via CSS scoping

### 2. Tambah section baru di antara dua bawaan

Pakai custom composition (lihat seksi di atas). `<LandingTemplate>` tidak menyediakan slot insert, by design — agar tetap simple.

### 3. Lebih dari 3-4 features, atau ingin layout 2x2

Layout default Features adalah `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Untuk override:
- Fork `LandingFeatures.tsx`, atau
- Bikin section sendiri pakai `<SectionHead>` + grid custom

### 4. Multi-language / i18n

Semua string copy datang dari props — jadi pass dari i18n library di parent component:

```tsx
const t = useTranslation();
<LandingTemplate
  hero={{ title: t("home.hero.title"), description: t("home.hero.desc"), ... }}
  ...
/>
```

### 5. Animation on scroll

Belum built-in. Tambah library seperti `framer-motion` atau `react-intersection-observer` di custom composition:

```tsx
<motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
  <LandingFeatures features={features} theme="dark" />
</motion.div>
```

### 6. Dark/light auto via OS preference

Belum built-in. Bisa diimplementasi di parent:

```tsx
const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
<LandingTemplate variant={prefersDark ? "dark-glow" : "light-clean"} ... />
```

### 7. SEO / meta tags

`<LandingTemplate>` tidak menangani `<head>`. Pakai `react-helmet-async` atau setup Next.js/Remix di parent.

---

## Ringkasan Architectural Decisions

| Decision | Alasan |
|---|---|
| Dispatcher pattern via prop `variant` | Tambah variant ≠ versioning |
| Sections per file | Mudah maintain, test, reorder; setiap file < 150 baris |
| Sections theme-aware via prop | Sections agnostic terhadap variant; testable independen |
| Variant = wrapper saja, bukan full template | Mengubah background ≠ menulis ulang halaman |
| Pakai `<Button>` dari `@dep/ui` | Konsisten dengan sisa app |
| Tailwind > CSS | Maintainability, theme switching mudah |
| `LandingCta` (section) di-export sebagai `LandingCtaSection` | Hindari konflik dengan type `LandingCta` (button config) |
| `LandingTemplateV1` alias | Migrasi non-breaking |

---

*Dokumen ini bagian dari `src/lib/templates/landing/`. Update setiap kali menambah section atau variant baru.*
