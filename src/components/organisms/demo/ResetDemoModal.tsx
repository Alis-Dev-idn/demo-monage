import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { notify } from "@dep/notify";
import { ModalShell } from "@/components/common/ModalShell";
import { ResetWarningBlock } from "@/components/molecules/demo/ResetWarningBlock";
import { ResetDangerButton } from "@/components/atoms/demo/ResetDangerButton";
import { api } from "@/utils/api";
import type { DemoPersonaId } from "@/mocks/storage/reset";

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ResetDemoModal({ isOpen, onClose, onSuccess }: ResetDemoModalProps) {
  const [selectedPersona, setSelectedPersona] = useState<DemoPersonaId>("personal");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await api().post("/demo/reset", { targetPersona: selectedPersona });
      notify.success("Data demo berhasil dikembalikan ke kondisi awal! 🎉");
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        // Refresh page to clean up all React state and sync with reseeded IndexedDB
        window.location.href = selectedPersona === "fresh" ? "/onboarding" : "/dashboard/beranda";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengembalikan data demo. Coba lagi.";
      notify.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalShell
        title="Reset Data Demo ke Kondisi Awal"
        subtitle="Kembalikan seluruh transaksi, stok, dan pengaturan ke data simulasi pabrik."
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle size={20} />
          </span>
        }
        footer={
          <div className="flex w-full items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Batal
            </button>
            <ResetDangerButton
              onClick={handleReset}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </div>
        }
      >
        <ResetWarningBlock
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersona}
        />
      </ModalShell>
    </Modal>
  );
}
