/**
 * Helper tanggal "calendar-only" — untuk field yang user pilih lewat
 * `<DatePicker>` (occurredAt transaksi, targetDate saving, rentang laporan).
 *
 * Masalah yang dipecahkan: `new Date(y, m, d).toISOString()` menghasilkan ISO
 * dalam UTC. Untuk zona +07:00 (WIB) tengah malam lokal tgl 25 menjadi tgl 24
 * jam 17:00 UTC, sehingga:
 *   - `iso.slice(0, 10)` (dipakai untuk grouping per hari) → "24" (mundur 1 hari)
 *   - hasil display lewat `Intl`/getter lokal → "25"
 * → tidak konsisten. Solusi: simpan tanggal sebagai **UTC midnight dari hari
 * kalender lokal** yang dipilih user. Dengan begitu `slice(0,10)` dan display
 * lokal (untuk zona +offset seperti WIB/WITA/WIT) sama-sama menunjuk hari yang
 * benar.
 */

/**
 * Date (local-midnight dari `<DatePicker>`) → ISO date-only di UTC midnight.
 * Contoh (WIB): pilih 25 Mei → `2026-05-25T00:00:00.000Z`.
 */
export function toDateOnlyISO(d: Date): string {
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  ).toISOString();
}

/**
 * Inverse dari {@link toDateOnlyISO}. ISO tersimpan → `Date` di local-midnight
 * pada hari kalender UTC-nya, supaya `<DatePicker>` menampilkan tanggal yang
 * sama dengan yang dipilih user. Return `null` kalau ISO tidak valid/kosong.
 */
export function fromDateOnlyISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
