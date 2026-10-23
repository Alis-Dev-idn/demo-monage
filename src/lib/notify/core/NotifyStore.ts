import type {NotifyItem} from "../types";

type Listener = (notifications: NotifyItem[]) => void;

class NotifyStore {
  private notifications: NotifyItem[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  getNotifications() {
    return this.notifications;
  }

  addNotification(notification: NotifyItem, maxVisible: number) {
    if (this.notifications.length >= maxVisible) {
      this.notifications.shift(); // Remove oldest
    }
    this.notifications.push(notification);
    this.emit();
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.emit();
  }

  updateNotification(id: string, updates: Partial<NotifyItem>) {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, ...updates } : n
    );
    this.emit();
  }

  dismissAll() {
    this.notifications = [];
    this.emit();
  }
}

export const notifyStore = new NotifyStore();
