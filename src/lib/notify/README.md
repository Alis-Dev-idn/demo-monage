# Notify Kit (`@dep/notify`)

Pustaka *toast notification* yang dirancang untuk bekerja secara **imperatif** dari mana saja — bahkan di luar React tree (interceptor, saga, util murni). Berbasis Observer Pattern (`NotifyStore`) sehingga tidak memicu re-render global.

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Konfigurasi `NotifyKit.setup`](#konfigurasi-notifykitsetup)
5. [API `notify.*`](#api-notify)
6. [`NotifyContainer`](#notifycontainer)
7. [`NotifyStore` (advance)](#notifystore-advance)
8. [Type Reference](#type-reference)
9. [Posisi & Animasi](#posisi--animasi)
10. [Resep Umum](#resep-umum)

---

## Fitur Utama

1. **API imperatif** — Panggil `notify.success()`, `notify.error()`, dll dari file mana pun (non-React sekalipun).
2. **Promise handler** — `notify.promise()` otomatis tampilkan loading → success/error sesuai resolve/reject.
3. **Konfigurasi terpusat** — `NotifyKit.setup()` atur posisi, durasi, animasi default.
4. **Custom render** — `notify.custom()` menerima JSX untuk konten kustom.
5. **Pause-on-hover** — Timer auto-pause saat mouse di atas notifikasi.
6. **Stacking dengan limit** — `maxVisible` jaga jumlah toast tampil bersamaan.

---

## Struktur Folder

```
src/lib/notify/
├── index.ts                       # Public API
├── notify.ts                      # Object `notify` (success/error/promise/dll)
├── types/index.ts                 # Type publik
├── core/
│   ├── NotifyKit.ts               # Singleton config
│   └── NotifyStore.ts             # Observer store
└── components/
    ├── NotifyContainer.tsx        # Container (di-render sekali di root)
    └── notify.css                 # Styling default
```

---

## Quick Start

```tsx
// App.tsx
import { NotifyKit, NotifyContainer } from "@dep/notify";

NotifyKit.setup({
  position: "top-right",
  duration: 4000,
  maxVisible: 3,
});

function App() {
  return (
    <>
      <Router />
      <NotifyContainer />   {/* Cukup satu kali, dekat root */}
    </>
  );
}
```

```typescript
// Di mana saja
import { notify } from "@dep/notify";

notify.success("Data tersimpan!");
notify.error("Server error", { duration: 6000 });
```

---

## Konfigurasi `NotifyKit.setup`

```typescript
NotifyKit.setup(config: NotifyKitConfig): void
NotifyKit.getConfig(): Required<NotifyKitConfig>
NotifyKit.dismiss(id: string): void
NotifyKit.dismissAll(): void
```

### `NotifyKitConfig` lengkap

| Opsi | Tipe | Default | Keterangan |
|---|---|---|---|
| `position` | `NotifyPosition` | `"top-right"` | Posisi global default. |
| `duration` | `number` (ms) | `3000` | Durasi tampil. `0` = persistent. |
| `dismissible` | `boolean` | `true` | Tampilkan tombol close. |
| `pauseOnHover` | `boolean` | `true` | Pause timer saat hover. |
| `maxVisible` | `number` | `3` | Maksimal toast tampil bersamaan. Toast terlama akan dibuang. |
| `stack` | `boolean` | `true` | Stack mode (saat ini selalu stack). |
| `gap` | `number` (px) | `8` | Jarak antar toast. |
| `animation.in` | `AnimationType` | `"fade"` | `"fade" \| "slide" \| "zoom" \| "bounce"` |
| `animation.out` | `AnimationType` | `"fade"` | Animasi exit. |
| `animation.duration` | `number` (ms) | `200` | Durasi animasi. |
| `interceptApiError.enabled` | `boolean` | `false` | Aktifkan auto-notify untuk `ApiError` dari axios. |
| `interceptApiError.messageOverride` | `(err: ApiError) => string` | — | Custom message dari error. |

```typescript
NotifyKit.setup({
  position: "bottom-right",
  duration: 5000,
  maxVisible: 5,
  animation: { in: "slide", out: "fade", duration: 300 },
});
```

---

## API `notify.*`

### `notify.success / error / warning / info`

```typescript
notify.success(message: string | ReactNode, options?: NotifyOptions): string  // returns ID
notify.error(...)
notify.warning(...)
notify.info(...)
```

```typescript
const id = notify.success("Tersimpan!", {
  duration: 5000,
  position: "top-center",
  action: { label: "Undo", onClick: () => undo() },
});
```

### `notify.custom(node, options?)`

Renders JSX sembarang sebagai konten toast.

```tsx
notify.custom(
  <div className="flex gap-3 items-center">
    <Avatar src="/u.png" />
    <div>
      <b>Andi</b> mengirim Anda pesan
    </div>
  </div>,
  { position: "bottom-right", duration: 8000 }
);
```

### `notify.promise(promise, messages, options?)`

Otomatis tampilkan loading toast → success/error tergantung hasil promise. **Akan re-throw error** sehingga `try/catch` Anda tetap berfungsi.

```typescript
async function saveUser(payload) {
  return notify.promise(
    api.post("/users", payload),
    {
      loading: "Menyimpan…",
      success: (result) => `Halo, ${result.name}!`,
      error:   (err)    => `Gagal: ${(err as ApiError).message}`,
    }
  );
}
```

### `notify.dismiss(id)` & `notify.dismissAll()`

```typescript
const id = notify.info("Loading...", { duration: 0 });
// ... selesai
notify.dismiss(id);

// Bersihkan semua
notify.dismissAll();
```

### `NotifyOptions`

```typescript
interface NotifyOptions {
  duration?: number;            // 0 = persistent
  dismissible?: boolean;
  action?: { label: string; onClick: () => void };
  position?: NotifyPosition;    // override global
  animation?: {
    in?: AnimationType;
    out?: AnimationType;
    duration?: number;
  };
}
```

---

## `NotifyContainer`

```tsx
<NotifyContainer position?={NotifyPosition} />
```

- Wajib dirender **sekali** di root aplikasi.
- Pakai `createPortal(... , document.body)` — z-index 10000.
- Prop `position` override default global jika diisi (semua toast tanpa `position` opsi akan ke posisi ini).

---

## `NotifyStore` (advance)

Untuk integrasi custom (mis. menampilkan list notifikasi di komponen lain):

```typescript
import { notifyStore } from "@dep/notify";

const unsub = notifyStore.subscribe((items) => {
  console.log(`${items.length} notifikasi aktif`);
});

// hentikan subscribe
unsub();

// Ambil snapshot
const list = notifyStore.getNotifications();
```

---

## Type Reference

```typescript
type NotifyPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

type NotifyType = "success" | "error" | "warning" | "info" | "custom";
type AnimationType = "fade" | "slide" | "zoom" | "bounce";

interface NotifyAction {
  label: string;
  onClick: () => void;
}

interface NotifyOptions { /* lihat atas */ }

interface NotifyItem {
  id: string;
  type: NotifyType;
  message: string | ReactNode;
  options: Required<NotifyOptions>;
  createdAt: number;
  paused: boolean;
  remaining: number;
}

interface NotifyKitConfig { /* lihat tabel di atas */ }
```

---

## Posisi & Animasi

### Posisi yang didukung
`top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.

Top → stack ke bawah. Bottom → stack ke atas (`flex-direction: column-reverse`).

### Animasi
Type didefinisikan: `fade`, `slide`, `zoom`, `bounce`. CSS yang ada saat ini: `fade` (full), `slide` (partial). `zoom` & `bounce` butuh CSS tambahan — lihat `ISSUES.md`.

### Warna ikon default
- success → `#10b981` (emerald)
- error → `#ef4444` (red)
- warning → `#f59e0b` (amber)
- info → `#3b82f6` (blue)

---

## Resep Umum

### Notifikasi persistent dengan tombol aksi

```typescript
const id = notify.warning("Anda memiliki perubahan yang belum disimpan.", {
  duration: 0,
  action: { label: "Simpan sekarang", onClick: () => saveNow() },
});
```

### Hubungkan ke axios interceptor

```typescript
// Saat membuat AxiosKit, lampirkan listener manual:
const api = AxiosKit.use("main");

api.getInstance().interceptors.response.use(
  (r) => r,
  (err) => {
    if (err instanceof ApiError && err.status >= 500) {
      notify.error(`Server error: ${err.message}`);
    }
    throw err;
  }
);
```

> Catatan: `interceptApiError` di config sudah terdefinisi tetapi belum di-wire di codebase. Lihat `ISSUES.md`.

### Bulk dismiss tipe tertentu

```typescript
notifyStore
  .getNotifications()
  .filter((n) => n.type === "info")
  .forEach((n) => notify.dismiss(n.id));
```

---

*Lihat [src/lib/ISSUES.md](../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
