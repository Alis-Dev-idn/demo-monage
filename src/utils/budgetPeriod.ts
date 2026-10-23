import type { BudgetPeriod } from "@/types";

/**
 * Hitung rentang efektif suatu periode anggaran berdasarkan `cycleStartDay`.
 *
 * Konvensi **end-anchored**: periode `(year, month)` dilabeli oleh bulan tempat
 * siklus BERAKHIR.
 * - `cycleStartDay = 1` (default): rentang = 1 bulan kalender (1 → akhir bulan).
 * - `cycleStartDay > 1`: rentang = tanggal X di bulan SEBELUMNYA → (X-1) bulan ini.
 *
 * Contoh: period {year:2026, month:6}, cycleStartDay=25 →
 *   from = 25 Mei 2026, to = 24 Juni 2026 (23:59:59.999).
 */
export function resolveBudgetRange(
  period: BudgetPeriod,
  cycleStartDay: number = 1,
): { from: Date; to: Date } {
  const start = Math.max(1, Math.min(28, Math.floor(cycleStartDay) || 1));
  if (start === 1) {
    return {
      from: new Date(period.year, period.month - 1, 1, 0, 0, 0, 0),
      to: new Date(period.year, period.month, 0, 23, 59, 59, 999),
    };
  }
  // End-anchored: mulai hari `start` di bulan sebelumnya (month-2), berakhir
  // hari `start-1` di bulan ini (month-1). JS Date menormalkan month-2 < 0.
  return {
    from: new Date(period.year, period.month - 2, start, 0, 0, 0, 0),
    to: new Date(period.year, period.month - 1, start - 1, 23, 59, 59, 999),
  };
}

/**
 * Periode anggaran yang sedang berjalan untuk `now`, dengan mempertimbangkan
 * `cycleStartDay`. `period.month` 1-indexed (konsisten dengan
 * {@link resolveBudgetRange} dan backend `budgetCycleRange`).
 *
 * Konvensi **end-anchored**: periode dilabeli oleh bulan tempat siklus berakhir.
 * Saat `cycleStartDay > 1` dan tanggal hari ini sudah ≥ hari mulai siklus, kita
 * telah masuk siklus yang berakhir bulan DEPAN → (year, month) maju satu bulan.
 *
 * Contoh: now = 2 Jun 2026, cycleStartDay = 25 → {2026, 6} (= 25 Mei – 24 Jun).
 *         now = 26 Jun 2026, cycleStartDay = 25 → {2026, 7} (= 25 Jun – 24 Jul).
 */
export function currentBudgetPeriod(
  cycleStartDay: number = 1,
  now: Date = new Date(),
): BudgetPeriod {
  const start = Math.max(1, Math.min(28, Math.floor(cycleStartDay) || 1));
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-indexed
  if (start > 1 && now.getDate() >= start) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return { year, month };
}

export function formatPeriodLabel(
  period: BudgetPeriod,
  cycleStartDay: number = 1,
): string {
  const { from, to } = resolveBudgetRange(period, cycleStartDay);
  const fmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
  if (cycleStartDay === 1) {
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(from);
  }
  return `${fmt.format(from)} – ${fmt.format(to)} ${to.getFullYear()}`;
}

/**
 * Cek apakah transaksi dengan `occurredAt` masuk ke periode anggaran tertentu.
 */
export function isInBudgetRange(
  occurredAt: string,
  period: BudgetPeriod,
  cycleStartDay: number = 1,
): boolean {
  const t = new Date(occurredAt).getTime();
  const { from, to } = resolveBudgetRange(period, cycleStartDay);
  return t >= from.getTime() && t <= to.getTime();
}
