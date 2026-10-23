# Chart (`@dep/ui/chart`)

```
chart/
├── Chart.tsx                — komponen utama (compose semuanya)
├── types.ts                 — ChartProps, ChartSeries, ChartType, PanConfig
├── constants.ts             — DEFAULT_PALETTE, DEFAULT_MARGIN
├── chart.css                — token tema + cursor utilities + tooltip
├── hooks/
│   ├── useChartBounds.ts    — hitung y-domain otomatis
│   ├── usePan.ts            — state + handler pan/zoom (pointer & wheel)
│   └── index.ts
├── components/
│   ├── ChartTooltip.tsx     — Tooltip kustom + `makeTooltipContent()`
│   ├── ChartSeries.tsx      — renderer Line/Area/Bar per-series
│   ├── ChartResetButton.tsx — tombol reset overlay
│   └── index.ts
├── index.ts                 — barrel
└── README.md
```

> Semua building block diekspor lewat barrel. Bila Anda ingin compose chart custom (mis. menambah brush bar, annotations, dll), import langsung dari `@dep/ui/chart` — `usePan`, `useChartBounds`, `ChartTooltip`, `makeTooltipContent`, `renderSeries`, `renderAllSeries`, `ChartResetButton`, dst.

Wrapper Recharts untuk **line / area / bar / composed** dengan dua mode pemakaian:

- **Fixed** (default) — render seluruh data, tidak bisa digeser.
- **Pan** — drag kiri-kanan untuk geser sumbu X, dan/atau atas-bawah untuk geser sumbu Y. Opsional **wheel zoom** untuk memperbesar/perkecil jendela X.

Semua data + definisi series datang dari props. Tidak ada hardcode.

---

## Install

Sudah dipasang di repo:

```jsonc
// package.json
"dependencies": { "recharts": "^2.13.0" }
```

---

## Quick start (fixed view)

```tsx
import { Chart } from "@dep/ui/chart";

<Chart
  data={[
    { t: "00:00", powerIn: 12.4, powerOut: 11.9 },
    { t: "01:00", powerIn: 13.1, powerOut: 12.5 },
    /* … */
  ]}
  xKey="t"
  series={[
    { key: "powerIn",  name: "Power In",  color: "#3b82f6", type: "area" },
    { key: "powerOut", name: "Power Out", color: "#10b981", type: "line" },
  ]}
  type="line"   // default chart type untuk series tanpa `type`
  height={280}
/>
```

> Tanpa prop `pan` → user tidak bisa menggeser chart.

## Pan: drag horizontal

```tsx
<Chart
  data={dataset}                 // misal 1000 titik
  xKey="t"
  series={series}
  type="area"
  pan={{
    x: true,
    windowSize: 50,              // tampilkan 50 titik sekaligus
    wheelZoom: true,             // scroll wheel = zoom in/out
    resetLabel: "Reset",         // tampilkan tombol reset saat user menggeser
  }}
/>
```

Behavior:
- Pointer down + drag horizontal → menggeser jendela 50 titik di sepanjang dataset.
- Wheel up → window mengecil (zoom in). Wheel down → window membesar.
- Tahan **Shift** saat wheel → biarkan event lewat (page scroll).
- Tombol "Reset" muncul saat state berubah dari default.

## Pan: drag vertical (Y-axis)

```tsx
<Chart
  data={dataset}
  xKey="t"
  series={[{ key: "temperature", color: "#f43f5e" }]}
  pan={{
    y: true,
    yWindowSize: 20,             // tinggi viewport y = 20 unit
    yMin: 0,                     // batas bawah domain
    yMax: 120,                   // batas atas domain
  }}
/>
```

Behavior:
- Drag ke atas → "naik" ke nilai yang lebih besar (yOffset bertambah).
- Drag ke bawah → turun.
- Clamp ke `[yMin, yMax]`. Jika `yMin`/`yMax` tidak diset, dihitung otomatis dari data.

## Pan: keduanya

```tsx
pan={{
  x: true,  windowSize: 50,
  y: true,  yWindowSize: 20, yMin: 0, yMax: 100,
  wheelZoom: true,
  resetLabel: "Reset view",
}}
```

Pointer drag bekerja **dua sumbu** sekaligus (deltaX & deltaY).

---

## Mix tipe series (Composed)

`series[].type` meng-override `type` default untuk series tersebut:

```tsx
<Chart
  data={dataset}
  xKey="date"
  type="area"
  series={[
    { key: "revenue", name: "Revenue", color: "#10b981", type: "area" },
    { key: "target",  name: "Target",  color: "#94a3b8", type: "line", dashed: true },
    { key: "orders",  name: "Orders",  color: "#3b82f6", type: "bar"  },
  ]}
/>
```

Series support `stackId` untuk stacked area/bar:
```tsx
series={[
  { key: "ios",     stackId: "os", type: "bar", color: "#3b82f6" },
  { key: "android", stackId: "os", type: "bar", color: "#10b981" },
]}
```

---

## Props lengkap

```ts
interface ChartProps<Row> {
  data: Row[];
  xKey: keyof Row;
  series: ChartSeries[];
  type?: "line" | "area" | "bar";    // default series type, default "line"

  pan?: {
    x?: boolean;                     // drag horizontal
    y?: boolean;                     // drag vertikal (butuh yWindowSize)
    windowSize?: number;             // jumlah titik tampak di X
    yWindowSize?: number;            // tinggi viewport Y (unit)
    yMin?: number;
    yMax?: number;
    wheelZoom?: boolean;             // scroll wheel zoom X
    resetLabel?: string;             // tampilkan tombol reset
  };

  height?: number;                   // default 280
  width?: number | string;           // default "100%"
  grid?: boolean;                    // default true
  legend?: boolean;                  // default true
  tooltip?: boolean;                 // default true

  valueFormatter?: (v: number, key: string) => string;
  xTickFormatter?: (v: unknown, i: number) => string;
  palette?: string[];                // default 7 warna
  background?: string;               // default "transparent"
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  margin?: { top?; right?; bottom?; left? };
}

interface ChartSeries {
  key: string;                       // property name di data row
  name?: string;                     // label di tooltip/legend
  color?: string;
  type?: "line" | "area" | "bar";
  strokeWidth?: number;
  fillOpacity?: number;              // default 0.18 untuk area
  stackId?: string;
  dashed?: boolean;
  hidden?: boolean;                  // tetap di legend, tidak digambar
}
```

---

## Theming

Override token di global CSS:

```css
[data-chart-theme="dark"] {
  --cht-grid:         rgba(255, 255, 255, 0.06);
  --cht-axis:         #6b7791;
  --cht-axis-strong:  #9aa6ba;
  --cht-tooltip-bg:   #15203a;
  --cht-tooltip-text: #e6edf7;
}
```

Atau set warna langsung di setiap `series[].color` + `palette` untuk konsistensi.

---

## Tips

1. **Datasets besar**: kombinasikan `pan.x` + `windowSize` daripada render 10.000 titik sekaligus. Recharts tetap menggambar semua di slice yang visible, jadi performa stabil.
2. **Realtime data**: cukup `setData([...prev, newPoint])`. Saat pan aktif, `xStart` otomatis di-clamp jika data array memendek; saat user di ujung kanan dan data tumbuh, tetap diam di posisi-nya — tambahkan logic auto-follow di caller kalau perlu (mis. `setState({ xStart: data.length - windowSize })`).
3. **Mobile**: pointer events native dipakai, jadi touch drag jalan tanpa konfigurasi tambahan.
4. **Disable pan sementara**: cukup hapus prop `pan` atau set `pan={undefined}`.
