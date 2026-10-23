import type { DialogInstance } from "../types";

type Listener = (dialogs: DialogInstance[]) => void;

class ConfirmStore {
  private dialogs: DialogInstance[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.dialogs]));
  }

  getDialogs() {
    return this.dialogs;
  }

  addDialog(dialog: DialogInstance) {
    this.dialogs.push(dialog);
    this.emit();
  }

  removeDialog(id: string) {
    this.dialogs = this.dialogs.filter((d) => d.id !== id);
    this.emit();
  }

  updateDialog(id: string, updates: Partial<DialogInstance>) {
    this.dialogs = this.dialogs.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    );
    this.emit();
  }

  dismissAll() {
    this.dialogs.forEach((d) => {
      d.resolve(d.type === "prompt" ? null : false);
    });
    this.dialogs = [];
    this.emit();
  }
}

export const confirmStore = new ConfirmStore();
