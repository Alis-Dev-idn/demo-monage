import { useMemo, useState } from "react";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox } from "@dep/ui/card";
import { ApiError } from "@dep/axios";
import { useLookup, useCategoriesByKind } from "@/hooks/useLookup";
import {
  deleteCategory,
  reorderCategories,
} from "@/hooks/useCategories";
import { CategoryTypeTabs } from "@/components/categories/CategoryTypeTabs";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
import { CategoryFormModal } from "@/components/categories/CategoryFormModal";
import { EmptyState } from "@/components/common/EmptyState";
import { DebouncedSearch } from "@/components/common/DebouncedSearch";
import type { Category, CategoryKind } from "@/types";

const CategoriesPage = () => {
  const { isLoading, error, refetchCategories } = useLookup();
  const [kind, setKind] = useState<CategoryKind>("expense");
  const filtered = useCategoriesByKind(kind);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);
  const [search, setSearch] = useState("");

  const searching = search.trim().length > 0;
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((c) => c.name.toLowerCase().includes(q));
  }, [filtered, search]);

  const openEditor = (category: Category) => {
    setEditing(category);
    setShowForm(true);
  };

  const hint = useMemo(
    () =>
      kind === "expense"
        ? "Kategori pengeluaran membantu melihat ke mana uang Anda pergi."
        : "Kategori pemasukan membantu melacak dari mana uang Anda datang.",
    [kind],
  );

  const handleReorder = async (next: Category[]) => {
    try {
      await reorderCategories(next.map((c, idx) => ({ id: c._id, order: idx + 1 })));
    } catch (err) {
      notify.error(
        err instanceof ApiError ? err.message : "Gagal menyimpan urutan kategori.",
      );
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      notify.warning("Kategori bawaan tidak dapat dihapus.");
      return;
    }
    const ok = await confirm({
      title: `Hapus kategori "${category.name}"?`,
      message: "Transaksi yang terkait kategori ini akan dipindah ke kategori bawaan.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await notify.promise(deleteCategory(category._id), {
        loading: "Menghapus…",
        success: "Kategori dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
    } catch {
      // surfaced via notify
    }
  };

  if (isLoading && filtered.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && filtered.length === 0) {
    return (
      <div className="p-4">
        <InfoBox
          variant="error"
          title="Gagal memuat kategori"
          description={error.message}
          action={{ label: "Coba lagi", onClick: () => void refetchCategories() }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Kelola Kategori</h1>
        <p className="text-sm text-neutral-500">{hint}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryTypeTabs value={kind} onChange={setKind} />
        <p className="text-xs text-neutral-500">
          Tip: tahan dan geser kategori untuk mengubah urutan.
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="Tag"
          title="Belum ada kategori"
          description={
            kind === "expense"
              ? "Tambah kategori pengeluaran pertama Anda."
              : "Tambah kategori pemasukan pertama Anda."
          }
          actionLabel="Tambah Kategori"
          onAction={() => {
            setEditing(undefined);
            setShowForm(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          <DebouncedSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari kategori…"
          />
          {visible.length === 0 ? (
            <p className="rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-500">
              Tidak ada kategori cocok dengan "{search}".
            </p>
          ) : (
            <CategoryGrid
              categories={visible}
              // Saat mencari, nonaktifkan drag-reorder (urutan parsial tak valid).
              mode={searching ? "select" : "manage"}
              onReorder={(next) => void handleReorder(next)}
              onAdd={() => {
                setEditing(undefined);
                setShowForm(true);
              }}
              onSelect={openEditor}
            />
          )}
        </div>
      )}

      <CategoryFormModal
        kind={kind}
        category={editing}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(undefined);
        }}
        onDelete={(category) => {
          setShowForm(false);
          setEditing(undefined);
          void handleDelete(category);
        }}
      />
    </div>
  );
};

export default CategoriesPage;
