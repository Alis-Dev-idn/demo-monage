# Timeline

> Komponen vertical **activity / audit-log timeline**: ikon berwarna + connector line + title + timestamp + opsional badge "current" + opsional detail card (avatar + nama + aksi) + opsional note (mis. alasan ditolak).

**Import:** `import { Timeline, TimelineItem } from "@dep/ui/timeline";`

---

## Daftar Isi

1. [Filosofi Desain](#filosofi-desain)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start (data-driven)](#quick-start-data-driven)
4. [Quick Start (compositional)](#quick-start-compositional)
5. [Props API](#props-api)
   - [`Timeline`](#timeline)
   - [`TimelineItem`](#timelineitem)
   - [`TimelineEntry`](#timelineentry)
   - [`TimelineDetail`](#timelinedetail)
   - [`TimelineNote`](#timelinenote)
6. [Status & Color Tokens](#status--color-tokens)
7. [Variants](#variants)
8. [Theme (Light / Dark)](#theme-light--dark)
9. [Custom Icons](#custom-icons)
10. [Sub-primitives](#sub-primitives)
11. [Resep / Pattern Umum](#resep--pattern-umum)
12. [Architectural Decisions](#architectural-decisions)

---

## Filosofi Desain

1. **Dua API, satu komponen** — Bisa dipakai **deklaratif** (`items` array) untuk kasus umum atau **kompositif** (`<TimelineItem>` children) untuk fleksibilitas penuh.
2. **Status-driven coloring** — Cukup pilih `status`, ikon + lingkaran + text color otomatis match (5 status: success/warning/danger/info/neutral).
3. **Theme-aware** — Prop `theme="light" | "dark"` mengubah palette tanpa fork komponen.
4. **Variant via prop** — `default`, `compact`, atau `bordered`. Tambah variant baru = ubah tokens, bukan fork komponen.
5. **Pakai sub-primitif** — `<TimelineIcon>`, `<TimelineBadge>`, `<TimelineDetail>`, `<TimelineNote>` semua di-export → bisa di-recompose.
6. **Tailwind first** — Tidak ada CSS file.

---

## Struktur Folder

```
src/lib/ui/timeline/
├── index.ts                            # public exports
├── Timeline.tsx                        # container + dispatcher
├── TimelineItem.tsx                    # single row
├── types.ts                            # semua types
└── components/
    ├── statusTokens.ts                 # color tokens per status × theme
    ├── TimelineIcon.tsx                # colored circle with icon
    ├── TimelineBadge.tsx               # "Status saat ini" pill
    ├── TimelineDetail.tsx              # avatar + name + description card
    └── TimelineNote.tsx                # footnote line (e.g. rejection reason)
```

---

## Quick Start (data-driven)

Cocok untuk audit log / activity feed yang datanya datang dari API:

```tsx
import { Timeline } from "@dep/ui/timeline";

<Timeline
  title="Log Mutasi"
  subtitle="Riwayat perubahan data mutasi ini"
  items={[
    {
      id: "1",
      status: "warning",
      title: "Menunggu Persetujuan SRM Hartrans",
      timestamp: "20 Mei 2026 12:38:26",
      isCurrent: true,
    },
    {
      id: "2",
      status: "info",
      title: "Draft",
      timestamp: "20 Mei 2026 12:38:02",
      detail: {
        avatar: { initials: "MM" },
        name: "Meimei MSB Fashar P3BKAL",
        description: "Draft",
      },
    },
    {
      id: "3",
      status: "danger",
      title: "Ditolak SRM Hartrans",
      timestamp: "20 Mei 2026 12:37:01",
      detail: {
        avatar: { initials: "SS" },
        name: "Susanti SRM Hartrans P3BKAL",
        description: "Ditolak SRM Hartrans",
      },
      note: { label: "Alasan ditolak: disesuaikan kembali" },
    },
    {
      id: "4",
      status: "warning",
      title: "Menunggu Persetujuan SRM Hartrans",
      timestamp: "20 Mei 2026 12:33:24",
      detail: {
        avatar: { initials: "MM" },
        name: "Meimei MSB Fashar P3BKAL",
        description: "Menunggu Persetujuan SRM Hartrans",
      },
    },
    {
      id: "5",
      status: "info",
      title: "Draft",
      timestamp: "20 Mei 2026 12:32:23",
      detail: {
        avatar: { initials: "EM" },
        name: "Ehsan MSB Fashar P3BSUL",
        description: "Draft",
      },
    },
  ]}
/>
```

Hasil persis seperti screenshot.

---

## Quick Start (compositional)

Untuk kasus dengan custom content di tiap item (mis. embed komponen lain):

```tsx
import { Timeline, TimelineItem } from "@dep/ui/timeline";
import { Button } from "@dep/ui/button";

<Timeline title="Log Mutasi" subtitle="Riwayat perubahan">
  <TimelineItem
    status="warning"
    title="Menunggu Persetujuan"
    timestamp="20 Mei 2026 12:38:26"
    isCurrent
  >
    {/* Konten custom di item ini saja */}
    <div className="flex gap-2 mt-2">
      <Button variant="primary" size="sm">Approve</Button>
      <Button variant="danger-outline" size="sm">Reject</Button>
    </div>
  </TimelineItem>

  <TimelineItem
    status="info"
    title="Draft"
    timestamp="20 Mei 2026 12:38:02"
    detail={{
      avatar: { initials: "MM" },
      name: "Meimei MSB Fashar P3BKAL",
      description: "Draft",
    }}
  />
</Timeline>
```

Anda tidak perlu mengatur `isLast` — `Timeline` mendeteksinya otomatis untuk children terakhir.

---

## Props API

### `Timeline`

| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `title` | `ReactNode` | — | Judul section (e.g. "Log Mutasi") |
| `subtitle` | `ReactNode` | — | Subtitle di bawah judul |
| `variant` | `"default" \| "compact" \| "bordered"` | `"default"` | Visual variant |
| `theme` | `"light" \| "dark"` | `"light"` | Palette |
| `items` | `TimelineEntry[]` | — | Data deklaratif |
| `children` | `ReactNode` | — | `<TimelineItem>` children (override `items` jika diisi) |
| `className` | `string` | — | Append ke container |

> `items` & `children` saling **mutually exclusive** — jika `children` ada, `items` diabaikan.

---

### `TimelineItem`

| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `status` | `TimelineStatus` | `"neutral"` | Warna ikon + accent |
| `title` | `ReactNode` | — | **Wajib** — judul item |
| `timestamp` | `ReactNode` | — | Pre-formatted string (mis. "20 Mei 2026 12:38:26") |
| `icon` | `ReactNode` | (default per status) | Override ikon |
| `isCurrent` | `boolean` | `false` | Tampilkan badge "Status saat ini" |
| `currentLabel` | `string` | `"Status saat ini"` | Label badge |
| `detail` | `TimelineDetail` | — | Detail card (avatar + name + desc) |
| `note` | `TimelineNote` | — | Footnote (mis. alasan ditolak) |
| `children` | `ReactNode` | — | Konten custom di bawah detail/note |
| `theme` | `"light" \| "dark"` | (dari Timeline) | Override theme |
| `variant` | `TimelineVariant` | (dari Timeline) | Override variant |
| `isLast` | `boolean` | (auto) | Sembunyikan connector di bawah |

---

### `TimelineEntry`

Format object untuk `items` array. Field-nya sama persis dengan `TimelineItemProps` plus `id` (wajib, untuk React key):

```ts
interface TimelineEntry {
  id: string;                          // wajib — React key
  status?: TimelineStatus;
  title: ReactNode;                    // wajib
  timestamp?: ReactNode;
  icon?: ReactNode;
  isCurrent?: boolean;
  currentLabel?: string;
  detail?: TimelineDetail;
  note?: TimelineNote;
  children?: ReactNode;
}
```

---

### `TimelineDetail`

```ts
interface TimelineDetail {
  avatar?: {
    src?: string;           // URL — kalau ada, pakai <img>
    initials?: string;      // fallback kalau src kosong (max 2 char)
    alt?: string;
  };
  name: ReactNode;          // primary line (bold)
  description?: ReactNode;  // secondary line (tinted by status)
  descriptionTone?: TimelineStatus | "default";  // override warna desc
}
```

`descriptionTone` defaults ke `status` item. Set `"default"` untuk teks normal (abu-abu).

---

### `TimelineNote`

```ts
interface TimelineNote {
  label: ReactNode;
  tone?: TimelineStatus | "default";  // default: "danger" (merah)
}
```

Digunakan untuk catatan/alasan tambahan. Default tone `danger` cocok untuk rejection reason.

---

## Status & Color Tokens

5 status, masing-masing punya `iconBg + iconRing + iconFg + textAccent + avatarBg + avatarFg`:

| Status | Use case | Light | Dark |
|---|---|---|---|
| `success` | Disetujui, selesai | Hijau | Hijau (lebih cerah) |
| `warning` | Menunggu approval, in review | Orange | Orange muda |
| `danger` | Ditolak, gagal, error | Merah | Merah muda |
| `info` | Draft, in progress | Biru | Cyan |
| `neutral` | Generic / tanpa makna | Abu-abu | Abu-abu |

**Akses programatik:**

```tsx
import { getStatusTokens } from "@dep/ui/timeline";

const tokens = getStatusTokens("warning", "light");
// { iconBg: "bg-orange-50", iconRing: "ring-orange-200", iconFg: "text-orange-500", ... }
```

Berguna kalau Anda butuh consistency di luar Timeline (mis. tombol approve/reject yang harus match warna status).

---

## Variants

### `default` (default)

Versi standar — circular icon + connector line + spacing nyaman. Persis seperti screenshot referensi.

### `compact`

Spacing & icon sedikit lebih kecil (h-8 w-8 vs h-10 w-10). Detail card tanpa border. Cocok untuk sidebar / panel dengan ruang terbatas.

```tsx
<Timeline variant="compact" items={items} />
```

### `bordered`

Container Timeline dibungkus border + padding (`rounded-xl border p-6`). Cocok kalau Timeline berdiri sendiri sebagai card di dashboard.

```tsx
<Timeline variant="bordered" items={items} />
```

---

## Theme (Light / Dark)

Atur via prop `theme`:

```tsx
<Timeline theme="dark" items={items} />
```

Semua sub-primitif menerima `theme` dan menyesuaikan palette otomatis (lihat tabel di [Status & Color Tokens](#status--color-tokens)).

Theme di `Timeline` akan **di-cascade** ke `<TimelineItem>` children — Anda tidak perlu set di tiap item.

---

## Custom Icons

Default tiap status pakai ikon Lucide yang sesuai (Clock, FilePlus, CheckCircle2, XCircle, AlertCircle). Override per-item:

```tsx
import { Banknote, FileCheck } from "lucide-react";

<Timeline items={[
  { id: "1", status: "success", title: "Pembayaran berhasil", icon: <Banknote size={18} /> },
  { id: "2", status: "info",    title: "Dokumen diterbitkan",   icon: <FileCheck size={18} /> },
]} />
```

Ikon Anda otomatis dibungkus lingkaran berwarna sesuai `status`.

---

## Sub-primitives

Semua di-export — bisa dipakai sendiri-sendiri di luar `<Timeline>`:

| Komponen | Fungsi |
|---|---|
| `<TimelineIcon status theme icon size>` | Lingkaran ikon berwarna |
| `<TimelineBadge status theme>` | Pill "current status" |
| `<TimelineDetail detail status theme bordered>` | Card avatar + name + desc |
| `<TimelineNote note theme>` | Footnote satu baris |

Contoh — bikin step indicator custom:

```tsx
import { TimelineIcon, TimelineBadge } from "@dep/ui/timeline";

<div className="flex items-center gap-3">
  <TimelineIcon status="success" theme="light" />
  <TimelineBadge status="warning" theme="light">In review</TimelineBadge>
</div>
```

---

## Resep / Pattern Umum

### 1. Format timestamp dari Date

Component menerima `timestamp: ReactNode`, jadi format-nya di luar Timeline:

```tsx
const formatId = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) +
  " " + d.toLocaleTimeString("id-ID");

<Timeline items={logs.map(log => ({
  id: log.id,
  status: log.statusKey,
  title: log.title,
  timestamp: formatId(new Date(log.createdAt)),
  detail: { avatar: { initials: log.actorInitials }, name: log.actorName, description: log.action },
}))} />
```

### 2. Loading state

`Timeline` tidak memiliki built-in skeleton — render skeleton items sendiri:

```tsx
{isLoading ? (
  <Timeline items={Array.from({ length: 3 }, (_, i) => ({
    id: `sk-${i}`,
    status: "neutral",
    title: <span className="bg-gray-200 animate-pulse rounded h-4 w-32 inline-block" />,
    timestamp: <span className="bg-gray-100 animate-pulse rounded h-3 w-24 inline-block" />,
  }))} />
) : (
  <Timeline items={data} />
)}
```

### 3. Empty state

Tampilkan empty state di luar `<Timeline>`:

```tsx
{logs.length === 0
  ? <EmptyState message="Belum ada aktivitas" />
  : <Timeline items={logs} />}
```

### 4. Group by date (header per hari)

Pakai compositional API + render header sendiri:

```tsx
<Timeline title="Log Aktivitas">
  {groupedByDay.map(([date, entries]) => (
    <Fragment key={date}>
      <li className="text-xs text-gray-500 font-medium uppercase tracking-wider py-2 pl-14">
        {date}
      </li>
      {entries.map(e => <TimelineItem key={e.id} {...e} />)}
    </Fragment>
  ))}
</Timeline>
```

### 5. Combine dengan Confirm dialog untuk action

```tsx
import { confirm } from "@dep/ui/confirm";

<TimelineItem status="warning" title="Menunggu approval" isCurrent>
  <div className="flex gap-2 mt-2">
    <Button onClick={async () => {
      const ok = await confirm({ title: "Setujui mutasi ini?", message: "Aksi tidak bisa dibatalkan." });
      if (ok) await api.approve();
    }}>Approve</Button>
  </div>
</TimelineItem>
```

### 6. Real-time updates

Item baru muncul di atas → urutkan data DESC by timestamp di parent component. `Timeline` render apa adanya.

### 7. Icon-only mode (tanpa title/timestamp)

Pakai compositional API + sembunyikan title via style:

```tsx
<TimelineItem
  status="success"
  title={<span className="sr-only">Done</span>}
  detail={{ avatar: { initials: "AA" }, name: "Andi Approved", description: "Approved" }}
/>
```

---

## Architectural Decisions

| Decision | Alasan |
|---|---|
| Dua API (data-driven + compositional) | Simple cases tidak perlu boilerplate; complex cases tidak terkunci |
| Status-driven coloring | Konsisten otomatis — tidak ada chance "biru di sini, hijau di sana untuk hal yang sama" |
| Theme via prop, bukan CSS variable | Eksplisit & predictable; tidak ada hidden global dependency |
| Tokens di file terpisah (`statusTokens.ts`) | Ganti palette di 1 tempat → seluruh Timeline berubah |
| Sub-primitives di-export | Komposisi custom tidak perlu fork |
| `isLast` auto-detected | Connector line tidak perlu di-manage user |
| Pakai `<ol>` + `<li>` | Semantic — screen reader bilang "Item 1 of 5", dll |
| Connector pakai absolute positioning | Tidak butuh known height; bekerja dengan content variable |

---

*Bagian dari `src/lib/ui/timeline/`. Update jika ada status baru, variant baru, atau primitif baru.*
