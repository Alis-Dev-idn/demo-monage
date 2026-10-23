/**
 * Helper untuk meresolve `bookId` aktif. Semua service yang scoped per
 * pembukuan otomatis menyertakan param ini supaya backend bisa filter.
 *
 * Disimpan di localStorage agar pilihan user persist antar reload.
 */

const STORAGE_KEY = "monage:activeBookId";

export function getActiveBookId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setActiveBookId(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage di-disable — abaikan
  }
}

/**
 * Param helper untuk service: kembalikan `{ bookId }` jika ada, atau
 * undefined supaya `params` di axios tetap rapi.
 */
export function withBookParam(
  extra?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const id = getActiveBookId();
  if (!id) return extra;
  return { ...extra, bookId: id };
}

/**
 * Helper untuk body POST/PATCH: inject bookId aktif kalau belum diset eksplisit.
 */
export function withBookBody<T extends Record<string, unknown>>(body: T): T & { bookId?: string } {
  const id = getActiveBookId();
  if (!id) return body;
  if ("bookId" in body && body.bookId) return body;
  return { ...body, bookId: id };
}
