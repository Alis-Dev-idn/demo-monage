import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { FormField, Input } from "@dep/ui/form";
import { Select, type SelectOption } from "@dep/ui/select";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import { InfiniteScrollSentinel } from "@/components/common/InfiniteScrollSentinel";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatCurrency, formatDate } from "@/utils/format";
import { fetchAccounts } from "@/services/account.service";
import {
  createTransfer,
  fetchLinkableAccounts,
  fetchTransfers,
} from "@/services/business.service";
import type { Account, BookTransfer, LinkableAccount } from "@/types";

const TransfersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  const fetchPage = useCallback(
    (opts: { limit: number; offset: number }) => fetchTransfers(opts),
    [],
  );
  const { items: transfers, loading, loadingMore, hasMore, error, loadMore, reset } =
    usePaginatedList<BookTransfer>(fetchPage);

  useEffect(() => {
    if (error) notify.error(error.message);
  }, [error]);

  // Filter (catatan/jumlah) + grup per tanggal (#F).
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? transfers.filter(
          (t) =>
            (t.note ?? "").toLowerCase().includes(q) ||
            String(t.amount).includes(q),
        )
      : transfers;
    const map = new Map<string, BookTransfer[]>();
    for (const t of filtered) {
      const key = t.occurredAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [transfers, search]);

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Transfer Antar-Pembukuan</h1>
          <p className="text-sm text-neutral-500">Pindahkan dana ke dompet di pembukuan lain.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
          Transfer Baru
        </Button>
      </header>

      <DebouncedSearch value={search} onChange={setSearch} placeholder="Cari catatan / jumlah…" />

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat…</p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="ArrowLeftRight"
          title={search ? "Tidak ada hasil" : "Belum ada transfer"}
          description={search ? "Coba kata kunci lain." : "Buat transfer antar-pembukuan pertama."}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(([day, list], index) => {
            const open = openDays[day] ?? index === 0;
            const dayTotal = list.reduce((sum, t) => sum + t.amount, 0);
            return (
              <div key={day} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenDays((p) => ({ ...p, [day]: !open }))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight size={16} className={`text-neutral-400 transition-transform ${open ? "rotate-90" : ""}`} />
                    <div>
                      <div className="font-medium text-neutral-900">{formatDate(`${day}T00:00:00.000Z`, "long")}</div>
                      <div className="text-xs text-neutral-500">{list.length} transfer</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-700">{formatCurrency(dayTotal)}</span>
                </button>
                {open && (
                  <div className="divide-y divide-neutral-100">
                    {list.map((t) => (
                      <div key={t._id} className="flex items-center gap-3 px-4 py-2.5">
                        <ArrowLeftRight size={16} className="text-neutral-400" />
                        <div className="flex-1 text-sm">
                          <div className="font-medium text-neutral-900">{formatCurrency(t.amount)}</div>
                          <div className="text-xs text-neutral-500">{t.note ?? "Transfer antar-pembukuan"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <InfiniteScrollSentinel
            hasMore={hasMore && !search}
            isLoading={loadingMore}
            onLoadMore={() => void loadMore()}
          />
        </div>
      )}

      {showForm && (
        <TransferFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void reset();
          }}
        />
      )}
    </div>
  );
};

function TransferFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linkable, setLinkable] = useState<LinkableAccount[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toKey, setToKey] = useState(""); // `${bookId}::${accountId}`
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [a, l] = await Promise.all([fetchAccounts(), fetchLinkableAccounts()]);
        setAccounts(a);
        setLinkable(l);
        if (a[0]) setFromAccountId(a[0]._id);
      } catch (e) {
        notify.error(e instanceof ApiError ? e.message : "Gagal memuat dompet.");
      }
    })();
  }, []);

  const submit = async () => {
    const amt = amount;
    if (!fromAccountId) return notify.warning("Pilih dompet asal.");
    if (!toKey) return notify.warning("Pilih dompet tujuan.");
    if (!Number.isFinite(amt) || amt <= 0) return notify.warning("Jumlah tidak valid.");
    const [toBookId, toAccountId] = toKey.split("::");
    setSaving(true);
    try {
      await createTransfer({ fromAccountId, toBookId, toAccountId, amount: amt, note: note.trim() || undefined });
      notify.success("Transfer berhasil.");
      onSaved();
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal transfer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalShell
        icon={<ArrowLeftRight size={20} />}
        title="Transfer Antar-Pembukuan"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button type="button" isLoading={saving} onClick={() => void submit()}>
              Transfer
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Dari dompet (pembukuan ini)">
            <Select<string>
              value={(() => {
                const a = accounts.find((x) => x._id === fromAccountId);
                return a ? { value: a._id, label: a.name } : null;
              })()}
              options={accounts.map<SelectOption<string>>((a) => ({
                value: a._id,
                label: `${a.name} — ${formatCurrency(a.currentBalance)}`,
              }))}
              onChange={(opt) => opt && setFromAccountId(opt.value)}
              isClearable={false}
            />
          </FormField>
          <FormField label="Ke dompet (pembukuan lain)">
            <Select<string>
              value={(() => {
                const l = linkable.find((x) => `${x.bookId}::${x.accountId}` === toKey);
                return l ? { value: toKey, label: `${l.bookName} · ${l.accountName}` } : null;
              })()}
              options={linkable.map<SelectOption<string>>((l) => ({
                value: `${l.bookId}::${l.accountId}`,
                label: `${l.bookName} · ${l.accountName} — ${formatCurrency(l.currentBalance)}`,
              }))}
              onChange={(opt) => opt && setToKey(opt.value)}
              isClearable={false}
            />
          </FormField>
          <FormField label="Jumlah (Rp)">
            <CurrencyInput value={amount} onChange={setAmount} />
          </FormField>
          <FormField label="Catatan (opsional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </div>
      </ModalShell>
    </Modal>
  );
}

export default TransfersPage;
