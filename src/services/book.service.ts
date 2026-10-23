import { api } from "@/utils/api";
import type {
  Book,
  BookInvitation,
  BookKind,
  BookMember,
  BookRole,
  BookShareActivity,
  ID,
} from "@/types";

export interface BookFormPayload {
  name: string;
  icon?: string;
  tone?: string;
  description?: string;
  isDefault?: boolean;
  /** Tipe pembukuan (v1.3). Default "personal" bila tak diisi. */
  kind?: BookKind;
}

export function fetchBooks(): Promise<Book[]> {
  return api().get<Book[]>("/books");
}

export function fetchBook(id: ID): Promise<Book> {
  return api().get<Book>(`/books/${id}`);
}

export function createBook(payload: BookFormPayload): Promise<Book> {
  return api().post<Book>("/books", payload);
}

export function updateBook(id: ID, payload: Partial<BookFormPayload>): Promise<Book> {
  return api().patch<Book>(`/books/${id}`, payload);
}

export function deleteBook(id: ID): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/books/${id}`);
}

export function setDefaultBook(id: ID): Promise<Book> {
  return api().post<Book>(`/books/${id}/set-default`);
}

/* ── Sharing ─────────────────────────────────────────────────────────────── */

export function fetchBookMembers(id: ID): Promise<BookMember[]> {
  return api().get<BookMember[]>(`/books/${id}/members`);
}

export interface InvitePayload {
  email: string;
  role: BookRole;
}

export function inviteBookMember(
  id: ID,
  payload: InvitePayload,
): Promise<BookInvitation> {
  return api().post<BookInvitation>(`/books/${id}/invitations`, payload);
}

export function fetchBookInvitations(id: ID): Promise<BookInvitation[]> {
  return api().get<BookInvitation[]>(`/books/${id}/invitations`);
}

export function fetchBookShareHistory(id: ID): Promise<BookShareActivity[]> {
  return api().get<BookShareActivity[]>(`/books/${id}/share-history`);
}

export function revokeBookInvitation(
  bookId: ID,
  invitationId: ID,
): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(
    `/books/${bookId}/invitations/${invitationId}`,
  );
}

export function updateBookMemberRole(
  bookId: ID,
  memberId: ID,
  role: BookRole,
): Promise<BookMember> {
  return api().patch<BookMember>(`/books/${bookId}/members/${memberId}`, { role });
}

export function removeBookMember(bookId: ID, memberId: ID): Promise<{ ok: true }> {
  return api().delete<{ ok: true }>(`/books/${bookId}/members/${memberId}`);
}

/** Owner / member sendiri keluar dari pembukuan. */
export function leaveBook(bookId: ID): Promise<{ ok: true }> {
  return api().post<{ ok: true }>(`/books/${bookId}/leave`);
}

/* ── Invitation acceptance (public-ish, butuh token) ─────────────────────── */

export interface InvitationPreview {
  bookName: string;
  bookIcon: string;
  invitedByName: string;
  role: BookRole;
  email: string;
  status: BookInvitation["status"];
  expiresAt: string;
}

export function previewInvitation(token: string): Promise<InvitationPreview> {
  return api().get<InvitationPreview>("/invitations/preview", {
    params: { token },
  });
}

export function acceptInvitation(token: string): Promise<{ book: Book }> {
  return api().post<{ book: Book }>("/invitations/accept", { token });
}

export function declineInvitation(token: string): Promise<{ ok: true }> {
  return api().post<{ ok: true }>("/invitations/decline", { token });
}
