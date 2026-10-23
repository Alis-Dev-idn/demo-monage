import type { DashboardSetupConfig } from "../types";

const DEFAULT_CONFIG: DashboardSetupConfig = {
  theme: "light",
  sidebar: {
    brand: { showToggle: true },
    sections: [],
  },
  sidebarItems: [],
  bottomNavItems: [],
  navbar: {
    showToggle: true,
    sticky: true,
    showBreadcrumb: true,
  },
  notifications: {
    emptyLabel: "No notifications",
  },
  sidebarWidth: 260,
  sidebarCollapsedWidth: 72,
  mobileBreakpoint: 1024,
};

export class DashboardKit {
  private static config: DashboardSetupConfig = { ...DEFAULT_CONFIG };
  // Observable: komponen (mis. Sidebar) subscribe agar re-render saat config
  // berubah. Tanpa ini, `setup()` di effect (mis. ganti pembukuan) memutasi
  // singleton tapi UI tak ikut berubah sampai ada render lain (#Bisnis-1.1).
  private static listeners = new Set<() => void>();

  private static notify(): void {
    for (const fn of this.listeners) fn();
  }

  static subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  static setup(config: DashboardSetupConfig): void {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      sidebar: { ...DEFAULT_CONFIG.sidebar, ...config.sidebar },
      navbar: { ...DEFAULT_CONFIG.navbar, ...config.navbar },
      notifications: { ...DEFAULT_CONFIG.notifications, ...config.notifications },
    };
    this.notify();
  }

  static getConfig(): DashboardSetupConfig {
    return this.config;
  }

  static updateUser(user: DashboardSetupConfig["user"]): void {
    this.config = { ...this.config, user };
    this.notify();
  }

  static updateNotifications(notifications: DashboardSetupConfig["notifications"]): void {
    this.config = {
      ...this.config,
      notifications: { ...this.config.notifications, ...notifications },
    };
    this.notify();
  }
}

/**
 * Referensi stabil (module-scope) untuk dipakai dengan `useSyncExternalStore`
 * sehingga komponen re-render saat config berubah. Referensi tetap antar-render
 * agar React tidak resubscribe tiap render.
 */
export const subscribeDashboardConfig = (fn: () => void): (() => void) =>
  DashboardKit.subscribe(fn);
export const getDashboardConfigSnapshot = (): DashboardSetupConfig =>
  DashboardKit.getConfig();
