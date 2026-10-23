import { eventBus, type AppEvent } from "@/utils/eventBus";
import type { RealtimeEvent } from "./wsClient";

/**
 * Peta entity realtime → event `eventBus` lokal (yang sudah didengarkan hooks/
 * contexts untuk reload). Mencerminkan event yang dipancarkan mutasi lokal.
 * Entity tanpa kanal eventBus (mis. monthlyPlan) di-refetch saat navigasi.
 */
const ENTITY_EVENTS: Record<string, AppEvent[]> = {
  transaction: ["transaction:changed", "account:changed", "budget:changed"],
  account: ["account:changed"],
  category: ["category:changed"],
  budget: ["budget:changed"],
  saving: ["saving:changed"],
  savingMovement: ["saving:changed"],
  book: ["book:changed"],
};

/**
 * Terapkan event realtime dari user lain: lewati echo diri sendiri, lalu emit
 * event eventBus terkait sehingga UI refetch. Mengembalikan `true` bila event
 * diterapkan.
 */
export function applyEvent(ev: RealtimeEvent, currentUserId: string | null): boolean {
  if (currentUserId && ev.actorId === currentUserId) return false; // skip echo
  const events = ENTITY_EVENTS[ev.entity];
  if (events) {
    for (const e of events) eventBus.emit(e);
  }
  return true;
}
