# Map (`@dep/ui/map`)

Komponen peta interaktif berbasis **MapLibre GL JS**. Menyediakan komponen primitif (Map, Marker, Popup) dan layer kompleks (Cluster, Heatmap, Geofence, Route, Drawing) dengan API React deklaratif.

---

## Daftar Isi
1. [Fitur](#fitur)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Setup `MapKit`](#setup-mapkit)
5. [`<Map>` — Komponen Utama](#map--komponen-utama)
6. [Komponen Marker & Popup](#komponen-marker--popup)
7. [Layer Komponen](#layer-komponen)
8. [Geofence & Detection](#geofence--detection)
9. [Clustering (Supercluster)](#clustering-supercluster)
10. [Heatmap Layer](#heatmap-layer)
11. [Drawing Control](#drawing-control)
12. [Overlay & Controls](#overlay--controls)
13. [Hook `useRealtimeLocation`](#hook-userealtimelocation)
14. [Type Reference](#type-reference)
15. [Tips & Gotchas](#tips--gotchas)

---

## Fitur
1. **Map dasar** dengan style apapun yang kompatibel MapLibre (Mapbox style spec).
2. **Marker** dengan konten React + dragging.
3. **Popup** standar dan **DraggablePopup** dengan leader-line.
4. **Layer GeoJSON** untuk fill/line/circle.
5. **Route** (polyline antar koordinat).
6. **Geofence** dengan deteksi point-in-polygon + callback enter/leave.
7. **Heatmap** dengan weight per titik.
8. **Clustering** ribuan titik via Supercluster.
9. **Drawing** untuk membuat polygon / line / point.
10. **Style switcher** + **Layer toggle control**.
11. **Realtime location** dengan smooth animation.

---

## Struktur Folder

```
src/lib/ui/map/
├── index.ts
├── core/MapKit.ts
├── components/
│   ├── Map/Map.tsx                # <Map>
│   ├── Map/MapContext.ts          # useMapContext()
│   ├── Marker/Marker.tsx
│   ├── Popup/Popup.tsx
│   ├── Popup/DraggablePopup.tsx
│   ├── Route/Route.tsx
│   ├── GeoJsonLayer/GeoJsonLayer.tsx
│   ├── HeatmapLayer/HeatmapLayer.tsx
│   ├── Geofence/Geofence.tsx
│   ├── ClusterLayer/SuperClusterLayer.tsx
│   ├── DrawControl/DrawControl.tsx
│   ├── MapStyleSwitcher/MapStyleSwitcher.tsx
│   ├── LayerControl/LayerControl.tsx
│   └── MapOverlay/MapOverlay.tsx
└── hooks/useRealtimeLocation.ts
```

---

## Quick Start

```tsx
import { Map, MapKit, Marker, Popup } from "@dep/ui/map";

MapKit.setup({
  defaultCenter: [106.8272, -6.1751], // Jakarta [lng, lat]
  defaultZoom: 12,
  styleUrl: "https://demotiles.maplibre.org/style.json",
});

function MyMap() {
  return (
    <div style={{ width: "100%", height: 500 }}>
      <Map>
        <Marker lng={106.8272} lat={-6.1751}>
          <div className="bg-red-500 w-4 h-4 rounded-full border-2 border-white" />
        </Marker>
        <Popup lng={106.8272} lat={-6.1751} open>
          <strong>Jakarta</strong>
        </Popup>
      </Map>
    </div>
  );
}
```

> **Penting:** parent `<Map>` **harus** memiliki width & height eksplisit, atau peta tidak akan render.

---

## Setup `MapKit`

```typescript
MapKit.setup(config: MapConfig): void
MapKit.getConfig(): MapConfig

interface MapConfig {
  defaultCenter?: [number, number];   // [lng, lat]
  defaultZoom?: number;
  styleUrl?: string;
}
```

Default:
```typescript
{
  defaultCenter: [106.8272, -6.1751],
  defaultZoom: 12,
  styleUrl: "https://demotiles.maplibre.org/style.json",
}
```

---

## `<Map>` — Komponen Utama

```tsx
<Map
  center?={[number, number]}    // override default
  zoom?={number}
  styleUrl?={string}            // hanya berefek saat init
  className?={string}
>
  {/* children: marker, popup, layer, overlay */}
</Map>
```

Children hanya di-render setelah event `load` MapLibre. Akses raw `map` lewat context:

```tsx
import { useMapContext } from "@dep/ui/map";

function FlyToButton() {
  const { map } = useMapContext();
  return <button onClick={() => map?.flyTo({ center: [107, -6.9], zoom: 14 })}>Fly</button>;
}
```

---

## Komponen Marker & Popup

### `<Marker>`

```tsx
<Marker
  lng={number}
  lat={number}
  draggable?={boolean}
  onDragEnd?={(coords: { lng, lat }) => void}
  className?={string}
>
  {/* konten React, default kosong (titik MapLibre default tidak muncul) */}
</Marker>
```

Children **wajib diberi tampilan visual sendiri** (mis. `<div className="w-4 h-4 rounded-full bg-red-500">`). Marker dirender via `createRoot` ke DOM yang dipasang ke `maplibregl.Marker`.

### `<Popup>`

```tsx
<Popup
  lng={number}
  lat={number}
  open?={boolean}              // default: true
  closeButton?={boolean}       // default: true
  closeOnClick?={boolean}      // default: false
  maxWidth?={string}           // default: "240px"
  className?={string}
>
  {children}
</Popup>
```

### `<DraggablePopup>` (eksperimental)

Popup yang bisa di-drag dengan **leader line** ke titik anchor. Berguna untuk callout pada peta padat.

```tsx
<DraggablePopup
  lng={107.6} lat={-6.9}
  open
  onClose={() => setOpen(false)}
  lineColor="#ef4444"
>
  <h4>Info</h4>
  <p>Bisa di-drag, terhubung dengan garis ke titik asalnya.</p>
</DraggablePopup>
```

---

## Layer Komponen

### `<GeoJsonLayer>` — primitif paling fleksibel

```tsx
<GeoJsonLayer
  id="districts"
  data={{
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [[[lng,lat], ...]] },
    }],
  }}
  type="fill"                  // "fill" | "line" | "circle"
  color="#3b82f6"
  opacity={0.5}
  width={2}                    // line width / circle radius
  visible
/>
```

| `type` | Cocok untuk geometry |
|---|---|
| `"fill"` | Polygon / MultiPolygon |
| `"line"` | LineString / MultiLineString |
| `"circle"` | Point |

### `<Route>` — wrapper line

```tsx
<Route
  id="delivery"
  coordinates={[[107.6,-6.9], [107.65,-6.88], [107.7,-6.92]]}
  color="#22c55e"
  width={4}
  opacity={0.8}
/>
```

Setara dengan `GeoJsonLayer` dengan LineString tunggal.

---

## Geofence & Detection

```tsx
<Geofence
  id="zone-a"
  polygon={[[107.6,-6.9], [107.7,-6.9], [107.7,-6.8], [107.6,-6.8]]}
  pointsToCheck={[
    { id: "truck-01", lng: 107.65, lat: -6.85 },
    { id: "truck-02", lng: 107.75, lat: -6.9 },
  ]}
  color="#ef4444"
  opacity={0.2}
  onEnter={(pointId) => notify.warning(`${pointId} masuk zone`)}
  onLeave={(pointId) => notify.info(`${pointId} keluar zone`)}
/>
```

- Algoritma: Ray Casting (akurat untuk polygon concave/convex).
- Callback hanya dipicu saat **transisi** (bukan setiap render).

---

## Clustering (Supercluster)

```tsx
<SuperClusterLayer
  points={[
    { id: 1, lng: 107.6, lat: -6.9, properties: { name: "A" } },
    /* ribuan lainnya … */
  ]}
  radius={50}                          // cluster radius (pixel)
  maxZoom={20}                         // sampai zoom berapa di-cluster
  renderMarker={(point) => <Pin />}    // optional override
  renderCluster={(cluster, count) => ( // optional override
    <div className="bg-blue-600 text-white rounded-full" style={{width:30+count, height:30+count}}>
      {count}
    </div>
  )}
/>
```

Click pada cluster → otomatis `flyTo` dengan zoom yang sesuai (Supercluster `getClusterExpansionZoom`).

---

## Heatmap Layer

```tsx
<HeatmapLayer
  id="incidents"
  data={[
    { lng: 107.6, lat: -6.9, weight: 10 },
    { lng: 107.65, lat: -6.88, weight: 5 },
  ]}
  intensity={1.2}
  radius={25}
  opacity={0.7}
  visible
/>
```

Color gradient bawaan (cool → hot). Untuk kustom gradient, gunakan `<GeoJsonLayer>` + MapLibre paint props manual via `useMapContext`.

---

## Drawing Control

```tsx
const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
const [mode, setMode] = useState<"polygon"|"line"|"point"|"none">("none");

<>
  <button onClick={() => setMode("polygon")}>Gambar polygon</button>
  <Map>
    <DrawControl
      mode={mode}
      active={mode !== "none"}
      onUpdate={(feat) => console.log("preview", feat)}
      onCreate={(feat) => {
        setFeatures((prev) => [...prev, feat]);
        setMode("none");
      }}
    />
    {features.map((f, i) => (
      <GeoJsonLayer key={i} id={`f-${i}`} data={f} type={f.geometry.type === "Polygon" ? "fill" : "line"} />
    ))}
  </Map>
</>
```

| Mode | Aksi user |
|---|---|
| `point` | 1× click → finish |
| `line` | click untuk add point, double-click → finish |
| `polygon` | click untuk add point, double-click → close polygon |
| `none` | drawing dinonaktifkan |

---

## Overlay & Controls

### `<MapOverlay>` — slot floating

```tsx
<Map>
  <MapOverlay position="top-right" gap="1rem">
    <MapStyleSwitcher styles={[...]} />
  </MapOverlay>
  <MapOverlay position="bottom-left">
    <LayerControl layers={[...]} onToggle={(id) => ...} />
  </MapOverlay>
</Map>
```

Posisi: `"top-left" | "top-right" | "bottom-left" | "bottom-right"`. Outer container `pointer-events: none`, child `auto` — sehingga map di belakangnya tetap bisa di-pan.

### `<MapStyleSwitcher>`

```tsx
<MapStyleSwitcher
  styles={[
    { label: "Streets", url: "https://demotiles.maplibre.org/style.json" },
    { label: "Satellite", url: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9?access_token=..." },
  ]}
  onChange={(url) => console.log("Style:", url)}
/>
```

### `<LayerControl>`

```tsx
<LayerControl
  layers={[
    { id: "route", label: "Rute pengiriman", visible: showRoute },
    { id: "heatmap", label: "Heatmap insiden", visible: showHeatmap },
  ]}
  onToggle={(id) => toggleLayer(id)}
/>
```

---

## Hook `useRealtimeLocation`

Animasi smooth saat menerima stream koordinat (mis. dari WebSocket / GPS).

```tsx
const { position, rawPosition } = useRealtimeLocation({
  enabled: true,
  smooth: true,
  duration: 1000,    // ms LERP
  stream: {
    subscribe: (push) => {
      // Push koordinat baru kapan saja
      const id = setInterval(() => push({ lng, lat }), 1000);
      return () => clearInterval(id);
    },
  },
});

// Pakai di Marker
<Marker lng={position.lng} lat={position.lat}>
  <div className="bg-blue-500 w-4 h-4 rounded-full" />
</Marker>
```

| Field | Tipe | Keterangan |
|---|---|---|
| `position` | `{ lng, lat }` | Posisi tampil (sudah di-smooth jika `smooth: true`) |
| `rawPosition` | `{ lng, lat }` | Posisi terakhir dari stream (tanpa smoothing) |

---

## Type Reference

```typescript
// MapKit
interface MapConfig { defaultCenter?, defaultZoom?, styleUrl? }

// Map
interface MapProps  { center?, zoom?, styleUrl?, className?, children? }
interface MapContextValue { map: maplibregl.Map | null }

// Marker / Popup
interface MarkerProps         { lng, lat, children?, draggable?, onDragEnd?, className? }
interface PopupProps          { lng, lat, children, open?, closeButton?, closeOnClick?, maxWidth?, className? }
interface DraggablePopupProps { lng, lat, children, open?, onClose?, lineColor?, className? }

// Layers
interface GeoJsonLayerProps { id, data, type?, color?, opacity?, width?, visible? }
interface RouteProps        { id, coordinates, color?, width?, opacity?, visible? }
interface HeatmapPoint      { lng, lat, weight? }
interface HeatmapLayerProps { id, data, intensity?, radius?, opacity?, visible? }
interface ClusterPoint      { id, lng, lat, properties? }
interface SuperClusterLayerProps { points, radius?, maxZoom?, renderMarker?, renderCluster? }
interface GeofenceProps     { id, polygon, pointsToCheck?, color?, opacity?, onEnter?, onLeave? }

// Controls
interface DrawControlProps        { mode?, onCreate?, onUpdate?, active? }
interface MapStyleSwitcherProps   { styles, onChange?, className? }
interface LayerControlProps       { layers, onToggle, className? }
interface MapOverlayProps         { position, children, className?, gap? }

// Hook
interface RealtimeLocationOptions { enabled?, stream?, smooth?, duration? }
```

---

## Tips & Gotchas

1. **Koordinat selalu `[lng, lat]`** — bukan `[lat, lng]`. Mengikuti spec GeoJSON & MapLibre.
2. **Parent container wajib punya tinggi**. `height: 0` → peta tidak muncul.
3. `styleUrl` di prop `<Map>` **hanya** dipakai saat init. Untuk runtime switching, gunakan `<MapStyleSwitcher>` yang memanggil `map.setStyle()`.
4. **Marker children harus visible** — tidak ada UI default. Berikan div dengan ukuran & background.
5. **`<GeoJsonLayer>` `id` harus unik** — duplikat akan crash MapLibre.
6. **`<SuperClusterLayer>` performa**: untuk >10k titik, jaga `radius` ≥ 40 dan render marker yang ringan.
7. **`<DrawControl>` tidak menampilkan preview real-time** saat menggambar — hanya callback (`onUpdate`). Untuk preview, render `<GeoJsonLayer>` manual dari state.
8. **Akses raw map** via `useMapContext()` di child component untuk operasi advance (custom layer, source, event listener).

---

*Lihat [src/lib/ISSUES.md](../../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
