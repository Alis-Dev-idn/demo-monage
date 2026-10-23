import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { ModalShell } from "@/components/common/ModalShell";
import { useSubscription } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pesan dari API (mis. "Kuota 20 transaksi habis…"). */
  message?: string;
  /** Heading utama. Default: "Kuota paket Anda habis". */
  title?: string;
}

/**
 * Modal generik yang ditampilkan saat aksi user di-block karena quota plan
 * (response 422 + code "QUOTA_EXCEEDED"). Memberi konteks tier sekarang
 * dan CTA langsung ke halaman langganan.
 */
export function UpgradeModal({
  isOpen,
  onClose,
  message,
  title = "Kuota paket Anda habis",
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const { currentPlan } = useSubscription();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalShell
        icon={<Zap size={20} className="text-emerald-500" />}
        title={title}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Nanti Saja
            </Button>
            <Button
              leftIcon={<Zap size={14} />}
              onClick={() => {
                onClose();
                navigate("/dashboard/settings/subscription");
              }}
            >
              Lihat Paket
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-neutral-700">
          {currentPlan && (
            <p>
              Anda sedang di paket{" "}
              <span className="font-semibold text-neutral-900">{currentPlan.name}</span>.
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">
              {message}
            </p>
          )}
          <p className="text-neutral-600">
            Upgrade kapan saja untuk menambah jumlah pembukuan, transaksi, dan
            akses fitur lanjutan.
          </p>
        </div>
      </ModalShell>
    </Modal>
  );
}
