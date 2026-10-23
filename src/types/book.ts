import type { ID, ISODate, Tone } from "./common";

/**
 * Peran user di sebuah pembukuan.
 * - `owner`: pembuat pembukuan. Bisa kelola anggota, edit, hapus pembukuan.
 * - `editor`: bisa CRUD semua data (dompet, transaksi, anggaran, tabungan), TIDAK bisa hapus pembukuan / kelola anggota.
 * - `viewer`: hanya bisa baca data.
 * - `cashier` (v1.3): khusus pembukuan **bisnis** — hanya kasir/POS + struk.
 */
export type BookRole = "owner" | "editor" | "viewer" | "cashier";

/** Tipe pembukuan (v1.3). `business` membuka menu POS/kasir/produk/laporan. */
export type BookKind = "personal" | "business";

/**
 * Pembukuan (ledger). Setiap user bisa punya >1 pembukuan untuk memisahkan
 * konteks (mis. Pribadi, Bisnis, Keluarga). Semua entity (Account, Category,
 * Transaction, Budget, Saving) terikat ke satu Book lewat `bookId`.
 *
 * Sejak v1.1 mendukung **share** — anggota lain dapat diundang dengan role.
 */
export interface Book {
  _id: ID;
  /** User pemilik (owner). Bisa berbeda dari user yang sedang login. */
  ownerId: ID;
  /** Peran user yang sedang login di pembukuan ini. Server compute per request. */
  myRole: BookRole;
  /** Jumlah anggota total (termasuk owner). */
  memberCount: number;
  /** True jika user login adalah owner. Shortcut untuk `myRole === "owner"`. */
  isOwner: boolean;
  /** True jika pembukuan ini di-share ke ≥1 anggota lain. */
  isShared: boolean;
  /** @deprecated Gunakan `ownerId`. Tetap dipertahankan untuk backward compat. */
  userId?: ID;
  name: string;
  icon: string;
  tone: Tone;
  isDefault: boolean;
  description?: string;
  /** Tipe pembukuan (v1.3). Default "personal" untuk dokumen lama. */
  kind: BookKind;
  createdAt: ISODate;
}

/**
 * Anggota pembukuan. Satu user bisa jadi anggota di banyak pembukuan dengan
 * role berbeda.
 */
export interface BookMember {
  _id: ID;
  bookId: ID;
  userId: ID;
  name: string;            // snapshot nama anggota (denormalized agar list cepat)
  email: string;
  avatarUrl?: string;
  role: BookRole;
  invitedBy?: ID;          // userId yang mengundang (null jika owner)
  joinedAt: ISODate;
}

export type ShareActivityAction =
  | "invite_sent"
  | "invite_revoked"
  | "invite_accepted"
  | "invite_declined"
  | "role_changed"
  | "member_removed"
  | "member_left";

/** Satu baris riwayat berbagi pembukuan (#9). */
export interface BookShareActivity {
  _id: ID;
  bookId: ID;
  actorId: ID;
  actorName: string;
  action: ShareActivityAction;
  targetEmail?: string | null;
  targetName?: string | null;
  role?: string | null;
  createdAt: ISODate;
}

export type BookInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked";

/**
 * Undangan terbuka — dikirim ke email yang belum tentu sudah terdaftar.
 */
export interface BookInvitation {
  _id: ID;
  bookId: ID;
  bookName: string;        // snapshot supaya halaman accept tidak butuh fetch
  bookIcon: string;
  email: string;
  role: BookRole;
  status: BookInvitationStatus;
  invitedBy: ID;
  invitedByName: string;
  /** Token unik untuk URL accept (`/invitations/accept?token=`). */
  token: string;
  expiresAt: ISODate;
  createdAt: ISODate;
}
