# Confirm / Alert / Prompt (`@dep/ui/confirm`)

Dialog modal **Promise-based** untuk konfirmasi, notifikasi, dan input. API imperatif `await`-able — `const ok = await confirm({...})`. Mendukung **Zod validation pada prompt**, **focus trap**, **keyboard handling**, **auto-close countdown**, dan **stacking dialog**.

---

## Daftar Isi
1. [Fitur](#fitur)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Setup `ConfirmKit`](#setup-confirmkit)
5. [API Imperatif](#api-imperatif)
6. [Hook `useConfirm`](#hook-useconfirm)
7. [`<ConfirmContainer>`](#confirmcontainer)
8. [Custom Component (override default UI)](#custom-component-override-default-ui)
9. [Type Reference](#type-reference)
10. [Pola & Resep](#pola--resep)

---

## Fitur
1. **Promise-based** — `await confirm(...)`, `await alert(...)`, `await prompt(...)`.
2. **Zod validation** built-in untuk `prompt`.
3. **Focus trap & keyboard** — Esc untuk cancel, Enter untuk submit (configurable).
4. **Backdrop dengan blur** opsional.
5. **Timeout + countdown** — auto-close setelah N ms, opsional countdown display.
6. **Custom component** — bypass UI default sepenuhnya.
7. **Theming** — light / dark / auto.

---

## Struktur Folder

```
src/lib/ui/confirm/
├── index.ts
├── types/index.ts
├── core/
│   ├── ConfirmKit.ts          # Singleton config
│   └── ConfirmStore.ts        # Observer store
├── imperative/
│   ├── confirm.ts             # confirm() → Promise<boolean>
│   ├── alert.ts               # alert()   → Promise<void>
│   └── prompt.ts              # prompt()  → Promise<string | null>
├── hooks/useConfirm.tsx
├── components/
│   ├── ConfirmContainer.tsx   # Render store via portal
│   ├── DialogWrapper.tsx      # Backdrop, animasi, focus trap
│   └── confirm.css
└── dialogs/
    ├── ConfirmDialog.tsx
    ├── AlertDialog.tsx
    └── PromptDialog.tsx
```

---

## Quick Start

```tsx
// 1. Setup (sekali di App.tsx)
import { ConfirmKit, ConfirmContainer } from "@dep/ui/confirm";

ConfirmKit.setup({
  theme: "light",
  animation: { in: "zoom", out: "fade", duration: 250 },
  backdrop: { blur: true },
});

function App() {
  return (
    <>
      <Router />
      <ConfirmContainer />
    </>
  );
}
```

```tsx
// 2. Pakai di mana saja
import { confirm, alert, prompt } from "@dep/ui/confirm";

async function deleteUser(id: number) {
  const ok = await confirm({
    title: "Hapus pengguna?",
    message: "Aksi ini tidak dapat dibatalkan.",
    confirmLabel: "Ya, hapus",
    cancelLabel: "Batal",
  });
  if (!ok) return;
  await api.delete(`/users/${id}`);
  await alert({ title: "Berhasil", message: "Pengguna dihapus." });
}
```

---

## Setup `ConfirmKit`

```typescript
ConfirmKit.setup(config: ConfirmKitConfig): void
ConfirmKit.getConfig(): Required<ConfirmKitConfig>
ConfirmKit.dismiss(id: string): void
ConfirmKit.dismissAll(): void

interface ConfirmKitConfig {
  animation?: {
    in?: "fade" | "slide" | "zoom" | "bounce";
    out?: "fade" | "slide" | "zoom" | "bounce";
    duration?: number;
  };
  backdrop?: {
    enabled?: boolean;     // default: true
    blur?: boolean;        // default: false
    dismissible?: boolean; // default: true (klik backdrop = cancel)
  };
  keyboard?: {
    confirm?: string;      // default: "Enter"
    cancel?: string;       // default: "Escape"
    trapFocus?: boolean;   // default: true
  };
  theme?: "light" | "dark" | "auto";   // default: "light"
  stack?: "layer" | "replace";          // default: "layer"
}
```

---

## API Imperatif

### `confirm(options): Promise<boolean>`

```typescript
interface ConfirmOptions extends BaseDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;     // default: "Confirm"
  cancelLabel?: string;      // default: "Cancel"
}
```

```typescript
const ok = await confirm({
  title: "Hapus folder?",
  message: "Semua file di dalam folder akan terhapus.",
  confirmLabel: "Hapus",
  cancelLabel: "Batal",
});
if (ok) { /* hapus */ }
```

Hasil: `true` (confirm) | `false` (cancel/Escape/click backdrop).

### `alert(options): Promise<void>`

```typescript
interface AlertOptions extends BaseDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;     // default: "OK"
}
```

```typescript
await alert({
  title: "Maintenance",
  message: "Sistem akan offline pukul 23:00 WIB.",
  confirmLabel: "Mengerti",
});
```

### `prompt(options): Promise<string | null>`

```typescript
interface PromptOptions extends BaseDialogOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;     // default: "Submit"
  cancelLabel?: string;      // default: "Cancel"
  validation?: ZodString;    // Zod schema (opsional)
}
```

```typescript
import { z } from "zod";

const name = await prompt({
  title: "Ganti nama",
  message: "Masukkan nama folder baru:",
  placeholder: "Nama folder…",
  defaultValue: "Untitled",
  confirmLabel: "Simpan",
  validation: z.string().min(3, "Minimal 3 karakter").max(40, "Maksimal 40 karakter"),
});

if (name !== null) {
  await api.patch(`/folders/${id}`, { name });
}
```

Hasil: `string` (submit valid) | `null` (cancel / Escape).

### `BaseDialogOptions` (tersedia untuk semua dialog)

```typescript
interface BaseDialogOptions {
  id?: string;                       // ID custom
  animation?: AnimationConfig;       // override per-call
  backdrop?: BackdropConfig;         // override per-call
  timeout?: TimeoutConfig;           // auto-close
  component?: ReactNode;             // override UI total (lihat section di bawah)
  preventClose?: boolean;            // disable backdrop & Esc close
}

interface TimeoutConfig {
  duration: number;                  // ms
  action: "confirm" | "cancel";      // hasil setelah timeout
  showCountdown?: boolean;           // tampilkan hitungan mundur
}
```

#### Contoh timeout

```typescript
const ok = await confirm({
  title: "Sesi akan berakhir",
  message: "Klik lanjutkan untuk tetap login.",
  confirmLabel: "Lanjutkan",
  cancelLabel: "Keluar",
  timeout: { duration: 10_000, action: "cancel", showCountdown: true },
});
```

---

## Hook `useConfirm`

Wrapper sederhana yang juga menyediakan `<ConfirmDialog />` component untuk diletakkan di JSX (alternatif `<ConfirmContainer />` global).

```typescript
const { confirm, alert, prompt, ConfirmDialog } = useConfirm();
```

```tsx
function Page() {
  const { confirm, alert, ConfirmDialog } = useConfirm();

  const handleDelete = async () => {
    if (await confirm({ title: "Yakin hapus?" })) {
      await deleteData();
      await alert({ title: "Berhasil" });
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Hapus</button>
      <ConfirmDialog />   {/* Letakkan sekali di komponen ini */}
    </>
  );
}
```

> Jika Anda sudah memasang `<ConfirmContainer />` di root, hook ini hanya memberi referensi fungsi yang sama — tidak perlu render `<ConfirmDialog />` lagi.

---

## `<ConfirmContainer>`

```tsx
<ConfirmContainer />
```

- Render sekali di root.
- Subscribe ke `confirmStore`, render dialog yang aktif via `createPortal(document.body)`.
- Sudah handle: animation in/out, focus trap, keyboard listener, backdrop, mobile sheet.

---

## Custom Component (override default UI)

Berikan property `component` untuk bypass UI default. Anda kontrol penuh konten + tombol.

```tsx
const result = await confirm({
  title: "ignored when component is set",
  component: (
    <div className="p-6 max-w-md">
      <h2 className="text-xl font-bold">Pilih opsi rencana</h2>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button onClick={() => /* … */}>Free</button>
        <button onClick={() => /* … */}>Pro</button>
      </div>
    </div>
  ),
});
```

> Saat menggunakan `component`, **Anda bertanggung jawab memanggil close manual** — tombol bawaan tidak akan muncul. Cara paling mudah: pakai `ConfirmKit.dismiss(id)` di handler.

---

## Type Reference

```typescript
type AnimationType = "fade" | "slide" | "zoom" | "bounce";
type StackBehavior = "layer" | "replace";
type ThemeType     = "light" | "dark" | "auto";
type DialogType    = "confirm" | "alert" | "prompt";

interface AnimationConfig { in?, out?, duration? }
interface BackdropConfig  { enabled?, blur?, dismissible? }
interface KeyboardConfig  { confirm?, cancel?, trapFocus? }
interface TimeoutConfig   { duration, action, showCountdown? }

interface BaseDialogOptions { id?, animation?, backdrop?, timeout?, component?, preventClose? }
interface ConfirmOptions extends BaseDialogOptions { title, message?, confirmLabel?, cancelLabel? }
interface AlertOptions   extends BaseDialogOptions { title, message?, confirmLabel? }
interface PromptOptions  extends BaseDialogOptions {
  title, message?, placeholder?, defaultValue?,
  confirmLabel?, cancelLabel?, validation?: ZodString
}

interface DialogInstance {
  id: string;
  type: DialogType;
  options: ConfirmOptions | AlertOptions | PromptOptions;
  resolve: (value: unknown) => void;
  isOpen: boolean;
  createdAt: number;
}

interface ConfirmKitConfig { animation?, backdrop?, keyboard?, theme?, stack? }
```

---

## Pola & Resep

### Konfirmasi destructive

```typescript
const ok = await confirm({
  title: "Hapus akun?",
  message: "Semua data Anda akan hilang permanen.",
  confirmLabel: "Ya, hapus akun saya",
  cancelLabel: "Batal",
  backdrop: { dismissible: false },
  preventClose: true,
});
```

### Prompt dengan email validation

```typescript
import { z } from "zod";

const email = await prompt({
  title: "Undang anggota",
  message: "Masukkan email anggota baru:",
  placeholder: "email@example.com",
  confirmLabel: "Kirim undangan",
  validation: z.string().email("Format email tidak valid"),
});
```

### Chain (alert setelah confirm)

```typescript
async function publish() {
  if (!(await confirm({ title: "Publikasikan sekarang?" }))) return;
  await api.post("/publish");
  await alert({ title: "Tersimpan", message: "Konten Anda sudah live." });
}
```

### Auto-cancel jika user tidak respon

```typescript
const ok = await confirm({
  title: "Konfirmasi pembelian",
  message: "Lanjutkan checkout?",
  timeout: { duration: 30_000, action: "cancel", showCountdown: true },
});
```

### Dismiss manual

```typescript
import { ConfirmKit } from "@dep/ui/confirm";

// Tutup dialog terbaru
ConfirmKit.dismissAll();

// Tutup dialog tertentu (kalau Anda pass id)
const p = confirm({ id: "my-modal", title: "..." });
ConfirmKit.dismiss("my-modal");
```

---

## Perbandingan dengan `@dep/ui/modal`

| Aspek | `@dep/ui/modal` | `@dep/ui/confirm` |
|---|---|---|
| API | `string` ID returned | `Promise<T>` (await-able) |
| Use case | Form, panel, drawer kompleks | Konfirmasi singkat, alert, input cepat |
| Custom layout | Penuh (Header/Body/Footer) | Standar (atau custom via `component`) |
| Focus trap | Tidak built-in | Built-in |
| Validation | Manual | Built-in (Zod untuk prompt) |
| Theme | Tidak | Light / Dark / Auto |
| Keyboard | Esc (built-in) | Esc + Enter (configurable) |

**Rule of thumb:** Gunakan `confirm/alert/prompt` untuk yes-no dan input pendek. Gunakan `Modal` untuk form panjang atau panel yang kompleks.

---

*Lihat [src/lib/ISSUES.md](../../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
