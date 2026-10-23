import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@dep/axios";
import * as savingService from "@/services/saving.service";
import type { SavingFormData, SavingMovementFormData } from "@/schemas/saving";
import { eventBus } from "@/utils/eventBus";
import type { ID, Saving, SavingMovement, SavingsSummary } from "@/types";

interface UseSavingsSummaryResult {
  data: SavingsSummary | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useSavingsSummary(period: {
  year: number;
  month: number;
}): UseSavingsSummaryResult {
  const [data, setData] = useState<SavingsSummary | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const key = `${period.year}-${period.month}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await savingService.fetchSavingsSummary({
        year: period.year,
        month: period.month,
      });
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const off = eventBus.on("transaction:changed", () => void load());
    return off;
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

interface UseSavingListResult {
  data: Saving[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useSavingList(): UseSavingListResult {
  const [data, setData] = useState<Saving[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await savingService.fetchSavings();
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const off1 = eventBus.on("transaction:changed", () => void load());
    return off1;
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

interface UseSavingDetailResult {
  saving: Saving | null;
  movements: SavingMovement[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useSavingDetail(id: ID | null | undefined): UseSavingDetailResult {
  const [saving, setSaving] = useState<Saving | null>(null);
  const [movements, setMovements] = useState<SavingMovement[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([
        savingService.fetchSaving(id),
        savingService.fetchSavingMovements(id),
      ]);
      setSaving(s);
      setMovements(m);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const off = eventBus.on("transaction:changed", () => void load());
    return off;
  }, [load]);

  return { saving, movements, isLoading, error, refetch: load };
}

/**
 * Semua movement tabungan dalam book aktif. Dipakai Riwayat Transaksi untuk
 * menampilkan setor/tarik sebagai entri virtual (#14 Opsi A). Refetch saat ada
 * perubahan transaksi/akun (mis. setelah setor/tarik/edit movement).
 */
export function useAllSavingMovements(): {
  data: SavingMovement[];
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<SavingMovement[]>([]);
  const [isLoading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await savingService.fetchAllSavingMovements());
    } catch {
      // senyap — riwayat transaksi tetap tampil tanpa entri tabungan
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const off1 = eventBus.on("transaction:changed", () => void load());
    const off2 = eventBus.on("account:changed", () => void load());
    return () => {
      off1();
      off2();
    };
  }, [load]);

  return { data, isLoading, refetch: load };
}

export async function createSaving(data: SavingFormData): Promise<Saving> {
  const created = await savingService.createSaving(data);
  eventBus.emit("saving:changed");
  eventBus.emit("transaction:changed");
  return created;
}

export async function updateSaving(
  id: ID,
  data: Partial<SavingFormData>,
): Promise<Saving> {
  const updated = await savingService.updateSaving(id, data);
  eventBus.emit("saving:changed");
  eventBus.emit("transaction:changed");
  return updated;
}

export async function deleteSaving(id: ID): Promise<void> {
  await savingService.deleteSaving(id);
  eventBus.emit("saving:changed");
  eventBus.emit("transaction:changed");
  eventBus.emit("account:changed");
}

export async function depositSaving(
  id: ID,
  payload: SavingMovementFormData,
): Promise<Saving> {
  const updated = await savingService.depositSaving(id, payload);
  eventBus.emit("transaction:changed");
  eventBus.emit("account:changed");
  eventBus.emit("budget:changed");
  return updated;
}

export async function withdrawSaving(
  id: ID,
  payload: SavingMovementFormData,
): Promise<Saving> {
  const updated = await savingService.withdrawSaving(id, payload);
  eventBus.emit("transaction:changed");
  eventBus.emit("account:changed");
  return updated;
}

export async function updateSavingMovement(
  savingId: ID,
  movementId: ID,
  payload: savingService.SavingMovementPatch,
): Promise<SavingMovement> {
  const updated = await savingService.updateSavingMovement(
    savingId,
    movementId,
    payload,
  );
  eventBus.emit("transaction:changed");
  eventBus.emit("account:changed");
  return updated;
}

export async function deleteSavingMovement(
  savingId: ID,
  movementId: ID,
): Promise<void> {
  await savingService.deleteSavingMovement(savingId, movementId);
  eventBus.emit("transaction:changed");
  eventBus.emit("account:changed");
}
