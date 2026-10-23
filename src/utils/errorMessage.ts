import { ApiError } from "@dep/axios";

/**
 * Map kode error backend (lihat BACKEND-API-SPEC §1.2) ke pesan UI yang
 * lebih ramah & spesifik. Pakai message dari backend kalau tersedia
 * (lebih konteksual), fallback ke generic per-code, terakhir ke pesan
 * default umum.
 *
 * Selalu dipakai lewat `getFriendlyError(err)` agar handler `try/catch`
 * di komponen / hook tidak mengulang map yang sama berkali-kali.
 */
const CODE_DEFAULTS: Record<string, string> = {
  VALIDATION_ERROR: "Input belum lengkap atau ada yang salah format.",
  BAD_REQUEST: "Permintaan tidak valid.",
  UNAUTHORIZED: "Sesi habis. Silakan login lagi.",
  SESSION_EXPIRED: "Sesi habis. Silakan login lagi.",
  INVALID_CREDENTIALS: "Email atau kata sandi salah.",
  FORBIDDEN: "Anda tidak punya akses ke aksi ini.",
  NOT_FOUND: "Data tidak ditemukan. Mungkin sudah dihapus.",
  CONFLICT: "Data bentrok — ada nilai duplikat atau kondisi yang sudah berubah.",
  BUSINESS_RULE: "Aksi tidak diizinkan oleh aturan bisnis.",
  INVALID_PASSWORD: "Kata sandi sekarang salah.",
  QUOTA_EXCEEDED: "Quota paket Anda sudah habis. Upgrade untuk menambah.",
  PROVIDER_NOT_CONNECTED:
    "Layanan cloud belum terhubung. Sambungkan dulu di Pengaturan → Backup.",
  INTERNAL_ERROR: "Terjadi kesalahan di server. Coba beberapa saat lagi.",
  INTERNAL_SERVER_ERROR: "Terjadi kesalahan di server. Coba beberapa saat lagi.",
  NETWORK_ERROR:
    "Tidak bisa menghubungi server. Cek koneksi internet Anda lalu coba lagi.",
  TIMEOUT:
    "Permintaan terlalu lama dijawab. Coba lagi atau cek koneksi internet.",
};

/**
 * Struktur error detail Zod yang dipakai backend route-api:
 *   { errors: [{ field, message }, ...] }
 */
interface ZodErrorDetail {
  errors?: Array<{ field?: string; message?: string }>;
}

function formatValidationDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as ZodErrorDetail;
  if (!Array.isArray(d.errors) || d.errors.length === 0) return null;
  // Ambil maks 3 baris agar tidak terlalu panjang di toast.
  const lines = d.errors.slice(0, 3).map((e) => {
    if (e.field && e.message) return `• ${humanizeField(e.field)}: ${e.message}`;
    return `• ${e.message ?? "Field tidak valid."}`;
  });
  const more = d.errors.length > 3 ? `\n…dan ${d.errors.length - 3} lainnya` : "";
  return lines.join("\n") + more;
}

// Konversi nama field teknis ke label yang lebih ramah.
const FIELD_LABEL: Record<string, string> = {
  name: "Nama",
  email: "Email",
  password: "Kata sandi",
  amount: "Nominal",
  occurredAt: "Tanggal",
  categoryId: "Kategori",
  accountId: "Dompet",
  fromAccountId: "Dompet asal",
  toAccountId: "Dompet tujuan",
  tier: "Paket",
  tone: "Warna",
  icon: "Ikon",
  bookId: "Pembukuan",
  goalAmount: "Target tabungan",
  monthlyDeposit: "Setoran bulanan",
};

function humanizeField(path: string): string {
  const head = path.split(".")[0];
  return FIELD_LABEL[head] ?? path;
}

/**
 * Ambil pesan paling ramah dari sebuah error. Untuk `ApiError` mencoba:
 *   1. Detail Zod (validation) — render per-field.
 *   2. `err.message` (backend sudah set message yang bagus, mis. BUSINESS_RULE).
 *   3. Default per `code`.
 *   4. Generic fallback.
 *
 * Untuk error non-ApiError (TypeError, dll), fallback ke `err.message` atau
 * pesan generic.
 */
export function getFriendlyError(
  err: unknown,
  fallback = "Terjadi kesalahan tak terduga.",
): string {
  if (err instanceof ApiError) {
    const detailsMsg = formatValidationDetails(err.data);
    if (detailsMsg) return detailsMsg;
    if (err.message && err.message.length > 0) return err.message;
    if (err.code && CODE_DEFAULTS[err.code]) return CODE_DEFAULTS[err.code];
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Cek apakah `err` berasal dari quota check (`code === "QUOTA_EXCEEDED"`). Pakai bareng `instanceof ApiError`. */
export function isQuotaError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "QUOTA_EXCEEDED"
  );
}
