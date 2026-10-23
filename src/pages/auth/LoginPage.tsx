import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthTemplate } from "@dep/templates/auth";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ArrowLeft, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { QuickPersonaLoginGrid } from "@/components/organisms/demo/QuickPersonaLoginGrid";

const BRAND = {
  name: "Monage Demo",
  logo: <img src="/logo.png" alt="Monage" className="h-8 w-8 object-contain" />,
  headline: "Atur uangmu dengan tenang, tanpa istilah ribet.",
  description: "Edisi Mandiri Zero-Backend: Coba seluruh fitur langsung di browser tanpa server.",
  features: [
    "100% Berjalan Lokal (IndexedDB)",
    "3 Persona Lengkap (Personal, Bisnis, Akun Bersih)",
    "Katalog Produk & Point-of-Sale (POS) Aktif",
  ],
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, cashierLogin } = useAuth();
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [cashierMode, setCashierMode] = useState(false);

  const handleSubmit = async (data: { email: string; password?: string }) => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const user = await login({ email: data.email, password: data.password || "demo123" });
      notify.success(`Halo, ${user.name.split(" ")[0]} 👋`);
      navigate(user.onboardedAt ? "/dashboard" : "/onboarding", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Gagal masuk. Coba lagi sebentar.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (cashierMode) {
    return (
      <CashierLoginCard
        brand={BRAND}
        onBack={() => setCashierMode(false)}
        onSubmit={async (username, pin) => {
          setLoading(true);
          setErrorMessage(undefined);
          try {
            const user = await cashierLogin({ username, pin });
            notify.success(`Halo, ${user.name.split(" ")[0]} 👋`);
            navigate("/dashboard/pos", { replace: true });
          } catch (err) {
            setErrorMessage(err instanceof ApiError ? err.message : "Gagal masuk.");
          } finally {
            setLoading(false);
          }
        }}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <AuthTemplate
      variant="minimal-card"
      mode="login"
      brand={BRAND}
      title="Monage Standalone Demo"
      subtitle="Eksplorasi manajemen keuangan pribadi dan POS kasir tanpa login manual."
      submitLabel="Masuk"
      isLoading={isLoading}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      onForgotPassword={() => navigate("/auth/forgot-password")}
      onRegister={() => navigate("/auth/register")}
      socialSlot={
        <div className="space-y-4">
          <QuickPersonaLoginGrid />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">opsi lainnya</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="space-y-2">
            <GoogleSignInButton mode="login" />
            <button
              type="button"
              onClick={() => {
                setErrorMessage(undefined);
                setCashierMode(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Store size={15} />
              Masuk sebagai Kasir POS
            </button>
          </div>
        </div>
      }
    />
  );
}

/** Kartu login kasir (username + PIN) */
function CashierLoginCard({
  brand,
  onBack,
  onSubmit,
  isLoading,
  errorMessage,
}: {
  brand: typeof BRAND;
  onBack: () => void;
  onSubmit: (username: string, pin: string) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string;
}) {
  const [username, setUsername] = useState("kasir1");
  const [pin, setPin] = useState("123456");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 transition hover:text-neutral-900"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          <div className="flex items-center gap-2">
            {brand.logo}
            <span className="font-bold text-neutral-900">{brand.name}</span>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-bold text-neutral-900">Masuk Kasir POS</h2>
          <p className="text-xs text-neutral-500">
            Gunakan username dan PIN kasir simulasi (bawaan: kasir1 / 123456).
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(username, pin);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Username Kasir
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs font-medium text-neutral-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              PIN (6 digit)
            </label>
            <input
              type="password"
              required
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs font-medium text-neutral-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Buka Terminal POS"}
          </button>
        </form>
      </div>
    </div>
  );
}
