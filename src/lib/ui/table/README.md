# Table (`@dep/ui/table`)

Headless table component dengan **sorting, filtering, pagination, selection, expandable rows, export CSV/Excel, dan responsive switch ke mobile card**. Logika di-handle oleh hook `useTable`; rendering di `<Table>`.

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Hook `useTable`](#hook-usetable)
5. [Komponen `<Table>`](#komponen-table)
6. [Column Configuration](#column-configuration)
7. [Mode Server-side](#mode-server-side)
8. [Selection, Expandable, Search, Filter, Sort](#selection-expandable-search-filter-sort)
9. [Mobile Card](#mobile-card)
10. [Export Excel / CSV](#export-excel--csv)
11. [Type Reference](#type-reference)
12. [Pola Lengkap](#pola-lengkap)

---

## Fitur Utama
1. **Dual mode** — Client-side (`data`) atau server-side (`fetchFn`).
2. **Multi-sort** dengan priority — Kombinasi field untuk sort kompleks.
3. **Search global + per-column filter** dengan operator (`eq`, `like`, `gte`, `lte`, `in`).
4. **Selection** + select-all dari header.
5. **Expandable rows** dengan render sync atau async.
6. **Sticky columns** (kiri/kanan) dengan auto-offset.
7. **Column toggle** — User bisa show/hide column.
8. **Export** CSV & Excel (XLSX).
9. **Responsive** — Otomatis tampil sebagai card di mobile.

---

## Struktur Folder

```
src/lib/ui/table/
├── index.ts                       # Public API
├── types/index.ts
├── hooks/useTable.ts              # State + business logic
├── components/
│   ├── Table.tsx                  # Desktop table + sub-components
│   ├── MobileCard.tsx             # Mobile card view
│   ├── TableStates.tsx            # Skeleton + Empty
│   └── table.css
└── utils/
    ├── exportCsv.ts
    └── exportExcel.ts
```

---

## Quick Start

```tsx
import { useTable, Table } from "@dep/ui/table";

interface User { id: number; name: string; role: string; }

const table = useTable<User>({
  data: users,
  pagination: { size: 10 },
  selection: true,
  columns: [
    { key: "id",   label: "ID",   width: "80px", sortable: true, pinned: "left", mobilePriority: 1 },
    { key: "name", label: "Nama", sortable: true, filterable: true, mobilePriority: 2 },
    { key: "role", label: "Role", render: (v) => <span className="badge">{String(v)}</span> },
    { key: "actions", label: "", pinned: "right", actions: (row) => <button onClick={() => edit(row)}>Edit</button> },
  ],
});

return (
  <div>
    <div className="flex gap-2 mb-3">
      <input placeholder="Cari…" value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
    </div>
    <Table {...table} showPagination showColumnToggle showExport exportFormats={["csv", "excel"]} />
  </div>
);
```

---

## Hook `useTable`

```typescript
function useTable<T extends object>(options: UseTableOptions<T>): UseTableResult<T>
```

### `UseTableOptions<T>`

| Opsi | Tipe | Default | Keterangan |
|---|---|---|---|
| `data` | `T[]` | `[]` | Data client-side. Diisi saat tidak pakai `fetchFn`. |
| `fetchFn` | `(params: TableParams) => Promise<PageResult<T>>` | — | Aktifkan mode server-side. |
| `columns` | `ColumnDef<T>[]` | **wajib** | Definisi kolom. |
| `pagination.page` | `number` | `1` | Halaman awal. |
| `pagination.size` | `number` | `10` | Item per halaman. |
| `selection` | `boolean` | `false` | Aktifkan checkbox per baris. |
| `expandable` | `ExpandableConfig<T>` | — | Konfigurasi expandable row. |
| `mobileBreakpoint` | `number` (px) | `768` | Threshold mobile. |

### `UseTableResult<T>` — yang dikembalikan

**Data & pagination**
```typescript
data: T[]
loading: boolean
isEmpty: boolean
page: number
size: number
total: number
totalPages: number
hasNext: boolean
hasPrev: boolean
setPage(page: number): void
setSize(size: number): void
```

**Sort**
```typescript
sorts: SortConfig[]
setSort(sorts: SortConfig[]): void
addSort(key: string, order: SortOrder, priority?: number): void
removeSort(key: string): void
clearSort(): void
```

**Search & filter**
```typescript
search: string
setSearch(value: string): void

filters: FilterConfig[]
setFilter(key: string, value: unknown, operator?: FilterConfig["operator"]): void
removeFilter(key: string): void
clearFilters(): void
```

**Visibility kolom**
```typescript
visibleColumns: ResolvedColumnDef<T>[]
toggleColumn(key: string): void
showColumn(key: string): void
hideColumn(key: string): void
```

**Selection**
```typescript
selectedRows: T[]
selectedKeys: string[]
toggleRow(row: T): void
toggleAll(): void
isSelected(row: T): boolean
clearSelection(): void
```

**Expand**
```typescript
expandedRows: string[]
toggleExpand(row: T): void
isExpanded(row: T): boolean
collapseAll(): void
```

**Export & lifecycle**
```typescript
exportCsv(filename?: string): void
exportExcel(filename?: string): void
refresh(): void
isMobile: boolean
```

---

## Komponen `<Table>`

`<Table>` menerima **semua** hasil `useTable` (gunakan spread) plus opsi tampilan:

```tsx
<Table
  {...table}
  showPagination
  showColumnToggle
  showExport
  exportFormats={["csv", "excel"]}
  className="bg-white rounded-lg shadow"
  headerClassName="bg-slate-50"
  rowClassName={(row) => row.isFlagged ? "bg-red-50" : ""}
  mobileCardClassName=""
  paginationClassName=""
/>
```

| Prop | Tipe | Default |
|---|---|---|
| `showPagination` | `boolean` | `true` |
| `showColumnToggle` | `boolean` | `false` |
| `showExport` | `boolean` | `false` |
| `exportFormats` | `("csv" \| "excel")[]` | `["csv", "excel"]` |
| `className` | `string` | `""` |
| `headerClassName` | `string` | `""` |
| `rowClassName` | `string \| ((row) => string)` | `""` |
| `mobileCardClassName` | `string` | `""` |
| `paginationClassName` | `string` | `""` |
| `columnToggleClassName` | `string` | `""` |
| `exportClassName` | `string` | `""` |

> **Catatan:** prop `cellClassName` saat ini didefinisikan tapi belum di-wire ke `<td>`. Lihat `ISSUES.md`.

Sub-component yang diekspor:
- `Table.ColumnToggle` — dropdown show/hide kolom.
- `Table.ExportButton` — dropdown export CSV/Excel.
- `TablePagination`, `TableSkeleton`, `TableEmpty` — bisa dipakai standalone.

---

## Column Configuration

```typescript
interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;                                 // "200px", "20%", dll
  pinned?: "left" | "right";
  visible?: boolean;                              // default: true
  render?: (value: unknown, row: T) => ReactNode; // custom cell
  actions?: (row: T) => ReactNode;                // action buttons
  mobilePriority?: number;                        // 1 = title, 2 = body, ≥3 = hidden behind toggle
}
```

### Contoh berbagai kolom

```tsx
// Sticky + sortable + custom render
{ key: "id", label: "ID", width: "80px", pinned: "left", sortable: true, mobilePriority: 1 }

// Custom render
{
  key: "amount",
  label: "Jumlah",
  sortable: true,
  render: (v) => <span className="font-mono">Rp {Number(v).toLocaleString("id-ID")}</span>,
  mobilePriority: 2,
}

// Status badge
{
  key: "status",
  label: "Status",
  render: (v) => (
    <span className={`badge ${v === "active" ? "badge-green" : "badge-red"}`}>
      {String(v)}
    </span>
  ),
  mobilePriority: 2,
}

// Action column (tidak di-export)
{
  key: "actions",
  label: "",
  width: "120px",
  pinned: "right",
  actions: (row) => (
    <div className="flex gap-1">
      <button onClick={() => edit(row)}>Edit</button>
      <button onClick={() => del(row)}>Hapus</button>
    </div>
  ),
}
```

---

## Mode Server-side

Aktifkan dengan menyediakan `fetchFn`. `data`, `pagination`, `sorts`, `filters`, `search` akan diteruskan ke server.

```tsx
const table = useTable<User>({
  columns,
  pagination: { size: 20 },
  fetchFn: async ({ page, size, sort, filters, search }) => {
    const res = await api.get<PageResult<User>>("/users", {
      params: { page, size, sort: JSON.stringify(sort), filters: JSON.stringify(filters), search },
    });
    return res;
  },
});
```

### `PageResult<T>` yang diharapkan server

```typescript
interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}
```

### `TableParams` yang dikirim

```typescript
interface TableParams {
  page: number;
  size: number;
  sort?: SortConfig[];
  filters?: FilterConfig[];
  search?: string;
}
```

Search di-debounce 300ms otomatis pada mode server-side.

---

## Selection, Expandable, Search, Filter, Sort

### Selection

```tsx
const table = useTable({ data, columns, selection: true });

// Akses hasil
table.selectedRows;        // T[]
table.toggleRow(row);
table.toggleAll();
table.clearSelection();
```

### Expandable

```tsx
const table = useTable<User>({
  data, columns,
  expandable: {
    multiple: true,                    // izinkan lebih dari 1 expand sekaligus
    render: (row) => <UserDetail user={row} />,
    // atau async:
    renderAsync: async (row) => {
      const detail = await api.get(`/users/${row.id}/detail`);
      return <UserDetail data={detail} />;
    },
    loadingComponent: <Spinner />,
  },
});
```

### Search global

```tsx
<input value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
```

Client-side: search di seluruh field (case-insensitive). Server-side: dikirim sebagai `search`.

### Filter per-kolom

```tsx
table.setFilter("status", "active");                       // operator: "eq"
table.setFilter("name", "andi", "like");
table.setFilter("price", 100_000, "gte");
table.setFilter("price", 500_000, "lte");
table.setFilter("role", ["ADMIN", "MANAGER"], "in");

table.removeFilter("status");
table.clearFilters();
```

| Operator | Logika (client-side) |
|---|---|
| `eq` (default) | `value === filter` |
| `like` | `String(value).toLowerCase().includes(filter.toLowerCase())` |
| `gte` | `value >= filter` |
| `lte` | `value <= filter` |
| `in` | `filter.includes(value)` |

### Multi-sort

```tsx
table.addSort("role", "asc", 1);
table.addSort("name", "asc", 2);
// → SORT BY role ASC, name ASC
```

---

## Mobile Card

Pada `isMobile === true`, `<Table>` otomatis switch ke `<MobileCard>` per row:

- `mobilePriority === 1` → **title** card.
- `mobilePriority === 2` → ditampilkan di body.
- `mobilePriority` tidak diset atau `≥ 3` → di-collapse, ditampilkan di "Show more".
- Column dengan `actions` → muncul di header card.

```tsx
const columns: ColumnDef<User>[] = [
  { key: "name", label: "Nama", mobilePriority: 1 },
  { key: "email", label: "Email", mobilePriority: 2 },
  { key: "role", label: "Role", mobilePriority: 2 },
  { key: "phone", label: "Telp" },                 // hidden by default
  { key: "address", label: "Alamat" },             // hidden by default
  { key: "actions", label: "", actions: (r) => <Btn>...</Btn> },
];
```

---

## Export Excel / CSV

```typescript
// Via hook
table.exportCsv("users.csv");
table.exportExcel("users.xlsx");

// Standalone
import { exportCsv, exportExcel } from "@dep/ui/table";
exportCsv(rows, columns, "data.csv");
exportExcel(rows, columns, "data.xlsx");
```

- Column dengan `actions` & `visible: false` di-skip.
- Header memakai `column.label`.
- CSV menggunakan UTF-8 BOM (kompatibel Excel ID).
- **Catatan:** `render` callback **tidak** diaplikasikan ke nilai export — Anda mendapatkan raw value. Untuk format custom di export, format data sebelum dimasukkan ke `data`, atau lihat saran di `ISSUES.md`.

---

## Type Reference

```typescript
type SortOrder = "asc" | "desc";
interface SortConfig   { key: string; order: SortOrder; priority: number }
interface FilterConfig { key: string; value: unknown; operator?: "eq"|"like"|"gte"|"lte"|"in" }

interface ColumnDef<T>          { /* lihat atas */ }
interface ResolvedColumnDef<T> extends ColumnDef<T> { pinnedOffset?: number }

interface ExpandableConfig<T> {
  multiple?: boolean;
  trigger?: "icon" | "row";              // belum di-implement
  render?: (row: T) => ReactNode;
  renderAsync?: (row: T) => Promise<ReactNode>;
  loadingComponent?: ReactNode;
  cacheResult?: boolean;                  // belum di-implement
}

interface PageResult<T>  { content, page, size, total, totalPages, hasPrev, hasNext }
interface TableParams    { page, size, sort?, filters?, search? }

interface UseTableOptions<T> { data?, fetchFn?, columns, pagination?, selection?, expandable?, mobileBreakpoint? }
interface UseTableResult<T>  { /* lihat di atas */ }
```

---

## Pola Lengkap

```tsx
import { useTable, Table } from "@dep/ui/table";
import { AxiosKit } from "@dep/axios";

const api = AxiosKit.use("main");

function UsersTable() {
  const table = useTable<User>({
    columns: [
      { key: "id", label: "ID", width: "60px", pinned: "left", sortable: true, mobilePriority: 1 },
      { key: "name", label: "Nama", sortable: true, filterable: true, mobilePriority: 2 },
      { key: "email", label: "Email", mobilePriority: 2 },
      { key: "role", label: "Role", render: (v) => <Badge>{String(v)}</Badge> },
      {
        key: "actions", label: "", width: "100px", pinned: "right",
        actions: (row) => (
          <div className="flex gap-1">
            <button onClick={() => edit(row)}>✏️</button>
            <button onClick={() => del(row)}>🗑️</button>
          </div>
        ),
      },
    ],
    pagination: { size: 20 },
    selection: true,
    expandable: {
      render: (row) => (
        <div className="p-4 bg-slate-50">
          <p><b>Alamat:</b> {row.address}</p>
          <p><b>Telp:</b> {row.phone}</p>
        </div>
      ),
    },
    fetchFn: ({ page, size, sort, filters, search }) =>
      api.get<PageResult<User>>("/users", {
        params: { page, size, sort: JSON.stringify(sort), filters: JSON.stringify(filters), search },
      }),
  });

  return (
    <section className="bg-white p-4 rounded-lg shadow">
      <header className="flex justify-between mb-3">
        <input
          placeholder="Cari…"
          className="border px-3 py-1.5 rounded"
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={table.refresh}>↻</button>
          <button onClick={() => table.exportExcel("users.xlsx")}>Export</button>
        </div>
      </header>

      <Table
        {...table}
        showPagination
        showColumnToggle
        rowClassName={(row) => (row.status === "banned" ? "bg-red-50" : "")}
      />

      {table.selectedRows.length > 0 && (
        <div className="mt-3 text-sm">
          {table.selectedRows.length} terpilih.
          <button onClick={() => bulkDelete(table.selectedRows)}>Hapus semua terpilih</button>
        </div>
      )}
    </section>
  );
}
```

---

*Lihat [src/lib/ISSUES.md](../../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
