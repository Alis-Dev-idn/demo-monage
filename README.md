# Monage Web Demo (Zero-Backend Standalone Edition)

Antarmuka web interaktif **Monage** versi **Standalone Demo**. Aplikasi ini dirancang untuk dijalankan **100% di sisi peramban (client-side)** tanpa ketergantungan pada backend server riil maupun database eksternal.

Seluruh pertukaran data jaringan dimodelkan secara realistis menggunakan **Mock Service Worker (MSW v2)** dan disimpan secara persisten di browser pengguna menggunakan **IndexedDB**.

---

## Fitur Utama Demo

1. **Zero-Backend Execution**
   - Menjalankan seluruh alur aplikasi secara lokal tanpa memerlukan service backend tambahan.
2. **One-Click Persona Login**
   - Akses cepat ke 3 profil demo langsung dari halaman login:
     - **Personal Finance User** (Budi Santoso): Simulasi pencatatan keuangan pribadi, mutasi multi-rekening, anggaran bulanan, target tabungan, dan visualisasi grafik arus kas.
     - **Business Owner / POS** (Siti Barokah): Fitur bisnis UMKM, kasir POS, katalog produk, pengurangan stok otomatis, cetak struk nota belanja, dan laporan laba kotor.
     - **Fresh Account**: Akun kosong untuk mensimulasikan alur pengguna baru (*onboarding wizard*).
3. **Data Persisten & Realistis**
   - Setiap transaksi, penambahan rekening, maupun mutasi stok tersimpan langsung di IndexedDB browser Anda.
4. **In-App Demo Controls & Reset Data**
   - Switcher profil langsung dari navigasi sidebar.
   - Tombol dan modal konfirmasi destruktif **Reset Data Demo** untuk mengembalikan database lokal ke kondisi bawaan (*initial seed*) kapan saja.
5. **Ekspor & Cetak Laporan**
   - Ekspor transaksi ke CSV & JSON dengan proteksi sanitasi *formula injection*.
   - Simulasi cetak struk nota belanja thermal 58mm/80mm.

---

## Stack Teknologi

- **Framework & Runtime**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS v4, Lucide Icons
- **Mocking & Client Storage**: Mock Service Worker (MSW v2), IndexedDB (`idb`)
- **Visualisasi & Peta**: Recharts, MapLibre GL
- **Form & Validasi**: React Hook Form, Zod

---

## Menjalankan Proyek (Local Development)

### 1. Prasyarat
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. Instalasi & Eksekusi

```bash
# Clone repositori
git clone https://github.com/Alis-Dev-idn/demo-monage.git
cd demo-monage

# Instalasi dependensi
npm install

# Jalankan server pengembangan Vite
npm run dev
```

Buka peramban di `http://localhost:5173`. Aplikasi otomatis menginisialisasi Mock Service Worker dan memuat seed data interaktif.

---

## Perintah Tersedia (NPM Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Vite dev server dengan MSW aktif |
| `npm run build` | Kompilasi TypeScript (`tsc -b`) dan build produksi Vite ke folder `dist/` |
| `npm run preview` | Meninjau hasil build produksi secara lokal |
| `npm run lint` | Menjalankan ESLint untuk pengecekan kualitas kode |
| `npm run test` | Menjalankan unit test dengan Vitest |

---

## Lisensi

Proyek ini dilisensikan di bawah lisensi MIT.
