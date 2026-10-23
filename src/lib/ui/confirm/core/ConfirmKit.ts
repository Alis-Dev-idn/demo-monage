import type { AnimationConfig, BackdropConfig, KeyboardConfig, ThemeType, StackBehavior } from "../types";
import { confirmStore } from "./ConfirmStore";

export interface ConfirmKitConfig {
  animation?: AnimationConfig;
  backdrop?: BackdropConfig;
  keyboard?: KeyboardConfig;
  theme?: ThemeType;               // default: "light"
  stack?: StackBehavior;           // default: "layer"
  mobileBreakpoint?: number;       // default: 768 (px)
}

const DEFAULT_CONFIG: Required<ConfirmKitConfig> = {
  animation: { in: "fade", out: "fade", duration: 200 },
  backdrop: { enabled: true, blur: false, dismissible: true },
  keyboard: { confirm: "Enter", cancel: "Escape", trapFocus: true },
  theme: "light",
  stack: "layer",
  mobileBreakpoint: 768,
};

export class ConfirmKit {
  private static config: Required<ConfirmKitConfig> = { ...DEFAULT_CONFIG };

  /**
   * Global setup for ConfirmKit
   */
  static setup(config: ConfirmKitConfig): void {
    this.config = {
      ...this.config,
      ...config,
      animation: { ...this.config.animation, ...config.animation },
      backdrop: { ...this.config.backdrop, ...config.backdrop },
      keyboard: { ...this.config.keyboard, ...config.keyboard },
    };
  }

  /**
   * Get current configuration
   */
  static getConfig(): Required<ConfirmKitConfig> {
    return this.config;
  }

  /**
   * Dismiss a specific dialog by ID
   */
  static dismiss(id: string): void {
    const dialog = confirmStore.getDialogs().find(d => d.id === id);
    if (dialog) {
      dialog.resolve(dialog.type === "prompt" ? null : false);
      confirmStore.removeDialog(id);
    }
  }

  /**
   * Dismiss all active dialogs
   */
  static dismissAll(): void {
    confirmStore.dismissAll();
  }
}
