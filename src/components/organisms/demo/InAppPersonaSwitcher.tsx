import { useState, useMemo } from "react";
import { ArrowRightLeft, Sparkles, Store, UserCheck, RotateCcw } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { notify } from "@dep/notify";
import { ModalShell } from "@/components/common/ModalShell";
import { PersonaCard } from "@/components/molecules/demo/PersonaCard";
import { ResetDemoModal } from "./ResetDemoModal";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import type { PersonaType } from "@/components/atoms/demo/PersonaAvatar";

interface InAppPersonaSwitcherProps {
  className?: string;
}

export function InAppPersonaSwitcher({ className = "" }: InAppPersonaSwitcherProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState<PersonaType | null>(null);

  const activePersona: PersonaType = useMemo(() => {
    if (!user) return "personal";
    if (user.email === "business@monage.demo" || user.email?.includes("business")) return "business";
    if (user.email === "fresh@monage.demo" || user.email?.includes("fresh")) return "fresh";
    return "personal";
  }, [user]);

  const personaMeta = {
    personal: { label: "Budi Santoso (Personal)", dot: "bg-emerald-500" },
    business: { label: "Siti Barokah (Bisnis)", dot: "bg-indigo-500" },
    fresh: { label: "Pengguna Baru (Fresh)", dot: "bg-sky-500" },
  };

  const currentMeta = personaMeta[activePersona] || personaMeta.personal;

  const handleSwitch = async (persona: PersonaType) => {
    setLoadingPersona(persona);
    try {
      const response = await api().post<{
        accessToken: string;
        activeBookId?: string;
        user: { _id: string; name: string; email: string; avatarUrl?: string; preferences?: Record<string, unknown> };
      }>("/auth/persona-login", { persona });

      // Synchronize client storage state immediately before navigation
      if (typeof window !== "undefined") {
        api().getTokenStorage()?.setAccessToken(response.accessToken);
        window.sessionStorage.setItem("monage:auth:accessToken", response.accessToken);
        window.sessionStorage.setItem("monage:mock:activePersona", persona);
        window.localStorage.setItem("monage:activePersona", persona);
        window.localStorage.setItem("monage:auth:user", JSON.stringify(response.user));

        if (response.activeBookId) {
          window.localStorage.setItem("monage:activeBookId", response.activeBookId);
        } else {
          window.localStorage.removeItem("monage:activeBookId");
        }
      }

      notify.success(`Beralih ke persona ${response.user.name} 🚀`);
      setIsOpen(false);

      // Refresh to reload data and contexts cleanly
      window.location.href = persona === "fresh" ? "/onboarding" : "/dashboard/beranda";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal beralih persona.";
      notify.error(message);
    } finally {
      setLoadingPersona(null);
    }
  };

  return (
    <>
      <div className={className}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:border-neutral-300"
          title="Klik untuk ganti persona demo"
        >
          <div className="flex items-center gap-2 truncate">
            <span className={`h-2 w-2 rounded-full shrink-0 ${currentMeta.dot}`} />
            <span className="truncate">Persona: {currentMeta.label}</span>
          </div>
          <ArrowRightLeft size={13} className="text-neutral-400 shrink-0" />
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <ModalShell
          title="Ganti Persona Simulasi Demo"
          subtitle="Beralih perspektif akun untuk menguji fitur personal finance, toko POS, atau alur onboarding."
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ArrowRightLeft size={18} />
            </span>
          }
          footer={
            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsResetOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition"
              >
                <RotateCcw size={13} />
                <span>Reset Seluruh Data</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                Tutup
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <PersonaCard
              persona="personal"
              title="Pengguna Personal"
              name="Budi Santoso"
              description="Keuangan Pribadi & 3 Dompet (BCA, GoPay, Tunai)"
              highlights="15+ transaksi mutasi, budgeting kategori, 2 target tabungan"
              icon={<UserCheck size={20} />}
              isLoading={loadingPersona === "personal"}
              onClick={() => handleSwitch("personal")}
            />

            <PersonaCard
              persona="business"
              title="Pemilik Bisnis & POS"
              name="Siti Barokah"
              description="Warung Berkah (Katalog 12 Produk & Kasir POS)"
              highlights="Penjualan kasir, pengurangan stok otomatis, laba rugi"
              icon={<Store size={20} />}
              isLoading={loadingPersona === "business"}
              onClick={() => handleSwitch("business")}
            />

            <PersonaCard
              persona="fresh"
              title="Akun Baru (Fresh Clean)"
              name="Pengguna Baru"
              description="Simulasi Akun Bersih Tanpa Data Lama"
              highlights="Mulai dari wizard onboarding pertama kali"
              icon={<Sparkles size={20} />}
              isLoading={loadingPersona === "fresh"}
              onClick={() => handleSwitch("fresh")}
            />
          </div>
        </ModalShell>
      </Modal>

      <ResetDemoModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
      />
    </>
  );
}
