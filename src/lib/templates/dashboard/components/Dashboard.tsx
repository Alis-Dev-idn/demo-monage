import { useState, useEffect, useMemo, useCallback, type CSSProperties, type FC, type ReactNode } from "react";
import { DashboardContext, type DashboardContextValue } from "../hooks/useDashboard";
import { DashboardKit } from "../core/DashboardKit";
import type { NotificationConfig, SidebarState } from "../types";
import "./dashboard.css";

/* ── Dashboard Root ──────────────────────────────────── */

interface DashboardProps {
  children: ReactNode;
  className?: string;
  defaultSidebarState?: SidebarState;
}

export const Dashboard: FC<DashboardProps> = ({
  children,
  className = "",
  defaultSidebarState = "full",
}) => {
  const config = DashboardKit.getConfig();
  const [sidebarState, setSidebarState] = useState<SidebarState>(defaultSidebarState);
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState(config.user);
  const [notifications, setNotifications] = useState<NotificationConfig[]>(
    config.notifications?.items ?? []
  );
  const breakpoint = config.mobileBreakpoint ?? 768;

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setIsDrawerOpen(false);
    };
    handler(mediaQuery);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  const toggleSidebar = useCallback(() => {
    setSidebarState((prev) => (prev === "full" ? "collapsed" : "full"));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Granular notification helpers — designed for realtime sources (WebSocket,
  // SSE, polling). Use functional `setNotifications` to avoid stale state
  // when multiple messages arrive in rapid succession.
  const addNotification = useCallback((item: NotificationConfig) => {
    setNotifications((prev) => {
      const without = prev.filter((n) => n.id !== item.id);
      return [item, ...without];
    });
  }, []);
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue: DashboardContextValue = useMemo(
    () => ({
      sidebarState,
      setSidebarState,
      toggleSidebar,
      isMobile,
      isDrawerOpen,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      user,
      setUser,
      notifications,
      setNotifications,
      addNotification,
      markNotificationRead,
      markAllRead,
      removeNotification,
      clearNotifications,
      unreadCount,
    }),
    [
      sidebarState,
      isMobile,
      isDrawerOpen,
      toggleSidebar,
      user,
      notifications,
      addNotification,
      markNotificationRead,
      markAllRead,
      removeNotification,
      clearNotifications,
      unreadCount,
    ]
  );

  const rootStyle: CSSProperties = {
    ...(config.sidebarWidth != null && { ["--db-sidebar-width-full"]: `${config.sidebarWidth}px` }),
    ...(config.sidebarCollapsedWidth != null && { ["--db-sidebar-width-collapsed"]: `${config.sidebarCollapsedWidth}px` }),
  } as CSSProperties;

  return (
    <DashboardContext.Provider value={contextValue}>
      <div
        className={`flex flex-row h-screen w-screen overflow-hidden bg-[var(--db-bg)] text-[var(--db-text-primary)] font-sans text-sm ${className}`}
        data-dashboard-theme={config.theme ?? "light"}
        data-sidebar-state={isMobile ? "hidden" : sidebarState}
        data-mobile={isMobile ? "true" : "false"}
        style={rootStyle}
      >
        {children}
      </div>
    </DashboardContext.Provider>
  );
};

/* ── Dashboard Body ──────────────────────────────────── */

interface DashboardBodyProps {
  children: ReactNode;
  className?: string;
}

export const DashboardBody: FC<DashboardBodyProps> = ({ children, className = "" }) => {
  return (
    <div className={`flex flex-col flex-1 min-w-0 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};
