import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Book as BookIcon, Pencil, Plus, Star, Store, Trash2, Users, Wallet } from "lucide-react";
import { resolveIcon } from "@/constants/iconRegistry";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { FormField, Input, Textarea } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { confirm } from "@dep/ui/confirm";
import {
  useBooks,
  createBook,
  updateBook,
  deleteBook,
  setDefaultBook,
} from "@/hooks/useBooks";
import { useBookQuota } from "@/hooks/useSubscription";
import { ModalShell } from "@/components/common/ModalShell";
import { IconPicker } from "@/components/categories/IconPicker";
import { TonePicker } from "@/components/categories/TonePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { QuotaBanner } from "@/components/common/QuotaBanner";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { isQuotaError } from "@/utils/errorMessage";
import { BookMembersModal } from "@/components/books/BookMembersModal";
import { TONE_HEX } from "@/constants/tones";
import { ROLE_LABEL } from "@/hooks/useBookPermission";
import type { Book, BookKind, Tone } from "@/types";

interface BookFormValues {
  name: string;
  icon: string;
  tone: Tone;
  description?: string;
  kind: BookKind;
}

const BooksPage = () => {
  const { books, activeBook, setActiveBook, refetch } = useBooks();
  const bookQuota = useBookQuota();
  const [editing, setEditing] = useState<Book | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [membersOf, setMembersOf] = useState<Book | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  const handleNewClick = () => {
    if (bookQuota.isAtLimit) {
      setUpgradeMsg(
        `Anda sudah mencapai batas ${bookQuota.limit} pembukuan di paket saat ini.`,
      );
      return;
    }
    setEditing(null);
    setShowForm(true);
  };

  const handleDelete = async (b: Book) => {
    if (b.isDefault) {
      notify.warning("Set pembukuan lain sebagai default dulu.");
      return;
    }
    const ok = await confirm({
      title: `Hapus "${b.name}"?`,
      message: "Semua data terkait (dompet, kategori, transaksi, dst.) tidak otomatis terhapus — pindahkan dulu jika perlu.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(deleteBook(b._id), {
        loading: "Menghapus pembukuan…",
        success: "Pembukuan dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
      void refetch();
    } catch {
      // surfaced
    }
  };

  const handleSetDefault = async (b: Book) => {
    try {
      await notify.promise(setDefaultBook(b._id), {
        loading: "Menyimpan…",
        success: "Pembukuan default diset ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      void refetch();
    } catch {
      // surfaced
    }
  };

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Pembukuan</h1>
          <p className="text-sm text-neutral-500">
            Pisahkan konteks keuangan — pribadi, bisnis, keluarga — dalam pembukuan
            terpisah. Switch konteks dari sidebar.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={14} />}
          onClick={handleNewClick}
        >
          Buat Pembukuan
        </Button>
      </header>

      <QuotaBanner kind="books" />

      {books.length === 0 ? (
        <EmptyState
          icon="Book"
          title="Belum ada pembukuan"
          description="Buat pembukuan pertama untuk mulai memisahkan konteks keuangan."
          actionLabel="Buat Pembukuan"
          onAction={handleNewClick}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => {
            const Icon = resolveIcon(b.icon, "Book");
            const palette = TONE_HEX[b.tone];
            const isActive = activeBook?._id === b._id;
            return (
              <div
                key={b._id}
                className={`rounded-2xl border bg-white p-4 transition ${
                  isActive ? "border-emerald-400 ring-2 ring-emerald-100" : "border-neutral-200"
                }`}
              >
                <header className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: palette.bg, color: palette.fg }}
                  >
                    <Icon size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-neutral-900">
                        {b.name}
                      </h3>
                      {b.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <Star size={10} /> Default
                        </span>
                      )}
                      {b.kind === "business" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                          <Store size={10} /> Bisnis
                        </span>
                      )}
                    </div>
                    {b.description && (
                      <p className="mt-1 text-xs text-neutral-500">{b.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          b.isOwner
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {ROLE_LABEL[b.myRole]}
                      </span>
                      {b.memberCount > 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                          <Users size={10} />
                          {b.memberCount} anggota
                        </span>
                      )}
                      {b.isOwner && b.isShared && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                          Dibagikan ke {b.memberCount - 1} orang
                        </span>
                      )}
                      {!b.isOwner && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          Dari orang lain
                        </span>
                      )}
                    </div>
                  </div>
                </header>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!isActive ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setActiveBook(b._id)}
                    >
                      Pakai Pembukuan Ini
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-emerald-700">
                      Sedang aktif
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Users size={12} />}
                    onClick={() => setMembersOf(b)}
                  >
                    Anggota
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Pencil size={12} />}
                    onClick={() => {
                      setEditing(b);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  {!b.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Star size={12} />}
                      onClick={() => void handleSetDefault(b)}
                    >
                      Set Default
                    </Button>
                  )}
                  {!b.isDefault && (
                    <Button
                      size="sm"
                      variant="danger-outline"
                      leftIcon={<Trash2 size={12} />}
                      onClick={() => void handleDelete(b)}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BookFormModal
        book={editing}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          void refetch();
        }}
        onQuotaExceeded={(msg) => {
          setShowForm(false);
          setUpgradeMsg(msg);
        }}
      />

      <BookMembersModal
        book={membersOf}
        isOpen={!!membersOf}
        onClose={() => {
          setMembersOf(null);
          void refetch();
        }}
      />

      <UpgradeModal
        isOpen={!!upgradeMsg}
        onClose={() => setUpgradeMsg(null)}
        message={upgradeMsg ?? undefined}
        title="Tidak bisa menambah pembukuan"
      />
    </div>
  );
};

interface BookFormModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onQuotaExceeded?: (message: string) => void;
}

function BookFormModal({ book, isOpen, onClose, onSaved, onQuotaExceeded }: BookFormModalProps) {
  const isEdit = !!book;
  const form = useForm<BookFormValues>({
    defaultValues: {
      name: book?.name ?? "",
      icon: book?.icon ?? "Book",
      tone: book?.tone ?? "blue",
      description: book?.description ?? "",
      kind: book?.kind ?? "personal",
    },
    values: {
      name: book?.name ?? "",
      icon: book?.icon ?? "Book",
      tone: book?.tone ?? "blue",
      description: book?.description ?? "",
      kind: book?.kind ?? "personal",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await notify.promise(
        isEdit
          ? updateBook(book._id, data)
          : createBook(data),
        {
          loading: isEdit ? "Menyimpan…" : "Membuat pembukuan…",
          success: isEdit ? "Pembukuan diperbarui ✓" : "Pembukuan dibuat ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
        },
      );
      onSaved();
    } catch (err) {
      if (!isEdit && isQuotaError(err) && onQuotaExceeded) {
        onQuotaExceeded(err instanceof ApiError ? err.message : "Kuota habis.");
      }
      // selain quota: sudah disurface via notify.promise
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<BookIcon size={20} />}
          title={isEdit ? "Edit Pembukuan" : "Pembukuan Baru"}
          footer={
            <>
              <Button variant="ghost" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" isLoading={form.formState.isSubmitting}>
                {isEdit ? "Simpan Perubahan" : "Buat"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {!isEdit && (
              <FormField label="Tipe Pembukuan">
                <Controller
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            value: "personal" as const,
                            icon: <Wallet size={18} />,
                            title: "Keuangan Pribadi",
                            desc: "Transaksi, dompet, anggaran, tabungan.",
                          },
                          {
                            value: "business" as const,
                            icon: <Store size={18} />,
                            title: "Bisnis",
                            desc: "Kasir (POS), produk & stok, laporan penjualan.",
                          },
                        ]
                      ).map((opt) => {
                        const selected = field.value === opt.value;
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => field.onChange(opt.value)}
                            className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition ${
                              selected
                                ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                                : "border-neutral-200 hover:border-neutral-300"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                selected ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              {opt.icon}
                            </span>
                            <span className="text-sm font-semibold text-neutral-900">
                              {opt.title}
                            </span>
                            <span className="text-[11px] text-neutral-500">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {form.watch("kind") === "business" && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Fitur bisnis memerlukan paket Personal ke atas.
                  </p>
                )}
              </FormField>
            )}
            <FormField label="Nama" required>
              <Input
                autoFocus
                placeholder="contoh: Pribadi, Bisnis, Keluarga"
                {...form.register("name", { required: true })}
              />
            </FormField>
            <FormField label="Deskripsi (opsional)">
              <Textarea
                rows={2}
                placeholder="Catatan singkat tentang pembukuan ini…"
                {...form.register("description")}
              />
            </FormField>
            <FormField label="Ikon">
              <Controller
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <IconPicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
            <FormField label="Warna">
              <Controller
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <TonePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
          </div>
        </ModalShell>
      </form>
    </Modal>
  );
}

export default BooksPage;
