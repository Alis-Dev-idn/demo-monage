import type { AnimationConfig, CloseButtonStyle } from "../types";

export interface ModalKitConfig {
  animation?: AnimationConfig;
  closeButtonStyle?: CloseButtonStyle;
  backdrop?: {
    enabled?: boolean;
    baseOpacity?: number;
    opacityIncrement?: number;
  };
  /**
   * Custom size presets. Keys override / extend the built-in
   * "xs" | "sm" | "md" | "lg" | "xl" | "full" presets and are referenced
   * by string from `<Modal size="..." />`.
   */
  sizePresets?: Record<string, string>;
}

export const DEFAULT_MODAL_SIZE_PRESETS: Record<string, string> = {
  xs: "320px",
  sm: "480px",
  md: "600px",
  lg: "800px",
  xl: "1024px",
  full: "100vw",
};

const DEFAULT_CONFIG: Required<ModalKitConfig> = {
  animation: { in: "fade", out: "fade", duration: 200 },
  closeButtonStyle: "windows",
  backdrop: {
    enabled: true,
    baseOpacity: 0.5,
    opacityIncrement: 0.1,
  },
  sizePresets: DEFAULT_MODAL_SIZE_PRESETS,
};

export class ModalKit {
  private static config: Required<ModalKitConfig> = { ...DEFAULT_CONFIG };

  static setup(config: ModalKitConfig): void {
    this.config = {
      ...this.config,
      ...config,
      animation: { ...this.config.animation, ...config.animation },
      backdrop: { ...this.config.backdrop, ...config.backdrop },
      sizePresets: { ...this.config.sizePresets, ...config.sizePresets },
    };
  }

  static getConfig(): Required<ModalKitConfig> {
    return this.config;
  }
}
