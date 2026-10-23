type Listener<T> = (items: T[]) => void;

/**
 * Generic observer/store pattern shared by NotifyStore, ModalStore,
 * ConfirmStore. Subclasses manage `items` and call `emit()` after mutation.
 *
 * @example
 * ```ts
 * class TodoStore extends BaseStore<Todo> {
 *   add(todo: Todo) {
 *     this.items.push(todo);
 *     this.emit();
 *   }
 *   remove(id: string) {
 *     this.items = this.items.filter(t => t.id !== id);
 *     this.emit();
 *   }
 * }
 * ```
 */
export abstract class BaseStore<T extends { id: string }> {
  protected items: T[] = [];
  private listeners: Set<Listener<T>> = new Set();

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getItems(): T[] {
    return [...this.items];
  }

  protected emit(): void {
    const snapshot = [...this.items];
    this.listeners.forEach((listener) => listener(snapshot));
  }

  clear(): void {
    this.items = [];
    this.emit();
  }
}
