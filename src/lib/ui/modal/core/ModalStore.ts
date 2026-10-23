import type { ModalInstance } from "../types";

type Listener = (modals: ModalInstance[]) => void;

class ModalStore {
  private modals: ModalInstance[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.modals]));
  }

  getModals() {
    return this.modals;
  }

  addModal(modal: ModalInstance) {
    this.modals.push(modal);
    this.emit();
  }

  removeModal(id: string) {
    this.modals = this.modals.filter((m) => m.id !== id);
    this.emit();
  }

  updateModal(id: string, updates: Partial<ModalInstance>) {
    this.modals = this.modals.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    this.emit();
  }

  closeModal(id: string) {
    this.updateModal(id, { isOpen: false });
  }

  closeTop() {
    const top = this.modals[this.modals.length - 1];
    if (top) {
      this.closeModal(top.id);
    }
  }

  closeAll() {
    this.modals = this.modals.map((m) => ({ ...m, isOpen: false }));
    this.emit();
  }
}

export const modalStore = new ModalStore();
