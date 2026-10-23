import { useEffect } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { realtimeWsClient, deriveWsUrl } from "./wsClient";
import { applyEvent } from "./applyEvent";

/**
 * Mengaktifkan realtime sync di web: konek WebSocket saat login, subscribe
 * semua pembukuan, lalu apply event yang memancarkan `eventBus` lokal sehingga
 * hooks/contexts refetch (FE memakai eventBus, bukan React Query). Dipasang
 * sekali di `AppShell`.
 */
export function useRealtime(): void {
  const { isAuthenticated, user } = useAuth();
  const { books } = useBooks();
  const userId = user?._id ?? null;

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    realtimeWsClient.configure({
      wsUrl: deriveWsUrl(),
      getToken: () => api().getTokenStorage()?.getAccessToken() ?? null,
      onEvent: (ev) => {
        applyEvent(ev, userId);
      },
    });
    realtimeWsClient.start();
    return () => {
      realtimeWsClient.stop();
    };
  }, [isAuthenticated, userId]);

  // Sinkronkan subscribe ke daftar pembukuan user.
  useEffect(() => {
    realtimeWsClient.setBooks(books.map((b) => b._id));
  }, [books]);
}
