import { http, HttpResponse } from "msw";
import type {
  Book,
  BookInvitation,
  BookMember,
  BookRole,
  Tone,
} from "@/types";
import { endpoint } from "../baseUrl";
import { DEFAULT_BOOK_ID, mockBooks, mockUser } from "../data/seed";
import { checkBookQuota, checkMemberQuota } from "./subscription";

const CURRENT_USER_ID = "u1"; // mock — semua request dianggap dari user ini

interface BookInternal extends Book {
  ownerId: string;
}

// Seed initial books: tambahkan ownerId, memberCount default 1.
const books: BookInternal[] = mockBooks.map((b) => ({
  ...b,
  ownerId: b.userId ?? CURRENT_USER_ID,
  myRole: "owner" as BookRole,
  memberCount: 1,
  isOwner: true,
  isShared: false,
}));

/** Daftar member per book. Owner otomatis di-include. */
const members: BookMember[] = books.map<BookMember>((b) => ({
  _id: `bm-${b._id}-${CURRENT_USER_ID}`,
  bookId: b._id,
  userId: CURRENT_USER_ID,
  name: mockUser.name,
  email: mockUser.email,
  avatarUrl: mockUser.avatarUrl,
  role: "owner",
  joinedAt: b.createdAt,
}));

const invitations: BookInvitation[] = [];

function nextBookId(): string {
  return `book-${Date.now()}`;
}
function nextMemberId(): string {
  return `bm-${Date.now()}`;
}
function nextInvId(): string {
  return `inv-${Date.now()}`;
}
function nextToken(): string {
  return `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function recomputeBook(b: BookInternal): Book {
  const bookMembers = members.filter((m) => m.bookId === b._id);
  const mine = bookMembers.find((m) => m.userId === CURRENT_USER_ID);
  return {
    ...b,
    myRole: mine?.role ?? "viewer",
    memberCount: bookMembers.length,
    isOwner: b.ownerId === CURRENT_USER_ID,
    isShared: bookMembers.length > 1,
  };
}

function findBook(id: string): BookInternal | undefined {
  return books.find((b) => b._id === id);
}

function requireRole(book: BookInternal, allowed: BookRole[]): BookRole | null {
  const m = members.find(
    (mm) => mm.bookId === book._id && mm.userId === CURRENT_USER_ID,
  );
  if (!m) return null;
  return allowed.includes(m.role) ? m.role : null;
}

export const bookHandlers = [
  http.get(endpoint("/books"), () => {
    // Hanya tampilkan book yang user adalah anggota.
    const myBookIds = new Set(
      members.filter((m) => m.userId === CURRENT_USER_ID).map((m) => m.bookId),
    );
    const visible = books.filter((b) => myBookIds.has(b._id));
    return HttpResponse.json(
      visible
        .map(recomputeBook)
        .sort((a, b) => {
          if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
          return a.createdAt.localeCompare(b.createdAt);
        }),
    );
  }),

  http.get(endpoint("/books/:id"), ({ params }) => {
    const b = findBook(params.id as string);
    if (!b)
      return HttpResponse.json({ message: "Pembukuan tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(recomputeBook(b));
  }),

  http.post(endpoint("/books"), async ({ request }) => {
    const body = (await request.json()) as Partial<Book>;
    // Quota check — hanya hitung pembukuan yang user adalah owner (yang
    // memakan slot di plan-nya). Pembukuan yang diundang tidak hitung.
    const ownedCount = books.filter((b) => b.ownerId === CURRENT_USER_ID).length;
    const check = checkBookQuota(ownedCount);
    if (!check.allowed) {
      return HttpResponse.json(
        {
          statusCode: 422,
          code: "QUOTA_EXCEEDED",
          message: check.message,
          details: check.details,
        },
        { status: 422 },
      );
    }
    const isDefault = !!body.isDefault;
    if (isDefault) {
      books.forEach((b) => {
        if (b.ownerId === CURRENT_USER_ID) b.isDefault = false;
      });
    }
    const id = nextBookId();
    const now = new Date().toISOString();
    const fresh: BookInternal = {
      _id: id,
      ownerId: CURRENT_USER_ID,
      userId: CURRENT_USER_ID,
      name: body.name ?? "Pembukuan Baru",
      icon: body.icon ?? "Book",
      tone: (body.tone ?? "blue") as Tone,
      isDefault,
      description: body.description,
      kind: body.kind ?? "personal",
      createdAt: now,
      // Recomputed di response.
      myRole: "owner",
      memberCount: 1,
      isOwner: true,
      isShared: false,
    };
    books.push(fresh);
    members.push({
      _id: nextMemberId(),
      bookId: id,
      userId: CURRENT_USER_ID,
      name: mockUser.name,
      email: mockUser.email,
      avatarUrl: mockUser.avatarUrl,
      role: "owner",
      joinedAt: now,
    });
    return HttpResponse.json(recomputeBook(fresh), { status: 201 });
  }),

  http.patch(endpoint("/books/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Partial<Book>;
    const b = findBook(params.id as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    const role = requireRole(b, ["owner", "editor"]);
    if (!role)
      return HttpResponse.json(
        { message: "Anda tidak punya akses edit pembukuan ini." },
        { status: 403 },
      );
    if (body.isDefault) {
      books.forEach((bb) => {
        if (bb.ownerId === CURRENT_USER_ID) bb.isDefault = false;
      });
    }
    Object.assign(b, body);
    return HttpResponse.json(recomputeBook(b));
  }),

  http.delete(endpoint("/books/:id"), ({ params }) => {
    const b = findBook(params.id as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    if (b.ownerId !== CURRENT_USER_ID)
      return HttpResponse.json(
        { message: "Hanya owner yang bisa menghapus pembukuan." },
        { status: 403 },
      );
    if (b.isDefault)
      return HttpResponse.json(
        { message: "Pembukuan default tidak bisa dihapus. Set default lain dulu." },
        { status: 422 },
      );
    const idx = books.findIndex((x) => x._id === b._id);
    books.splice(idx, 1);
    // Cascade hapus member & invitation di mock.
    for (let i = members.length - 1; i >= 0; i--)
      if (members[i].bookId === b._id) members.splice(i, 1);
    for (let i = invitations.length - 1; i >= 0; i--)
      if (invitations[i].bookId === b._id) invitations.splice(i, 1);
    return HttpResponse.json({ ok: true });
  }),

  http.post(endpoint("/books/:id/set-default"), ({ params }) => {
    const b = findBook(params.id as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    books.forEach((bb) => {
      if (bb.ownerId === CURRENT_USER_ID) bb.isDefault = false;
    });
    b.isDefault = true;
    return HttpResponse.json(recomputeBook(b));
  }),

  /* ── Members ──────────────────────────────────────────────────────────── */

  http.get(endpoint("/books/:id/members"), ({ params }) => {
    const b = findBook(params.id as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(
      members
        .filter((m) => m.bookId === b._id)
        .sort((a, c) => {
          // Owner di atas.
          if (a.role === "owner" && c.role !== "owner") return -1;
          if (a.role !== "owner" && c.role === "owner") return 1;
          return a.joinedAt.localeCompare(c.joinedAt);
        }),
    );
  }),

  http.patch(endpoint("/books/:bookId/members/:memberId"), async ({ params, request }) => {
    const b = findBook(params.bookId as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    if (!requireRole(b, ["owner"]))
      return HttpResponse.json(
        { message: "Hanya owner yang bisa mengubah role anggota." },
        { status: 403 },
      );
    const body = (await request.json()) as { role: BookRole };
    const m = members.find((mm) => mm._id === params.memberId);
    if (!m) return HttpResponse.json({ message: "Anggota tidak ditemukan" }, { status: 404 });
    if (m.role === "owner")
      return HttpResponse.json(
        { message: "Role owner tidak bisa diubah dari sini." },
        { status: 422 },
      );
    m.role = body.role;
    return HttpResponse.json(m);
  }),

  http.delete(endpoint("/books/:bookId/members/:memberId"), ({ params }) => {
    const b = findBook(params.bookId as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    if (!requireRole(b, ["owner"]))
      return HttpResponse.json(
        { message: "Hanya owner yang bisa mengeluarkan anggota." },
        { status: 403 },
      );
    const idx = members.findIndex((m) => m._id === params.memberId);
    if (idx === -1)
      return HttpResponse.json({ message: "Anggota tidak ditemukan" }, { status: 404 });
    if (members[idx].role === "owner")
      return HttpResponse.json(
        { message: "Owner tidak bisa dikeluarkan. Pindahkan ownership dulu." },
        { status: 422 },
      );
    members.splice(idx, 1);
    return HttpResponse.json({ ok: true });
  }),

  http.post(endpoint("/books/:id/leave"), ({ params }) => {
    const b = findBook(params.id as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    const idx = members.findIndex(
      (m) => m.bookId === b._id && m.userId === CURRENT_USER_ID,
    );
    if (idx === -1)
      return HttpResponse.json(
        { message: "Anda bukan anggota pembukuan ini." },
        { status: 404 },
      );
    if (members[idx].role === "owner")
      return HttpResponse.json(
        { message: "Owner tidak bisa keluar. Pindahkan ownership atau hapus pembukuan." },
        { status: 422 },
      );
    members.splice(idx, 1);
    return HttpResponse.json({ ok: true });
  }),

  /* ── Invitations ──────────────────────────────────────────────────────── */

  http.get(endpoint("/books/:id/invitations"), ({ params }) => {
    const b = findBook(params.id as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    return HttpResponse.json(
      invitations
        .filter((i) => i.bookId === b._id)
        .sort((a, c) => c.createdAt.localeCompare(a.createdAt)),
    );
  }),

  http.post(endpoint("/books/:id/invitations"), async ({ params, request }) => {
    const b = findBook(params.id as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    if (!requireRole(b, ["owner"]))
      return HttpResponse.json(
        { message: "Hanya owner yang bisa mengundang anggota." },
        { status: 403 },
      );
    const body = (await request.json()) as { email: string; role: BookRole };
    if (!body.email || !body.role)
      return HttpResponse.json(
        { message: "Email dan role wajib." },
        { status: 400 },
      );
    if (body.role === "owner")
      return HttpResponse.json(
        { message: "Tidak bisa mengundang sebagai owner." },
        { status: 422 },
      );
    // Cek apakah email sudah jadi member.
    const existing = members.find(
      (m) => m.bookId === b._id && m.email.toLowerCase() === body.email.toLowerCase(),
    );
    if (existing)
      return HttpResponse.json(
        { message: `${body.email} sudah jadi anggota pembukuan ini.` },
        { status: 409 },
      );
    // Quota anggota — hitung members aktif + invitation pending di book ini.
    const activeMembers = members.filter((m) => m.bookId === b._id).length;
    const pendingInv = invitations.filter(
      (i) => i.bookId === b._id && i.status === "pending",
    ).length;
    const memberCheck = checkMemberQuota(b._id, activeMembers + pendingInv);
    if (!memberCheck.allowed) {
      return HttpResponse.json(
        {
          statusCode: 422,
          code: "QUOTA_EXCEEDED",
          message: memberCheck.message,
          details: memberCheck.details,
        },
        { status: 422 },
      );
    }

    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 7);
    const inv: BookInvitation = {
      _id: nextInvId(),
      bookId: b._id,
      bookName: b.name,
      bookIcon: b.icon,
      email: body.email,
      role: body.role,
      status: "pending",
      invitedBy: CURRENT_USER_ID,
      invitedByName: mockUser.name,
      token: nextToken(),
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString(),
    };
    invitations.push(inv);
    return HttpResponse.json(inv, { status: 201 });
  }),

  http.delete(endpoint("/books/:bookId/invitations/:invId"), ({ params }) => {
    const b = findBook(params.bookId as string);
    if (!b) return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    if (!requireRole(b, ["owner"]))
      return HttpResponse.json(
        { message: "Hanya owner yang bisa cabut undangan." },
        { status: 403 },
      );
    const idx = invitations.findIndex((i) => i._id === params.invId);
    if (idx === -1)
      return HttpResponse.json({ message: "Undangan tidak ditemukan" }, { status: 404 });
    invitations[idx] = { ...invitations[idx], status: "revoked" };
    return HttpResponse.json({ ok: true });
  }),

  /* ── Invitation token endpoints ────────────────────────────────────────── */

  http.get(endpoint("/invitations/preview"), ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    const inv = invitations.find((i) => i.token === token);
    if (!inv)
      return HttpResponse.json(
        { message: "Undangan tidak ditemukan atau sudah kadaluarsa." },
        { status: 404 },
      );
    const now = Date.now();
    if (new Date(inv.expiresAt).getTime() < now && inv.status === "pending") {
      inv.status = "expired";
    }
    return HttpResponse.json({
      bookName: inv.bookName,
      bookIcon: inv.bookIcon,
      invitedByName: inv.invitedByName,
      role: inv.role,
      email: inv.email,
      status: inv.status,
      expiresAt: inv.expiresAt,
    });
  }),

  http.post(endpoint("/invitations/accept"), async ({ request }) => {
    const body = (await request.json()) as { token: string };
    const inv = invitations.find((i) => i.token === body.token);
    if (!inv)
      return HttpResponse.json(
        { message: "Undangan tidak ditemukan." },
        { status: 404 },
      );
    if (inv.status !== "pending")
      return HttpResponse.json(
        { message: "Undangan sudah tidak aktif." },
        { status: 422 },
      );
    const b = findBook(inv.bookId);
    if (!b)
      return HttpResponse.json(
        { message: "Pembukuan sudah dihapus." },
        { status: 404 },
      );
    // Tandai accepted dan tambahkan member.
    inv.status = "accepted";
    const m: BookMember = {
      _id: nextMemberId(),
      bookId: b._id,
      userId: CURRENT_USER_ID,
      name: mockUser.name,
      email: mockUser.email,
      avatarUrl: mockUser.avatarUrl,
      role: inv.role,
      invitedBy: inv.invitedBy,
      joinedAt: new Date().toISOString(),
    };
    members.push(m);
    return HttpResponse.json({ book: recomputeBook(b) });
  }),

  http.post(endpoint("/invitations/decline"), async ({ request }) => {
    const body = (await request.json()) as { token: string };
    const inv = invitations.find((i) => i.token === body.token);
    if (!inv)
      return HttpResponse.json(
        { message: "Undangan tidak ditemukan." },
        { status: 404 },
      );
    inv.status = "declined";
    return HttpResponse.json({ ok: true });
  }),
];

/**
 * Helper untuk handler entity (account/category/transaction/budget/saving):
 * cek apakah entity dengan field `bookId?` cocok dengan `bookId` query.
 *
 * - Entity tanpa `bookId` dianggap milik DEFAULT_BOOK_ID (backward-compat seed).
 * - Jika query `bookId` tidak diset → tampilkan semua (compat).
 */
export function matchesBook(entityBookId: string | undefined, queryBookId: string | null): boolean {
  if (!queryBookId) return true;
  const resolved = entityBookId ?? DEFAULT_BOOK_ID;
  return resolved === queryBookId;
}

/**
 * Dipakai handler `/subscription/usage` untuk listing pembukuan yang user
 * adalah anggotanya (termasuk yang di-share dari user lain).
 */
export function __getMockBooksForUser(): Array<{ _id: string; name: string }> {
  const myBookIds = new Set(
    members.filter((m) => m.userId === CURRENT_USER_ID).map((m) => m.bookId),
  );
  return books
    .filter((b) => myBookIds.has(b._id))
    .map((b) => ({ _id: b._id, name: b.name }));
}

/**
 * Usage anggota per book = jumlah member aktif + invitation pending. Dipakai
 * `/subscription/usage` untuk menampilkan kuota share di UI.
 */
export function __getMockMemberUsageByBook(): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of members) {
    map.set(m.bookId, (map.get(m.bookId) ?? 0) + 1);
  }
  for (const i of invitations) {
    if (i.status !== "pending") continue;
    map.set(i.bookId, (map.get(i.bookId) ?? 0) + 1);
  }
  return map;
}
