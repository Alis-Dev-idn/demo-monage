import { createContext, useContext } from "react";
import type { NotificationConfig, SidebarState, UserConfig } from "../types";

export interface DashboardContextValue {
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  user?: UserConfig;
  setUser: (user?: UserConfig) => void;

  /* ── Notifications (realtime-friendly) ───────────────── */
  notifications: NotificationConfig[];
  /** Replace the entire list. */
  setNotifications: (items: NotificationConfig[]) => void;
  /**
   * Push a single notification to the top. If an item with the same `id`
   * exists, it is replaced in-place (no duplicates).
   */
  addNotification: (item: NotificationConfig) => void;
  /** Mark one notification as read. */
  markNotificationRead: (id: string) => void;
  /** Mark all as read. */
  markAllRead: () => void;
  /** Remove a notification by id. */
  removeNotification: (id: string) => void;
  /** Empty the list. */
  clearNotifications: () => void;
  /** Count of unread items. */
  unreadCount: number;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a <Dashboard> component");
  }
  return context;
}
