/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resolveIcon } from "@/constants/iconRegistry";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Pencil,
  Trash2,
} from "lucide-react";
import { LoadingSpinner } from "@dep/ui/loading";
import { Button } from "@dep/ui/button";
import { InfoBox, IconChip, ListBox } from "@dep/ui/card";
import { ProgressBar } from "@dep/ui/progress";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import {
  useSavingDetail,
  deleteSaving,
  deleteSavingMovement,
} from "@/hooks/useSavings";
import { useAccountById } from "@/hooks/useLookup";
import { TO_LIB_TONE } from "@/constants/tones";
import { formatDate } from "@/utils/format";
import { CurrencyText } from "@/components/common/CurrencyText";
import { EmptyState } from "@/components/common/EmptyState";
import { SavingFormModal } from "@/components/savings/SavingFormModal";
import { SavingMovementModal } from "@/components/savings/SavingMovementModal";
import { SavingMovementEditModal } from "@/components/savings/SavingMovementEditModal";
import type { SavingMovement } from "@/types";

const SavingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { saving, movements, isLoading, error, refetch } = useSavingDetail(id);
  const [editOpen, setEditOpen] = useState(false);
  const [movementMode, setMovementMode] = useState<"deposit" | "withdraw" | null>(null);
  const [editingMovement, setEditingMovement] = useState<SavingMovement | null>(null);

  const handleDeleteMovement = async (m: SavingMovement) => {
    if (!id) return;
    const ok = await confirm({
      title: m.type === "deposit" ? "Hapus setoran?" : "Hapus penarikan?",
      message:
        "Saldo tabungan dan dompet terkait akan dikembalikan seperti sebelum pergerakan ini.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(deleteSavingMovement(id, m._id), {
        loading: "Menghapus…",
        success: "Riwayat dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
    } catch {
      // surfaced via notify
    }
  };

  const percent = useMemo(() => {
    if (!saving || saving.goalAmount <= 0) return 0;
    return Math.min(100, Math.round((saving.currentAmount / saving.goalAmount) * 100));
  }, [saving]);

  const thisMonthDeposit = useMemo(() => {
    const now = new Date();
    return movements
      .filter((m) => m.type === "deposit")
      .filter((m) => {
        const d = new Date(m.occurredAt);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, m) => sum + m.amount, 0);
  }, [movements]);

  const monthlyTarget = saving?.monthlyDeposit ?? 0;
  const monthlyPercent =
    monthlyTarget > 0
      ? Math.min(999, Math.round((thisMonthDeposit / monthlyTarget) * 100))
      : 0;

  if (isLoading && !saving) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !saving) {
    return (
      <div className="p-4">
        <InfoBox
          variant="error"
          title="Gagal memuat tabungan"
          description={error.message}
          action={{ label: "Coba lagi", onClick: () => void refetch() }}
        />
      </div>
    );
  }

  if (!saving) return null;

  const Icon = resolveIcon(saving.icon, "PiggyBank");
  const remaining = Math.max(0, saving.goalAmount - saving.currentAmount);
  const variant = percent >= 100 ? "success" : percent >= 75 ? "info" : "default";

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Hapus tabungan "${saving.name}"?`,
      message:
        "Saldo tabungan tidak otomatis kembali ke dompet — pastikan sudah ditarik dulu jika diperlukan.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(deleteSaving(saving._id), {
        loading: "Menghapus tabungan…",
        success: "Tabungan dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
      navigate("/dashboard/savings");
    } catch {
      // surfaced via notify
    }
  };

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/savings")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Semua Tabungan
      </button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <IconChip tone={TO_LIB_TONE[saving.tone]} size="lg">
            <Icon size={22} aria-hidden />
          </IconChip>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{saving.name}</h1>
            <p className="text-sm text-neutral-500">
              {saving.targetDate
                ? `Target tercapai ${formatDate(saving.targetDate, "long")}`
                : "Tanpa target waktu"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Pencil size={14} />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="danger-outline"
            leftIcon={<Trash2 size={14} />}
            onClick={() => void handleDelete()}
          >
            Hapus
          </Button>
        </div>
      </header>

      {/* (#6) Info ringkas menyamping (scroll horizontal di mobile) — pola sama
          dengan halaman daftar Tabungan, supaya tidak menumpuk tinggi di mobile. */}
      <section className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div className="min-w-[230px] flex-shrink-0 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700/80">
            Terkumpul
          </p>
          <div className="mt-1">
            <CurrencyText
              amount={saving.currentAmount}
              type="neutral"
              size="lg"
              className="text-blue-900"
            />
          </div>
          <div className="mt-2">
            <ProgressBar value={percent} variant={variant} size="sm" />
          </div>
          <p className="mt-1 text-xs text-blue-700">{percent}% tercapai</p>
        </div>

        <div className="min-w-[180px] flex-shrink-0 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Target
          </p>
          <div className="mt-1">
            <CurrencyText amount={saving.goalAmount} type="neutral" size="lg" />
          </div>
        </div>

        <div className="min-w-[180px] flex-shrink-0 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Sisa
          </p>
          <div className="mt-1">
            <CurrencyText
              amount={remaining}
              type={remaining > 0 ? "out" : "in"}
              size="lg"
              showSign={false}
            />
          </div>
        </div>

        {monthlyTarget > 0 && (
          <div className="min-w-[230px] flex-shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <header className="flex items-center justify-between text-emerald-700">
              <p className="text-xs font-medium uppercase tracking-wide">
                Setoran Bulan Ini
              </p>
              <span
                className={`text-xs font-medium ${
                  monthlyPercent >= 100 ? "text-emerald-700" : "text-emerald-700/70"
                }`}
              >
                {monthlyPercent}%
              </span>
            </header>
            <div className="mt-1">
              <CurrencyText
                amount={thisMonthDeposit}
                type="in"
                size="lg"
                showSign={false}
                className="text-emerald-900"
              />
            </div>
            <p className="mt-1 text-xs text-emerald-700/80">
              Target{" "}
              <CurrencyText amount={monthlyTarget} type="neutral" size="sm" />
            </p>
            <div className="mt-2">
              <ProgressBar
                value={Math.min(100, monthlyPercent)}
                variant={
                  monthlyPercent >= 100
                    ? "success"
                    : monthlyPercent >= 50
                    ? "info"
                    : "default"
                }
                size="sm"
              />
            </div>
          </div>
        )}
      </section>

      {saving.note && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
          “{saving.note}”
        </p>
      )}

      <div className="flex gap-2">
        <Button
          leftIcon={<ArrowDownToLine size={14} />}
          onClick={() => setMovementMode("deposit")}
        >
          Setor
        </Button>
        <Button
          variant="outline"
          leftIcon={<ArrowUpFromLine size={14} />}
          onClick={() => setMovementMode("withdraw")}
        >
          Tarik
        </Button>
      </div>

      <section>
        <h2 className="mb-2 text-base font-semibold text-neutral-800">Riwayat</h2>
        {movements.length === 0 ? (
          <EmptyState
            icon="History"
            title="Belum ada pergerakan"
            description="Mulai dengan setoran pertama Anda."
            actionLabel="Setor Sekarang"
            onAction={() => setMovementMode("deposit")}
          />
        ) : (
          <ListBox variant="outlined" pad="none">
            <div className="divide-y divide-neutral-100">
              {movements.map((m) => (
                <MovementRow
                  key={m._id}
                  movement={m}
                  onEdit={() => setEditingMovement(m)}
                  onDelete={() => void handleDeleteMovement(m)}
                />
              ))}
            </div>
          </ListBox>
        )}
      </section>

      <SavingFormModal
        saving={saving}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <SavingMovementModal
        saving={saving}
        mode={movementMode ?? "deposit"}
        isOpen={!!movementMode}
        onClose={() => setMovementMode(null)}
      />

      {id && (
        <SavingMovementEditModal
          savingId={id}
          movement={editingMovement}
          isOpen={!!editingMovement}
          onClose={() => setEditingMovement(null)}
        />
      )}
    </div>
  );
};

interface MovementRowProps {
  movement: SavingMovement;
  onEdit: () => void;
  onDelete: () => void;
}

function MovementRow({ movement, onEdit, onDelete }: MovementRowProps) {
  const account = useAccountById(movement.accountId);
  const isDeposit = movement.type === "deposit";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          isDeposit ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
        }`}
      >
        {isDeposit ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900">
          {isDeposit ? "Setoran" : "Penarikan"}
        </p>
        <p className="text-xs text-neutral-500">
          {isDeposit ? "Dari" : "Ke"} {account?.name ?? "—"} ·{" "}
          {formatDate(movement.occurredAt, "long")}
        </p>
        {movement.note && (
          <p className="text-xs text-neutral-500 italic">“{movement.note}”</p>
        )}
      </div>
      <CurrencyText
        amount={movement.amount}
        type={isDeposit ? "in" : "out"}
        size="sm"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit riwayat"
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Hapus riwayat"
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default SavingDetailPage;
