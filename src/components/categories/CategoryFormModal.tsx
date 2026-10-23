import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tag, Trash2 } from "lucide-react";
import { Modal } from "@dep/ui/modal";
import { ModalShell } from "@/components/common/ModalShell";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { IconPicker } from "./IconPicker";
import { TonePicker } from "./TonePicker";
import { categoryFormSchema, type CategoryFormData } from "@/schemas/category";
import { createCategory, updateCategory } from "@/hooks/useCategories";
import type { Category, CategoryKind } from "@/types";

interface CategoryFormModalProps {
  kind: CategoryKind;
  category?: Category;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (category: Category) => void;
  /** Dipanggil saat user menekan Hapus (editor menyiapkan konfirmasi sendiri). */
  onDelete?: (category: Category) => void;
}

export function CategoryFormModal({
  kind,
  category,
  isOpen,
  onClose,
  onSaved,
  onDelete,
}: CategoryFormModalProps) {
  const isEdit = !!category;
  const canDelete = isEdit && !category.isDefault && !!onDelete;

  const defaultValues = useMemo<CategoryFormData>(
    () => ({
      kind: category?.kind ?? kind,
      name: category?.name ?? "",
      icon: category?.icon ?? "Tag",
      tone: category?.tone ?? "emerald",
    }),
    [category, kind],
  );

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
    values: defaultValues,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const saved = await notify.promise(
        isEdit ? updateCategory(category._id, data) : createCategory(data),
        {
          loading: isEdit ? "Menyimpan perubahan…" : "Menambah kategori…",
          success: isEdit ? "Kategori diperbarui ✓" : "Kategori dibuat ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
        },
      );
      onSaved?.(saved);
      onClose();
      form.reset(defaultValues);
    } catch {
      // surfaced via notify
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={onSubmit} noValidate>
        <ModalShell
          icon={<Tag size={20} />}
          title={
            isEdit
              ? "Edit Kategori"
              : kind === "income"
              ? "Tambah Kategori Pemasukan"
              : "Tambah Kategori Pengeluaran"
          }
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              {canDelete ? (
                <Button
                  variant="danger-outline"
                  type="button"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => onDelete?.(category)}
                >
                  Hapus
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" isLoading={form.formState.isSubmitting}>
                  {isEdit ? "Simpan Perubahan" : "Buat Kategori"}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField
              label="Nama Kategori"
              required
              errorMessage={form.formState.errors.name?.message}
            >
              <Input
                autoFocus
                placeholder="contoh: Makanan, Transportasi"
                {...form.register("name")}
              />
            </FormField>

            <FormField label="Ikon" errorMessage={form.formState.errors.icon?.message}>
              <Controller
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <IconPicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>

            <FormField label="Warna" errorMessage={form.formState.errors.tone?.message}>
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
