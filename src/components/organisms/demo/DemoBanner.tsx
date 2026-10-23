import { useState } from "react";
import { RotateCcw, Sparkles, X } from "lucide-react";
import { ResetDemoModal } from "./ResetDemoModal";

const DISMISS_KEY = "monage:demo:bannerDismissed";

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className = "" }: DemoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(DISMISS_KEY) === "true";
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "true");
    }
  };

  if (isDismissed) return null;

  return (
    <>
      <div
        className={`mb-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:px-5 sm:py-2.5 ${className}`}
      >
        <div className="flex items-start gap-2.5 sm:items-center">
          <Sparkles size={18} className="shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-amber-900">
              Mode Demo Standalone:
            </span>
            <span className="text-amber-800/90 ml-1">
              Berjalan 100% di browser tanpa backend. Data tersimpan di penyimpanan lokal Anda.
            </span>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100/70 hover:text-amber-950"
          >
            <RotateCcw size={13} className="shrink-0 text-amber-700" />
            <span>Reset Data</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup banner demo"
            title="Sembunyikan banner sesi ini"
            className="rounded-lg p-1 text-amber-600 transition hover:bg-amber-100/80 hover:text-amber-900"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <ResetDemoModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </>
  );
}
