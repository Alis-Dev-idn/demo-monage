import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@dep/ui/button";
import { Section, InfoBox } from "@dep/ui/card";
import { ApiError } from "@dep/axios";
import * as subscriptionService from "@/services/subscription.service";
import { eventBus } from "@/utils/eventBus";
import { useSubscription } from "@/hooks/useSubscription";
import type { PlanTier, UserSubscription } from "@/types";

/**
 * Landing setelah user kembali dari hosted checkout payment gateway.
 * URL contract (lihat `docs/integration/PAYMENT-GATEWAY.md` §2.4):
 *   /subscription/result?status=success|pending|failed&sessionId=xxx&tier=premium
 *
 * Behavior:
 *   - `success` → polling `GET /subscription/me` sampai tier = expected
 *     (atau status `active`). Polling 2 detik × 30 kali (1 menit).
 *   - `pending` → tampilkan "diproses" + tombol refresh manual.
 *   - `failed`  → tampilkan error + CTA balik ke halaman langganan.
 */
type ResultStatus = "success" | "pending" | "failed";

const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 30;

const SubscriptionResultPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refetch } = useSubscription();
  const status = (params.get("status") as ResultStatus | null) ?? "pending";
  const sessionId = params.get("sessionId") ?? null;
  const expectedTier = params.get("tier") as PlanTier | null;

  const [pollAttempts, setPollAttempts] = useState(0);
  const [latest, setLatest] = useState<UserSubscription | null>(null);
  const [pollState, setPollState] = useState<
    "idle" | "polling" | "settled" | "timeout"
  >(status === "success" ? "polling" : "idle");
  const stopRef = useRef(false);

  const isMatchingTier = useCallback(
    (sub: UserSubscription): boolean => {
      if (!expectedTier) return sub.status === "active";
      return sub.tier === expectedTier && sub.status === "active";
    },
    [expectedTier],
  );

  // Polling worker. Ditrigger oleh effect saat status=success.
  const poll = useCallback(async () => {
    stopRef.current = false;
    setPollState("polling");
    setPollAttempts(0);
    for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
      if (stopRef.current) return;
      setPollAttempts(attempt);
      try {
        const sub = await subscriptionService.fetchMySubscription();
        setLatest(sub);
        if (isMatchingTier(sub)) {
          setPollState("settled");
          eventBus.emit("subscription:changed");
          await refetch();
          return;
        }
      } catch (err) {
        // Network blip — lanjut polling, jangan abort.
        if (err instanceof ApiError && err.status === 401) {
          // Session expired di tengah polling — biarkan default handler.
          setPollState("timeout");
          return;
        }
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    setPollState("timeout");
  }, [isMatchingTier, refetch]);

  useEffect(() => {
    if (status === "success") {
      void poll();
    }
    return () => {
      stopRef.current = true;
    };
  }, [status, poll]);

  const view = useMemo(() => resolveView(status, pollState), [status, pollState]);

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Status Pembayaran
        </h1>
        <p className="text-sm text-neutral-500">
          {sessionId ? (
            <>
              Referensi:{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                {sessionId}
              </code>
            </>
          ) : (
            "Hasil checkout dari payment gateway."
          )}
        </p>
      </header>

      <Section title={view.title} icon={view.icon}>
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${view.iconBg}`}
            >
              {view.bigIcon}
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900">
                {view.headline}
              </p>
              <p className="mt-1 text-sm text-neutral-600">{view.message}</p>
              {pollState === "polling" && status === "success" && (
                <p className="mt-2 text-xs text-neutral-500">
                  Mencoba memuat status terbaru… ({pollAttempts}/
                  {POLL_MAX_ATTEMPTS})
                </p>
              )}
              {latest && (
                <p className="mt-2 text-xs text-neutral-500">
                  Tier saat ini di server:{" "}
                  <strong className="text-neutral-700">{latest.tier}</strong> ·{" "}
                  status{" "}
                  <strong className="text-neutral-700">{latest.status}</strong>
                </p>
              )}
            </div>
          </div>

          {pollState === "timeout" && (
            <InfoBox
              variant="warning"
              title="Pembayaran masih diproses"
              description="Webhook dari gateway belum tiba. Refresh manual atau tunggu beberapa menit — biasanya tier akan otomatis aktif begitu pembayaran dikonfirmasi."
            />
          )}

          <div className="flex flex-wrap gap-2">
            {view.allowRetry && (
              <Button
                leftIcon={<RefreshCcw size={14} />}
                onClick={() => void poll()}
                isLoading={pollState === "polling"}
              >
                Cek lagi
              </Button>
            )}
            <Button
              variant="outline"
              leftIcon={<Home size={14} />}
              onClick={() => navigate("/dashboard/beranda")}
            >
              Ke Beranda
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/settings/subscription")}
            >
              Kembali ke Langganan
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
};

interface ResultView {
  title: string;
  icon: React.ReactNode;
  bigIcon: React.ReactNode;
  iconBg: string;
  headline: string;
  message: string;
  allowRetry: boolean;
}

function resolveView(
  status: ResultStatus,
  pollState: "idle" | "polling" | "settled" | "timeout",
): ResultView {
  if (status === "failed") {
    return {
      title: "Pembayaran Gagal",
      icon: <XCircle size={16} />,
      bigIcon: <XCircle size={28} className="text-rose-600" />,
      iconBg: "bg-rose-100",
      headline: "Pembayaran tidak berhasil",
      message:
        "Tagihan Anda tidak diproses. Tier langganan tetap di paket sebelumnya. Coba lagi dari halaman Langganan, atau gunakan metode pembayaran lain.",
      allowRetry: false,
    };
  }
  if (status === "pending") {
    return {
      title: "Pembayaran Diproses",
      icon: <Clock size={16} />,
      bigIcon: <Clock size={28} className="text-amber-600" />,
      iconBg: "bg-amber-100",
      headline: "Menunggu konfirmasi gateway",
      message:
        "Bank atau e-wallet sedang memproses pembayaran. Tier akan otomatis aktif begitu webhook diterima — biasanya < 30 detik.",
      allowRetry: true,
    };
  }
  // status === "success"
  if (pollState === "settled") {
    return {
      title: "Pembayaran Berhasil",
      icon: <CheckCircle2 size={16} />,
      bigIcon: <CheckCircle2 size={28} className="text-emerald-600" />,
      iconBg: "bg-emerald-100",
      headline: "Tier Anda sudah aktif ✓",
      message:
        "Selamat menikmati fitur tambahan! Quota baru sudah berlaku — coba buat pembukuan / transaksi tambahan.",
      allowRetry: false,
    };
  }
  if (pollState === "timeout") {
    return {
      title: "Menunggu Konfirmasi",
      icon: <Clock size={16} />,
      bigIcon: <Clock size={28} className="text-amber-600" />,
      iconBg: "bg-amber-100",
      headline: "Pembayaran masih diproses",
      message:
        "Polling sudah berlangsung 1 menit tapi tier belum berubah. Webhook biasanya tiba dalam < 5 menit. Refresh manual atau tunggu sebentar.",
      allowRetry: true,
    };
  }
  // polling / idle
  return {
    title: "Memverifikasi Pembayaran",
    icon: <Loader2 size={16} className="animate-spin" />,
    bigIcon: <Loader2 size={28} className="animate-spin text-emerald-600" />,
    iconBg: "bg-emerald-50",
    headline: "Memverifikasi status…",
    message:
      "Sedang cek dengan server. Jangan tutup tab ini sampai status terkonfirmasi.",
    allowRetry: false,
  };
}

export default SubscriptionResultPage;
