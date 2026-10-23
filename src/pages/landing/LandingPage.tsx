import { useEffect, useState } from "react";
import { LandingTemplate } from "@dep/templates/landing";
import type { LandingPricingItem } from "@dep/templates/landing";
import { useNavigate } from "react-router-dom";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import {
  ArrowRight,
  BookOpen,
  Eye,
  Layers,
  PiggyBank,
  Play,
  Receipt,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import * as subscriptionService from "@/services/subscription.service";
import type { SubscriptionPlan } from "@/types";
import { useAuth } from "@/hooks/useAuth";

function formatPrice(plan: SubscriptionPlan): string {
  if (plan.pricePerMonth === null) return "Hubungi kami";
  if (plan.pricePerMonth === 0) return "Gratis";
  return `Rp ${plan.pricePerMonth.toLocaleString("id-ID")}`;
}

function planToPricingItem(
  plan: SubscriptionPlan,
  onSelect: (plan: SubscriptionPlan) => void,
): LandingPricingItem {
  return {
    name: plan.name,
    tagline: plan.tagline,
    price: formatPrice(plan),
    priceSuffix:
      plan.pricePerMonth === null || plan.pricePerMonth === 0 ? undefined : "/bulan",
    highlights: plan.highlights,
    featured: plan.featured,
    cta: {
      label: plan.ctaLabel,
      onClick: () => onSelect(plan),
    },
  };
}

const LandingPage = () => {
  const nav = useNavigate();
  const { loginDemo } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    subscriptionService.fetchPlans().then(setPlans).catch(() => {
      // Diam saja — section harga di-hide jika gagal load.
    });
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.tier === "business") {
      nav("/contact?topic=business");
      return;
    }
    // Belum login → arahkan ke register. Setelah login user bisa upgrade
    // dari halaman Pengaturan → Langganan.
    nav("/auth/register", { state: { intendedTier: plan.tier } });
  };

  // Sesi demo ephemeral (backend `POST /auth/demo`) — sekali klik langsung
  // masuk ke dashboard berisi data seed, tanpa perlu kredensial.
  const handleLoginDemo = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await loginDemo();
      nav("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Gagal membuat sesi demo. Coba lagi sebentar.";
      notify.error(msg);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <LandingTemplate
      variant="light-clean"
      brand={{
        name: "Monage",
        onClick: () => nav("/"),
        logo: (
          <img
            src="/logo.png"
            alt="Monage"
            className="h-full w-full object-contain"
          />
        ),
      }}
      nav={{
        items: [
          { label: "Fitur", onClick: () => nav("/#fitur") },
          { label: "Cara Kerja", onClick: () => nav("/#cara-kerja") },
          { label: "Harga", onClick: () => nav("/#harga") },
        ],
        signIn: { label: "Masuk", onClick: () => nav("/auth") },
        getStarted: {
          label: "Mulai Gratis",
          onClick: () => nav("/auth/register"),
        },
      }}
      hero={{
        badge: (
          <>
            <Sparkles size={12} /> Mulai gratis — upgrade saat butuh lebih
          </>
        ),
        title: (
          <>
            Kelola uang dengan{" "}
            <span className="text-emerald-500">tenang & visual</span>,
            <br className="hidden sm:block" /> tanpa istilah ribet.
          </>
        ),
        description:
          "Catat pemasukan, pengeluaran, transfer, dan tabungan lewat tampilan yang gampang dibaca. Tidak ada Debit/Kredit/Jurnal — hanya ikon, warna, dan arus uang yang jelas.",
        primaryCta: {
          label: "Coba Sekarang",
          icon: <ArrowRight size={16} />,
          onClick: () => nav("/auth/register"),
        },
        secondaryCta: {
          label: demoLoading ? "Menyiapkan demo…" : "Login Demo",
          icon: <Play size={16} />,
          onClick: handleLoginDemo,
        },
        stats: [
          { value: "0", label: "Istilah akuntansi" },
          { value: "< 30dt", label: "Setup transaksi pertama" },
          { value: "4", label: "Paket fleksibel" },
          { value: "100%", label: "Bahasa Indonesia" },
        ],
      }}
      preview={{
        url: "monage.my.id/dashboard",
        demo: {
          sidebar: {
            items: [
              { label: "Beranda", active: true },
              { label: "Transaksi" },
              { label: "Dompet" },
              { label: "Anggaran" },
              { label: "Tabungan" },
              { label: "Laporan" },
            ],
            sections: [
              {
                label: "Pembukuan",
                items: [
                  { label: "Pribadi", dotColor: "#10b981" },
                  { label: "Bisnis Sampingan", dotColor: "#3b82f6" },
                ],
              },
            ],
          },
          stats: [
            { label: "Saldo", value: "Rp 5,6", unit: "jt", valueColor: "#10b981" },
            { label: "Masuk", value: "+8,7", unit: "jt", valueColor: "#10b981" },
            { label: "Keluar", value: "−2,1", unit: "jt", valueColor: "#f97316" },
            { label: "Tabungan", value: "5,7", unit: "jt", valueColor: "#3b82f6" },
          ],
          chart: {
            title: "Arus Uang Bulan Ini",
            legend: [
              { color: "#10b981", label: "Uang Masuk" },
              { color: "#f97316", label: "Uang Keluar" },
            ],
          },
        },
      }}
      features={{
        eyebrow: "Fitur",
        title: "Semua yang Anda butuhkan untuk tenang soal uang.",
        description:
          "Dirancang untuk pemula. Tidak ada bahasa akuntansi rumit — semua disajikan sebagai aliran uang yang mudah dimengerti.",
        items: [
          {
            icon: <Eye size={20} />,
            iconColor: "green",
            title: "Visual-first",
            description:
              "Hijau untuk masuk, oranye untuk keluar, biru untuk transfer. Status anggaran & tabungan langsung terlihat warnanya.",
          },
          {
            icon: <Receipt size={20} />,
            iconColor: "cyan",
            title: "Catat 3 mode transaksi",
            description:
              "Uang masuk, uang keluar, dan transfer antar dompet — dengan dukungan biaya admin terpisah.",
          },
          {
            icon: <BookOpen size={20} />,
            iconColor: "purple",
            title: "Multi-pembukuan",
            description:
              "Pisahkan keuangan pribadi, bisnis sampingan, atau keluarga dalam pembukuan yang terisolasi. Switch konteks kapan saja.",
          },
          {
            icon: <PiggyBank size={20} />,
            iconColor: "green",
            title: "Anggaran & Tabungan",
            description:
              "Anggaran recurring per kategori dengan threshold alert. Tabungan dengan target setoran bulanan + tujuan jelas.",
          },
          {
            icon: <Wallet size={20} />,
            iconColor: "cyan",
            title: "Multi-dompet",
            description:
              "Tunai, bank, e-wallet, investasi — semua di satu tempat. Saldo total terhitung otomatis dari semua transaksi.",
          },
          {
            icon: <Layers size={20} />,
            iconColor: "purple",
            title: "Laporan visual",
            description:
              "Tren bulan ke bulan, donut kategori, top pengeluaran, dan tabel perbandingan anggaran sepanjang tahun.",
          },
          {
            icon: <Shield size={20} />,
            iconColor: "green",
            title: "Aman & privat",
            description:
              "Data Anda hanya untuk Anda. Tidak ada iklan, tidak ada tracker pihak ketiga. Token disimpan terenkripsi.",
          },
          {
            icon: <Sparkles size={20} />,
            iconColor: "cyan",
            title: "Onboarding < 1 menit",
            description:
              "Tiga langkah singkat: buat dompet, pilih kategori, catat transaksi pertama. Langsung jalan.",
          },
        ],
      }}
      pricing={
        plans.length === 0
          ? undefined
          : {
              eyebrow: "Harga",
              title: "Pilih paket sesuai kebutuhan Anda.",
              description:
                "Mulai dari gratis. Upgrade kapan pun untuk menambah jumlah pembukuan & transaksi. Semua paket termasuk anggaran, tabungan, dan laporan.",
              items: plans.map((p) => planToPricingItem(p, handleSelectPlan)),
            }
      }
      cta={{
        title: "Siap mulai mengelola uang dengan tenang?",
        description:
          "Buat akun gratis dalam 30 detik. Tanpa kartu kredit, tanpa iklan, tanpa tracker.",
        primary: {
          label: "Buat Akun Gratis",
          icon: <ArrowRight size={16} />,
          onClick: () => nav("/auth/register"),
        },
        secondary: {
          label: demoLoading ? "Menyiapkan demo…" : "Login dengan Akun Demo",
          onClick: handleLoginDemo,
        },
      }}
      footer={{
        copyright: "© 2026 Monage. Dibuat dengan ☕ untuk yang ingin tenang soal uang.",
        links: [
          // Halaman legal statis di public/ — wajib publik & tanpa login untuk
          // verifikasi OAuth Google (lihat docs/google-oauth-verification-guide.md).
          // Pakai `href` ABSOLUT yang sama persis dengan yang didaftarkan di
          // OAuth consent screen — crawler verifikasi homepage Google butuh
          // link nyata ke Kebijakan Privasi (anchor <a href>, bukan tombol JS)
          // dan mencocokkan URL-nya persis dengan consent screen.
          { label: "Kebijakan Privasi", href: "https://monage.my.id/privacy.html" },
          { label: "Syarat & Ketentuan", href: "https://monage.my.id/terms.html" },
          { label: "Kontak", href: "mailto:support@monage.my.id" },
        ],
      }}
    />
  );
};

export default LandingPage;
