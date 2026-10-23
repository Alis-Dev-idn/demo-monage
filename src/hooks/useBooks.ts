import { useContext } from "react";
import { BookContext, type BookContextValue } from "@/contexts/BookContext";
import * as bookService from "@/services/book.service";
import { eventBus } from "@/utils/eventBus";
import type { Book, ID } from "@/types";

export function useBooks(): BookContextValue {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error("useBooks() harus dipanggil di dalam <BookProvider>");
  return ctx;
}

export async function createBook(
  payload: bookService.BookFormPayload,
): Promise<Book> {
  const created = await bookService.createBook(payload);
  eventBus.emit("book:changed");
  return created;
}

export async function updateBook(
  id: ID,
  payload: Partial<bookService.BookFormPayload>,
): Promise<Book> {
  const updated = await bookService.updateBook(id, payload);
  eventBus.emit("book:changed");
  return updated;
}

export async function deleteBook(id: ID): Promise<void> {
  await bookService.deleteBook(id);
  eventBus.emit("book:changed");
}

export async function setDefaultBook(id: ID): Promise<Book> {
  const updated = await bookService.setDefaultBook(id);
  eventBus.emit("book:changed");
  return updated;
}
