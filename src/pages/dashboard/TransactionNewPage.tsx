import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { QuotaBanner } from "@/components/common/QuotaBanner";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { useBooks } from "@/hooks/useBooks";
import { useTransactionQuota } from "@/hooks/useSubscription";
import type { TransactionType } from "@/types";

function parseType(value: string | null): TransactionType {
  if (value === "in" || value === "out" || value === "transfer") return value;
  return "out";
}

const TransactionNewPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultType = parseType(params.get("type"));
  const { activeBook } = useBooks();
  const txQuota = useTransactionQuota(activeBook?._id ?? null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  // Saat user buka halaman ini dalam keadaan kuota sudah habis → langsung
  // tampilkan modal upgrade supaya tidak isi form sia-sia.
  useEffect(() => {
    if (txQuota.isAtLimit && !upgradeMsg) {
      setUpgradeMsg(
        `Pembukuan "${activeBook?.name ?? ""}" sudah mencapai batas ${txQuota.limit} transaksi bulan ini di paket Anda.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txQuota.isAtLimit]);

  return (
    <div className="mx-auto max-w-xl space-y-5 p-4 sm:p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Catat Transaksi</h1>
        <p className="text-sm text-neutral-500">
          Pilih jenis transaksi, lalu lengkapi detailnya.
        </p>
      </header>

      <QuotaBanner kind="transactions" />

      <TransactionForm
        defaultType={defaultType}
        onSubmitted={() => navigate("/dashboard/transactions", { replace: true })}
        onCancel={() => navigate(-1)}
        onQuotaExceeded={(msg) => setUpgradeMsg(msg)}
      />

      <UpgradeModal
        isOpen={!!upgradeMsg}
        onClose={() => {
          setUpgradeMsg(null);
          if (txQuota.isAtLimit) navigate(-1);
        }}
        message={upgradeMsg ?? undefined}
        title="Tidak bisa menambah transaksi"
      />
    </div>
  );
};

export default TransactionNewPage;
