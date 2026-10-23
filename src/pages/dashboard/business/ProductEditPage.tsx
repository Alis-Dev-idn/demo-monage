import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Package, X } from "lucide-react";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import {
  createProduct,
  deleteProductImage,
  fetchProduct,
  updateProduct,
  uploadProductImage,
} from "@/services/business.service";
import type { Product } from "@/types";

/** Halaman buat/edit produk (menggantikan modal). Route: products/new & products/:id/edit. */
const ProductEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [loaded, setLoaded] = useState(!isEdit);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [sellPrice, setSellPrice] = useState("0");
  const [costPrice, setCostPrice] = useState("0");
  const [stockQty, setStockQty] = useState("0");
  const [trackStock, setTrackStock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void fetchProduct(id)
      .then((p: Product) => {
        if (!alive) return;
        setName(p.name);
        setSku(p.sku ?? "");
        setUnit(p.unit);
        setSellPrice(String(p.sellPrice));
        setCostPrice(String(p.costPrice));
        setStockQty(String(p.stockQty));
        setTrackStock(p.trackStock);
        setExistingImage(p.imageUrl ?? null);
        setImagePreview(p.imageUrl ?? null);
        setLoaded(true);
      })
      .catch((e) => {
        notify.error(e instanceof ApiError ? e.message : "Gagal memuat produk.");
        navigate("/dashboard/products", { replace: true });
      });
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      return notify.error("Format gambar harus JPEG, PNG, atau WebP.");
    }
    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  };
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const onSubmit = async () => {
    if (!name.trim()) return notify.error("Nama wajib diisi.");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        unit: unit.trim() || "pcs",
        sellPrice: Number(sellPrice) || 0,
        costPrice: Number(costPrice) || 0,
        trackStock,
      };
      const saved =
        isEdit && id
          ? await updateProduct(id, payload)
          : await createProduct({ ...payload, stockQty: trackStock ? Number(stockQty) || 0 : 0 });
      if (imageFile) await uploadProductImage(saved._id, imageFile);
      else if (removeImage && existingImage) await deleteProductImage(saved._id);
      notify.success(isEdit ? "Produk diperbarui." : "Produk dibuat.");
      navigate("/dashboard/products");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <p className="p-6 text-sm text-neutral-500">Memuat…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/products")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Kembali ke Produk & Stok
      </button>
      <header className="flex items-center gap-2">
        <Package size={22} className="text-emerald-700" />
        <h1 className="text-2xl font-semibold text-neutral-900">{isEdit ? "Edit Produk" : "Produk Baru"}</h1>
      </header>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <FormField label="Gambar produk (opsional)">
          <div className="flex items-center gap-3">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg border border-neutral-200 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Hapus gambar"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-neutral-300">
                <Package size={20} />
              </span>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              <ImagePlus size={14} />
              {imagePreview ? "Ganti" : "Pilih gambar"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
            </label>
          </div>
        </FormField>
        <FormField label="Nama" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="SKU (opsional)">
            <Input value={sku} onChange={(e) => setSku(e.target.value)} />
          </FormField>
          <FormField label="Satuan">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Harga Jual">
            <Input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
          </FormField>
          <FormField label="HPP (modal)">
            <Input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} />
          Lacak stok (matikan untuk jasa/non-stok)
        </label>
        {!isEdit && trackStock && (
          <FormField label="Stok awal">
            <Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
          </FormField>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/dashboard/products")}>
            Batal
          </Button>
          <Button type="button" isLoading={saving} onClick={() => void onSubmit()}>
            {isEdit ? "Simpan" : "Buat"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductEditPage;
