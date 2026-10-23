import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Store, UserCheck } from "lucide-react";
import { notify } from "@dep/notify";
import { PersonaCard } from "@/components/molecules/demo/PersonaCard";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import type { PersonaType } from "@/components/atoms/demo/PersonaAvatar";

interface QuickPersonaLoginGridProps {
  className?: string;
}

export function QuickPersonaLoginGrid({ className = "" }: QuickPersonaLoginGridProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loadingPersona, setLoadingPersona] = useState<PersonaType | null>(null);

  const handleSelectPersona = async (persona: PersonaType) => {
    setLoadingPersona(persona);
    try {
      const response = await api().post<{
        accessToken: string;
        activeBookId?: string;
        user: { _id: string; name: string; email: string; onboardedAt?: string | null };
      }>("/auth/persona-login", { persona });

      const { user, activeBookId } = response;

      // Sync local storage active book and persona identifiers
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("monage:mock:activePersona", persona);
        window.localStorage.setItem("monage:activePersona", persona);
        if (activeBookId) {
          window.localStorage.setItem("monage:activeBookId", activeBookId);
        } else {
          window.localStorage.removeItem("monage:activeBookId");
        }
      }

      // Also trigger auth login to notify React AuthContext
      await login({ email: user.email, password: "demo123" });

      const shortName = user.name.split(" ")[0] || "Demo";
      notify.success(`Masuk sebagai ${shortName} 👋`);

      if (!user.onboardedAt || persona === "fresh") {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal masuk sebagai persona pilihan. Coba lagi.";
      notify.error(message);
    } finally {
      setLoadingPersona(null);
    }
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Pilih Persona Demo Instan
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Klik salah satu profil untuk masuk langsung tanpa mengisi kata sandi:
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <PersonaCard
          persona="personal"
          title="Pengguna Personal"
          name="Budi Santoso"
          description="Pembukuan Pribadi, Dompet & Tabungan"
          highlights="Gaji bulanan, 3 dompet, budgeting, 15+ transaksi realistis"
          icon={<UserCheck size={20} />}
          isLoading={loadingPersona === "personal"}
          onClick={() => handleSelectPersona("personal")}
        />

        <PersonaCard
          persona="business"
          title="Pemilik Bisnis & POS"
          name="Siti Barokah"
          description="Usaha Kuliner Warung Berkah & Kasir"
          highlights="Katalog 12 produk, pelacakan stok harian, POS kasir, laba rugi"
          icon={<Store size={20} />}
          isLoading={loadingPersona === "business"}
          onClick={() => handleSelectPersona("business")}
        />

        <PersonaCard
          persona="fresh"
          title="Akun Baru (Fresh)"
          name="Pengguna Baru"
          description="Simulasi Akun Bersih & Wizard Onboarding"
          highlights="Tanpa data transaksi lama, siap untuk evaluasi setup pertama"
          icon={<Sparkles size={20} />}
          isLoading={loadingPersona === "fresh"}
          onClick={() => handleSelectPersona("fresh")}
        />
      </div>
    </div>
  );
}
