import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Pencil,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";
import { Section, InfoBox } from "@dep/ui/card";
import { Modal } from "@dep/ui/modal";
import { FormField, Input, Textarea } from "@dep/ui/form";
import { LoadingSpinner } from "@dep/ui/loading";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import * as adminService from "@/services/admin.service";
import { ModalShell } from "@/components/common/ModalShell";
import { useAuth } from "@/hooks/useAuth";
import type {
  AdminPatchPlanPayload,
  PlanTier,
  SubscriptionPlan,
} from "@/types";

const TIER_ORDER: PlanTier[] = ["free", "personal", "premium", "business"];

function formatLimit(n: number | null): string {
  if (n === null) return "∞";
  return n.toLocaleString("id-ID");
}

function formatPrice(n: number | null): string {
  if (n === null) return "Hubungi kami";
  if (n === 0) return "Gratis";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const AdminPlansPage = () => {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const isSuper = me?.adminLevel === "super";
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [taxPercent, setTaxPercent] = useState<string>("");
  const [savingTax, setSavingTax] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, settings] = await Promise.all([
        adminService.fetchAdminPlans(),
        adminService.fetchPaymentSettings(),
      ]);
      setPlans(list);
      setTaxPercent(String(settings.taxPercent));
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveTax = async () => {
    const n = Math.max(0, Math.min(100, Number(taxPercent) || 0));
    setSavingTax(true);
    try {
      const saved = await notify.promise(adminService.patchPaymentSettings(n), {
        loading: "Menyimpan PPN…",
        success: "PPN diperbarui ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      setTaxPercent(String(saved.taxPercent));
    } catch {
      // surfaced
    } finally {
      setSavingTax(false);
    }
  };

  const handleReset = async (tier: PlanTier) => {
    const ok = await confirm({
      title: `Reset paket ${tier} ke default?`,
      message:
        "Semua override (harga, quota, highlights) di tier ini akan dibuang. Default catalog akan dipakai lagi.",
      confirmLabel: "Reset",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(adminService.resetAdminPlan(tier), {
        loading: "Mereset…",
        success: "Plan kembali ke default ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      void load();
    } catch {
      // surfaced
    }
  };

  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
      ),
    [plans],
  );

  if (loading && plans.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/admin")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Kembali ke Admin Panel
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Plan Catalog
        </h1>
        <p className="text-sm text-neutral-500">
          Atur harga, quota, dan copy paket langganan. Perubahan langsung
          terlihat di landing & halaman langganan tanpa redeploy.
        </p>
      </header>

      {!isSuper && (
        <InfoBox
          variant="warning"
          title="Read-only"
          description="Level Anda tidak bisa edit plan. Hubungi super-admin."
        />
      )}

      <Section title="Paket Aktif" icon={<Sparkles size={16} />}>
        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
          {sortedPlans.map((p) => (
            <article
              key={p.tier}
              className={`relative flex flex-col rounded-2xl border p-4 ${
                p.featured
                  ? "border-emerald-400 ring-2 ring-emerald-100"
                  : "border-neutral-200"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <Star size={10} /> Featured
                </span>
              )}
              <h3 className="text-base font-semibold text-neutral-900">
                {p.name}
              </h3>
              <p className="mt-1 text-xs text-neutral-500">{p.tagline}</p>
              <p className="mt-3 text-xl font-bold text-neutral-900">
                {formatPrice(p.pricePerMonth)}
                {p.pricePerMonth !== null && p.pricePerMonth > 0 && (
                  <span className="text-xs font-normal text-neutral-500">
                    /bulan
                  </span>
                )}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                <Quota label="Pembukuan" value={p.maxBooks} />
                <Quota
                  label="Tx/bulan/buku"
                  value={p.maxTransactionsPerBookPerMonth}
                />
                <Quota label="Dompet" value={p.maxAccountsPerBook} />
                <Quota label="Tabungan" value={p.maxSavingsPerBook} />
                <Quota label="Anggota" value={p.maxMembersPerBook} />
                <Quota
                  label="Monthly Plan"
                  value={p.maxMonthlyPlans}
                  zeroLabel="—"
                />
              </dl>
              <p className="mt-3 text-[11px] text-neutral-500">
                Auto-backup:{" "}
                <strong>{p.autoBackupEnabled ? "Ya" : "Tidak"}</strong>
              </p>
              {p.highlights.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] text-neutral-600">
                  {p.highlights.slice(0, 3).map((h, i) => (
                    <li key={i}>• {h}</li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Pencil size={12} />}
                  onClick={() => setEditing(p)}
                  disabled={!isSuper}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<RotateCcw size={12} />}
                  onClick={() => void handleReset(p.tier)}
                  disabled={!isSuper}
                  title="Reset ke default catalog"
                >
                  Reset
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Pajak (PPN)" icon={<Sparkles size={16} />}>
        <div className="space-y-3 p-3">
          <p className="text-xs text-neutral-500">
            PPN dibebankan saat upgrade paket berbayar dan tampil sebagai baris
            terpisah di rincian pembayaran. Berlaku global untuk semua paket.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <FormField label="PPN (%)">
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                disabled={!isSuper}
                className="w-32"
              />
            </FormField>
            <Button
              onClick={() => void handleSaveTax()}
              isLoading={savingTax}
              disabled={!isSuper}
            >
              Simpan PPN
            </Button>
          </div>
        </div>
      </Section>

      <EditPlanModal
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    </div>
  );
};

interface QuotaProps {
  label: string;
  value: number | null;
  zeroLabel?: string;
}

function Quota({ label, value, zeroLabel = "0" }: QuotaProps) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">
        {value === 0 ? zeroLabel : formatLimit(value)}
      </dd>
    </>
  );
}

// ── Edit Plan Modal ───────────────────────────────────────────────────────────

/**
 * Form values pakai string untuk number-nullable supaya UI bisa bedakan
 * "kosong" (= unlimited / null) vs "0" yang valid. Saat submit kita parse.
 */
interface EditPlanFormValues {
  name: string;
  pricePerMonth: string;
  maxBooks: string;
  maxTransactionsPerBookPerMonth: string;
  maxAccountsPerBook: string;
  maxSavingsPerBook: string;
  maxMembersPerBook: string;
  maxMonthlyPlans: string;
  autoBackupEnabled: boolean;
  tagline: string;
  highlights: string; // newline-separated
  featured: boolean;
  ctaLabel: string;
}

interface EditPlanModalProps {
  target: SubscriptionPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

function toFormString(n: number | null): string {
  return n === null ? "" : String(n);
}

function parseNullableNumber(s: string): number | null | undefined {
  const trimmed = s.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

function EditPlanModal({ target, onClose, onSaved }: EditPlanModalProps) {
  const form = useForm<EditPlanFormValues>({
    values: {
      name: target?.name ?? "",
      pricePerMonth: toFormString(target?.pricePerMonth ?? 0),
      maxBooks: toFormString(target?.maxBooks ?? null),
      maxTransactionsPerBookPerMonth: toFormString(
        target?.maxTransactionsPerBookPerMonth ?? null,
      ),
      maxAccountsPerBook: toFormString(target?.maxAccountsPerBook ?? null),
      maxSavingsPerBook: toFormString(target?.maxSavingsPerBook ?? null),
      maxMembersPerBook: toFormString(target?.maxMembersPerBook ?? null),
      maxMonthlyPlans: toFormString(target?.maxMonthlyPlans ?? null),
      autoBackupEnabled: target?.autoBackupEnabled ?? false,
      tagline: target?.tagline ?? "",
      highlights: (target?.highlights ?? []).join("\n"),
      featured: target?.featured ?? false,
      ctaLabel: target?.ctaLabel ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (!target) return;
    const payload: AdminPatchPlanPayload = {
      name: data.name.trim() || undefined,
      pricePerMonth: parseNullableNumber(data.pricePerMonth),
      maxBooks: parseNullableNumber(data.maxBooks),
      maxTransactionsPerBookPerMonth: parseNullableNumber(
        data.maxTransactionsPerBookPerMonth,
      ),
      maxAccountsPerBook: parseNullableNumber(data.maxAccountsPerBook),
      maxSavingsPerBook: parseNullableNumber(data.maxSavingsPerBook),
      maxMembersPerBook: parseNullableNumber(data.maxMembersPerBook),
      maxMonthlyPlans: parseNullableNumber(data.maxMonthlyPlans),
      autoBackupEnabled: data.autoBackupEnabled,
      tagline: data.tagline.trim() || undefined,
      highlights: data.highlights
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      featured: data.featured,
      ctaLabel: data.ctaLabel.trim() || undefined,
    };
    try {
      await notify.promise(adminService.patchAdminPlan(target.tier, payload), {
        loading: "Menyimpan…",
        success: "Plan diperbarui ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      onSaved();
    } catch {
      // surfaced
    }
  });

  return (
    <Modal isOpen={!!target} onClose={onClose} size="lg">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<Sparkles size={20} className="text-emerald-600" />}
          title={`Edit Paket — ${target?.name ?? ""}`}
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Simpan
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <strong>Tips:</strong> kosongkan field quota untuk "tanpa
              batas". Isi <code>0</code> untuk men-disable fitur (mis. Monthly
              Plan di tier Free).
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Nama">
                <Input {...form.register("name")} />
              </FormField>
              <FormField label="CTA Label">
                <Input {...form.register("ctaLabel")} />
              </FormField>
            </div>

            <FormField label="Tagline">
              <Input {...form.register("tagline")} />
            </FormField>

            <FormField label="Harga / bulan (IDR, kosong = 'Hubungi kami')">
              <Input
                type="number"
                min={0}
                {...form.register("pricePerMonth")}
              />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Maks Pembukuan">
                <Input type="number" min={0} {...form.register("maxBooks")} />
              </FormField>
              <FormField label="Tx / bulan / buku">
                <Input
                  type="number"
                  min={0}
                  {...form.register("maxTransactionsPerBookPerMonth")}
                />
              </FormField>
              <FormField label="Dompet / buku">
                <Input
                  type="number"
                  min={0}
                  {...form.register("maxAccountsPerBook")}
                />
              </FormField>
              <FormField label="Tabungan / buku">
                <Input
                  type="number"
                  min={0}
                  {...form.register("maxSavingsPerBook")}
                />
              </FormField>
              <FormField label="Anggota / buku">
                <Input
                  type="number"
                  min={0}
                  {...form.register("maxMembersPerBook")}
                />
              </FormField>
              <FormField label="Monthly Plan">
                <Input
                  type="number"
                  min={0}
                  {...form.register("maxMonthlyPlans")}
                />
              </FormField>
            </div>

            <FormField label="Highlights (satu per baris)">
              <Textarea rows={4} {...form.register("highlights")} />
            </FormField>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...form.register("autoBackupEnabled")}
                />
                <span>Auto-backup aktif</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("featured")} />
                <span>Featured (badge "Populer")</span>
              </label>
            </div>
          </div>
        </ModalShell>
      </form>
    </Modal>
  );
}

export default AdminPlansPage;
