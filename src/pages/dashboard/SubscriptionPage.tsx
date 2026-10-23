import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Mail, Sparkles, Zap } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Section, InfoBox } from "@dep/ui/card";
import { Modal } from "@dep/ui/modal";
import { FormField, Input, Textarea } from "@dep/ui/form";
import { LoadingSpinner } from "@dep/ui/loading";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useForm } from "react-hook-form";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { ModalShell } from "@/components/common/ModalShell";
import * as subscriptionService from "@/services/subscription.service";
import { resendVerification } from "@/services/auth.service";
import { eventBus } from "@/utils/eventBus";
import { isAdmin } from "@/types";
import type {
  PaymentMethodId,
  PaymentMethodQuote,
  PlanTier,
  SubscriptionPlan,
} from "@/types";

const TIER_RANK: Record<PlanTier, number> = {
  free: 0,
  personal: 1,
  premium: 2,
  business: 3,
};

function formatIDR(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatPrice(plan: SubscriptionPlan): string {
  if (plan.pricePerMonth === null) return "Hubungi kami";
  if (plan.pricePerMonth === 0) return "Gratis";
  return formatIDR(plan.pricePerMonth);
}

function formatLimit(n: number | null): string {
  return n === null ? "Tanpa batas" : n.toLocaleString("id-ID");
}

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    plans,
    subscription,
    usage,
    currentPlan,
    isLoading,
    change,
    cancel,
    claimTrial,
    refetch,
  } = useSubscription();
  const [busyTier, setBusyTier] = useState<PlanTier | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);

  const emailVerified = !!user?.emailVerifiedAt;

  const handleClaimTrial = async () => {
    const ok = await confirm({
      title: "Klaim Trial Premium 1 Bulan?",
      message:
        "Anda akan mendapat akses Premium gratis selama 30 hari. Trial hanya bisa diklaim sekali per akun dan berakhir otomatis setelah periode selesai.",
      confirmLabel: "Ya, Klaim",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    setClaimingTrial(true);
    try {
      await notify.promise(claimTrial(), {
        loading: "Mengaktifkan trial…",
        success: "Trial Premium 1 bulan aktif 🎉",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal klaim trial."),
      });
    } catch {
      // surfaced via notify
    } finally {
      setClaimingTrial(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    try {
      await resendVerification(user.email);
      notify.success("Email verifikasi dikirim ulang. Cek inbox Anda.");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal mengirim ulang.");
    }
  };
  // Paket berbayar yang sedang menunggu pemilihan metode pembayaran.
  const [payPlan, setPayPlan] = useState<SubscriptionPlan | null>(null);

  // Saat payment gateway belum live, user non-admin tidak boleh upgrade ke
  // tier berbayar. Disable tombolnya di UI biar feedback langsung, dan
  // backend tetap reject sebagai second line of defense. Begitu backend sudah
  // mengaktifkan pembayaran (`subscription.paymentEnabled`), tombol terbuka dan
  // upgrade akan mengarahkan ke checkout gateway.
  const userIsAdmin = isAdmin(user);
  const paymentEnabled = subscription?.paymentEnabled === true;

  function isPaidUpgrade(plan: SubscriptionPlan): boolean {
    const isPaid = (plan.pricePerMonth ?? 0) > 0;
    const isUpgrade =
      TIER_RANK[plan.tier] > TIER_RANK[currentPlan?.tier ?? "free"];
    return isPaid && isUpgrade;
  }

  function paidUpgradeBlocked(plan: SubscriptionPlan): boolean {
    if (userIsAdmin) return false;
    if (plan.tier === "business") return false; // pakai contact form
    if (paymentEnabled) return false; // pembayaran online aktif → boleh upgrade
    return isPaidUpgrade(plan);
  }

  // Sesi demo (data sementara, tanpa kredensial nyata) tidak boleh checkout
  // pembayaran sungguhan — arahkan ke pendaftaran akun asli sebagai gantinya.
  function demoUpgradeBlocked(plan: SubscriptionPlan): boolean {
    return !!user?.isDemo && isPaidUpgrade(plan);
  }

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => {
        const order: PlanTier[] = ["free", "personal", "premium", "business"];
        return order.indexOf(a.tier) - order.indexOf(b.tier);
      }),
    [plans],
  );

  const handleSelect = async (plan: SubscriptionPlan) => {
    if (plan.tier === "business") {
      setContactOpen(true);
      return;
    }
    if (plan.tier === currentPlan?.tier) {
      notify.info(`Anda sudah di paket ${plan.name}.`);
      return;
    }
    if (demoUpgradeBlocked(plan)) {
      notify.info("Ini sesi demo — buat akun asli dulu untuk upgrade ke paket berbayar.");
      navigate("/auth/register");
      return;
    }
    if (paidUpgradeBlocked(plan)) {
      notify.warning(
        "Pembayaran online belum aktif. Sementara ini hanya admin yang bisa upgrade paket berbayar. Anda bisa downgrade kapan saja.",
      );
      return;
    }
    // Upgrade berbayar (non-admin, gateway aktif) → pilih metode pembayaran dulu
    // agar biaya admin per metode bisa ditampilkan & dibebankan.
    if (!userIsAdmin && paymentEnabled && isPaidUpgrade(plan)) {
      setPayPlan(plan);
      return;
    }
    const isDowngrade =
      sortedPlans.findIndex((p) => p.tier === plan.tier) <
      sortedPlans.findIndex((p) => p.tier === (currentPlan?.tier ?? "free"));
    const ok = await confirm({
      title: isDowngrade
        ? `Turun ke paket ${plan.name}?`
        : `Upgrade ke paket ${plan.name}?`,
      message: isDowngrade
        ? "Setelah turun paket, data yang melebihi quota baru tetap tersimpan, tapi Anda tidak bisa menambah baru sampai sesuai quota."
        : `Anda akan dikenakan ${formatPrice(plan)} per bulan setelah konfirmasi.`,
      confirmLabel: isDowngrade ? "Turunkan" : "Lanjutkan",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    setBusyTier(plan.tier);
    try {
      // Notify.promise sayangnya tidak forward result-nya, jadi kita
      // jalankan change() lalu kalau ada `checkout` redirect manual ke
      // hosted checkout page (lihat docs/integration/PAYMENT-GATEWAY.md §2).
      const result = await notify.promise(
        change(plan.tier as Exclude<PlanTier, "business">),
        {
          loading: "Memperbarui paket…",
          success: (r) =>
            r.checkout
              ? "Mengarahkan ke pembayaran…"
              : `Paket aktif: ${plan.name} ✓`,
          error: (e) =>
            e instanceof ApiError ? e.message : "Gagal memperbarui paket.",
        },
      );
      eventBus.emit("subscription:changed");
      if (result.checkout) {
        // Redirect ke gateway; FE landing setelahnya pakai
        // /subscription/result?status=...&sessionId=...
        window.location.assign(result.checkout.checkoutUrl);
      }
    } catch {
      // surfaced
    } finally {
      setBusyTier(null);
    }
  };

  // Konfirmasi metode → buat checkout → redirect ke halaman pembayaran gateway.
  const handlePay = async (plan: SubscriptionPlan, method: PaymentMethodId) => {
    setBusyTier(plan.tier);
    try {
      const result = await notify.promise(
        change(plan.tier as Exclude<PlanTier, "business">, method),
        {
          loading: "Menyiapkan pembayaran…",
          success: (r) =>
            r.checkout ? "Mengarahkan ke pembayaran…" : `Paket aktif: ${plan.name} ✓`,
          error: (e) =>
            e instanceof ApiError ? e.message : "Gagal memproses pembayaran.",
        },
      );
      eventBus.emit("subscription:changed");
      setPayPlan(null);
      if (result.checkout) {
        window.location.assign(result.checkout.checkoutUrl);
      }
    } catch {
      // surfaced
    } finally {
      setBusyTier(null);
    }
  };

  const handleCancel = async () => {
    if (!subscription || subscription.tier === "free") return;
    const ok = await confirm({
      title: "Batalkan langganan?",
      message:
        "Akun akan otomatis turun ke paket Gratis di akhir periode pembayaran. Anda bisa mengaktifkan ulang kapan saja sebelum itu.",
      confirmLabel: "Ya, batalkan",
      cancelLabel: "Jangan",
    });
    if (!ok) return;
    try {
      await notify.promise(cancel(), {
        loading: "Membatalkan…",
        success: "Auto-cancel diaktifkan ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
    } catch {
      // surfaced
    }
  };

  if (isLoading && !subscription) {
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
        onClick={() => navigate("/dashboard/settings")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Kembali ke Pengaturan
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Langganan</h1>
        <p className="text-sm text-neutral-500">
          Atur paket Monage Anda dan pantau penggunaan kuota bulan ini.
        </p>
      </header>

      {currentPlan && subscription && (
        <Section title="Paket Aktif" icon={<Sparkles size={16} />}>
          <div className="grid gap-4 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Paket
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {currentPlan.name}
              </p>
              <p className="text-xs text-neutral-500">
                {currentPlan.pricePerMonth === null
                  ? "Hubungi kami"
                  : currentPlan.pricePerMonth === 0
                    ? "Gratis"
                    : `${formatIDR(currentPlan.pricePerMonth)} / bulan`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Pembukuan
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {usage?.books.used ?? "—"}{" "}
                <span className="text-sm font-normal text-neutral-500">
                  / {formatLimit(currentPlan.maxBooks)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Transaksi / pembukuan bulan ini
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                Maks {formatLimit(currentPlan.maxTransactionsPerBookPerMonth)}
              </p>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="sm:col-span-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                {subscription.status === "trialing" ? "Trial aktif sampai" : "Periode berlaku sampai"}{" "}
                <span className="font-medium text-neutral-800">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {subscription.status === "trialing" && (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-700">
                    Trial Premium
                  </span>
                )}
                {subscription.status !== "trialing" && subscription.cancelAtPeriodEnd && (
                  <span className="ml-2 rounded bg-rose-100 px-2 py-0.5 text-rose-700">
                    Auto-batal aktif
                  </span>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {usage && usage.transactionsPerBook.length > 0 && (
        <Section title="Pemakaian per Pembukuan (Bulan Ini)" icon={<Zap size={16} />}>
          <ul className="divide-y divide-neutral-100">
            {usage.transactionsPerBook.map((row) => {
              const pct = row.percentUsed ?? 0;
              const isOver = row.limit !== null && row.used >= row.limit;
              const barCls = isOver
                ? "bg-rose-500"
                : pct >= 80
                  ? "bg-amber-500"
                  : "bg-emerald-500";
              return (
                <li key={row.bookId} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {row.bookName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {row.used} / {formatLimit(row.limit)} transaksi
                    </p>
                  </div>
                  {row.limit !== null && (
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full ${barCls}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {subscription?.trialEligible && (
        <Section title="Penawaran Spesial" icon={<Sparkles size={16} />}>
          <div className="m-3 space-y-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Sparkles size={22} aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-neutral-900">
                  Trial Premium 1 Bulan — Gratis
                </p>
                <p className="text-sm text-neutral-600">
                  Nikmati pembukuan tanpa batas, 300 transaksi/bulan, dan fitur bisnis.
                  Hanya bisa diklaim <strong>sekali per akun</strong> dan berakhir otomatis
                  setelah 30 hari.
                </p>
              </div>
            </div>

            {user?.isDemo ? (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1.5 text-xs text-amber-800">
                  <Sparkles size={13} /> Ini sesi demo — buat akun asli untuk klaim trial ini.
                </p>
                <Button
                  variant="outline"
                  leftIcon={<Sparkles size={14} />}
                  onClick={() => navigate("/auth/register")}
                >
                  Buat Akun Asli
                </Button>
              </div>
            ) : emailVerified ? (
              <Button
                leftIcon={<Sparkles size={14} />}
                onClick={() => void handleClaimTrial()}
                isLoading={claimingTrial}
              >
                Klaim Sekarang
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1.5 text-xs text-amber-800">
                  <Mail size={13} /> Verifikasi email Anda terlebih dahulu untuk mengklaim trial.
                </p>
                <Button
                  variant="outline"
                  leftIcon={<Mail size={14} />}
                  onClick={() => void handleResendVerification()}
                >
                  Kirim ulang verifikasi
                </Button>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="Semua Paket" icon={<Sparkles size={16} />}>
        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
          {sortedPlans.map((plan) => {
            const isCurrent = plan.tier === currentPlan?.tier;
            return (
              <article
                key={plan.tier}
                className={`relative flex flex-col rounded-2xl border p-4 ${
                  plan.featured
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : "border-neutral-200"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Populer
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-500">{plan.tagline}</p>
                <p className="mt-3 text-xl font-bold text-neutral-900">
                  {formatPrice(plan)}
                  {plan.pricePerMonth !== null && plan.pricePerMonth > 0 && (
                    <span className="text-xs font-normal text-neutral-500">/bulan</span>
                  )}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {plan.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                      <Check size={12} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                {(() => {
                  const demoBlocked = demoUpgradeBlocked(plan);
                  // Demo tetap boleh diklik (klik → redirect ke pendaftaran),
                  // jadi dikeluarkan dari kondisi "blocked" yang men-disable tombol.
                  const blocked = !demoBlocked && paidUpgradeBlocked(plan);
                  const label = isCurrent
                    ? "Paket Aktif"
                    : demoBlocked
                      ? "Buat Akun untuk Upgrade"
                      : blocked
                        ? "Pembayaran segera hadir"
                        : plan.ctaLabel;
                  return (
                    <Button
                      className="mt-4"
                      size="sm"
                      variant={isCurrent || blocked ? "outline" : "primary"}
                      disabled={
                        isCurrent || blocked || busyTier === plan.tier
                      }
                      isLoading={busyTier === plan.tier}
                      leftIcon={
                        plan.tier === "business" ? <Mail size={12} /> : undefined
                      }
                      onClick={() => void handleSelect(plan)}
                      title={
                        demoBlocked
                          ? "Ini sesi demo — buat akun asli untuk upgrade paket berbayar."
                          : blocked
                            ? "Upgrade berbayar belum tersedia. Tunggu fitur pembayaran online aktif."
                            : undefined
                      }
                    >
                      {label}
                    </Button>
                  );
                })()}
              </article>
            );
          })}
        </div>
      </Section>

      {subscription && subscription.tier !== "free" && !subscription.cancelAtPeriodEnd && (
        <Section title="Zona Berbahaya" icon={<Sparkles size={16} />}>
          <div className="p-3">
            <InfoBox
              variant="error"
              title="Batalkan langganan"
              description="Akun akan otomatis turun ke paket Gratis di akhir periode pembayaran."
              action={{
                label: "Batalkan",
                onClick: () => void handleCancel(),
              }}
            />
          </div>
        </Section>
      )}

      <BusinessContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        onSent={() => {
          setContactOpen(false);
          void refetch();
        }}
      />

      <PaymentMethodModal
        plan={payPlan}
        isBusy={payPlan ? busyTier === payPlan.tier : false}
        onClose={() => setPayPlan(null)}
        onConfirm={(method) => {
          if (payPlan) void handlePay(payPlan, method);
        }}
      />
    </div>
  );
};

interface PaymentMethodModalProps {
  plan: SubscriptionPlan | null;
  isBusy: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethodId) => void;
}

function PaymentMethodModal({
  plan,
  isBusy,
  onClose,
  onConfirm,
}: PaymentMethodModalProps) {
  const [quotes, setQuotes] = useState<PaymentMethodQuote[]>([]);
  const [selected, setSelected] = useState<PaymentMethodId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = plan?.tier;

  useEffect(() => {
    if (tier !== "personal" && tier !== "premium") {
      setQuotes([]);
      setSelected(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    subscriptionService
      .fetchPaymentMethods(tier)
      .then((rows) => {
        if (!active) return;
        setQuotes(rows);
        setSelected(rows[0]?.method ?? null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof ApiError ? e.message : "Gagal memuat metode pembayaran.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tier]);

  const selectedQuote = quotes.find((q) => q.method === selected) ?? null;

  return (
    <Modal isOpen={!!plan} onClose={onClose} size="md">
      <ModalShell
        title={`Pembayaran — ${plan?.name ?? ""}`}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={onClose} disabled={isBusy}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => selected && onConfirm(selected)}
              isLoading={isBusy}
              disabled={!selected || loading}
            >
              Lanjut ke Pembayaran
            </Button>
          </>
        }
      >
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <InfoBox variant="error" title="Gagal memuat" description={error} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Pilih metode pembayaran. Biaya admin berbeda per metode dan
              ditambahkan ke total tagihan.
            </p>
            <div className="space-y-2">
              {quotes.map((q) => {
                const isSel = q.method === selected;
                return (
                  <button
                    key={q.method}
                    type="button"
                    onClick={() => setSelected(q.method)}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                      isSel
                        ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-200"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{q.label}</p>
                      <p className="text-xs text-neutral-500">{q.description}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Biaya admin: {formatIDR(q.adminFee)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatIDR(q.totalAmount)}
                      </p>
                      {isSel && (
                        <Check size={16} className="ml-auto mt-1 text-emerald-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedQuote && (
              <dl className="space-y-1 rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Harga paket</dt>
                  <dd className="text-neutral-800">{formatIDR(selectedQuote.baseAmount)}</dd>
                </div>
                {selectedQuote.tax > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">PPN {selectedQuote.taxPercent}%</dt>
                    <dd className="text-neutral-800">{formatIDR(selectedQuote.tax)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Biaya admin</dt>
                  <dd className="text-neutral-800">{formatIDR(selectedQuote.adminFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold">
                  <dt className="text-neutral-700">Total</dt>
                  <dd className="text-neutral-900">{formatIDR(selectedQuote.totalAmount)}</dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </ModalShell>
    </Modal>
  );
}

interface BusinessContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

interface ContactFormValues {
  name: string;
  email: string;
  company?: string;
  message: string;
}

function BusinessContactModal({ isOpen, onClose, onSent }: BusinessContactModalProps) {
  const { user } = useAuth();
  const form = useForm<ContactFormValues>({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      company: "",
      message: "",
    },
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      company: "",
      message: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await notify.promise(subscriptionService.requestBusinessContact(data), {
        loading: "Mengirim pesan…",
        success: "Pesan terkirim ✓ Tim kami akan menghubungi Anda.",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal mengirim."),
      });
      onSent();
    } catch {
      // surfaced
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<Mail size={20} className="text-blue-500" />}
          title="Hubungi Tim Bisnis"
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                Kirim Pesan
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Untuk paket Bisnis, kami menyusun penawaran kustom (jumlah pembukuan,
              kuota transaksi, integrasi, dan SLA). Tim sales akan menghubungi Anda
              di hari kerja berikutnya.
            </p>
            <FormField label="Nama" required>
              <Input {...form.register("name", { required: true })} />
            </FormField>
            <FormField label="Email" required>
              <Input type="email" {...form.register("email", { required: true })} />
            </FormField>
            <FormField label="Nama Perusahaan (opsional)">
              <Input {...form.register("company")} />
            </FormField>
            <FormField label="Kebutuhan Anda" required>
              <Textarea
                rows={4}
                placeholder="Ceritakan singkat: berapa pembukuan, transaksi per bulan, tim berapa orang…"
                {...form.register("message", { required: true })}
              />
            </FormField>
          </div>
        </ModalShell>
      </form>
    </Modal>
  );
}

export default SubscriptionPage;
