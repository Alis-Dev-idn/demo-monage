import { useState } from "react";
import {
  ArrowRight,
  Check,
  Crown,
  Mail,
  SkipForward,
  Sparkles,
  Wallet,
  Tag,
  Receipt,
} from "lucide-react";
import { Button } from "@dep/ui/button";
import { ProgressBar } from "@dep/ui/progress";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { AccountFormModal } from "@/components/accounts/AccountFormModal";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import * as authService from "@/services/auth.service";
import { useLookup, useCategoriesByKind } from "@/hooks/useLookup";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

type StepId = "account" | "categories" | "transaction" | "done";

const STEPS: Array<{ id: StepId; title: string; description: string; icon: typeof Wallet }> = [
  {
    id: "account",
    title: "Buat dompet pertama",
    description: "Misal: tunai, BCA, GoPay — sumber uang utama Anda.",
    icon: Wallet,
  },
  {
    id: "categories",
    title: "Pilih kategori favorit",
    description: "Anda bisa pakai kategori bawaan atau tambah nanti.",
    icon: Tag,
  },
  {
    id: "transaction",
    title: "Catat transaksi pertama",
    description: "Coba catat pengeluaran kecil hari ini.",
    icon: Receipt,
  },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [trialDismissed, setTrialDismissed] = useState(false);
  const { user, completeOnboarding } = useAuth();
  const { subscription, claimTrial } = useSubscription();
  const { accounts } = useLookup();
  const expenseCategories = useCategoriesByKind("expense");

  const emailVerified = !!user?.emailVerifiedAt;
  const showTrialOffer = !!subscription?.trialEligible && !trialDismissed;

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
      await authService.resendVerification(user.email);
      notify.success("Email verifikasi dikirim ulang. Cek inbox Anda.");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal mengirim ulang.");
    }
  };

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));

  const finishOnboarding = async () => {
    setFinishing(true);
    try {
      await notify.promise(completeOnboarding(), {
        loading: "Menyelesaikan…",
        success: "Selamat datang di Monage 🎉",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menyelesaikan."),
      });
      onComplete();
    } catch {
      // surfaced via notify
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      {showTrialOffer && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Crown size={20} aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                <Sparkles size={14} className="text-amber-500" />
                Coba Premium 1 Bulan — Gratis
              </p>
              <p className="text-xs text-neutral-600">
                Pembukuan tanpa batas, 300 transaksi/bulan, & fitur bisnis.
                Hanya bisa diklaim sekali per akun, langsung berakhir setelah 30 hari.
              </p>
            </div>
          </div>

          {emailVerified ? (
            <div className="flex flex-wrap gap-2">
              <Button
                leftIcon={<Crown size={14} />}
                onClick={() => void handleClaimTrial()}
                isLoading={claimingTrial}
              >
                Klaim Trial Premium
              </Button>
              <Button variant="ghost" onClick={() => setTrialDismissed(true)}>
                Nanti saja
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1.5 text-xs text-amber-800">
                <Mail size={13} /> Verifikasi email Anda dulu untuk mengklaim trial.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Mail size={14} />}
                  onClick={() => void handleResendVerification()}
                >
                  Kirim ulang verifikasi
                </Button>
                <Button variant="ghost" onClick={() => setTrialDismissed(true)}>
                  Nanti saja
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <header className="space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
          <span>
            Langkah {stepIndex + 1} dari {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900"
          >
            <SkipForward size={14} /> Lewati untuk sekarang
          </button>
        </div>
        <ProgressBar value={progress} variant="success" size="sm" />
      </header>

      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <step.icon size={22} aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900">{step.title}</h2>
        <p className="text-sm text-neutral-500">{step.description}</p>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
        {step.id === "account" && (
          <div className="space-y-3">
            {accounts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">
                  {accounts.length} dompet sudah dibuat:
                </p>
                <ul className="space-y-1 text-sm text-neutral-800">
                  {accounts.map((a) => (
                    <li key={a._id} className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600" />
                      {a.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-center text-sm text-neutral-600">
                Belum ada dompet. Tambah satu untuk mulai.
              </p>
            )}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowAccountModal(true)}
              >
                {accounts.length > 0 ? "Tambah Dompet Lain" : "Buat Dompet Pertama"}
              </Button>
            </div>
          </div>
        )}

        {step.id === "categories" && (
          <div className="space-y-3">
            <p className="text-center text-sm text-neutral-600">
              Anda sudah punya {expenseCategories.length} kategori pengeluaran bawaan.
              Atur lebih lanjut nanti di menu Kategori.
            </p>
            <CategoryGrid categories={expenseCategories.slice(0, 12)} mode="select" />
          </div>
        )}

        {step.id === "transaction" && (
          <TransactionForm
            defaultType="out"
            onSubmitted={() => void finishOnboarding()}
            onCancel={onSkip}
          />
        )}
      </div>

      <footer className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="text-sm text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
        >
          Sebelumnya
        </button>
        {step.id !== "transaction" ? (
          <Button
            onClick={goNext}
            rightIcon={<ArrowRight size={14} />}
            disabled={step.id === "account" && accounts.length === 0}
          >
            Lanjut
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => void finishOnboarding()}
            isLoading={finishing}
          >
            Selesaikan Tanpa Transaksi
          </Button>
        )}
      </footer>

      <AccountFormModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </div>
  );
}
