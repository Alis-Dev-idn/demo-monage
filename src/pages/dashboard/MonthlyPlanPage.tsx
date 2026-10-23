import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveIcon } from "@/constants/iconRegistry";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox, Section } from "@dep/ui/card";
import { Modal } from "@dep/ui/modal";
import { FormField, Input, RadioGroup, Textarea } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { confirm } from "@dep/ui/confirm";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import { CurrencyText } from "@/components/common/CurrencyText";
import { EmptyState } from "@/components/common/EmptyState";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { AccountSelect } from "@/components/accounts/AccountSelect";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { PlanIconPicker } from "@/components/monthlyPlan/PlanIconPicker";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { MonthPicker } from "@/components/common/MonthPicker";
import { Switch } from "@/components/common/Switch";
import { useBooks } from "@/hooks/useBooks";
import { useSubscription } from "@/hooks/useSubscription";
import { eventBus } from "@/utils/eventBus";
import * as planService from "@/services/monthlyPlan.service";
import {
  DEFAULT_GROUP_ICON,
  GROUP_KIND_LABEL,
} from "@/constants/planIcons";
import { PLAN_ITEM_CATEGORIES } from "@/constants/planItemCategory";
import type {
  ID,
  MonthlyPlan,
  PlanGroup,
  PlanGroupKind,
  PlanIngredient,
  PlanItem,
  PlanItemCategory,
} from "@/types";
import { currentBudgetPeriod, formatPeriodLabel } from "@/utils/budgetPeriod";
import { usePreferences } from "@/hooks/usePreferences";

const KIND_OPTIONS: Array<{ value: PlanGroupKind; label: string }> = [
  { value: "shopping", label: "Belanja" },
  { value: "meal", label: "Menu Masak" },
  { value: "hobby", label: "Hobi" },
  { value: "bills", label: "Tagihan" },
  { value: "other", label: "Lainnya" },
];

const KIND_COLOR: Record<PlanGroupKind, string> = {
  shopping: "text-emerald-600 bg-emerald-50",
  meal: "text-orange-600 bg-orange-50",
  hobby: "text-violet-600 bg-violet-50",
  bills: "text-rose-600 bg-rose-50",
  other: "text-neutral-600 bg-neutral-100",
};

function renderIcon(name: string | undefined, fallback: string, size = 16) {
  const Icon = resolveIcon(name, fallback);
  return <Icon size={size} aria-hidden />;
}

const MonthlyPlanPage = () => {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const cycleStartDay = preferences.budgetCycleStartDay ?? 1;
  const { activeBook } = useBooks();
  const { currentPlan } = useSubscription();
  const [period, setPeriod] = useState(() => currentBudgetPeriod(cycleStartDay));

  // Default periode mengikuti siklus anggaran user (cycleStartDay). `cycleStartDay`
  // bisa datang async (preferences belum termuat di render pertama → sempat 1),
  // jadi selaraskan ulang selama user belum memilih periode manual.
  const userPickedPeriod = useRef(false);
  const changePeriod = useCallback<typeof setPeriod>((next) => {
    userPickedPeriod.current = true;
    setPeriod(next);
  }, []);
  useEffect(() => {
    if (!userPickedPeriod.current) {
      setPeriod(currentBudgetPeriod(cycleStartDay));
    }
  }, [cycleStartDay]);
  // Multi-plan (#M7): banyak plan per bulan. `plans` = semua plan periode ini,
  // `selectedPlanId` = yang sedang dibuka, `plan` = turunannya.
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<ID | null>(null);
  const plan = useMemo(
    () => plans.find((p) => p._id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );
  const [isLoading, setLoading] = useState(true);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [creatingGroupAtWeek, setCreatingGroupAtWeek] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ weekId: string; group: PlanGroup } | null>(null);
  const [creatingItemAtGroup, setCreatingItemAtGroup] = useState<PlanGroup | null>(null);
  const [editingItem, setEditingItem] = useState<{ group: PlanGroup; item: PlanItem } | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  // Collapse per-group (key = group._id). Default mengikuti posisi: group teratas
  // (terbaru) terbuka, sisanya tertutup. `groupOpen` menyimpan override manual.
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});
  const toggleGroupOpen = useCallback((id: string, defaultOpen: boolean) => {
    setGroupOpen((prev) => ({ ...prev, [id]: !(prev[id] ?? defaultOpen) }));
  }, []);

  // `maxMonthlyPlans`: `null` = unlimited (Premium/Business), `0` = fitur off (Free),
  // angka > 0 = quota berhingga (Personal). Jangan pakai `?? 0` — itu salah
  // klasifikasi `null` jadi 0.
  const planLimit: number | null = currentPlan?.maxMonthlyPlans ?? null;
  const planAllowed = planLimit !== 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await planService.fetchMonthlyPlans({
        year: period.year,
        month: period.month,
      });
      setPlans(result);
      // Pertahankan pilihan jika masih ada; kalau tidak, pilih plan pertama.
      setSelectedPlanId((cur) =>
        cur && result.some((p) => p._id === cur) ? cur : result[0]?._id ?? null,
      );
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [period.year, period.month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.year, period.month, activeBook?._id]);

  // Upsert satu plan di list + jadikan terpilih (dipakai create & semua update).
  const applyPlan = useCallback((updated: MonthlyPlan) => {
    setPlans((prev) =>
      prev.some((p) => p._id === updated._id)
        ? prev.map((p) => (p._id === updated._id ? updated : p))
        : [...prev, updated],
    );
    setSelectedPlanId(updated._id);
    eventBus.emit("transaction:changed"); // auto-tx mengubah saldo & list tx
  }, []);

  const removePlan = useCallback((id: ID) => {
    setPlans((prev) => {
      const rest = prev.filter((p) => p._id !== id);
      setSelectedPlanId((cur) => (cur === id ? rest[0]?._id ?? null : cur));
      return rest;
    });
    eventBus.emit("transaction:changed");
  }, []);

  const handleCreate = (
    name: string,
    opts?: { copyFromPlanId?: ID; copyGroupIds?: ID[] },
  ) => {
    if (!planAllowed) {
      setUpgradeMsg(
        `Fitur Perencanaan Bulanan tidak tersedia di paket ${currentPlan?.name ?? "Gratis"}. Upgrade ke Personal atau lebih tinggi.`,
      );
      return;
    }
    void notify
      .promise(
        planService.createMonthlyPlan({
          name,
          period,
          bookId: activeBook?._id,
          copyFromPlanId: opts?.copyFromPlanId,
          copyGroupIds: opts?.copyGroupIds,
        }),
        {
          loading: "Membuat plan…",
          success: "Plan dibuat ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      )
      .then((created) => {
        applyPlan(created);
        setCreatePlanOpen(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
          setCreatePlanOpen(false);
          setUpgradeMsg(err.message);
        }
      });
  };

  const handleDelete = async () => {
    if (!plan) return;
    const ok = await confirm({
      title: `Hapus plan "${plan.name}"?`,
      message: "Transaksi otomatis yang sudah ter-create dari ceklis ikut dihapus.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(planService.deleteMonthlyPlan(plan._id), {
        loading: "Menghapus…",
        success: "Plan dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      removePlan(plan._id);
    } catch {
      // surfaced
    }
  };

  const handleEditPlan = async (name: string, totalBudget?: number) => {
    if (!plan) return;
    try {
      const saved = await notify.promise(
        planService.updateMonthlyPlan(plan._id, { name, totalBudget }),
        {
          loading: "Menyimpan…",
          success: "Plan diperbarui ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      );
      applyPlan(saved);
      setEditPlanOpen(false);
    } catch {
      // surfaced
    }
  };

  const persistWeeks = async (newWeeks: MonthlyPlan["weeks"]) => {
    if (!plan) return;
    try {
      const saved = await planService.updateMonthlyPlan(plan._id, { weeks: newWeeks });
      applyPlan(saved);
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    }
  };

  const addGroup = async (weekId: string, draft: Omit<PlanGroup, "_id" | "items">) => {
    if (!plan) return;
    const newWeeks = plan.weeks.map((w) => {
      if (w._id !== weekId) return w;
      return {
        ...w,
        groups: [
          ...w.groups,
          { ...draft, _id: `tmp-grp-${Date.now()}`, items: [] } satisfies PlanGroup,
        ],
      };
    });
    await persistWeeks(newWeeks);
  };

  const updateGroup = async (weekId: string, groupId: string, patch: Partial<PlanGroup>) => {
    if (!plan) return;
    const newWeeks = plan.weeks.map((w) => {
      if (w._id !== weekId) return w;
      return {
        ...w,
        groups: w.groups.map((g) => (g._id === groupId ? { ...g, ...patch, id: g._id } : g)),
      };
    });
    await persistWeeks(newWeeks);
  };

  const deleteGroup = async (weekId: string, groupId: string) => {
    if (!plan) return;
    const ok = await confirm({
      title: "Hapus group?",
      message: "Semua item & transaksi otomatis terkait akan dihapus.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    const newWeeks = plan.weeks.map((w) => {
      if (w._id !== weekId) return w;
      return { ...w, groups: w.groups.filter((g) => g._id !== groupId) };
    });
    await persistWeeks(newWeeks);
    eventBus.emit("transaction:changed");
  };

  const addItem = async (groupId: string, draft: Omit<PlanItem, "_id" | "order" | "done">) => {
    if (!plan) return;
    const newWeeks = plan.weeks.map((w) => ({
      ...w,
      groups: w.groups.map((g) => {
        if (g._id !== groupId) return g;
        const order = (g.items[g.items.length - 1]?.order ?? 0) + 1;
        return {
          ...g,
          items: [...g.items, { ...draft, _id: `tmp-item-${Date.now()}`, order, done: false }],
        };
      }),
    }));
    await persistWeeks(newWeeks);
  };

  const updateItemFields = async (
    groupId: string,
    itemId: string,
    patch: Partial<PlanItem>,
  ) => {
    if (!plan) return;
    const newWeeks = plan.weeks.map((w) => ({
      ...w,
      groups: w.groups.map((g) => {
        if (g._id !== groupId) return g;
        return {
          ...g,
          items: g.items.map((it) => (it._id === itemId ? { ...it, ...patch, id: it._id } : it)),
        };
      }),
    }));
    await persistWeeks(newWeeks);
  };

  const deleteItem = async (groupId: string, itemId: string) => {
    if (!plan) return;
    const newWeeks = plan.weeks.map((w) => ({
      ...w,
      groups: w.groups.map((g) => {
        if (g._id !== groupId) return g;
        return { ...g, items: g.items.filter((i) => i._id !== itemId) };
      }),
    }));
    await persistWeeks(newWeeks);
    eventBus.emit("transaction:changed");
  };

  const toggleItem = async (item: PlanItem, done: boolean) => {
    if (!plan) return;
    try {
      const updated = await planService.patchPlanItem(plan._id, item._id, { done });
      applyPlan(updated);
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    }
  };

  const toggleIngredient = async (
    item: PlanItem,
    ing: PlanIngredient,
    done: boolean,
  ) => {
    if (!plan) return;
    try {
      const updated = await planService.patchPlanIngredient(
        plan._id,
        item._id,
        ing._id,
        { done },
      );
      applyPlan(updated);
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    }
  };

  /* ────────────────────────────────────────────────────────── */
  /* Render                                                    */
  /* ────────────────────────────────────────────────────────── */

  // 1) Free tier — fitur terkunci.
  if (!planAllowed && !isLoading) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <header>
          <h1 className="text-2xl font-semibold text-neutral-900">Perencanaan Bulanan</h1>
          <p className="text-sm text-neutral-500">
            Susun belanja, menu masak, dan kebutuhan lain per minggu — dengan auto-track ke dompet & kategori.
          </p>
        </header>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
          <Lock size={32} className="text-amber-600" />
          <p className="text-base font-semibold text-amber-900">
            Fitur ini tersedia mulai paket Personal
          </p>
          <p className="max-w-md text-sm text-amber-800">
            Paket Personal bisa membuat hingga 3 perencanaan, Premium dan Bisnis tanpa
            batas. Setiap item yang dicentang otomatis catat transaksi ke dompet pilihan
            Anda.
          </p>
          <Button
            leftIcon={<Zap size={14} />}
            onClick={() => navigate("/dashboard/settings/subscription")}
          >
            Lihat Paket
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !plan) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // 2) Personal+ tapi belum ada plan untuk bulan ini.
  if (!plan) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <header>
          <h1 className="text-2xl font-semibold text-neutral-900">Perencanaan Bulanan</h1>
          <p className="text-sm text-neutral-500">
            Susun kebutuhan {formatPeriodLabel(period, cycleStartDay)} per minggu.
          </p>
        </header>
        <PeriodPicker period={period} onChange={changePeriod} cycleStartDay={cycleStartDay} />
        <EmptyState
          icon="CalendarRange"
          title="Belum ada plan untuk bulan ini"
          description="Buat plan kosong, lalu tambah group sesuai kebutuhan (belanja, menu masak, hobi, tagihan)."
          actionLabel="+ Plan Bulan Ini"
          onAction={() => setCreatePlanOpen(true)}
        />

        <CreatePlanModal
          isOpen={createPlanOpen}
          onClose={() => setCreatePlanOpen(false)}
          onSubmit={handleCreate}
          period={period}
          cycleStartDay={cycleStartDay}
        />

        <UpgradeModal
          isOpen={!!upgradeMsg}
          onClose={() => setUpgradeMsg(null)}
          message={upgradeMsg ?? undefined}
          title="Tidak bisa membuat plan"
        />
      </div>
    );
  }

  // 3) Sudah ada plan — render struktur lengkap. Plan kini selalu satu bucket
  // (tanpa pembagian minggu) → group tinggal di `weeks[0]`.
  const week = plan.weeks[0];
  const totalDone = week.groups.reduce(
    (s, g) => s + g.items.filter((i) => i.done).length,
    0,
  );
  const totalItems = week.groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500">
            {formatPeriodLabel(period, cycleStartDay)}
            {" · "}
            {planLimit === null ? "Tanpa batas" : `${planLimit} plan max di paket Anda`}
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">{plan.name}</h1>
          {/* Budget/estimasi/sisa dipindah ke panel "Rincian" tiap group (#P3).
              Header cukup menampilkan progres ceklis. */}
          <p className="text-sm text-neutral-500">
            {totalDone}/{totalItems} item selesai
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Pencil size={14} />}
            onClick={() => setEditPlanOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="danger-outline"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={() => void handleDelete()}
          >
            Hapus
          </Button>
        </div>
      </header>

      <PeriodPicker period={period} onChange={changePeriod} cycleStartDay={cycleStartDay} />

      {/* Plan selector — banyak plan per bulan (#M7). */}
      <div className="flex flex-wrap items-center gap-2">
        {plans.map((p) => (
          <button
            key={p._id}
            type="button"
            onClick={() => setSelectedPlanId(p._id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              p._id === selectedPlanId
                ? "bg-emerald-600 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreatePlanOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          <Plus size={12} /> Plan
        </button>
      </div>

      <div className="space-y-3">
        {week.groups.length === 0 && (
          <InfoBox
            variant="info"
            title="Plan ini belum punya group"
            description='Klik "+ Group" untuk menambah list belanja, menu masak, atau kebutuhan lain.'
          />
        )}

        {/* Urutan: group terbaru (terakhir ditambah) di atas. Default: hanya
            group teratas terbuka, sisanya tertutup (pola grup transaksi). */}
        {[...week.groups].reverse().map((g, index) => {
          const defaultOpen = index === 0;
          const collapsed = !(groupOpen[g._id] ?? defaultOpen);
          return (
            <PlanGroupCard
              key={g._id}
              group={g}
              collapsed={collapsed}
              onToggleCollapse={() => toggleGroupOpen(g._id, defaultOpen)}
              onEditGroup={() => setEditingGroup({ weekId: week._id, group: g })}
              onDeleteGroup={() => void deleteGroup(week._id, g._id)}
              onAddItem={() => setCreatingItemAtGroup(g)}
              onEditItem={(item) => setEditingItem({ group: g, item })}
              onDeleteItem={(itemId) => void deleteItem(g._id, itemId)}
              onToggleItem={(item, done) => void toggleItem(item, done)}
              onToggleIngredient={(item, ing, done) => void toggleIngredient(item, ing, done)}
            />
          );
        })}

        <div className="pt-2">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={12} />}
            onClick={() => setCreatingGroupAtWeek(week._id)}
          >
            Tambah Group
          </Button>
        </div>
      </div>

      <CreatePlanModal
        isOpen={createPlanOpen}
        onClose={() => setCreatePlanOpen(false)}
        onSubmit={handleCreate}
        period={period}
      />

      <EditPlanModal
        isOpen={editPlanOpen}
        onClose={() => setEditPlanOpen(false)}
        onSubmit={handleEditPlan}
        initialName={plan.name}
      />

      <GroupFormModal
        isOpen={!!creatingGroupAtWeek}
        onClose={() => setCreatingGroupAtWeek(null)}
        initial={null}
        onSubmit={async (draft) => {
          if (creatingGroupAtWeek) await addGroup(creatingGroupAtWeek, draft);
          setCreatingGroupAtWeek(null);
        }}
      />

      <GroupFormModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        initial={editingGroup?.group ?? null}
        onSubmit={async (draft) => {
          if (editingGroup) await updateGroup(editingGroup.weekId, editingGroup.group._id, draft);
          setEditingGroup(null);
        }}
      />

      <ItemFormModal
        isOpen={!!creatingItemAtGroup}
        onClose={() => setCreatingItemAtGroup(null)}
        initial={null}
        group={creatingItemAtGroup}
        onSubmit={async (draft) => {
          if (creatingItemAtGroup) await addItem(creatingItemAtGroup._id, draft);
          setCreatingItemAtGroup(null);
        }}
      />

      <ItemFormModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        initial={editingItem?.item ?? null}
        group={editingItem?.group ?? null}
        onSubmit={async (draft) => {
          if (editingItem) await updateItemFields(editingItem.group._id, editingItem.item._id, draft);
          setEditingItem(null);
        }}
      />

      <UpgradeModal
        isOpen={!!upgradeMsg}
        onClose={() => setUpgradeMsg(null)}
        message={upgradeMsg ?? undefined}
        title="Tidak bisa membuat plan"
      />
    </div>
  );
};

/* ─────────── PeriodPicker ─────────── */
/**
 * Wrapper di atas {@link MonthPicker} untuk konsistensi dengan halaman
 * Anggaran — chevron prev/next + label bulan + shortcut "Periode ini".
 * Shortcut mengarah ke periode siklus berjalan (sesuai cycleStartDay), bukan
 * sekadar bulan kalender.
 */
function PeriodPicker({
  period,
  onChange,
  cycleStartDay = 1,
}: {
  period: { year: number; month: number };
  onChange: (p: { year: number; month: number }) => void;
  cycleStartDay?: number;
}) {
  const thisPeriod = currentBudgetPeriod(cycleStartDay);
  const isThisPeriod =
    period.year === thisPeriod.year && period.month === thisPeriod.month;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MonthPicker value={period} onChange={onChange} />
      {!isThisPeriod && (
        <button
          type="button"
          onClick={() => onChange(thisPeriod)}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Periode ini
        </button>
      )}
    </div>
  );
}

/* ─────────── CreatePlanModal ─────────── */
function CreatePlanModal({
  isOpen,
  onClose,
  onSubmit,
  period,
  cycleStartDay = 1,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, opts?: { copyFromPlanId?: ID; copyGroupIds?: ID[] }) => void;
  period: { year: number; month: number };
  cycleStartDay?: number;
}) {
  // Nama plan tetap pakai label bulan singkat; teks deskripsi pakai rentang
  // siklus penuh agar konsisten dengan halaman Anggaran.
  const monthLabel = new Date(period.year, period.month - 1).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const periodLabel = formatPeriodLabel(period, cycleStartDay);
  const [name, setName] = useState("");

  // Referensi: salin group dari plan lain (bisa lintas bulan).
  const [useRef, setUseRef] = useState(false);
  const [refMonth, setRefMonth] = useState(period);
  const [refPlans, setRefPlans] = useState<MonthlyPlan[]>([]);
  const [refPlanId, setRefPlanId] = useState<ID | null>(null);
  const [refGroups, setRefGroups] = useState<PlanGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<ID[]>([]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(`Perencanaan ${monthLabel}`);
      setUseRef(false);
      setRefMonth(period);
      setRefPlans([]);
      setRefPlanId(null);
      setRefGroups([]);
      setSelectedGroupIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, monthLabel]);

  // Muat daftar plan bulan referensi saat picker dibuka / bulan referensi ganti.
  useEffect(() => {
    if (!isOpen || !useRef) return;
    let alive = true;
    void planService
      .fetchMonthlyPlans({ year: refMonth.year, month: refMonth.month })
      .then((rows) => {
        if (!alive) return;
        setRefPlans(rows);
        setRefPlanId(null);
        setRefGroups([]);
        setSelectedGroupIds([]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isOpen, useRef, refMonth.year, refMonth.month]);

  // Muat group plan sumber terpilih; default centang semua.
  useEffect(() => {
    if (!refPlanId) return;
    let alive = true;
    void planService
      .fetchMonthlyPlanById(refPlanId)
      .then((p) => {
        if (!alive) return;
        const groups = p.weeks.flatMap((w) => w.groups);
        setRefGroups(groups);
        setSelectedGroupIds(groups.map((g) => g._id));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refPlanId]);

  const toggleGroup = (id: ID) =>
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const submit = () => {
    if (!name) return;
    if (useRef && refPlanId && selectedGroupIds.length > 0) {
      onSubmit(name, { copyFromPlanId: refPlanId, copyGroupIds: selectedGroupIds });
    } else {
      onSubmit(name);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalShell
        icon={<CalendarDays size={20} />}
        title="Buat Plan Bulan Ini"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button leftIcon={<ArrowRight size={14} />} onClick={submit}>
              Buat
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Nama Plan" required>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <Switch
            checked={useRef}
            onChange={setUseRef}
            label="Ambil dari referensi"
            description="Salin group & item dari plan lain (bisa bulan sebelumnya). Status ceklis di-reset."
          />
          {useRef && (
            <div className="space-y-2 rounded-xl border border-neutral-200 p-3">
              <FormField label="Bulan sumber">
                <MonthPicker value={refMonth} onChange={setRefMonth} />
              </FormField>
              {refPlans.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  Tidak ada plan di bulan ini. Pilih bulan lain.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {refPlans.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setRefPlanId(p._id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        p._id === refPlanId
                          ? "bg-emerald-600 text-white"
                          : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {refPlanId && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    Group yang disalin
                  </p>
                  {refGroups.length === 0 ? (
                    <p className="text-xs text-neutral-500">Plan ini tidak punya group.</p>
                  ) : (
                    refGroups.map((g) => {
                      const checked = selectedGroupIds.includes(g._id);
                      return (
                        <button
                          key={g._id}
                          type="button"
                          onClick={() => toggleGroup(g._id)}
                          className="flex w-full items-center gap-2 rounded-lg border border-neutral-100 px-2 py-1.5 text-left hover:bg-neutral-50"
                        >
                          <span className={checked ? "text-emerald-600" : "text-neutral-300"}>
                            {checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          </span>
                          <span className="flex-1 text-sm text-neutral-800">{g.name}</span>
                          <span className="text-[11px] text-neutral-500">
                            {g.items.length} item · {GROUP_KIND_LABEL[g.kind]}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-neutral-500">
            Plan dibuat untuk {periodLabel}; tambah group sendiri (belanja, menu masak,
            dst) atau salin dari referensi. Anda bisa membuat lebih dari satu plan per bulan.
          </p>
        </div>
      </ModalShell>
    </Modal>
  );
}

/* ─────────── EditPlanModal ─────────── */
function EditPlanModal({
  isOpen,
  onClose,
  onSubmit,
  initialName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initialName);
    }
  }, [isOpen, initialName]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalShell
        icon={<Pencil size={20} />}
        title="Edit Plan"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={() => name && onSubmit(name)}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Nama Plan" required>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <p className="text-xs text-neutral-500">
            Budget kini diatur per-group saat menambah / mengedit group.
          </p>
        </div>
      </ModalShell>
    </Modal>
  );
}

/* ─────────── GroupFormModal ─────────── */
function GroupFormModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: PlanGroup | null;
  onSubmit: (draft: Omit<PlanGroup, "_id" | "items">) => Promise<void> | void;
}) {
  const [kind, setKind] = useState<PlanGroupKind>("shopping");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_GROUP_ICON.shopping);
  const [categoryId, setCategoryId] = useState<ID | null>(null);
  const [note, setNote] = useState("");
  const [budget, setBudget] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKind(initial.kind);
      setName(initial.name);
      setIcon(initial.icon || DEFAULT_GROUP_ICON[initial.kind]);
      setCategoryId(initial.linkedCategoryId ?? null);
      setNote(initial.note ?? "");
      setBudget(initial.budget ?? 0);
    } else {
      setKind("shopping");
      setName("");
      setIcon(DEFAULT_GROUP_ICON.shopping);
      setCategoryId(null);
      setNote("");
      setBudget(0);
    }
  }, [isOpen, initial]);

  const handleKindChange = (k: PlanGroupKind) => {
    setKind(k);
    if (!initial) setIcon(DEFAULT_GROUP_ICON[k]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalShell
        icon={renderIcon(icon, "ClipboardList", 20)}
        title={initial ? "Edit Group" : "Tambah Group"}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={() =>
                name &&
                onSubmit({
                  kind,
                  name,
                  icon,
                  budget: budget > 0 ? budget : undefined,
                  linkedCategoryId: categoryId ?? undefined,
                  note: note || undefined,
                })
              }
            >
              {initial ? "Simpan" : "Tambah"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Jenis Group" required>
            <RadioGroup
              name="group-kind"
              value={kind}
              onChange={(v) => handleKindChange(v as PlanGroupKind)}
              options={KIND_OPTIONS}
            />
          </FormField>
          <FormField label="Nama Group" required>
            <Input
              placeholder="mis. Belanja Mingguan / Menu Senin / Tagihan Listrik"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Ikon">
            <PlanIconPicker value={icon} onChange={setIcon} />
          </FormField>
          <FormField label="Kategori Transaksi (untuk auto-catat saat ceklis)">
            <CategorySelect
              kind="expense"
              value={categoryId}
              onChange={(v) => setCategoryId(v as ID)}
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Kategori yang dipakai saat sistem membuat transaksi otomatis dari ceklis item.
            </p>
          </FormField>
          <FormField label="Budget Group (opsional)">
            <CurrencyInput value={budget} onChange={setBudget} />
            <p className="mt-1 text-[11px] text-neutral-500">
              Batas dana untuk group ini. Estimasi item akan dibandingkan dengan budget ini.
            </p>
          </FormField>
          <FormField label="Catatan (opsional)">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </div>
      </ModalShell>
    </Modal>
  );
}

/* ─────────── ItemFormModal ─────────── */
function ItemFormModal({
  isOpen,
  onClose,
  initial,
  group,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: PlanItem | null;
  group: PlanGroup | null;
  onSubmit: (draft: Omit<PlanItem, "_id" | "order" | "done">) => Promise<void> | void;
}) {
  const isMeal = group?.kind === "meal";
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [linkedAccountId, setLinkedAccountId] = useState<ID | null>(null);
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<PlanIngredient[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initial.name);
      setQuantity(initial.quantity ?? "");
      setUnit(initial.unit ?? "");
      setEstimatedPrice(initial.estimatedPrice ?? 0);
      setLinkedAccountId(initial.linkedAccountId ?? null);
      setNotes(initial.notes ?? "");
      setIngredients(initial.ingredients ?? []);
    } else {
      setName("");
      setQuantity("");
      setUnit(isMeal ? "porsi" : "pcs");
      setEstimatedPrice(0);
      setLinkedAccountId(null);
      setNotes("");
      setIngredients([]);
    }
  }, [isOpen, initial, isMeal]);

  const computedPrice = useMemo(
    () =>
      isMeal && ingredients.length > 0
        ? ingredients.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0)
        : estimatedPrice,
    [isMeal, ingredients, estimatedPrice],
  );

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        _id: `tmp-ing-${Date.now()}-${prev.length}`,
        name: "",
        category: "sayuran",
        quantity: 0,
        unit: "gr",
        done: false,
      },
    ]);
  };
  const updateIng = (id: string, patch: Partial<PlanIngredient>) => {
    setIngredients((prev) => prev.map((i) => (i._id === id ? { ...i, ...patch } : i)));
  };
  const deleteIng = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i._id !== id));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalShell
        icon={renderIcon(undefined, isMeal ? "ChefHat" : "ShoppingCart", 20)}
        title={initial ? "Edit Item" : isMeal ? "Tambah Menu" : "Tambah Item"}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!name) return;
                onSubmit({
                  name,
                  quantity: quantity === "" ? undefined : Number(quantity),
                  unit: unit || undefined,
                  // Untuk meal: server akan recompute dari ingredients.
                  estimatedPrice: isMeal ? computedPrice : estimatedPrice || undefined,
                  linkedAccountId: linkedAccountId ?? undefined,
                  notes: notes || undefined,
                  ingredients: isMeal && ingredients.length > 0 ? ingredients : undefined,
                });
              }}
            >
              {initial ? "Simpan" : "Tambah"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Nama" required>
            <Input
              autoFocus
              placeholder={isMeal ? "mis. Ayam Goreng" : "mis. Beras 5kg"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kuantitas">
              <Input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </FormField>
            <FormField label="Satuan">
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </FormField>
          </div>
          {!isMeal && (
            <FormField label="Estimasi Harga (Rp)">
              <CurrencyInput value={estimatedPrice} onChange={setEstimatedPrice} />
            </FormField>
          )}

          <FormField
            label={isMeal ? "Dompet sumber dana (default semua bahan)" : "Dompet sumber dana"}
          >
            <AccountSelect
              value={linkedAccountId}
              onChange={(id) => setLinkedAccountId(id as ID)}
              placeholder="Pilih dompet"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              {isMeal
                ? "Jika diisi, semua bahan tanpa dompet sendiri akan ambil dari sini saat dicentang."
                : "Wajib diisi sebelum item bisa di-ceklis (auto-create transaksi out). Jika item sudah terceklis, mengganti dompet akan memindahkan transaksinya ke dompet baru."}
            </p>
          </FormField>

          <FormField label="Catatan (opsional)">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>

          {isMeal && (
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-800">Bahan & Harga</p>
                  <p className="text-[11px] text-neutral-500">
                    Estimasi harga item ditentukan dari total harga semua bahan.
                  </p>
                </div>
                <Button size="sm" variant="ghost" leftIcon={<Plus size={10} />} onClick={addIngredient}>
                  Tambah Bahan
                </Button>
              </div>
              {ingredients.length === 0 && (
                <p className="text-xs text-neutral-500">
                  Belum ada bahan. Tambah minimal 1 supaya bisa di-ceklis & catat transaksi.
                </p>
              )}
              {/* (#1) Di mobile baris bahan dulu terlalu sempit (nama bahan ~1fr
                  dari layar kecil). Sekarang baris punya lebar minimum nyaman &
                  bisa di-scroll menyamping; tiap kolom diberi label kecil agar
                  jelas walau header tak muat. */}
              {ingredients.length > 0 && (
                <div className="-mx-3 overflow-x-auto px-3">
                  <ul className="min-w-[740px] space-y-1.5">
                    <li className="grid grid-cols-[minmax(140px,1fr)_110px_64px_60px_120px_150px_32px] gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                      <span>Nama bahan</span>
                      <span>Kategori</span>
                      <span>Qty</span>
                      <span>Satuan</span>
                      <span>Harga</span>
                      <span>Dompet</span>
                      <span aria-hidden />
                    </li>
                    {ingredients.map((ing) => (
                      <li
                        key={ing._id}
                        className="grid grid-cols-[minmax(140px,1fr)_110px_64px_60px_120px_150px_32px] items-center gap-1.5"
                      >
                        <Input
                          placeholder="Nama bahan"
                          value={ing.name}
                          onChange={(e) => updateIng(ing._id, { name: e.target.value })}
                        />
                        <select
                          value={ing.category ?? "sayuran"}
                          onChange={(e) =>
                            updateIng(ing._id, { category: e.target.value as PlanItemCategory })
                          }
                          className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-800 focus:border-emerald-400 focus:outline-none"
                        >
                          {PLAN_ITEM_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={ing.quantity || ""}
                          onChange={(e) => updateIng(ing._id, { quantity: Number(e.target.value) || 0 })}
                        />
                        <Input
                          placeholder="Unit"
                          value={ing.unit}
                          onChange={(e) => updateIng(ing._id, { unit: e.target.value })}
                        />
                        <CurrencyInput
                          value={ing.estimatedPrice ?? 0}
                          onChange={(v) => updateIng(ing._id, { estimatedPrice: v })}
                        />
                        <AccountSelect
                          value={ing.linkedAccountId ?? null}
                          onChange={(id) =>
                            updateIng(ing._id, { linkedAccountId: (id as ID) ?? undefined })
                          }
                          placeholder="Default"
                        />
                        <button
                          type="button"
                          aria-label="Hapus bahan"
                          onClick={() => deleteIng(ing._id)}
                          className="flex items-center justify-center rounded-md p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ingredients.length > 0 && (
                <p className="mt-2 text-right text-xs text-neutral-600">
                  Total estimasi:{" "}
                  <CurrencyText amount={computedPrice} type="neutral" size="sm" />
                </p>
              )}
            </div>
          )}
        </div>
      </ModalShell>
    </Modal>
  );
}

/* ─────────── PlanGroupCard ─────────── */
interface PlanGroupCardProps {
  group: PlanGroup;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  onAddItem: () => void;
  onEditItem: (item: PlanItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItem: (item: PlanItem, done: boolean) => void;
  onToggleIngredient: (item: PlanItem, ing: PlanIngredient, done: boolean) => void;
}

function PlanGroupCard({
  group,
  collapsed,
  onToggleCollapse,
  onEditGroup,
  onDeleteGroup,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleItem,
  onToggleIngredient,
}: PlanGroupCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const estimated = group.items.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);
  const budget = group.budget ?? 0;
  const remaining = budget - estimated;
  // Rincian per-kategori bahan (jumlah harga bahan per kategori; sembunyikan 0).
  const categoryRows = PLAN_ITEM_CATEGORIES.map((c) => ({
    label: c.label,
    total: group.items.reduce(
      (s, it) =>
        s +
        (it.ingredients ?? [])
          .filter((ing) => ing.category === c.value)
          .reduce((s2, ing) => s2 + (ing.estimatedPrice ?? 0), 0),
      0,
    ),
  })).filter((r) => r.total > 0);
  const hasFooter = estimated > 0 || budget > 0;
  return (
    <Section
      title={
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          {collapsed ? (
            <ChevronRight size={16} className="shrink-0 text-neutral-400" />
          ) : (
            <ChevronDown size={16} className="shrink-0 text-neutral-400" />
          )}
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${KIND_COLOR[group.kind]}`}>
            {renderIcon(group.icon, DEFAULT_GROUP_ICON[group.kind], 14)}
          </span>
          <span className="truncate">{group.name}</span>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
            {collapsed ? `${group.items.length} item` : GROUP_KIND_LABEL[group.kind]}
          </span>
        </button>
      }
      toolbar={
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={onAddItem}>
            Item
          </Button>
          <button
            type="button"
            aria-label="Edit group"
            onClick={onEditGroup}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            aria-label="Hapus group"
            onClick={onDeleteGroup}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      }
    >
      {collapsed ? null : (
      <div className="space-y-1 p-2">
        {group.items.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-neutral-500">
            Belum ada item.
          </p>
        ) : (
          group.items.map((item) => (
            <PlanItemRow
              key={item._id}
              item={item}
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item._id)}
              onToggle={(done) => onToggleItem(item, done)}
              onToggleIngredient={(ing, done) => onToggleIngredient(item, ing, done)}
            />
          ))
        )}
        {hasFooter && (
          <div className="border-t border-neutral-100 pt-1.5">
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              className="flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-50"
            >
              <span className="flex items-center gap-1">
                {showDetail ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Rincian
              </span>
              <span className="flex items-center gap-1">
                Estimasi:{" "}
                <CurrencyText
                  amount={estimated}
                  type={budget > 0 && estimated > budget ? "out" : "neutral"}
                  size="sm"
                />
              </span>
            </button>
            {showDetail && (
              <div className="space-y-1.5 px-3 pb-1 pt-1.5 text-xs text-neutral-500">
                {categoryRows.length > 0 && (
                  <div className="space-y-0.5">
                    {categoryRows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between">
                        <span>{r.label}</span>
                        <CurrencyText amount={r.total} type="neutral" size="sm" />
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-neutral-100 pt-0.5 font-medium text-neutral-600">
                      <span>Total</span>
                      <CurrencyText amount={estimated} type="neutral" size="sm" />
                    </div>
                  </div>
                )}
                {budget > 0 && (
                  <div className="space-y-0.5 border-t border-neutral-100 pt-1.5">
                    <div className="flex items-center justify-between">
                      <span>Budget</span>
                      <CurrencyText amount={budget} type="neutral" size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Estimasi</span>
                      <CurrencyText
                        amount={estimated}
                        type={estimated > budget ? "out" : "neutral"}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center justify-between font-medium text-neutral-600">
                      <span>Sisa{remaining < 0 ? " (lebih)" : ""}</span>
                      <CurrencyText
                        amount={Math.abs(remaining)}
                        type={remaining < 0 ? "out" : "neutral"}
                        size="sm"
                        showSign={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </Section>
  );
}

/* ─────────── PlanItemRow ─────────── */
interface PlanItemRowProps {
  item: PlanItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (done: boolean) => void;
  onToggleIngredient: (ing: PlanIngredient, done: boolean) => void;
}

function PlanItemRow({
  item,
  onEdit,
  onDelete,
  onToggle,
  onToggleIngredient,
}: PlanItemRowProps) {
  const hasIngredients = !!item.ingredients && item.ingredients.length > 0;
  const [expanded, setExpanded] = useState(false);
  const canCheckDirectly = !hasIngredients;
  const cannotCheckReason = !item.linkedAccountId && canCheckDirectly
    ? "Set dompet sumber dana (klik edit) sebelum ceklis."
    : null;

  return (
    <div className="rounded-lg border border-neutral-100 px-2 py-1.5">
      <div className="flex items-center gap-2">
        {canCheckDirectly ? (
          <button
            type="button"
            aria-label={item.done ? "Tandai belum selesai" : "Tandai selesai"}
            onClick={() => onToggle(!item.done)}
            className={item.done ? "text-emerald-600" : "text-neutral-400 hover:text-emerald-600"}
            title={cannotCheckReason ?? undefined}
            disabled={!!cannotCheckReason}
          >
            {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </button>
        ) : (
          <span
            className={item.done ? "text-emerald-600" : "text-neutral-300"}
            title="Ceklis di level bahan — header auto-centang saat semua bahan dicentang"
          >
            {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${item.done ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
            {item.name}
            {item.quantity != null && (
              <span className="ml-1 text-xs text-neutral-500">
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
            )}
          </p>
          {cannotCheckReason && (
            <p className="flex items-center gap-1 text-[11px] text-amber-700">
              <AlertTriangle size={10} /> {cannotCheckReason}
            </p>
          )}
        </div>
        {item.estimatedPrice != null && item.estimatedPrice > 0 && (
          <CurrencyText amount={item.estimatedPrice} type="neutral" size="sm" />
        )}
        {hasIngredients && (
          <button
            type="button"
            aria-label="Lihat bahan"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        <button
          type="button"
          aria-label="Edit item"
          onClick={onEdit}
          className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          aria-label="Hapus item"
          onClick={onDelete}
          className="rounded-md p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {hasIngredients && expanded && (
        <ul className="mt-2 space-y-1 border-t border-neutral-100 pt-2 pl-6">
          {item.ingredients!.map((ing) => (
            <li key={ing._id} className="flex items-center gap-2 text-xs">
              <button
                type="button"
                aria-label={ing.done ? "Batalkan ceklis bahan" : "Centang bahan"}
                onClick={() => onToggleIngredient(ing, !ing.done)}
                className={ing.done ? "text-emerald-600" : "text-neutral-400 hover:text-emerald-600"}
              >
                {ing.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              </button>
              <span className={`flex-1 ${ing.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
                {ing.name}
              </span>
              <span className="text-neutral-500">
                {ing.quantity} {ing.unit}
              </span>
              {ing.estimatedPrice != null && ing.estimatedPrice > 0 && (
                <CurrencyText amount={ing.estimatedPrice} type="neutral" size="sm" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MonthlyPlanPage;
