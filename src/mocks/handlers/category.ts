import { http, HttpResponse } from "msw";
import type { Category, CategoryKind } from "@/types";
import { endpoint } from "../baseUrl";
import { matchesBook } from "./book";
import { storageAdapter } from "../storage/adapter";
import { mockCategories } from "../data/seed";

function nextId(): string {
  return `c-${Date.now()}`;
}

export const categoryHandlers = [
  http.get(endpoint("/categories"), async ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") as CategoryKind | null;
    const bookId = url.searchParams.get("bookId");

    const categories = await storageAdapter.getAll<Category>("categories");
    const filtered = categories
      .filter((c) => matchesBook(c.bookId, bookId))
      .filter((c) => !kind || c.kind === kind);

    return HttpResponse.json([...filtered].sort((a, b) => a.order - b.order));
  }),

  http.post(endpoint("/categories"), async ({ request }) => {
    const body = (await request.json()) as Partial<Category>;
    const targetBookId = body.bookId || "book-personal";
    const categories = await storageAdapter.getAll<Category>("categories");

    const newCat: Category = {
      _id: nextId(),
      userId: body.userId || "u-personal",
      bookId: targetBookId,
      kind: body.kind ?? "expense",
      name: body.name ?? "Kategori Baru",
      icon: body.icon ?? "Tag",
      tone: body.tone ?? "neutral",
      order: categories.filter((c) => c.kind === (body.kind ?? "expense")).length + 1,
      isDefault: false,
      subcategories: [],
    };

    await storageAdapter.insert("categories", newCat);
    return HttpResponse.json(newCat, { status: 201 });
  }),

  http.patch(endpoint("/categories/reorder"), async ({ request }) => {
    const body = (await request.json()) as { orders: Array<{ _id: string; order: number }> };
    for (const { _id, order } of body.orders) {
      await storageAdapter.update<Category>("categories", _id, { order });
    }
    const categories = await storageAdapter.getAll<Category>("categories");
    return HttpResponse.json([...categories].sort((a, b) => a.order - b.order));
  }),

  http.patch(endpoint("/categories/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Partial<Category>;
    try {
      const updated = await storageAdapter.update<Category>("categories", params.id as string, body);
      return HttpResponse.json(updated);
    } catch {
      return HttpResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
    }
  }),

  http.delete(endpoint("/categories/:id"), async ({ params }) => {
    await storageAdapter.delete("categories", params.id as string);
    return HttpResponse.json({ ok: true });
  }),
];

export const __categoriesStore: Category[] = mockCategories;
