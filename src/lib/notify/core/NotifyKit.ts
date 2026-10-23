import type {NotifyKitConfig} from "../types";
import { notifyStore } from "./NotifyStore";

const DEFAULT_CONFIG: Required<NotifyKitConfig> = {
  position: "top-right",
  duration: 3000,
  dismissible: true,
  pauseOnHover: true,
  maxVisible: 3,
  stack: true,
  gap: 8,
  animation: {
    in: "fade",
    out: "fade",
    duration: 200,
  },
  interceptApiError: {
    enabled: false,
  },
};

export class NotifyKit {
  private static config: Required<NotifyKitConfig> = { ...DEFAULT_CONFIG };

  static setup(config: NotifyKitConfig): void {
    this.config = {
      ...this.config,
      ...config,
      animation: { ...this.config.animation, ...config.animation },
      interceptApiError: { ...this.config.interceptApiError, ...config.interceptApiError },
    };
  }

  static getConfig(): Required<NotifyKitConfig> {
    return this.config;
  }

  static dismiss(id: string): void {
    notifyStore.removeNotification(id);
  }

  static dismissAll(): void {
    notifyStore.dismissAll();
  }
}
