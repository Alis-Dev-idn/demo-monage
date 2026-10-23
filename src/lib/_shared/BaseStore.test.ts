import { describe, expect, it, vi } from "vitest";
import { BaseStore } from "./BaseStore";

interface Item {
  id: string;
  value: number;
}

class TestStore extends BaseStore<Item> {
  add(item: Item) {
    this.items.push(item);
    this.emit();
  }
  remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.emit();
  }
}

describe("BaseStore", () => {
  it("starts empty", () => {
    const store = new TestStore();
    expect(store.getItems()).toEqual([]);
  });

  it("notifies subscribers on add/remove/clear", () => {
    const store = new TestStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.add({ id: "a", value: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual([{ id: "a", value: 1 }]);

    store.remove("a");
    expect(listener).toHaveBeenCalledTimes(2);

    store.clear();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("subscribe() returns an unsubscribe function", () => {
    const store = new TestStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.add({ id: "a", value: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("emits a fresh snapshot, not the internal array", () => {
    const store = new TestStore();
    store.add({ id: "a", value: 1 });
    const snap = store.getItems();
    snap.push({ id: "x", value: 0 });
    // Mutating snapshot should not affect the store
    expect(store.getItems().length).toBe(1);
  });
});
