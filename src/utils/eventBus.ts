export type AppEvent =
  | "transaction:changed"
  | "account:changed"
  | "category:changed"
  | "budget:changed"
  | "preferences:changed"
  | "book:changed"
  | "saving:changed"
  | "subscription:changed"
  | "outbox:changed";

type Listener = () => void;

const subscribers = new Map<AppEvent, Set<Listener>>();

export const eventBus = {
  on(event: AppEvent, fn: Listener): () => void {
    let set = subscribers.get(event);
    if (!set) {
      set = new Set();
      subscribers.set(event, set);
    }
    set.add(fn);
    return () => set?.delete(fn);
  },
  emit(event: AppEvent): void {
    subscribers.get(event)?.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(`[eventBus] handler for "${event}" threw:`, err);
      }
    });
  },
  clear(event?: AppEvent): void {
    if (event) subscribers.delete(event);
    else subscribers.clear();
  },
};
