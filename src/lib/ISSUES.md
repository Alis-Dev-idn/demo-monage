# Catatan Perbaikan & Saran Peningkatan — `src/lib`

Dokumen ini merangkum **bug**, **inkonsistensi API**, **anomali**, **inefisiensi**, dan **saran peningkatan** untuk semua modul di `src/lib`. Telah diverifikasi langsung di kode (bukan klaim spekulatif). File:line mengacu pada kondisi saat dokumen ini ditulis.

**Legenda Prioritas:**
- 🔴 **Bug** — Perilaku tidak sesuai yang diharapkan; berpotensi memengaruhi user.
- 🟠 **Inkonsistensi / dead-code** — API yang didefinisikan tapi tidak berfungsi; perlu di-wire atau dihapus.
- 🟡 **UX / Performance** — Bukan bug, tetapi pengalaman pengguna atau performa bisa lebih baik.
- 🔵 **Saran arsitektur** — Refactor opsional untuk kemudahan maintenance jangka panjang.

---

## Daftar Isi

1. [Modul `axios`](#modul-axios)
2. [Modul `notify`](#modul-notify)
3. [Modul `route`](#modul-route)
4. [Modul `templates/dashboard`](#modul-templatesdashboard)
5. [Modul `ui/table`](#modul-uitable)
6. [Modul `ui/map`](#modul-uimap)
7. [Modul `ui/modal`](#modul-uimodal)
8. [Modul `ui/confirm`](#modul-uiconfirm)
9. [Lintas Modul / Arsitektur](#lintas-modul--arsitektur)

---

## Modul `axios`

### 🟠 1. `interceptApiError` di NotifyKit didefinisikan tapi belum di-wire ke Axios
**Lokasi:** `notify/types/index.ts` (`NotifyKitConfig.interceptApiError`) + `App.tsx` setup
**Masalah:** Field `interceptApiError.enabled` & `messageOverride` ada di config NotifyKit, tetapi tidak ada interceptor di AxiosKit yang membacanya.
**Rekomendasi:**
- Hapus opsi ini dari `NotifyKitConfig`, atau
- Tambah modul tipis di setup AxiosKit yang membaca `NotifyKit.getConfig().interceptApiError` dan memasang interceptor:
  ```typescript
  // axios/core/AxiosKit.ts (saat register)
  const notifyConf = NotifyKit.getConfig().interceptApiError;
  if (notifyConf?.enabled) {
    instance.interceptors.response.use(r => r, err => {
      if (err instanceof ApiError) {
        notify.error(notifyConf.messageOverride?.(err) ?? err.message);
      }
      throw err;
    });
  }
  ```

### 🟡 2. Download auto-trigger memakai `setTimeout(100)` magic number
**Lokasi:** `axios/methods/transfer.ts` (block download dengan `filename`)
**Masalah:** Anchor `<a>` ditambah ke DOM, di-click, lalu dibersihkan dengan `setTimeout(100)`. Hardcoded 100ms terlalu cepat di device lambat.
**Rekomendasi:** Pakai `queueMicrotask` untuk revoke URL dan tidak perlu append ke DOM:
```typescript
const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = filename;
a.click();
queueMicrotask(() => URL.revokeObjectURL(a.href));
```

### 🟡 3. Race condition kecil di auth interceptor: `_retry` flag di-set setelah `isRefreshing`
**Lokasi:** `axios/core/interceptors/auth.interceptor.ts` (block "Start refresh")
**Masalah:** Urutan saat ini: `isRefreshing = true; originalRequest._retry = true;` — secara teori aman karena single-thread JS, tapi tidak defensive.
**Rekomendasi:** Tukar urutan supaya `_retry` di-flag dulu sebelum mulai refresh. Risiko sangat rendah; opsional.

### 🔵 4. Speed calculation upload/download mulai dari `0` di event pertama
**Lokasi:** `axios/methods/transfer.ts` (rolling 2-event snapshot)
**Masalah:** File kecil yang `onProgress` hanya 1× event akan punya `speed: 0`. Visual progress tetap benar (percent), hanya field `speed` & `estimatedTime` kosong.
**Rekomendasi:** Inisialisasi snapshot dengan `{ loaded: 0, timestamp: startTime }` saat memulai request, sehingga event pertama sudah punya delta.

---

## Modul `notify`

### 🔴 5. Class animasi hardcoded ke `"fade"` (config `animation.in/out` tidak berefek)
**Lokasi:** `notify/components/NotifyContainer.tsx:93`
**Masalah:** Class diset literal `notify-fade-enter-active` / `notify-fade-exit-active`. Konfigurasi `animation: { in: "slide" }` di `NotifyKit.setup` tidak akan terlihat.
**Rekomendasi:**
```tsx
const animType = isExiting ? options.animation.out : options.animation.in;
className={`notify-item notify-${type} notify-${animType}-${isExiting ? "exit" : "enter"}-active`}
```

### 🟠 6. CSS untuk animasi `zoom` & `bounce` belum ada
**Lokasi:** `notify/components/notify.css`
**Masalah:** Type mendukung `"fade" | "slide" | "zoom" | "bounce"`, tetapi CSS hanya berisi `fade` (lengkap) dan `slide` (partial — tanpa exit base class).
**Rekomendasi:** Tambahkan keyframes:
```css
.notify-zoom-enter { transform: scale(0.8); opacity: 0; }
.notify-zoom-enter-active { transform: scale(1); opacity: 1; }
.notify-zoom-exit-active { transform: scale(0.8); opacity: 0; }

.notify-bounce-enter-active { animation: bounce-in 0.5s ease-out; }
.notify-bounce-exit-active  { animation: bounce-out 0.3s ease-in; }
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### 🔴 7. `pauseOnHover` di config tidak dihormati
**Lokasi:** `notify/components/NotifyContainer.tsx` (hover handler)
**Masalah:** `onMouseEnter={() => setIsPaused(true)}` selalu pause walau `pauseOnHover: false` di config.
**Rekomendasi:**
```tsx
const config = NotifyKit.getConfig();
onMouseEnter={() => config.pauseOnHover && setIsPaused(true)}
onMouseLeave={() => config.pauseOnHover && setIsPaused(false)}
```

### 🟠 8. Konfigurasi `gap` di NotifyKit tidak diaplikasikan
**Lokasi:** `notify/components/notify.css:8` (hardcoded `gap: 8px`)
**Masalah:** Default config `gap: 8` ada di `NotifyKit`, tapi CSS hardcoded.
**Rekomendasi:** Set inline `style={{ gap: `${config.gap}px` }}` di container, atau buat CSS variable `--notify-gap` di root container.

### 🟠 9. `eslint-disable react-hooks/exhaustive-deps` di useEffect timer
**Lokasi:** `notify/components/NotifyContainer.tsx:86`
**Masalah:** Disable rule menyembunyikan dependency lain yang dipakai (`id`, `notifyStore`, `dismiss`). Saat ini bekerja karena reference stabil, tetapi rapuh.
**Rekomendasi:** Wrap `dismiss` di `useCallback` dan tambahkan ke deps. Atau ekstrak timer logic ke custom hook.

### 🟡 10. ID notifikasi dari `Math.random().toString(36).substring(2,9)` — bukan UUID
**Lokasi:** `notify/notify.ts` (di `createNotify`)
**Masalah:** Collision probability sangat kecil tapi bukan nol. Untuk app yang spam banyak toast, ada risiko.
**Rekomendasi:** Pakai counter increment + timestamp: ``id = `notify-${Date.now()}-${counter++}` ``.

---

## Modul `route`

### 🟠 11. Useless `useEffect` deps — `config` object dari `RouteKit.getConfig()`
**Lokasi:** `route/components/Guards.tsx` (`AuthRoute` & `RoleRoute`)
**Masalah:** `config` adalah reference baru setiap render. `useEffect([config, navigate])` akan re-fire setiap render parent walau isi tidak berubah.
**Rekomendasi:** Destructure field yang dipakai saja:
```tsx
const { authCheck, authStore, authSelector, loginPath } = RouteKit.getConfig();
useEffect(() => { /* check */ }, [authCheck, authStore, authSelector, loginPath, navigate]);
```

### 🟡 12. Tidak ada cleanup `isMounted` di Guards async check
**Lokasi:** `route/components/Guards.tsx` (`AuthRoute.useEffect`)
**Masalah:** `await config.authCheck()` selesai setelah component unmount → `setIsAuthorized` + `navigate` jalan, memicu React warning di console.
**Rekomendasi:**
```tsx
useEffect(() => {
  let alive = true;
  (async () => {
    const auth = await config.authCheck?.();
    if (!alive) return;
    setIsAuthorized(auth);
    if (!auth) navigate(loginPath);
  })();
  return () => { alive = false; };
}, [/* deps */]);
```

### 🟡 13. Async breadcrumb (Promise) tidak di-resolve, selalu tampil `"Loading..."`
**Lokasi:** `route/hook/useRouteInfo.ts` (logika `breadcrumb` function)
**Masalah:** Saat breadcrumb adalah async function, hook me-render `"Loading..."` tetapi tidak pernah update saat promise selesai (tidak ada state untuk async result).
**Rekomendasi:** Tambah state internal `Map<string, string>` di hook untuk cache hasil async, dan trigger update via `useEffect`.

### 🟠 14. `Math.random()` untuk key di nested 404 route
**Lokasi:** `route/core/createRoutes.tsx` (block `notFoundComponent`)
**Masalah:** `<Route key={`404-${Math.random()}`}>` — key berubah setiap render, memicu remount.
**Rekomendasi:** Pakai key stabil seperti `404-fallback-${groupIndex}`.

### 🔵 15. `RouteConfig` tidak punya field `meta` generik
**Lokasi:** `route/types/index.ts`
**Masalah:** Saat app butuh attach data custom (feature flag, ACL granular), tidak ada slot. `sidebar` saat ini satu-satunya extension point.
**Rekomendasi:** Tambah `meta?: Record<string, unknown>` untuk extensibility.

---

## Modul `templates/dashboard`

### 🔴 16. `NavbarUser` crash kalau `user.name` undefined
**Lokasi:** `templates/dashboard/components/Navbar/Navbar.tsx` (block avatar fallback)
**Masalah:** `user.name.charAt(0).toUpperCase()` tanpa null check. Kalau `setUser({})` atau `user` undefined → crash.
**Rekomendasi:**
```tsx
{user?.avatar
  ? <img src={user.avatar} alt="User avatar" />
  : <div>{user?.name?.charAt(0)?.toUpperCase() ?? "?"}</div>}
```

### 🟡 17. Default icon bottom nav `"•"` (titik) — tidak ramah secara visual
**Lokasi:** `templates/dashboard/core/DashboardLayout.tsx` (mapping sidebar → bottom nav)
**Masalah:** Saat `sidebar.icon` tidak diset, bottom nav menampilkan bullet `•` yang terlalu kecil.
**Rekomendasi:** Skip item tanpa icon, atau pakai icon default dari `lucide-react` (mis. `Circle`).

### 🟡 18. Recursive `createSidebarFromRoutes` tanpa max-depth
**Lokasi:** `templates/dashboard/core/createSidebarFromRoutes.ts`
**Masalah:** Tidak ada guard untuk depth — jika ada cycle (jarang, tapi mungkin di route definition error), bisa stack overflow.
**Rekomendasi:** Tambah parameter `depth` dengan limit 5.

### 🟠 19. `gap` & dimensi sidebar hardcoded di CSS, juga di DashboardKit
**Lokasi:** `templates/dashboard/components/dashboard.css` + `DashboardKit.setup` opsi `sidebarWidth`
**Masalah:** Konfigurasi `sidebarWidth: 280` di kit tidak override CSS yang punya `var(--db-sidebar-width-full)`. Sumber kebenarannya tumpang tindih.
**Rekomendasi:** Aplikasikan `sidebarWidth` via inline style ke `<Dashboard>` element root sebagai CSS variable:
```tsx
<div style={{ "--db-sidebar-width-full": `${config.sidebarWidth}px` } as CSSProperties}>
```

### 🟡 20. Loading state hilang saat resolve roles
**Lokasi:** `templates/dashboard/core/DashboardLayout.tsx` (block resolve `getRoles`)
**Masalah:** Saat `getRoles()` async pending, layout sudah render dengan `userRoles = []` → sidebar item dengan `roles` di-filter habis. Saat roles resolve, sidebar tiba-tiba muncul (flicker).
**Rekomendasi:** Tambah state `rolesReady`, render skeleton sidebar sampai roles diketahui.

---

## Modul `ui/table`

## Fitur yang Belum Ada (Keterbatasan)
- **Cell Merging / Merge Table**: **Belum didukung**. Fitur `rowSpan` atau `colSpan` untuk menggabungkan sel kolom atau baris secara dinamis berdasarkan data saat ini belum terimplementasi pada iterasi render `Table.tsx`.
- **Inline Row/Cell Editing**: Belum ada dukungan edit langsung di dalam sel.
- **Row/Column Drag & Drop**: Belum bisa menukar urutan baris atau letak kolom dengan menarik (*drag*).
- **Data Virtualization**: Belum ada implementasi *virtual scrolling* untuk menangani data berjumlah masif (*ribuan baris sekaligus*) pada *client-side* tanpa paginasi.


### 🔴 21. Row key memakai `index` di `<Table>`
**Lokasi:** `ui/table/components/Table.tsx` (block `table.data.map((row, i) => ...)` di tbody)
**Masalah:** `<React.Fragment key={i}>` — saat sorting/filter mengubah order, React menganggap row sebagai "row yang sama" dan mempertahankan state input/checkbox lama di posisi salah.
**Rekomendasi:**
```tsx
const rowKey = (row as any).id ?? (row as any)._id ?? `row-${i}`;
<React.Fragment key={rowKey}>
```

### 🟠 22. Prop `cellClassName` di-destructure tapi tidak diaplikasikan
**Lokasi:** `ui/table/components/Table.tsx:32` + render `<td>`
**Masalah:** Destructured (line 32), tidak pernah dipakai di `<td className={`table-td ${col.pinned ? "sticky-col" : ""}`}>`.
**Rekomendasi:** Pakai di render atau hapus dari `TableProps`:
```tsx
<td className={`table-td ${col.pinned ? "sticky-col" : ""} ${cellClassName}`}>
```

### 🔴 23. Export CSV/Excel mengabaikan `column.render`
**Lokasi:** `ui/table/utils/exportCsv.ts` + `exportExcel.ts`
**Masalah:** Export memakai raw value, sehingga kolom yang format (currency, date, badge) keluar dengan value mentah — sering bukan yang user lihat.
**Rekomendasi:** Tambah optional `column.exportValue?: (value, row) => string | number` dan pakai di export. Atau jelaskan via dokumentasi bahwa user harus pre-format data sebelum dimasukkan ke table.

### 🔴 24. Search match nilai `null`/`undefined` sebagai string
**Lokasi:** `ui/table/hooks/useTable.ts` (block global search di `processedData`)
**Masalah:** `String(null).toLowerCase() === "null"` → search "null" akan match semua row null.
**Rekomendasi:**
```typescript
val != null && String(val).toLowerCase().includes(s)
```

### 🟡 25. Width parsing untuk pinned offset rapuh terhadap unit non-px
**Lokasi:** `ui/table/hooks/useTable.ts` (perhitungan `pinnedOffset`)
**Masalah:** `parseInt(c.width || "100")` — kalau width `"20%"`, `parseInt` mengembalikan `20` (bukan persentase pixel).
**Rekomendasi:** Skip pinned offset untuk percentage width, atau force pinned column harus pakai px.

### 🟡 26. Mobile loading state hardcoded `"Loading..."` text
**Lokasi:** `ui/table/components/Table.tsx:40`
**Masalah:** Desktop pakai `TableSkeleton`, mobile pakai text mentah. Tidak konsisten.
**Rekomendasi:** Tambah `MobileCardSkeleton` atau ekstrak loading text ke prop/config.

### 🟡 27. `ExpandableConfig.trigger` & `cacheResult` didefinisikan tapi tidak di-implement
**Lokasi:** `ui/table/types/index.ts`
**Masalah:** Field ada di type tapi tidak dipakai di runtime. Kalau dipakai user, tidak ada error tapi juga tidak ada efek.
**Rekomendasi:** Implement atau hapus dari type.

### 🟡 28. Mobile card hidden fields tanpa border/padding pemisah
**Lokasi:** `ui/table/components/MobileCard.tsx` + `table.css`
**Masalah:** Section "expanded" tidak punya separator visual dari body. UX kurang.
**Rekomendasi:** Tambah `.mobile-card-expanded { border-top: 1px solid #e2e8f0; padding-top: 0.75rem; }`.

---

## Modul `ui/map`

### 🟠 29. `<DrawControl>` tidak menampilkan preview real-time saat menggambar
**Lokasi:** `ui/map/components/DrawControl/DrawControl.tsx` (akhir return: `return null`)
**Masalah:** User klik untuk menambah titik, tapi tidak ada visual feedback sampai shape selesai. Sangat membingungkan.
**Rekomendasi:** Render `<GeoJsonLayer>` dinamis dari state `points` saat mode aktif:
```tsx
{points.length > 0 && (
  <GeoJsonLayer id="__draw-preview" type="line"
    data={{ type:"Feature", geometry:{ type:"LineString", coordinates: points } }} />
)}
```

### 🟡 30. `<SuperClusterLayer>` lookup point pakai `Array.find` per cluster
**Lokasi:** `ui/map/components/ClusterLayer/SuperClusterLayer.tsx` (render block)
**Masalah:** `points.find(p => p.id === pointId)` adalah O(n). Untuk 10k titik = 10k linear scan tiap render → O(n²).
**Rekomendasi:**
```typescript
const pointMap = useMemo(() => new Map(points.map(p => [p.id, p])), [points]);
const point = pointMap.get(pointId);
```

### 🟡 31. `<Map>` tidak reactive terhadap perubahan `styleUrl`
**Lokasi:** `ui/map/components/Map/Map.tsx` (useEffect dengan `[]` deps)
**Masalah:** Mengganti `styleUrl` via prop tidak memicu `map.setStyle()`.
**Rekomendasi:** Tambah `useEffect` terpisah:
```tsx
useEffect(() => {
  if (map && styleUrl) map.setStyle(styleUrl);
}, [styleUrl, map]);
```

### 🟡 32. `<Marker>` tidak unmount React root saat `children` jadi falsy
**Lokasi:** `ui/map/components/Marker/Marker.tsx` (useEffect untuk children)
**Masalah:** Saat children → undefined/null, root sebelumnya tetap ada di DOM. Bisa menyisakan visual yang stale.
**Rekomendasi:**
```tsx
useEffect(() => {
  if (!children) { rootRef.current?.unmount(); rootRef.current = null; return; }
  rootRef.current ??= createRoot(elementRef.current);
  rootRef.current.render(<div className={className}>{children}</div>);
}, [children, className]);
```

### 🔵 33. Tidak ada error handling saat init `new maplibregl.Map(...)`
**Lokasi:** `ui/map/components/Map/Map.tsx`
**Masalah:** Style URL salah / network down → exception dilempar ke React, tidak ada UI fallback.
**Rekomendasi:** Bungkus dengan try/catch + state error → render fallback UI.

---

## Modul `ui/modal`

### 🔴 34. Tombol close di `Modal.Header` tidak terhubung ke `onClose`
**Lokasi:** `ui/modal/components/ModalSubComponents.tsx:10-14`
**Masalah:** `<div className="modal-close-windows">×</div>` — hanya visual, click tidak melakukan apa-apa.
**Rekomendasi:** Inject `onClose` via context dari `<Modal>` (sudah ada `ModalContext`-an di store; pakai). Atau biarkan user pass `onClose` di prop `Modal.Header`:
```tsx
<ModalHeader onClose={close} showCloseButton>
  <h3>Judul</h3>
</ModalHeader>
```

### 🟠 35. Prop `closeButtonStyle` & `scrollBehavior` di `<Modal>` tidak diimplementasi
**Lokasi:** `ui/modal/components/Modal.tsx` (destructure di awal)
**Masalah:** Props diterima dan didokumentasikan tapi tidak diwire ke render.
**Rekomendasi:** Implement, atau hapus dari `ModalProps`.

### 🟠 36. Magic number `setTimeout(1000)` di ModalStack untuk cleanup
**Lokasi:** `ui/modal/components/ModalStack.tsx` (onClose handler)
**Masalah:** `setTimeout(() => modalStore.removeModal(m.id), 1000)` — 1 detik hardcoded; tidak sinkron dengan `animation.duration`.
**Rekomendasi:** Pakai `ModalKit.getConfig().animation.duration` atau ambil dari modal instance.

### 🔵 37. `SIZE_PRESETS` hardcoded di komponen
**Lokasi:** `ui/modal/components/Modal.tsx`
**Masalah:** Tidak bisa di-override via `ModalKit`. Brand butuh "xl" yang lebih besar harus fork.
**Rekomendasi:** Pindah ke `ModalKit.setup({ sizePresets: { xl: "1280px" } })`.

---

## Modul `ui/confirm`

### 🟡 38. Mobile breakpoint hardcoded `768` di DialogWrapper
**Lokasi:** `ui/confirm/components/DialogWrapper.tsx` (cek `window.innerWidth <= 768`)
**Masalah:** Tidak responsive terhadap resize (`innerWidth` di-cek saat render, bukan via media query listener), dan tidak configurable.
**Rekomendasi:** Pakai `matchMedia` + state, atau pindahkan ke CSS pure (`@media`).

### 🟡 39. Tombol submit prompt selalu Enter (tidak configurable)
**Lokasi:** `ui/confirm/dialogs/PromptDialog.tsx` (onKeyDown handler)
**Masalah:** Hardcoded `e.key === "Enter"`. `KeyboardConfig.confirm` tidak dipakai.
**Rekomendasi:** Baca `ConfirmKit.getConfig().keyboard.confirm`.

### 🟠 40. Saat memakai `options.component`, tidak ada cara built-in untuk close
**Lokasi:** `ui/confirm/dialogs/{Confirm,Alert,Prompt}Dialog.tsx`
**Masalah:** Custom `component` skip semua tombol, user harus tahu cara dismiss manual (`ConfirmKit.dismiss(id)`).
**Rekomendasi:** Inject `close` callback via context atau child prop:
```tsx
{typeof options.component === "function"
  ? options.component({ close })
  : options.component}
```
Lalu user bisa: `component: ({ close }) => <MyContent onDone={close} />`.

### 🔵 41. Re-render logic animasi class di `DialogWrapper` duplikat (in / out helper)
**Lokasi:** `ui/confirm/components/DialogWrapper.tsx` (`getAnimationClass` + `getBaseAnimationClass`)
**Masalah:** Switch yang sama dipanggil dua kali untuk in/out.
**Rekomendasi:** Helper tunggal:
```typescript
const cls = (anim: AnimationType, suffix: "" | "-active") => `confirm-${anim}-in${suffix}`;
```

---

## Lintas Modul / Arsitektur

### 🔵 42. `src/lib/ui/README.md` punya referensi API yang sudah tidak akurat
**Lokasi:** `src/lib/ui/README.md`
**Masalah:**
- Bagian Map menyebut `MapProvider` & `NavigationControl` — komponennya bernama `Map` dan tidak ada `NavigationControl`.
- Bagian Modal: `<Modal.Header title="..." onClose={...} />` — `ModalHeader` saat ini menerima `children` + `showCloseButton`, bukan `title`/`onClose`.
**Rekomendasi:** Sinkronkan dengan README per-modul yang baru. Pertimbangkan menjadikan `ui/README.md` sebagai index/TOC saja yang link ke README masing-masing.

### 🔵 43. `NotifyStore`, `ModalStore`, `ConfirmStore` punya pola Observer identik
**Lokasi:** `notify/core/NotifyStore.ts`, `ui/modal/core/ModalStore.ts`, `ui/confirm/core/ConfirmStore.ts`
**Masalah:** Tiga implementasi berbeda dari pattern yang sama (subscribers + emit + addItem/removeItem).
**Rekomendasi:** Ekstrak ke `src/lib/_shared/BaseStore.ts`:
```typescript
abstract class BaseStore<T extends { id: string }> {
  protected items: T[] = [];
  private listeners = new Set<(items: T[]) => void>();
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  protected emit() { this.listeners.forEach(fn => fn([...this.items])); }
  // ...
}
```
Tiga store cukup `extends BaseStore<Item>`.

### 🔵 44. `NotifyKit`, `ModalKit`, `ConfirmKit`, `RouteKit`, `DashboardKit`, `MapKit`, `AxiosKit` semua singleton config — pola serupa
**Masalah:** Pattern serupa, implementasi terpisah.
**Rekomendasi:** Buat helper:
```typescript
// _shared/createKit.ts
export function createKit<T>(defaultConfig: T) {
  let config = defaultConfig;
  return {
    setup(partial: Partial<T>) { config = deepMerge(config, partial); },
    getConfig() { return config; },
  };
}
```
Kemudian masing-masing kit cukup: `export const NotifyKit = createKit(DEFAULT_NOTIFY_CONFIG);`.

### 🔵 45. ID generation di banyak modul memakai `Math.random().toString(36).substring(2, 9)`
**Masalah:** Duplikat di notify, modal, confirm.
**Rekomendasi:** Helper kecil:
```typescript
// _shared/uid.ts
let counter = 0;
export const uid = (prefix = "id") => `${prefix}-${Date.now()}-${counter++}`;
```

### 🔵 46. Belum ada index `src/lib/index.ts` yang re-export semua modul
**Masalah:** Import path bermacam: `@dep/axios`, `@dep/ui/table`, dll. Tidak ada satu pintu masuk.
**Rekomendasi:** Pertimbangkan `src/lib/index.ts` yang re-export namespace untuk auto-completion lebih baik (opsional — tergantung gaya project).

### 🔵 47. Belum ada test untuk satupun modul `lib`
**Lokasi:** Tidak ada `*.test.ts` / `*.spec.ts` di `src/lib`.
**Saran:** Mulai dengan smoke test untuk utilities yang murni:
- `axios/core/ApiError.toJSON()` & `.toString()`
- `route/core/createRoutes` (snapshot of generated route tree)
- `table/utils/exportCsv` (output exact format)
- `map/components/Geofence` point-in-polygon (sudah ada algoritma diskrit)

Setup minimal Vitest tanpa banyak overhead untuk pustaka internal yang dipakai banyak project.

### 🔵 48. Hardcoded breakpoint `768px` tersebar di banyak file
**Lokasi:** `templates/dashboard`, `ui/confirm`, `ui/table`, `notify/css`, etc.
**Saran:** Buat konstanta global `BREAKPOINTS` dan/atau CSS variable `--breakpoint-mobile`:
```typescript
// _shared/breakpoints.ts
export const BREAKPOINTS = { mobile: 768, tablet: 1024 } as const;
```

### 🔵 49. Belum ada Storybook / Playground halaman demo
**Saran:** Mengingat ini adalah pustaka in-project yang dipakai cross-project, tambahkan halaman `/playground` di Vite dev mode (atau Storybook) untuk visual regression & dokumentasi hidup.

### 🔵 50. Accessibility belum ditangani serius
**Lokasi:** Sidebar items, BottomNav, ModalHeader close, MapStyleSwitcher buttons.
**Saran:**
- Tambahkan `aria-label`, `aria-current="page"`, `role="dialog"`, `role="alertdialog"` di komponen relevan.
- `Modal` & dialog `confirm` perlu trap focus dan kembalikan focus ke trigger setelah close (sudah ada di confirm, belum di modal).
- Tombol icon-only butuh `aria-label`.

---

## Rangkuman Severity

| Modul | 🔴 Bug | 🟠 Inkonsist. | 🟡 UX/Perf | 🔵 Saran |
|---|---|---|---|---|
| axios | — | 1 | 1 | 2 |
| notify | 2 | 2 | 2 | — |
| route | — | 2 | 2 | 1 |
| templates/dashboard | 1 | 1 | 2 | — |
| ui/table | 3 | 1 | 4 | — |
| ui/map | — | 1 | 3 | 1 |
| ui/modal | 1 | 2 | — | 1 |
| ui/confirm | — | 1 | 2 | 1 |
| Lintas modul | — | — | — | 9 |
| **Total** | **7** | **11** | **16** | **15** |

---

## Prioritas Penanganan (Saran)

**Sprint 1 — bug-fix langsung berdampak ke user:**
- #5 (notify animation hardcoded)
- #7 (pauseOnHover tidak hormat)
- #16 (Navbar crash undefined user)
- #21 (Table row key index)
- #23 (Export ignore render)
- #24 (Search match "null")
- #34 (Modal close button mati)

**Sprint 2 — inkonsistensi API & cleanup dead-code:**
- #1, #6, #8, #19, #22, #27, #35, #36

**Sprint 3 — UX & performance:**
- #11–#15 (route polish)
- #28–#32 (map polish)
- #38–#40 (confirm polish)

**Backlog — refactor arsitektur:**
- #42–#50 (lintas modul: BaseStore, createKit, breakpoints, tests, a11y)

---

*Dokumen ini hidup. Update setiap kali issue di-resolve dengan menambahkan tanda `~~struck through~~` dan link ke commit/PR yang memperbaikinya.*

---

## Status Implementasi (Batch Pertama)

Issue yang telah diperbaiki / diimplementasi dalam batch ini:

**Bug Sprint 1:**
- ✅ #5 — Notify animation hardcoded → sekarang membaca `options.animation.in/out` di [NotifyContainer.tsx](notify/components/NotifyContainer.tsx)
- ✅ #7 — `pauseOnHover` dihormati di hover handler
- ✅ #16 — Navbar guard `user?.name` undefined-safe di [Navbar.tsx](templates/dashboard/components/Navbar/Navbar.tsx)
- ✅ #21 — Row key pakai `id`/`_id` di [Table.tsx](ui/table/components/Table.tsx)
- ✅ #23 — Tambah `column.exportValue` di [types](ui/table/types/index.ts) + dipakai oleh [exportCsv](ui/table/utils/exportCsv.ts) & [exportExcel](ui/table/utils/exportExcel.ts) (juga CSV escape & queueMicrotask URL revoke)
- ✅ #24 — Search skip `null`/`undefined` di [useTable.ts](ui/table/hooks/useTable.ts)
- ✅ #34 — Modal close button wired via [ModalContext.ts](ui/modal/components/ModalContext.ts) + [ModalSubComponents.tsx](ui/modal/components/ModalSubComponents.tsx)

**Inkonsistensi Sprint 2:**
- ✅ #1 — Axios error interceptor membaca `NotifyKit.interceptApiError` di [error.interceptor.ts](axios/core/interceptors/error.interceptor.ts)
- ✅ #6 — CSS animasi zoom/bounce + slide-exit di [notify.css](notify/components/notify.css)
- ✅ #8 — `gap` config diaplikasikan via CSS variable `--notify-gap`
- ✅ #19 — `sidebarWidth` & `sidebarCollapsedWidth` di-set sebagai CSS variable di Dashboard root
- ✅ #22 — `cellClassName` dipakai di `<td>` render
- ✅ #27 — `ExpandableConfig.trigger` (`"row"`) + `cacheResult` di-implement
- ✅ #35 — `closeButtonStyle` & `scrollBehavior` di-wire (overlay scroll + data-attribute)
- ✅ #36 — `setTimeout(1000)` di ModalStack diganti `animation.duration + 50`

**UX/Performance Sprint 3:**
- ✅ #2 — Download cleanup pakai `queueMicrotask` (hapus `setTimeout(100)`)
- ✅ #4 — Snapshot awal `{ loaded: 0, timestamp: startTime }` di transfer
- ✅ #11 — Guards destructure config field (auth/role/getRoles/loginPath/unauthorizedPath)
- ✅ #12 — Cleanup `alive` flag di async check Guards
- ✅ #14 — Key 404 stabil pakai `parentKey` (bukan `Math.random()`)
- ✅ #15 — `RouteConfig.meta` ditambahkan untuk extensibility
- ✅ #17 — Bottom nav skip item tanpa icon
- ✅ #18 — Max-depth guard di `createSidebarFromRoutes`
- ✅ #25 — Pinned offset skip percentage width (warn + fallback 100px)
- ✅ #29 — DrawControl preview real-time via `<GeoJsonLayer id="__draw-preview">`
- ✅ #30 — SuperClusterLayer pakai `Map` lookup (O(1) bukan O(n))
- ✅ #31 — Map `styleUrl` reactive via separate `useEffect`
- ✅ #32 — Marker unmount React root saat children falsy
- ✅ #33 — Map init dibungkus try/catch + state `initError` + `errorFallback`
- ✅ #38 — Mobile breakpoint via `matchMedia` listener + `ConfirmKit.mobileBreakpoint`
- ✅ #39 — PromptDialog baca `ConfirmKit.keyboard.confirm`
- ✅ #40 — `options.component` bisa berupa `({ close }) => ReactNode`
- ✅ #41 — Helper `animCls` tunggal di DialogWrapper

**Backlog Arsitektur:**
- ✅ #43 — `BaseStore` (di [_shared/BaseStore.ts](_shared/BaseStore.ts)) siap dipakai (tidak retrofit store yang sudah ada untuk minim risiko)
- ✅ #45 — `uid()` helper di [_shared/uid.ts](_shared/uid.ts) + dipakai di notify/modal/confirm imperative
- ✅ #48 — `BREAKPOINTS` & `maxWidth()` di [_shared/breakpoints.ts](_shared/breakpoints.ts)

**Batch lanjutan (s/d #37):**
- ✅ #3 — Auth interceptor swap urutan: `_retry` di-flag sebelum `isRefreshing`
- ✅ #9 — Refactor timer di [NotifyContainer.tsx](notify/components/NotifyContainer.tsx): pakai `useCallback` untuk `dismiss` + `isPausedRef` agar tidak butuh `eslint-disable`
- ✅ #13 — Async breadcrumb resolver di [useRouteInfo.ts](route/hook/useRouteInfo.ts) dengan cache `Map<string,string>` + state tick
- ✅ #20 — `rolesReady` state + skeleton sidebar di [DashboardLayout.tsx](templates/dashboard/core/DashboardLayout.tsx)
- ✅ #26 — `MobileCardSkeleton` di [TableStates.tsx](ui/table/components/TableStates.tsx) + dipakai di Table mobile loading
- ✅ #28 — `.mobile-card-expanded` separator (border-top + padding) di [table.css](ui/table/components/table.css)
- ✅ #37 — `ModalKit.sizePresets` di [ModalKit.ts](ui/modal/core/ModalKit.ts) (export `DEFAULT_MODAL_SIZE_PRESETS`)

**Batch final (#10, #42, #44, #46, #47, #50):**
- ✅ #10 — Selain `uid()`, tambah `uuid()` helper di [_shared/uid.ts](_shared/uid.ts) yang pakai `crypto.randomUUID()` jika tersedia
- ✅ #42 — Sinkronisasi [ui/README.md](ui/README.md): Modal.Header API (`children` + `showCloseButton`), Map (`Map` bukan `MapProvider`, tanpa `NavigationControl`, dengan `onError`/`errorFallback`), `column.exportValue`
- ✅ #44 — `createKit()` helper di [_shared/createKit.ts](_shared/createKit.ts) dengan opsi `deepMergeKeys` + `reset()` (existing Kits tidak dimigrasikan agar tidak risiko regresi — siap dipakai oleh Kit baru)
- ✅ #46 — Entry-point [src/lib/index.ts](index.ts) + barrel [ui/index.ts](ui/index.ts) + [templates/index.ts](templates/index.ts) (namespaced exports: `AxiosLib`, `NotifyLib`, `UI`, `Templates`, `Shared`)
- ✅ #47 — Vitest setup ([vitest.config.ts](../../vitest.config.ts) + scripts `test`/`test:watch`) + 5 file test:
  - `_shared/uid.test.ts`, `_shared/createKit.test.ts`, `_shared/BaseStore.test.ts`
  - `axios/core/ApiError.test.ts`
  - `ui/table/utils/exportCsv.test.ts` (didahului ekstraksi `buildCsv()` pure helper)
  - `tsconfig.app.json` exclude `*.test.*` agar build prod tidak butuh vitest
  - **Catatan instalasi:** `npm install --save-dev vitest @testing-library/react jsdom` sebelum run
- ✅ #50 — A11y improvements:
  - Sidebar: `aria-label`, `aria-current="page"`, `aria-expanded`, `role="group"` di children, `aria-hidden` di icon
  - BottomNav: `aria-label` di nav + items, `aria-current`
  - Modal: focus trap (Tab/Shift+Tab) + restore previous focus, focus first focusable on open
  - MapStyleSwitcher: `role="group"`, `aria-label` per button
  - Notify: `role="alert"` (error/warning) atau `"status"` (success/info), `aria-live`, `aria-atomic`
  - Navbar toggle: `aria-hidden` di svg

**Tidak diimplementasi (skip — perlu infrastructure besar):**
- #49 — Storybook / playground (membutuhkan setup besar; lebih cocok sebagai initiative terpisah)
