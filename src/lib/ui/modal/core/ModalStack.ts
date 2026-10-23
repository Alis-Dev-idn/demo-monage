class ModalStack {
  private stack: string[] = [];

  push(id: string) {
    this.stack.push(id);
  }

  pop(id: string) {
    this.stack = this.stack.filter((i) => i !== id);
  }

  isTop(id: string) {
    return this.stack[this.stack.length - 1] === id;
  }

  getZIndex(id: string) {
    const index = this.stack.indexOf(id);
    return 1000 + (index + 1) * 10;
  }

  getCount() {
    return this.stack.length;
  }
}

export const modalStack = new ModalStack();
