# Modal (`@dep/ui/modal`)

Sistem modal dengan **dual API** — deklaratif (`<Modal />` compound component) atau imperatif (`modal.open()`). Mendukung **stacking multiple modals**, lazy size presets, custom animasi, dan portal ke `<body>`.

---

## Daftar Isi
1. [Fitur](#fitur)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Setup `ModalKit`](#setup-modalkit)
5. [API Deklaratif `<Modal>`](#api-deklaratif-modal)
6. [API Imperatif `modal.*`](#api-imperatif-modal)
7. [Hook `useModal`](#hook-usemodal)
8. [`<ModalStack>` Renderer](#modalstack-renderer)
9. [Sub-component (`Modal.Header / Body / Footer`)](#sub-component-modalheader--body--footer)
10. [Type Reference](#type-reference)
11. [Pola & Tips](#pola--tips)

---

## Fitur
1. **Dual API** — pakai `<Modal />` di JSX, atau `modal.open()` imperatif dari mana saja.
2. **Stacking** — Modal kedua/ketiga otomatis di-stack dengan z-index increment (1010, 1020, 1030, …).
3. **Size presets** — `xs | sm | md | lg | xl | full` atau custom `{ width, height }`.
4. **Position** — `center | top | bottom | left | right` (right/left untuk drawer-style).
5. **Animasi** — fade / slide / zoom / bounce; in & out independen.
6. **Close behaviour** — backdrop, Escape key, atau `preventClose`.
7. **Portal** — render ke `document.body`, aman dari `overflow: hidden` parent.

---

## Struktur Folder

```
src/lib/ui/modal/
├── index.ts
├── types/index.ts
├── core/
│   ├── ModalKit.ts          # Singleton config
│   ├── ModalStack.ts        # Stack & z-index manager
│   └── ModalStore.ts        # Observer store
├── components/
│   ├── Modal.tsx            # <Modal> komponen utama
│   ├── ModalSubComponents.tsx
│   ├── ModalStack.tsx       # <ModalStack> renderer untuk imperatif
│   └── modal.css
├── imperative/modal.ts      # modal.open / close / closeAll
└── hooks/useModal.ts        # State lokal { isOpen, open, close, toggle }
```

---

## Quick Start

```tsx
import { ModalKit, ModalStack, modal, Modal, useModal } from "@dep/ui/modal";

// 1. Setup global (sekali)
ModalKit.setup({
  animation: { in: "zoom", out: "fade", duration: 250 },
  backdrop: { enabled: true, baseOpacity: 0.5, opacityIncrement: 0.1 },
});

// 2. Render ModalStack di root (untuk imperatif API)
function App() {
  return (
    <>
      <Router />
      <ModalStack />
    </>
  );
}
```

```tsx
// 3a. Deklaratif
function MyView() {
  const m = useModal();
  return (
    <>
      <button onClick={m.open}>Buka</button>
      <Modal isOpen={m.isOpen} onClose={m.close} size="md">
        <Modal.Header>Judul</Modal.Header>
        <Modal.Body>Isi modal di sini.</Modal.Body>
        <Modal.Footer>
          <button onClick={m.close}>Batal</button>
          <button onClick={m.close}>OK</button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

// 3b. Imperatif (dari mana saja)
function deleteUser(id) {
  modal.open({
    size: "sm",
    content: (
      <div className="p-6">
        <h3>Hapus pengguna?</h3>
        <button onClick={() => api.delete(`/users/${id}`)}>Ya</button>
      </div>
    ),
  });
}
```

---

## Setup `ModalKit`

```typescript
ModalKit.setup(config: ModalKitConfig): void
ModalKit.getConfig(): Required<ModalKitConfig>

interface ModalKitConfig {
  animation?: {
    in?: "fade" | "slide" | "zoom" | "bounce";
    out?: "fade" | "slide" | "zoom" | "bounce";
    duration?: number;            // ms
  };
  closeButtonStyle?: "macos" | "windows" | "button";
  backdrop?: {
    enabled?: boolean;            // default: true
    baseOpacity?: number;         // default: 0.5
    opacityIncrement?: number;    // tambahan opacity per stack level (default: 0.1)
  };
}
```

Default:
```typescript
{
  animation: { in: "fade", out: "fade", duration: 200 },
  closeButtonStyle: "windows",
  backdrop: { enabled: true, baseOpacity: 0.5, opacityIncrement: 0.1 },
}
```

---

## API Deklaratif `<Modal>`

### Props

| Prop | Tipe | Default | Keterangan |
|---|---|---|---|
| `isOpen` | `boolean` | **wajib** | Controlled visibility. |
| `onClose` | `() => void` | **wajib** | Handler tutup. |
| `onOpen` | `() => void` | — | Callback saat dibuka. |
| `size` | `ModalSize` | `"md"` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "full" \| { width, height? }` |
| `position` | `ModalPosition` | `"center"` | `"center" \| "top" \| "bottom" \| "left" \| "right"` |
| `closeOnBackdrop` | `boolean` | `true` | Klik backdrop → close. |
| `closeOnEscape` | `boolean` | `true` | Tombol Esc → close. |
| `preventClose` | `boolean` | `false` | Override semua close trigger. |
| `closeButtonStyle` | `CloseButtonStyle` | — | Override style tombol close. |
| `closeButton` | `ReactNode` | — | Custom close button element. |
| `scrollBehavior` | `"body" \| "outside"` | `"body"` | Scroll di dalam body atau di luar modal. |
| `animation` | `AnimationConfig` | dari `ModalKit` | Override animasi per-modal. |
| `id` | `string` | — | ID custom (dipakai stack). |

### Size presets

```typescript
xs   → 320px
sm   → 480px
md   → 600px
lg   → 800px
xl   → 1024px
full → 100vw
{ width: "60vw", height: "70vh" }   // custom
```

---

## API Imperatif `modal.*`

Berguna untuk dialog yang dipicu di luar React tree (handler, axios interceptor, dll).

```typescript
modal.open(config: ModalConfig): string     // returns ID
modal.close(id: string): void
modal.closeTop(): void                       // tutup modal paling atas
modal.closeAll(): void

interface ModalConfig extends Omit<ModalProps, "isOpen" | "onClose" | "children"> {
  content: ReactNode;
  id?: string;
  onClose?: () => void;
}
```

### Contoh

```tsx
// Dialog konfirmasi sederhana (tapi pertimbangkan @dep/ui/confirm untuk ini)
const id = modal.open({
  size: "sm",
  position: "center",
  content: (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-3">Selesaikan pesanan?</h3>
      <p className="text-slate-600">Total Rp 200.000.</p>
      <div className="mt-4 flex gap-2 justify-end">
        <button onClick={() => modal.close(id)}>Batal</button>
        <button onClick={() => { processOrder(); modal.close(id); }}>OK</button>
      </div>
    </div>
  ),
});

// Drawer kanan
modal.open({
  size: { width: "400px" },
  position: "right",
  animation: { in: "slide", out: "slide", duration: 250 },
  content: <CartSidebar />,
});
```

> Pastikan `<ModalStack />` ter-mount di root, kalau tidak imperatif API tidak akan render apapun.

---

## Hook `useModal`

State lokal sederhana untuk deklaratif mode:

```typescript
const { isOpen, open, close, toggle } = useModal(defaultOpen?: boolean);
```

```tsx
const m = useModal(false);

<button onClick={m.open}>Open</button>
<Modal isOpen={m.isOpen} onClose={m.close}>…</Modal>
```

---

## `<ModalStack>` Renderer

```tsx
<ModalStack />
```

- Render satu kali di root.
- Subscribe ke `modalStore`, render setiap modal dengan z-index yang sesuai.
- Backdrop opacity = `baseOpacity + (level * opacityIncrement)` → modal yang lebih atas terlihat lebih gelap latarnya.

---

## Sub-component (`Modal.Header / Body / Footer`)

```tsx
<Modal isOpen={open} onClose={close}>
  <Modal.Header showCloseButton={true}>
    <h3 className="text-lg font-semibold">Judul Modal</h3>
  </Modal.Header>

  <Modal.Body padding="2rem">
    Konten apapun di sini.
  </Modal.Body>

  <Modal.Footer align="right" divider={true}>
    <button onClick={close}>Batal</button>
    <button onClick={save}>Simpan</button>
  </Modal.Footer>
</Modal>
```

### Props

**`Modal.Header`**
| Prop | Tipe | Default |
|---|---|---|
| `children` | `ReactNode` | wajib |
| `showCloseButton` | `boolean` | `true` |

**`Modal.Body`**
| Prop | Tipe | Default |
|---|---|---|
| `children` | `ReactNode` | wajib |
| `padding` | `string \| number` | `"1.5rem"` |

**`Modal.Footer`**
| Prop | Tipe | Default |
|---|---|---|
| `children` | `ReactNode` | wajib |
| `align` | `"left" \| "center" \| "right"` | `"right"` |
| `divider` | `boolean` | `true` |

> **Catatan:** Tombol close di `Modal.Header` saat ini hanya visual (`×` div), belum di-wire ke `onClose`. Untuk close yang berfungsi, andalkan `closeOnBackdrop` / `closeOnEscape`, atau tambahkan tombol close manual di footer. Lihat `ISSUES.md`.

---

## Type Reference

```typescript
type ModalSize     = "xs" | "sm" | "md" | "lg" | "xl" | "full" | { width: string; height?: string };
type ModalPosition = "center" | "top" | "bottom" | "left" | "right";
type CloseButtonStyle = "macos" | "windows" | "button";
type ScrollBehavior   = "body" | "outside";
type AnimationType    = "fade" | "slide" | "zoom" | "bounce";

interface AnimationConfig { in?: AnimationType; out?: AnimationType; duration?: number }

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  size?: ModalSize;
  position?: ModalPosition;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  preventClose?: boolean;
  closeButtonStyle?: CloseButtonStyle;
  closeButton?: ReactNode;
  scrollBehavior?: ScrollBehavior;
  animation?: AnimationConfig;
  children: ReactNode;
  id?: string;
}

interface ModalConfig extends Omit<ModalProps, "isOpen" | "onClose" | "children"> {
  content: ReactNode;
  id?: string;
  onClose?: () => void;
}

interface ModalInstance extends ModalConfig {
  id: string;
  isOpen: boolean;
}

interface ModalKitConfig { /* lihat atas */ }
```

---

## Pola & Tips

### Drawer (slide dari kanan)

```tsx
modal.open({
  position: "right",
  size: { width: "420px", height: "100vh" },
  animation: { in: "slide", out: "slide", duration: 250 },
  content: <Sidebar />,
});
```

### Form modal dengan validation lock

```tsx
const m = useModal();
const [isDirty, setDirty] = useState(false);

<Modal
  isOpen={m.isOpen}
  onClose={m.close}
  preventClose={isDirty}              // user harus eksplisit batal/simpan
  closeOnBackdrop={!isDirty}
>
  <Modal.Header>Edit Pengguna</Modal.Header>
  <Modal.Body><MyForm onChange={() => setDirty(true)} /></Modal.Body>
  <Modal.Footer>
    <button onClick={() => { setDirty(false); m.close(); }}>Batal</button>
    <button onClick={async () => { await save(); m.close(); }}>Simpan</button>
  </Modal.Footer>
</Modal>
```

### Imperatif dengan return value (Promise pattern)

API saat ini tidak return Promise. Untuk pola "menunggu konfirmasi", gunakan `@dep/ui/confirm`:

```typescript
import { confirm } from "@dep/ui/confirm";
const ok = await confirm({ title: "Yakin?" });
```

### Stacking limit (opsional)

Tidak ada batas hardcoded. Stack lebih dari ~3 modal sebaiknya dihindari demi UX.

---

*Lihat [src/lib/ISSUES.md](../../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
