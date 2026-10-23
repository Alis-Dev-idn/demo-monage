# Auth Template

> Komponen template untuk halaman autentikasi: **login, register, forgot password, reset password, verify email**. Satu komponen `<AuthTemplate>` menangani semua mode, dengan visual yang bisa di-swap lewat prop `variant`.

**Import:** `import { AuthTemplate } from "@dep/templates/auth";`

---

## Daftar Isi

1. [Filosofi Desain](#filosofi-desain)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Props API](#props-api)
   - [Common props](#common-props)
   - [Mode: `login`](#mode-login)
   - [Mode: `register`](#mode-register)
   - [Mode: `forgot`](#mode-forgot)
   - [Mode: `reset`](#mode-reset)
   - [Mode: `verify`](#mode-verify)
5. [Variants](#variants)
   - [`dark-split` (default)](#dark-split-default)
   - [`minimal-card`](#minimal-card)
6. [Membuat Variant Baru](#membuat-variant-baru)
7. [Custom Composition](#custom-composition)
8. [Komponen Primitif](#komponen-primitif)
9. [Validasi (Zod)](#validasi-zod)
10. [Integrasi dengan Router & API](#integrasi-dengan-router--api)
11. [Theming Inputs (Light vs Dark)](#theming-inputs-light-vs-dark)
12. [Backward Compatibility](#backward-compatibility)
13. [FAQ / Resep](#faq--resep)

---

## Filosofi Desain

1. **Satu pintu masuk** — `<AuthTemplate>` adalah satu-satunya komponen yang biasanya perlu diimport. Pilih mode lewat `mode`, pilih tampilan lewat `variant`.
2. **Pisah "apa" dari "bagaimana"** — Logika form (validasi, state, submit) ada di `forms/*Form.tsx`. Tampilan keseluruhan halaman ada di `variants/*Shell.tsx`. Keduanya independen.
3. **Tambah variant = tambah file, bukan bump versi** — Tidak ada `AuthTemplateV2`. Variant baru cukup 1 file di `variants/`.
4. **Pakai UI library internal** — Tombol pakai `@dep/ui/button`, input pakai `@dep/ui/form/Input`, dst. Tidak ada duplikasi style.
5. **Tailwind first** — CSS murni hanya untuk efek visual yang sulit di-Tailwind-kan (glow blur, grid overlay).

---

## Struktur Folder

```
src/lib/templates/auth/
├── index.ts                        # public exports
├── AuthTemplate.tsx                # dispatcher (mode × variant)
├── types.ts                        # AuthBrand, mode props, AuthShellProps, dll
├── schemas.ts                      # Zod schemas (loginSchema, registerSchema, …)
│
├── components/                     # primitif lintas-form (theme-aware)
│   ├── PasswordField.tsx           # Input password + tombol eye toggle
│   ├── AuthFormBanner.tsx          # banner error/success inline
│   ├── AuthFormHeader.tsx          # title + subtitle pair
│   ├── AuthFormFooter.tsx          # footer + AuthLink
│   └── AuthStatusView.tsx          # status panel (success / error / info icons)
│
├── forms/                          # satu file per mode
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── ResetPasswordForm.tsx
│   └── VerifyEmailView.tsx
│
└── variants/                       # visual shells (pluggable)
    ├── DarkSplitShell.tsx          # dark + split panel branding/form
    ├── MinimalCardShell.tsx        # light + centered card
    └── auth-variants.css           # CSS minimal (hanya glow & grid)
```

**Aturan tambahan:**
- File di `forms/` tidak boleh tahu variant apa yang merender mereka. Mereka hanya menerima `theme: "light" | "dark"`.
- File di `variants/` tidak boleh tahu mode apa yang sedang aktif. Mereka hanya merender `children`.
- `AuthTemplate.tsx` adalah satu-satunya tempat yang tahu kombinasi mode × variant.

---

## Quick Start

```tsx
import { AuthTemplate } from "@dep/templates/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();

  return (
    <AuthTemplate
      // Visual variant — opsional, default "dark-split"
      variant="dark-split"
      // Mode — wajib
      mode="login"
      // Branding — wajib
      brand={{
        name: "Monage",
        headline: "Manage your money mindfully",
        description: "All your accounts in one quiet place.",
        features: ["Auto-categorize", "Beautiful charts", "Privacy-first"],
      }}
      // Callbacks per-mode
      onSubmit={async ({ email, password, remember }) => {
        await api.login({ email, password, remember });
        nav("/dashboard");
      }}
      onForgotPassword={() => nav("/forgot-password")}
      onRegister={() => nav("/register")}
      // State opsional
      isLoading={false}
      errorMessage=""
    />
  );
}
```

---

## Props API

### Common props

Semua mode menerima props ini:

| Prop | Type | Wajib | Keterangan |
|---|---|---|---|
| `mode` | `"login" \| "register" \| "forgot" \| "reset" \| "verify"` | ✓ | Mode form |
| `brand` | `AuthBrand` | ✓ | Identitas aplikasi |
| `variant` | `"dark-split" \| "minimal-card"` | — | Default `"dark-split"` |
| `onBackHome` | `() => void` | — | Jika diisi, tampil tombol "Back to home" di atas form |
| `backHomeLabel` | `string` | — | Default `"Back to home"` |
| `isLoading` | `boolean` | — | Disable submit & show spinner |
| `errorMessage` | `string` | — | Tampilkan banner error merah di atas form |

#### `AuthBrand`

```ts
interface AuthBrand {
  name: string;                  // wajib — "Monage"
  logo?: ReactNode;              // opsional — Komponen logo (mis. <Logo />)
  headline: ReactNode;           // wajib — judul utama di panel branding
  description?: string;          // opsional — paragraf di bawah headline
  features?: string[];           // opsional — daftar fitur (✓ bulleted)
}
```

---

### Mode: `login`

```tsx
<AuthTemplate
  mode="login"
  brand={brand}
  onSubmit={async (data) => { /* { email, password, remember } */ }}
  onForgotPassword={() => nav("/forgot")}
  onRegister={() => nav("/register")}
/>
```

| Prop | Type | Wajib |
|---|---|---|
| `onSubmit` | `(data: { email, password, remember }) => Promise<void> \| void` | ✓ |
| `onForgotPassword` | `() => void` | ✓ |
| `onRegister` | `() => void` | ✓ |
| `title` | `string` | — (default `"Welcome back"`) |
| `subtitle` | `string` | — (default `"Sign in to your <brand.name> account"`) |
| `submitLabel` | `string` | — (default `"Sign In"`) |

**Validasi:**
- `email` — format email valid
- `password` — minimal 6 karakter

---

### Mode: `register`

```tsx
<AuthTemplate
  mode="register"
  brand={brand}
  onSubmit={async (data) => { /* { fullName, email, password } */ }}
  onLogin={() => nav("/login")}
/>
```

| Prop | Type | Wajib |
|---|---|---|
| `onSubmit` | `(data: { fullName, email, password }) => Promise<void> \| void` | ✓ |
| `onLogin` | `() => void` | ✓ |
| `title` | `string` | — (default `"Create account"`) |
| `subtitle` | `string` | — |
| `submitLabel` | `string` | — (default `"Create account"`) |

**Validasi:**
- `fullName` — min 3 karakter
- `email` — format email valid
- `password` — min 8 karakter
- `confirmPassword` — harus cocok dengan `password`
- `agree` — checkbox wajib dicentang

---

### Mode: `forgot`

```tsx
<AuthTemplate
  mode="forgot"
  brand={brand}
  onSubmit={async (data) => { /* { email } */ }}
  onBackToLogin={() => nav("/login")}
  isSuccess={emailSent}     // ← toggle ke status view setelah email terkirim
/>
```

| Prop | Type | Wajib |
|---|---|---|
| `onSubmit` | `(data: { email }) => Promise<void> \| void` | ✓ |
| `onBackToLogin` | `() => void` | ✓ |
| `isSuccess` | `boolean` | — Tampilkan layar "Email sent" |
| `title` / `subtitle` / `submitLabel` | `string` | — |

---

### Mode: `reset`

```tsx
<AuthTemplate
  mode="reset"
  brand={brand}
  onSubmit={async (data) => { /* { password } */ }}
  onBackToLogin={() => nav("/login")}
  isTokenValid={tokenValid} // ← false → tampil "Invalid link"
  isSuccess={resetDone}     // ← true → tampil "Password updated"
/>
```

| Prop | Type | Wajib |
|---|---|---|
| `onSubmit` | `(data: { password }) => Promise<void> \| void` | ✓ |
| `onBackToLogin` | `() => void` | ✓ |
| `isTokenValid` | `boolean` | — `false` → tampil "Invalid link" |
| `isSuccess` | `boolean` | — `true` → tampil "Password updated" |
| `title` / `subtitle` / `submitLabel` | `string` | — |

**Validasi:**
- `password` — min 8 karakter
- `confirmPassword` — harus cocok

**Diagram alur:**

```
       ┌─────────────────────┐
       │ isTokenValid===false│ ──→ Tampil "Invalid link" + tombol "Back to sign in"
       └─────────────────────┘
                │ token valid
                ▼
       ┌─────────────────────┐
       │ user submit         │
       └─────────────────────┘
                │
                ▼
       ┌─────────────────────┐
       │ isSuccess===true    │ ──→ Tampil "Password updated" + tombol "Sign in now"
       └─────────────────────┘
```

---

### Mode: `verify`

```tsx
<AuthTemplate
  mode="verify"
  brand={brand}
  email="user@example.com"
  onResend={async () => { await api.resendVerification(); }}
  onBackToLogin={() => nav("/login")}
  isVerifying={isPending}
  isVerified={done}
  isTokenInvalid={tokenBad}
  isResending={resending}
  resendSuccess={resendOk}
/>
```

| Prop | Type | Wajib |
|---|---|---|
| `onResend` | `() => Promise<void> \| void` | ✓ |
| `onBackToLogin` | `() => void` | ✓ |
| `email` | `string` | — Email yang dikirimi link verifikasi |
| `isVerifying` | `boolean` | — Spinner besar (sedang verifikasi) |
| `isVerified` | `boolean` | — Layar "Email verified" + tombol login |
| `isTokenInvalid` | `boolean` | — Layar "Invalid link" + tombol resend |
| `isResending` | `boolean` | — Disable + spinner pada tombol resend |
| `resendSuccess` | `boolean` | — Banner "Verification email sent again" |

**Prioritas state (yang pertama true menang):**
1. `isVerifying`
2. `isVerified`
3. `isTokenInvalid`
4. _default_ — layar "Check your email"

---

## Variants

### `dark-split` (default)

Dark theme, dua panel: branding di kiri (lg+), form di kanan. Memiliki efek glow cyan & purple di sudut + grid overlay halus.

**Cocok untuk:**
- Landing produk konsumen
- Aplikasi B2B yang ingin tampil premium
- Brand yang punya tagline marketing kuat (gunakan `description` + `features`)

**Responsive:**
- `< 1024px` (mobile/tablet): panel branding hilang, form full-width dengan logo kecil di atas
- `≥ 1024px`: split layout penuh

```tsx
<AuthTemplate variant="dark-split" mode="login" brand={...} ... />
```

---

### `minimal-card`

Light theme, kartu terpusat tanpa panel branding. Logo & nama produk muncul kecil di atas kartu.

**Cocok untuk:**
- Internal tools / admin panel
- Embedded auth di iframe / modal
- Project yang belum punya copy marketing matang

```tsx
<AuthTemplate variant="minimal-card" mode="login" brand={...} ... />
```

Properti `brand.description`, `brand.features` **diabaikan** di variant ini (tidak ada panel untuk menampilkan).

---

## Membuat Variant Baru

3 langkah:

**1. Buat file shell**

```tsx
// src/lib/templates/auth/variants/GradientFullScreenShell.tsx
import type { AuthShellProps } from "../types";

export const GradientFullScreenShell = ({ brand, children }: AuthShellProps) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center p-6">
    <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
      <h1 className="text-xl font-bold mb-6 text-gray-900">{brand.name}</h1>
      {children}
    </div>
  </div>
);
```

**2. Daftarkan di `AuthTemplate.tsx`**

```tsx
// AuthTemplate.tsx
import { GradientFullScreenShell } from "./variants/GradientFullScreenShell";

const VARIANTS = {
  "dark-split": { Shell: DarkSplitShell, theme: "dark" },
  "minimal-card": { Shell: MinimalCardShell, theme: "light" },
  "gradient": { Shell: GradientFullScreenShell, theme: "light" }, // ← baru
};
```

**3. Tambah ke `AuthVariant` type**

```ts
// types.ts
export type AuthVariant = "dark-split" | "minimal-card" | "gradient";
```

Selesai. Tidak perlu `AuthTemplateV2`, tidak perlu menyentuh forms. Pakai langsung:

```tsx
<AuthTemplate variant="gradient" mode="login" brand={...} ... />
```

**Kontrak Shell:**

```ts
interface AuthShellProps {
  brand: AuthBrand;
  onBackHome?: () => void;
  backHomeLabel?: string;
  children: ReactNode;        // ← form yang sudah dipilih oleh dispatcher
}
```

**Penting:** Jika theme shell baru gelap, set entry `theme: "dark"`. Theme ini diteruskan ke setiap form yang akan meneruskan lagi ke `<Input theme>` & `<AuthFormBanner theme>` agar warna match.

---

## Custom Composition

Jika 2 variant bawaan tidak cocok dan tidak ingin bikin variant baru, susun manual dari Shell + Form:

```tsx
import { MinimalCardShell, LoginForm } from "@dep/templates/auth";

export const MyCustomLogin = () => (
  <MinimalCardShell brand={{ name: "Acme", headline: "—" }}>
    <LoginForm
      theme="light"
      mode="login"
      brand={{ name: "Acme", headline: "—" }}
      onSubmit={...}
      onForgotPassword={...}
      onRegister={...}
    />
  </MinimalCardShell>
);
```

Atau bahkan tanpa Shell sama sekali — render form langsung di dalam layout app:

```tsx
<div className="my-custom-app-shell">
  <LoginForm theme="light" {...loginProps} />
</div>
```

---

## Komponen Primitif

Semua primitif di `components/` menerima prop `theme: "light" | "dark"` dan **dipakai oleh forms apa pun variant-nya**. Bisa dipakai juga di luar konteks auth:

| Komponen | Kegunaan |
|---|---|
| `<PasswordField>` | Input password + tombol eye toggle. Wrapper di atas `<Input>` + `<FormField>`. |
| `<AuthFormBanner variant="error\|success\|info">` | Banner inline berwarna sesuai variant. |
| `<AuthFormHeader title subtitle>` | Pair judul + sub-judul standar. |
| `<AuthFormFooter>` + `<AuthLink>` | Teks kecil di bawah form + tombol link inline. |
| `<AuthStatusView icon title description email>` | Layar status (success / error / info) — dipakai oleh Forgot / Reset / Verify. |

Contoh:

```tsx
import {
  PasswordField,
  AuthFormBanner,
  AuthFormHeader,
  AuthStatusView,
} from "@dep/templates/auth";
import { CheckCircle } from "lucide-react";

<AuthFormHeader theme="dark" title="Welcome" subtitle="Sign in to continue" />

<AuthFormBanner variant="error" theme="dark">
  Email atau password salah
</AuthFormBanner>

<PasswordField
  id="pwd"
  label="Password"
  theme="dark"
  errorMessage={errors.password?.message}
  register={register("password")}
/>

<AuthStatusView
  theme="light"
  iconVariant="success"
  icon={<CheckCircle size={32} />}
  title="Done!"
  description="You can now sign in."
/>
```

---

## Validasi (Zod)

Schema sudah disiapkan di `schemas.ts`:

```ts
import {
  loginSchema,
  registerSchema,
  forgotSchema,
  resetSchema,
} from "@dep/templates/auth/schemas";
```

Schema dipakai otomatis oleh form bawaan via `react-hook-form` + `@hookform/resolvers/zod`. Anda **tidak perlu** memvalidasi lagi di `onSubmit` — data yang masuk ke callback sudah lolos validasi client-side.

Untuk validasi server-side, kirim error message lewat prop `errorMessage`:

```tsx
const [error, setError] = useState("");

<AuthTemplate
  mode="login"
  errorMessage={error}
  onSubmit={async (data) => {
    try {
      await api.login(data);
    } catch (e) {
      setError(e.message);
    }
  }}
  ...
/>
```

**Override schema:** jika butuh validasi custom (mis. password policy berbeda), gunakan composition: import `loginSchema` lalu `.extend()` atau bikin form custom dengan `LoginForm` + schema sendiri.

---

## Integrasi dengan Router & API

Pola yang direkomendasikan — satu komponen page per mode, semuanya delegate ke `<AuthTemplate>`:

```tsx
// src/pages/auth/LoginPage.tsx
import { AuthTemplate } from "@dep/templates/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AxiosKit } from "@dep/axios";

export default function LoginPage() {
  const nav = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <AuthTemplate
      mode="login"
      brand={{ name: "Monage", headline: "Manage your money mindfully" }}
      isLoading={isLoading}
      errorMessage={error}
      onSubmit={async ({ email, password }) => {
        setLoading(true);
        setError("");
        try {
          const { token } = await AxiosKit.use("main").post("/auth/login", { email, password });
          localStorage.setItem("access_token", token);
          nav("/dashboard");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Login failed");
        } finally {
          setLoading(false);
        }
      }}
      onForgotPassword={() => nav("/auth/forgot-password")}
      onRegister={() => nav("/auth/register")}
    />
  );
}
```

Sama pattern untuk RegisterPage, ForgotPage, ResetPage, VerifyPage.

---

## Theming Inputs (Light vs Dark)

Komponen `<Input>` di `@dep/ui/form/Input` sekarang menerima prop `theme`:

```tsx
<Input theme="light" />  {/* white bg, gray border (default) */}
<Input theme="dark"  />  {/* white/5 bg, white/10 border, gray text */}
```

Di dalam form auth, theme di-cascade otomatis dari variant. Tetapi Anda bisa juga pakai `<Input theme="dark">` di luar konteks auth bila perlu (mis. settings page dengan dark sidebar).

Color tokens dark theme:
- bg: `bg-white/5` → `bg-white/[0.07]` saat focus
- border: `border-white/10` → `border-cyan-500/60` saat focus
- text: `text-gray-100`
- placeholder: `text-gray-500`
- ring: `ring-cyan-500/20`

---

## Backward Compatibility

`AuthTemplateV1` masih di-export sebagai alias ke `AuthTemplate`:

```ts
// Old code — tetap jalan
import { AuthTemplateV1 } from "@dep/templates/auth";
<AuthTemplateV1 mode="login" brand={...} ... />   // ← default ke variant="dark-split"
```

**Migration path** (opsional):
1. Replace `AuthTemplateV1` → `AuthTemplate` (drop-in).
2. Hapus prop `variant` jika ingin tetap di `dark-split` (itu defaultnya).
3. Atau set `variant="minimal-card"` jika ingin pakai variant baru.

Tipe `AuthTemplateV1Props` juga masih ada sebagai alias ke `AuthTemplateProps`.

**File lama yang dihapus** (jangan diimport lagi — sudah tidak ada):
- `AuthTemplateV1.tsx` — sudah di-replace `AuthTemplate.tsx`
- `LoginPage.tsx`, `RegisterPage.tsx`, dst — flat single-component versions, tidak dipakai
- `auth.css` — sudah di-replace `variants/auth-variants.css`

---

## FAQ / Resep

### 1. Ingin tombol submit warna lain

Forms pakai `<Button variant="primary">` dari `@dep/ui/button`. Untuk override warna:
- Ganti theme Tailwind project (rekomendasi)
- Atau bikin variant custom dengan `<Button variant="...">` lain via composition

### 2. Ingin ganti copy default ("Sign In", "Forgot password?", dll)

Sebagian sudah di-prop-kan (`submitLabel`, `title`, `subtitle`). Untuk copy lain seperti "Remember me", "Don't have an account?":
- Fork form spesifik yang ingin diubah, atau
- Bungkus `<AuthTemplate>` dan ganti via i18n wrapper

Roadmap: prop `labels?: Partial<...>` untuk override semua string. Belum diimplementasi karena belum ada use case.

### 3. Tidak mau pakai react-hook-form

Forms bawaan hardcoded pakai `react-hook-form` + `zod`. Jika ingin pakai form library lain, gunakan custom composition — pakai `<DarkSplitShell>` / `<MinimalCardShell>` saja, lalu bikin form sendiri sebagai children.

### 4. Login multi-factor (OTP, 2FA)

Belum tersedia sebagai mode. Pattern yang direkomendasikan:
- Login normal → dapat token tahap 1
- Route ke halaman OTP custom (bukan `<AuthTemplate>`)
- Pakai `<MinimalCardShell>` + form custom

Roadmap: mode `mfa` jika banyak project butuh.

### 5. Social login (Google/GitHub)

Belum di-built-in. Pattern saat ini: render tombol social di luar `<AuthTemplate>` di parent component, atau gunakan custom composition dengan shell + form custom yang sudah include social buttons.

### 6. Bagaimana cara test dengan Vitest?

Karena forms pakai `react-hook-form` + custom UI, butuh `@testing-library/react`. Contoh:

```ts
import { render, screen } from "@testing-library/react";
import { AuthTemplate } from "@dep/templates/auth";

it("renders login form", () => {
  render(
    <AuthTemplate
      mode="login"
      brand={{ name: "X", headline: "—" }}
      onSubmit={vi.fn()}
      onForgotPassword={vi.fn()}
      onRegister={vi.fn()}
    />
  );
  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
});
```

---

## Ringkasan Architectural Decisions

| Decision | Alasan |
|---|---|
| Dispatcher pattern (1 komponen, banyak mode) | Mengurangi import surface — user hanya tahu `<AuthTemplate>` |
| Variant via prop, bukan versioning | Tidak ada `V2` membusuk — variant baru hanya 1 file |
| Forms theme-aware via prop, bukan context | Eksplisit & testable, tidak ada hidden dependency |
| Shell-vs-form split | Variant baru tidak perlu menyentuh logika form, dan sebaliknya |
| Tailwind > CSS | Konsisten dengan sisa codebase, lebih mudah diubah |
| `AuthTemplateV1` alias | Migrasi non-breaking — call site lama tetap jalan |

---

*Dokumen ini bagian dari `src/lib/templates/auth/`. Update setiap kali menambah mode atau variant baru.*
