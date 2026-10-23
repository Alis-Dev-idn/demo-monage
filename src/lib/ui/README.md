# UI Component Library

> Dokumentasi komponen UI internal untuk `monage-fe`. Komponen bersifat **in-project library** dengan path alias `@dep/ui/*`.

---

## Daftar Isi

1. [Dependencies](#dependencies)
2. [Struktur Folder](#struktur-folder)
3. [Button](#button)
4. [Form (Input, Textarea, Checkbox, RadioGroup, FormField)](#form)
5. [Select / MultiSelect](#select--multiselect)
6. [Progress Bar & Progress Circle](#progress-bar--progress-circle)
7. [Loading Spinner & Loading Overlay](#loading-spinner--loading-overlay)
8. [Modal](#modal)
9. [Confirm / Alert / Prompt](#confirm--alert--prompt)
10. [Table](#table)
11. [Map](#map)
12. [Auth Template](#auth-template)

---

## Dependencies

```bash
npm install react react-dom tailwindcss
npm install react-select react-hook-form @hookform/resolvers zod lucide-react
```

---

## Struktur Folder

```
src/lib/ui/
├── button/          Button.tsx, index.ts
├── form/            Input, Textarea, Checkbox, RadioGroup, FormField
├── select/          Select, MultiSelect
├── progress/        ProgressBar, ProgressCircle
├── loading/         LoadingSpinner, LoadingOverlay
├── modal/           Modal compound component + imperative API
├── confirm/         confirm(), alert(), prompt()
├── table/           useTable hook + Table component
├── map/             MapProvider, Marker, SuperClusterLayer, DrawControl
└── README.md

src/lib/templates/
└── auth/            LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage
```

---

## Button

Import: `import { Button } from "@dep/ui/button";`

### Variants

| Variant | Kegunaan |
|---|---|
| `primary` | Aksi utama (Submit, Simpan) |
| `secondary` | Aksi sekunder |
| `outline` | Aksi ringan |
| `ghost` | Toolbar, navigasi |
| `danger` | Hapus, konfirmasi destruktif |
| `danger-outline` | Peringatan non-destruktif |
| `link` | Terlihat seperti anchor |

### Sizes

`xs` | `sm` | `md` (default) | `lg`

### Contoh Penggunaan

```tsx
import { Button } from "@dep/ui/button";
import { Plus, Trash2 } from "lucide-react";

// Dasar
<Button>Simpan</Button>
<Button variant="outline">Batal</Button>
<Button variant="danger">Hapus</Button>

// Dengan icon
<Button leftIcon={<Plus size={16} />}>Tambah Data</Button>
<Button variant="danger" leftIcon={<Trash2 size={16} />}>Hapus</Button>

// State loading
<Button isLoading loadingText="Menyimpan...">Simpan</Button>

// Full width
<Button fullWidth size="lg">Login</Button>

// Group button
<div className="flex gap-2">
  <Button variant="primary">Simpan</Button>
  <Button variant="outline">Batal</Button>
</div>
```

---

## Form

Import: `import { FormField, Input, Textarea, Checkbox, RadioGroup } from "@dep/ui/form";`

### Input

```tsx
// Dasar
<Input placeholder="Masukkan teks..." />

// Dengan addon
<Input leftAddon={<Mail size={16} />} placeholder="Email" />
<Input rightAddon={<Eye size={16} />} type="password" />

// Size
<Input inputSize="sm" placeholder="Small" />
<Input inputSize="lg" placeholder="Large" />

// Error state
<Input error placeholder="Field error" />

// Disabled
<Input disabled placeholder="Disabled" />
```

### Textarea

```tsx
<Textarea placeholder="Tulis catatan..." rows={4} />
<Textarea resize="none" placeholder="Tidak bisa resize" />
<Textarea error placeholder="Error state" />
```

### Checkbox

```tsx
<Checkbox label="Setuju syarat dan ketentuan" />
<Checkbox label="Newsletter" description="Terima update via email" />
<Checkbox label="Error" error />
<Checkbox label="Disabled" disabled />
```

### RadioGroup

```tsx
<RadioGroup
  name="gender"
  options={[
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ]}
  value={selected}
  onChange={setSelected}
/>

// Horizontal
<RadioGroup
  name="size"
  direction="horizontal"
  options={[
    { value: "s", label: "S" },
    { value: "m", label: "M" },
    { value: "l", label: "L" },
  ]}
  value={size}
  onChange={setSize}
/>
```

### FormField (Wrapper)

```tsx
<FormField label="Email" htmlFor="email" required errorMessage={errors.email?.message}>
  <Input id="email" type="email" error={!!errors.email} {...register("email")} />
</FormField>

<FormField label="Catatan" helperText="Opsional">
  <Textarea placeholder="Tulis catatan..." />
</FormField>
```

### Contoh Lengkap dengan react-hook-form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, Input, Textarea, Checkbox, RadioGroup } from "@dep/ui/form";

const schema = z.object({
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  catatan: z.string().optional(),
  setuju: z.boolean().refine((v) => v === true, "Harus menyetujui syarat"),
  gender: z.string().min(1, "Pilih salah satu"),
});

type FormData = z.infer<typeof schema>;

export const ContohForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(console.log)} className="flex flex-col gap-5">
      <FormField label="Nama Lengkap" htmlFor="namaLengkap" required errorMessage={errors.namaLengkap?.message}>
        <Input id="namaLengkap" placeholder="Masukkan nama" error={!!errors.namaLengkap} {...register("namaLengkap")} />
      </FormField>

      <FormField label="Email" htmlFor="email" required helperText="Email digunakan untuk login" errorMessage={errors.email?.message}>
        <Input id="email" type="email" placeholder="contoh@email.com" error={!!errors.email} {...register("email")} />
      </FormField>

      <FormField label="Catatan" htmlFor="catatan" helperText="Opsional">
        <Textarea id="catatan" placeholder="Tambahkan catatan..." rows={4} {...register("catatan")} />
      </FormField>

      <FormField label="Jenis Kelamin" errorMessage={errors.gender?.message}>
        <RadioGroup
          name="gender"
          options={[{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }]}
          error={!!errors.gender}
        />
      </FormField>

      <FormField errorMessage={errors.setuju?.message}>
        <Checkbox label="Saya menyetujui syarat dan ketentuan" error={!!errors.setuju} {...register("setuju")} />
      </FormField>
    </form>
  );
};
```

---

## Select / MultiSelect

Import: `import { Select, MultiSelect, SelectOption } from "@dep/ui/select";`

### Select (Single)

```tsx
const kotaOptions: SelectOption[] = [
  { value: "jkt", label: "Jakarta" },
  { value: "bdg", label: "Bandung" },
  { value: "sby", label: "Surabaya" },
];

// Standalone
<Select options={kotaOptions} value={selected} onChange={setSelected} placeholder="Pilih kota..." isClearable />

// Error state
<Select options={kotaOptions} error placeholder="Wajib dipilih" />

// Loading
<Select options={[]} isLoading placeholder="Memuat data..." />

// Disabled
<Select options={kotaOptions} isDisabled />
```

### MultiSelect

```tsx
const hobiOptions: SelectOption[] = [
  { value: "membaca", label: "Membaca" },
  { value: "olahraga", label: "Olahraga" },
  { value: "masak", label: "Memasak" },
  { value: "travel", label: "Traveling" },
];

<MultiSelect options={hobiOptions} value={hobi} onChange={setHobi} placeholder="Pilih hobi..." maxSelected={3} />
```

### Dengan react-hook-form (Controller)

```tsx
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@dep/ui/form";
import { Select, MultiSelect } from "@dep/ui/select";

const { control, formState: { errors } } = useForm();

<FormField label="Kota Asal" htmlFor="kota" required errorMessage={errors.kota?.message as string}>
  <Controller
    name="kota"
    control={control}
    rules={{ required: "Kota wajib dipilih" }}
    render={({ field }) => (
      <Select inputId="kota" options={kotaOptions} value={field.value} onChange={field.onChange} isClearable error={!!errors.kota} />
    )}
  />
</FormField>

<FormField label="Hobi" helperText="Pilih maksimal 3 hobi">
  <Controller
    name="hobi"
    control={control}
    render={({ field }) => (
      <MultiSelect inputId="hobi" options={hobiOptions} value={field.value ?? []} onChange={field.onChange} maxSelected={3} />
    )}
  />
</FormField>
```

---

## Progress Bar & Progress Circle

Import: `import { ProgressBar, ProgressCircle } from "@dep/ui/progress";`

### ProgressBar

```tsx
// Dasar
<ProgressBar value={60} />

// Dengan label
<ProgressBar value={75} showLabel />
<ProgressBar value={75} showLabel labelPosition="top" />
<ProgressBar value={75} showLabel label="3/4 selesai" />

// Variants
<ProgressBar value={100} variant="success" showLabel />
<ProgressBar value={50} variant="warning" showLabel />
<ProgressBar value={25} variant="danger" showLabel />
<ProgressBar value={80} variant="info" showLabel />

// Sizes
<ProgressBar value={60} size="xs" />
<ProgressBar value={60} size="sm" />
<ProgressBar value={60} size="md" />
<ProgressBar value={60} size="lg" />

// Striped & Animated
<ProgressBar value={65} striped />
<ProgressBar value={65} striped animated />

// Indeterminate (loading tanpa value pasti)
<ProgressBar value={0} indeterminate />
```

### ProgressCircle

```tsx
// Dasar
<ProgressCircle value={72} />

// Sizes
<ProgressCircle value={50} size="xs" />
<ProgressCircle value={50} size="sm" />
<ProgressCircle value={50} size="md" />
<ProgressCircle value={50} size="lg" />
<ProgressCircle value={50} size="xl" />

// Variants
<ProgressCircle value={100} variant="success" />
<ProgressCircle value={60} variant="warning" />
<ProgressCircle value={30} variant="danger" />

// Custom label
<ProgressCircle value={3} max={10} label="3/10" />

// Custom children di tengah
<ProgressCircle value={85} size="xl" showLabel={false}>
  <div className="text-center">
    <span className="text-2xl font-bold text-blue-600">85</span>
    <span className="text-xs text-gray-500 block">Score</span>
  </div>
</ProgressCircle>

// Tanpa label
<ProgressCircle value={40} showLabel={false} />

// Stroke tebal
<ProgressCircle value={60} strokeWidth={8} size="lg" />

// Indeterminate
<ProgressCircle value={0} indeterminate />
```

---

## Loading Spinner & Loading Overlay

Import: `import { LoadingSpinner, LoadingOverlay } from "@dep/ui/loading";`

### LoadingSpinner

```tsx
// Dasar
<LoadingSpinner />

// Sizes
<LoadingSpinner size="xs" />
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />
<LoadingSpinner size="xl" />

// Variants
<LoadingSpinner variant="default" />
<LoadingSpinner variant="primary" />
<LoadingSpinner variant="success" />
<LoadingSpinner variant="danger" />
<LoadingSpinner variant="white" />  {/* untuk background gelap */}

// Dengan label
<LoadingSpinner label="Memuat data..." />
<LoadingSpinner size="lg" label="Mohon tunggu..." />
```

### LoadingOverlay

```tsx
// Overlay pada area tertentu (relative container)
<LoadingOverlay visible={isLoading} label="Memuat data...">
  <div className="p-6 border rounded-lg">
    <h3>Konten yang di-overlay</h3>
    <p>Konten ini akan tertutup overlay saat loading.</p>
  </div>
</LoadingOverlay>

// Tanpa blur
<LoadingOverlay visible={isLoading} blur={false}>
  <div>Konten...</div>
</LoadingOverlay>

// Fullscreen overlay
<LoadingOverlay visible={isLoading} fullScreen label="Memproses..." />

// Custom spinner size
<LoadingOverlay visible={isLoading} spinnerSize="xl" label="Upload file...">
  <div>Konten...</div>
</LoadingOverlay>
```

### Contoh Penggunaan di Komponen

```tsx
import { useState, useEffect } from "react";
import { LoadingOverlay } from "@dep/ui/loading";

export const DataList = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  return (
    <LoadingOverlay visible={loading} label="Memuat data...">
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.id} className="p-4 border rounded">{item.name}</div>
        ))}
      </div>
    </LoadingOverlay>
  );
};
```

---

## Modal

Import: `import { Modal, ModalKit, ModalStack, modal } from "@dep/ui/modal";`

### Setup Awal

```tsx
import { ModalKit, ModalStack } from "@dep/ui/modal";

ModalKit.setup({
  theme: "light",
  animation: { in: "zoom", out: "fade", duration: 300 },
  backdrop: { enabled: true, blur: true },
});

const App = () => (
  <>
    <ModalStack />
    <Router />
  </>
);
```

### Deklaratif

```tsx
import { useState } from "react";
import { Modal } from "@dep/ui/modal";

const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
  <Modal.Header showCloseButton>
    <h3>Tambah Data</h3>
  </Modal.Header>
  <Modal.Body>
    <p>Isi konten modal.</p>
  </Modal.Body>
  <Modal.Footer>
    <button onClick={() => setIsOpen(false)}>Batal</button>
    <button onClick={() => setIsOpen(false)}>Simpan</button>
  </Modal.Footer>
</Modal>

// `Modal.Header` menerima `children` + `showCloseButton`. Tombol close
// otomatis terhubung ke `onClose` lewat ModalContext — tidak perlu pass
// callback manual. Jika ingin override, kirim prop `onClose`.
```

### Imperatif

```tsx
import { modal } from "@dep/ui/modal";

modal.open({
  size: "md",
  children: (
    <div>
      <h3>Berhasil!</h3>
      <p>Data telah disimpan.</p>
    </div>
  ),
});
```

---

## Confirm / Alert / Prompt

Import: `import { confirm, alert, prompt, ConfirmKit, ConfirmContainer } from "@dep/ui/confirm";`

### Setup

```tsx
import { ConfirmKit, ConfirmContainer } from "@dep/ui/confirm";

ConfirmKit.setup({ theme: "light", animation: { in: "bounce", out: "fade", duration: 250 } });

const App = () => (
  <>
    <ConfirmContainer />
    <Router />
  </>
);
```

### confirm()

```tsx
import { confirm } from "@dep/ui/confirm";

const handleDelete = async () => {
  const ok = await confirm({
    title: "Hapus Pengguna?",
    message: "Aksi ini tidak dapat dibatalkan.",
    confirmLabel: "Ya, Hapus!",
    cancelLabel: "Batal",
  });
  if (ok) { /* delete... */ }
};
```

### alert()

```tsx
import { alert } from "@dep/ui/confirm";

await alert({
  title: "Informasi Sistem",
  message: "Maintenance server jam 12 malam.",
  confirmLabel: "Mengerti",
});
```

### prompt() dengan Zod

```tsx
import { prompt } from "@dep/ui/confirm";
import { z } from "zod";

const newName = await prompt({
  title: "Ganti Nama Folder",
  message: "Masukkan nama folder baru:",
  placeholder: "Nama Folder...",
  defaultValue: "Folder Baru",
  confirmLabel: "Simpan",
  validation: z.string().min(3, "Minimal 3 karakter").max(20, "Maksimal 20 karakter"),
});
if (newName !== null) { /* save... */ }
```

---

## Table

Import: `import { useTable, Table } from "@dep/ui/table";`

```tsx
import { useTable, Table } from "@dep/ui/table";

interface User { id: number; name: string; role: string; }

const table = useTable<User>({
  data: users,
  columns: [
    { key: "id", label: "ID", sortable: true, width: "80px" },
    { key: "name", label: "Nama", sortable: true },
    {
      key: "role",
      label: "Role",
      render: (val) => <span className="badge">{val as string}</span>,
      // Optional: control output for CSV/Excel export — falls back to raw value if omitted
      exportValue: (val) => String(val ?? "").toUpperCase(),
    },
    { key: "actions", label: "Aksi", pinned: "right", actions: (row) => <button>Edit</button> },
  ],
  pagination: { size: 5 },
  selection: true,
});

return (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="flex justify-between mb-4">
      <input placeholder="Cari..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} />
      <div className="flex gap-2">
        <Table.ColumnToggle table={table} />
        <Table.ExportButton table={table} formats={["csv", "excel"]} />
      </div>
    </div>
    <Table {...table} showPagination showColumnToggle={false} showExport={false} />
  </div>
);
```

---

## Map

Import: `import { Map, Marker, SuperClusterLayer, DrawControl, GeoJsonLayer, MapOverlay, MapStyleSwitcher } from "@dep/ui/map";`

> Root component-nya bernama `Map` (bukan `MapProvider`). Tidak ada `NavigationControl` built-in — letakkan kontrol custom di `<MapOverlay>` jika perlu.

### Marker

```tsx
<div style={{ height: "400px" }}>
  <Map styleUrl="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" center={[106.827, -6.175]} zoom={12}>
    <Marker lng={106.827} lat={-6.175}>
      <div className="bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow" />
    </Marker>
  </Map>
</div>
```

### SuperCluster

```tsx
<Map styleUrl="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" center={[106.8, -6.2]} zoom={10}>
  <SuperClusterLayer points={points} radius={50} maxZoom={16} />
</Map>
```

### DrawControl

`DrawControl` sekarang merender preview real-time lewat `<GeoJsonLayer id="__draw-preview">` selama user menggambar.

```tsx
<Map styleUrl="..." center={[106.8, -6.2]} zoom={12}>
  <DrawControl active mode="polygon" onCreate={(feature) => console.log(feature)} />
</Map>
```

### Error fallback

`Map` membungkus inisialisasi MapLibre dengan try/catch. Kirim `onError` untuk
menerima notifikasi error dan `errorFallback` untuk UI custom saat init gagal:

```tsx
<Map
  styleUrl={url}
  onError={(err) => notify.error(`Map error: ${(err as Error).message}`)}
  errorFallback={<MyCustomErrorState />}
/>
```

---

## Auth Template

Import: `import { AuthTemplate } from "@dep/templates/auth";`

Satu komponen `<AuthTemplate>` menangani semua mode auth — pilih mode lewat prop `mode` dan visual lewat prop `variant`.

### Variants

| `variant` | Tampilan |
|---|---|
| `dark-split` (default) | Dark theme, panel branding kiri + form kanan (cocok untuk landing produk) |
| `minimal-card` | Light theme, kartu terpusat (cocok untuk internal tools / embed) |

Menambah variant baru: buat `variants/<Name>Shell.tsx` yang implement `AuthShellProps`, register di `AuthTemplate.tsx`, dan tambahkan key-nya di `AuthVariant`. Tidak perlu bump versi.

### Login

```tsx
<AuthTemplate
  variant="dark-split"
  mode="login"
  brand={{ name: "Monage", headline: "Manage your money mindfully" }}
  onSubmit={async (data) => { /* { email, password, remember } */ }}
  onForgotPassword={() => navigate("/forgot-password")}
  onRegister={() => navigate("/register")}
  isLoading={isSubmitting}
  errorMessage={serverError}
/>
```

### Register / Forgot / Reset / Verify

Sama seperti login, ubah `mode` dan kirim callback yang sesuai:

```tsx
<AuthTemplate mode="register" brand={...} onSubmit={...} onLogin={...} />
<AuthTemplate mode="forgot" brand={...} onSubmit={...} onBackToLogin={...} isSuccess={emailSent} />
<AuthTemplate mode="reset"  brand={...} onSubmit={...} onBackToLogin={...} isTokenValid={tokenValid} isSuccess={resetDone} />
<AuthTemplate mode="verify" brand={...} onResend={...} onBackToLogin={...} email="..." isVerified={done} />
```

### Custom composition

Bila perlu shell sendiri, gunakan komponen primitif yang sudah di-export:

```tsx
import { LoginForm, MinimalCardShell } from "@dep/templates/auth";

<MinimalCardShell brand={brand}>
  <LoginForm theme="light" {...loginProps} />
</MinimalCardShell>
```

### Backward-compat

`AuthTemplateV1` masih ada sebagai alias ke `AuthTemplate` (default `variant="dark-split"`) — call site lama tetap jalan.

---

## Checklist Project Baru

- [ ] Copy folder `src/lib/` ke project baru
- [ ] Install semua dependencies
- [ ] Konfigurasi Tailwind CSS
- [ ] Set path alias `@dep/*` → `src/lib/*` di `tsconfig.json` dan `vite.config.ts`
- [ ] Render `<ModalStack />` dan `<ConfirmContainer />` di root `App.tsx`
- [ ] Ganti placeholder logo "A" di auth pages
- [ ] Sambungkan `onSubmit` props dengan API
- [ ] Sambungkan navigasi dengan router project

---

*Dokumen ini dibuat sebagai referensi internal. Perbarui jika ada perubahan pada props API atau penambahan komponen baru.*
