import { describe, expect, it } from "vitest";
import { currentBudgetPeriod, resolveBudgetRange } from "./budgetPeriod";

// Konvensi end-anchored: periode {month:M} dilabeli oleh bulan AKHIR siklus.
// mis. {2026, 6} + cycle 25 → 25 Mei – 24 Jun 2026.

describe("currentBudgetPeriod() — end-anchored", () => {
  it("default cycle (day 1) → bulan kalender berjalan (1-indexed)", () => {
    expect(currentBudgetPeriod(1, new Date(2026, 5, 1))).toEqual({
      year: 2026,
      month: 6,
    });
    expect(currentBudgetPeriod(1, new Date(2026, 5, 30))).toEqual({
      year: 2026,
      month: 6,
    });
  });

  it("cycle 25, sebelum hari mulai → dilabeli bulan ini (akhir siklus)", () => {
    // 2 Jun 2026 di siklus 25 Mei–24 Jun → periode {Juni}
    expect(currentBudgetPeriod(25, new Date(2026, 5, 2))).toEqual({
      year: 2026,
      month: 6,
    });
    // 24 Jun 2026 masih siklus 25 Mei–24 Jun → {Juni}
    expect(currentBudgetPeriod(25, new Date(2026, 5, 24))).toEqual({
      year: 2026,
      month: 6,
    });
  });

  it("cycle 25, pada/Setelah hari mulai → maju ke bulan depan (akhir siklus berikutnya)", () => {
    // 25 Jun 2026 → siklus 25 Jun–24 Jul → periode {Juli}
    expect(currentBudgetPeriod(25, new Date(2026, 5, 25))).toEqual({
      year: 2026,
      month: 7,
    });
  });

  it("wrap tahun saat Desember pada/Setelah hari mulai", () => {
    // 26 Des 2026, cycle 25 → siklus 25 Des 2026–24 Jan 2027 → {2027, Jan}
    expect(currentBudgetPeriod(25, new Date(2026, 11, 26))).toEqual({
      year: 2027,
      month: 1,
    });
  });

  it("periode default selalu memuat 'hari ini' di dalam rentangnya", () => {
    for (const day of [25, 15, 1]) {
      for (const d of [
        new Date(2026, 5, 1),
        new Date(2026, 5, 24),
        new Date(2026, 5, 25),
        new Date(2026, 11, 31),
        new Date(2026, 0, 1),
      ]) {
        const period = currentBudgetPeriod(day, d);
        const { from, to } = resolveBudgetRange(period, day);
        expect(d.getTime()).toBeGreaterThanOrEqual(from.getTime());
        expect(d.getTime()).toBeLessThanOrEqual(to.getTime());
      }
    }
  });
});

describe("resolveBudgetRange() — end-anchored", () => {
  it("cycle 25, {2026, 6} → 25 Mei – 24 Jun 2026", () => {
    const { from, to } = resolveBudgetRange({ year: 2026, month: 6 }, 25);
    expect(from).toEqual(new Date(2026, 4, 25, 0, 0, 0, 0)); // 25 Mei
    expect(to).toEqual(new Date(2026, 5, 24, 23, 59, 59, 999)); // 24 Jun
  });

  it("cycle 25, {2026, 1} → wrap ke Des tahun sebelumnya", () => {
    const { from, to } = resolveBudgetRange({ year: 2026, month: 1 }, 25);
    expect(from).toEqual(new Date(2025, 11, 25, 0, 0, 0, 0)); // 25 Des 2025
    expect(to).toEqual(new Date(2026, 0, 24, 23, 59, 59, 999)); // 24 Jan 2026
  });

  it("cycle 1 → bulan kalender penuh", () => {
    const { from, to } = resolveBudgetRange({ year: 2026, month: 6 }, 1);
    expect(from).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999));
  });
});
