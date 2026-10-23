import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@dep/axios";
import * as bookService from "@/services/book.service";
import {
  getActiveBookId,
  setActiveBookId as persistActiveBookId,
} from "@/utils/activeBook";
import { eventBus } from "@/utils/eventBus";
import { useAuth } from "@/hooks/useAuth";
import type { Book, ID } from "@/types";

export interface BookContextValue {
  books: Book[];
  activeBook: Book | null;
  isLoading: boolean;
  error: ApiError | null;
  setActiveBook: (id: ID) => void;
  refetch: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const BookContext = createContext<BookContextValue | null>(null);

interface BookProviderProps {
  children: ReactNode;
}

export function BookProvider({ children }: BookProviderProps) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [activeId, setActiveId] = useState<ID | null>(() => getActiveBookId());
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookService.fetchBooks();
      setBooks(data);
      if (data.length > 0) {
        const stored = getActiveBookId();
        const existsStored = stored && data.some((b) => b._id === stored);
        if (!existsStored) {
          const def = data.find((b) => b.isDefault) ?? data[0];
          setActiveId(def._id);
          persistActiveBookId(def._id);
        } else {
          setActiveId(stored);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBooks([]);
      setActiveId(null);
      persistActiveBookId(null);
      return;
    }
    void load();
  }, [isAuthenticated, isBootstrapping, load]);

  const setActiveBook = useCallback((id: ID) => {
    persistActiveBookId(id);
    setActiveId(id);
    // Refetch semua lookup/data scoped per book
    eventBus.emit("account:changed");
    eventBus.emit("category:changed");
    eventBus.emit("transaction:changed");
    eventBus.emit("budget:changed");
  }, []);

  const activeBook = useMemo(
    () => books.find((b) => b._id === activeId) ?? null,
    [books, activeId],
  );

  const value = useMemo<BookContextValue>(
    () => ({
      books,
      activeBook,
      isLoading,
      error,
      setActiveBook,
      refetch: load,
    }),
    [books, activeBook, isLoading, error, setActiveBook, load],
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}
