import { useMemo } from "react";
import { useBooks } from "@/hooks/useBooks";
import type { BookRole } from "@/types";

export interface BookPermission {
  /** Role user di pembukuan aktif. `null` jika belum load. */
  role: BookRole | null;
  /** Anggota dengan role owner. */
  isOwner: boolean;
  /** Bisa CRUD data (transaksi, dompet, kategori, anggaran, tabungan). */
  canWrite: boolean;
  /** Bisa kelola anggota & undangan. */
  canManageMembers: boolean;
  /** Bisa edit metadata pembukuan (nama, ikon, dst.). */
  canEditBook: boolean;
  /** Bisa hapus pembukuan. */
  canDeleteBook: boolean;
}

/**
 * Permission hook berdasarkan role user di pembukuan aktif.
 *
 * - `owner`: bisa segalanya
 * - `editor`: bisa CRUD data, TIDAK bisa kelola anggota / hapus pembukuan
 * - `viewer`: read-only
 *
 * Pakai untuk disable tombol primary action di UI. Backend tetap enforcement
 * utama — UI sekedar tidak menampilkan aksi yang akan ditolak.
 */
export function useBookPermission(): BookPermission {
  const { activeBook } = useBooks();

  return useMemo<BookPermission>(() => {
    const role: BookRole | null = activeBook?.myRole ?? null;
    const isOwner = role === "owner";
    const isEditor = role === "editor";
    return {
      role,
      isOwner,
      canWrite: isOwner || isEditor,
      canManageMembers: isOwner,
      canEditBook: isOwner || isEditor,
      canDeleteBook: isOwner,
    };
  }, [activeBook]);
}

export const ROLE_LABEL: Record<BookRole, string> = {
  owner: "Pemilik",
  editor: "Editor",
  viewer: "Pengamat",
  cashier: "Kasir",
};

export const ROLE_DESCRIPTION: Record<BookRole, string> = {
  owner: "Kelola pembukuan, anggota, dan semua data",
  editor: "Catat & ubah transaksi, dompet, anggaran, tabungan",
  viewer: "Hanya bisa membaca data, tidak bisa mengubah",
  cashier: "Khusus pembukuan bisnis — hanya kasir (POS) & struk",
};
