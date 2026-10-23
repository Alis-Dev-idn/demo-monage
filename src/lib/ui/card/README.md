# Card / Box (`@dep/ui/card`)

```
card/
├── types.ts                 — Tone / CardVariant / StatusVariant / semua props interface
├── card.css                 — token tema + tone palette + helper class (pulse, skeleton)
├── Box/                     — primitif container generic
│   ├── Box.tsx              — surface: solid/soft/outlined/ghost/gradient
│   ├── InfoBox.tsx          — callout/alert (info/success/warning/error/neutral)
│   ├── Section.tsx          — wrapper halaman (title + subtitle + toolbar)
│   ├── Divider.tsx          — garis pemisah (horizontal/vertical/label)
│   └── index.ts
├── Card/                    — Card dengan compound API
│   ├── Card.tsx             — Card + .Header/.Body/.Footer/.Title/.Subtitle/.Label
│   └── index.ts
├── widgets/                 — widget komposit siap-pakai
│   ├── Stat.tsx             — KPI block (label + value + caption + icon)
│   ├── MetricItem.tsx       — pair label uppercase + value mono
│   ├── StatusPill.tsx       — pill dot+label (online/warning/offline/error/info/neutral)
│   ├── IconChip.tsx         — kotak rounded tone-soft + icon
│   ├── GroupRow.tsx         — baris dengan accent bar warna kiri
│   ├── ActivityRow.tsx      — feed item (icon + title + meta + time)
│   ├── ListBox.tsx          — section container (header + body list)
│   └── index.ts
├── index.ts                 — barrel: `export * from "./Box" | "./Card" | "./widgets"`
└── README.md
```

Library kartu & box modular untuk dashboard. Mengikuti **screenshot SiMonit**: stat KPI di atas, deretan device card, list group dengan accent bar, recent activity. Semua data datang dari props caller — **tidak ada teks/nilai yang di-hardcode**, hanya **variant style** (tone, padding, radius, dll.) yang fixed.

Styling campuran:
- Tailwind utilities untuk layout, spacing, typography.
- `card.css` menyimpan **token tema** (`--crd-bg`, `--crd-text`, …) + **palette tone** (`data-tone="accent|cyan|emerald|amber|rose|violet|slate"`) + pulse animation + skeleton shimmer.

---

## Komponen

### Box family — primitif tanpa struktur internal
| Komponen | Untuk apa |
|---|---|
| `Box` | Container generic. Variant `surface` (`solid`/`soft`/`outlined`/`ghost`/`gradient`), `pad`, `radius`, `shadow`, `tone`, `accent` (left/top/right/bottom), `interactive`, `fill`, `as`. |
| `InfoBox` | Callout/alert dengan variant `info`/`success`/`warning`/`error`/`neutral` + title + description + optional icon/action/close. |
| `Section` | Wrapper halaman: header (title+subtitle+icon+toolbar) lalu body. Tanpa background. |
| `Divider` | Garis pemisah horizontal/vertical, opsional label di tengah, opsional dashed. |

### Card family — container dengan compound API
| Komponen | Untuk apa |
|---|---|
| `Card` (+ `.Header`, `.Body`, `.Footer`, `.Title`, `.Subtitle`, `.Label`) | Container primitif dengan slot. |
| `Stat` | KPI block (label uppercase, nilai besar, caption + ikon chip). |
| `MetricItem` | Pair label+value kompak (untuk grid di dalam card device). |
| `StatusPill` | Pill dot+label dengan variant (`online`/`warning`/`offline`/`error`/`info`/`neutral`). |
| `IconChip` | Kotak rounded dengan tone-soft + ikon. |
| `GroupRow` | Baris dengan accent bar warna kiri + title + meta + chevron. |
| `ListBox` | Section container (header + body), untuk daftar Devices, My Groups, dll. |
| `ActivityRow` | Baris kompak icon chip + title + time. |

> Kapan pakai `Box` vs `Card`?
> - **`Box`**: container murni — Anda menyusun isinya sendiri dengan Tailwind / komponen lain. Cocok untuk panel ringan, dekor, callout, layout helper.
> - **`Card`**: container dengan compound API (`.Header`/`.Body`/`.Footer`). Cocok untuk widget berstruktur (KPI, device card).
> - **`ListBox`**: `Card` yang sudah berisi header standar + body list — paling cepat untuk section "Devices / My Groups / Recent activity".

## Variant pool

- **Card.variant**: `elevated` (default), `outlined`, `ghost`, `filled` (latar = tone-soft).
- **Card.pad**: `none | sm | md | lg`.
- **Card.radius**: `sm | md | lg`.
- **Card.accentBar**: tampilkan bar warna 4px di kiri sesuai `tone`.
- **Card.interactive** / `onClick`: hover lift + cursor pointer.
- **tone** (semua komponen): `accent | cyan | emerald | amber | rose | violet | slate` — meneruskan satu set warna ke sub-komponen via `data-tone`.
- **StatusPill.variant**: `online` (emerald) · `warning` (amber) · `offline` (slate) · `error` (rose) · `info` (accent) · `neutral` (slate) · plus `pulse` untuk dot berdenyut.

---

## Box family examples

```tsx
import { Box, InfoBox, Section, Divider, Stat } from "@dep/ui/card";

// Solid panel dengan accent bar atas
<Box surface="solid" accent="top" tone="accent" pad="lg" radius="lg" shadow="sm">
  <h3 className="text-base font-semibold">Live overview</h3>
  <p className="text-[var(--crd-text-muted)] text-sm mt-1">Status sistem realtime.</p>
</Box>

// Soft panel berlatar tone-soft, sebagai background untuk grup card
<Box surface="soft" tone="violet" pad="lg" radius="lg">
  <Section title="Energy Today" subtitle="Konsumsi vs target">
    <Chart data={...} xKey="t" series={...} />
  </Section>
</Box>

// Gradient surface — header hero halaman
<Box surface="gradient" tone="emerald" pad="lg" radius="lg" shadow="md">
  <h1 className="text-2xl font-bold">Good afternoon, {user.name}</h1>
  <p className="opacity-80 mt-1">Here's what's happening across your devices right now.</p>
</Box>

// Interactive ghost (klik untuk drill-down)
<Box surface="ghost" pad="md" interactive onClick={() => nav("/details")}>
  <Stat label="Active alerts" value={alerts.length} tone="rose" />
</Box>

// Callouts
<InfoBox variant="success" title="Backup complete"
         description="Snapshot tersimpan ke S3 pukul 14:02." />
<InfoBox variant="warning" title="Device offline"
         description="CNC Machine A tidak merespon selama 12 menit."
         action={{ label: "Investigate", onClick: openTicket }}
         onClose={dismiss} />
<InfoBox variant="error" title="Connection lost" surface="outlined" icon={<WifiOff />} />

// Section + Divider
<Section title="Devices" subtitle="8 perangkat terdaftar"
         icon={<Devices size={18} />}
         toolbar={<Tabs ... />}
         divider>
  {/* grid card di sini */}
</Section>

<Divider label="Yesterday" dashed spacing="lg" />
```

---

## Quick examples

### Stat card row (4 KPI)

```tsx
import { Stat } from "@dep/ui/card";
import { Cpu, Zap, BatteryCharging, Gauge } from "lucide-react";

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Stat label="Devices Online" value={summary.online} unit={`/${summary.total}`}
        caption={`${summary.percent}% live`} icon={<Cpu size={18} />} tone="emerald" />
  <Stat label="Total Power In" value={summary.powerIn.toFixed(1)} unit="kW"
        caption={`+${summary.powerInDeltaPct}% vs avg`} icon={<Zap size={18} />} tone="accent" />
  <Stat label="Energy Today" value={summary.energy.toFixed(1)} unit="kWh"
        caption="↑ on track" icon={<BatteryCharging size={18} />} tone="rose" />
  <Stat label="Avg Power Factor" value={summary.pf.toFixed(2)}
        caption={summary.health} icon={<Gauge size={18} />} tone="violet" />
</div>
```

### Device card (mix Card + StatusPill + MetricItem)

```tsx
import { Card, MetricItem, StatusPill } from "@dep/ui/card";

<Card accentBar tone={device.statusTone}>
  <Card.Header>
    <div className="min-w-0">
      <Card.Title size="md">{device.name}</Card.Title>
      <Card.Subtitle>{device.description}</Card.Subtitle>
    </div>
    <StatusPill variant={device.status} pulse={device.status === "online"} />
  </Card.Header>

  <div className="grid grid-cols-2 gap-3 mt-4">
    <MetricItem label="Power In"  value={device.powerIn.toFixed(2)}  unit="kW" />
    <MetricItem label="Power Out" value={device.powerOut.toFixed(2)} unit="kW" align="right" />
  </div>

  <Card.Footer>
    <span>{device.groupName ?? "No group"}</span>
    <span>{device.lastSeen}</span>
  </Card.Footer>
</Card>
```

### "My groups" list

```tsx
import { ListBox, GroupRow } from "@dep/ui/card";

<ListBox
  title="My groups"
  icon={<Layers size={16} />}
  action={{ label: "View all →", onClick: () => nav("/groups") }}
>
  {groups.map((g) => (
    <GroupRow
      key={g.id}
      title={g.name}
      meta={`${g.deviceCount} devices · ${g.memberCount} members`}
      barColor={g.color}
      onClick={() => nav(`/groups/${g.id}`)}
    />
  ))}
</ListBox>
```

### Recent activity

```tsx
import { ListBox, ActivityRow } from "@dep/ui/card";

<ListBox title="Recent activity" icon={<Activity size={16} />} count={feed.length}>
  {feed.map((a) => (
    <ActivityRow
      key={a.id}
      tone={a.tone}
      icon={a.icon}
      title={a.title}
      meta={a.meta}
      time={a.timeAgo}
      onClick={() => nav(a.href)}
    />
  ))}
</ListBox>
```

---

## API singkat

```ts
// Tone — meneruskan satu palette ke seluruh anak.
type Tone = "accent" | "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";

// Status variant → otomatis dipetakan ke tone.
type StatusVariant = "online" | "warning" | "offline" | "error" | "info" | "neutral";

// Box surface variants
type BoxSurface = "solid" | "soft" | "outlined" | "ghost" | "gradient";
type BoxAccent  = "none" | "left" | "top" | "right" | "bottom";

// Box family
<Box surface pad radius shadow tone accent interactive fill as onClick />
<InfoBox variant="info|success|warning|error|neutral"
         title description icon action={{label,onClick,placement}} onClose />
<Section title subtitle icon toolbar divider gap />
<Divider orientation="horizontal|vertical" label spacing dashed />

// Card family
<Card variant pad radius tone accentBar interactive onClick />
<Card.Header /> <Card.Body /> <Card.Footer />
<Card.Title size="sm|md|lg|xl" /> <Card.Subtitle /> <Card.Label tone />

<Stat label value unit caption trend icon tone variant pad />
<MetricItem label value unit align="left|right" />
<StatusPill variant label pulse />
<IconChip tone size="sm|md|lg" rounded="md|lg|full">{icon}</IconChip>
<GroupRow title meta barColor showArrow onClick />
<ListBox title icon count action={{label,onClick}} tabs variant pad>{children}</ListBox>
<ActivityRow icon title meta time tone onClick />
```

---

## Theming

Override token di global CSS (atau scope element dengan `[data-card-theme="dark"]`):

```css
[data-card-theme="dark"] {
  --crd-bg: #0d1424;
  --crd-bg-elev: #111a2e;
  --crd-text: #e6edf7;
  /* … */
}
```

Tone palette juga override-able:

```css
[data-tone="emerald"] {
  --tone: #059669;
  --tone-soft: rgba(5, 150, 105, 0.2);
  --tone-text: #34d399;
  --tone-bar: #10b981;
}
```

> Token Dashboard (`--db-*`) dan Card (`--crd-*`) sengaja terpisah agar setiap library bisa dipakai sendiri. Anda bebas memadukan via custom CSS.
