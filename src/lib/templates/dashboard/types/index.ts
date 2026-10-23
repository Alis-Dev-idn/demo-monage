import type { ReactNode } from "react";

export type SidebarState = "full" | "collapsed" | "hidden";
export type ThemeType = "light" | "dark" | "auto";

/* ── Sidebar ─────────────────────────────────────────── */

export interface SidebarItemConfig {
  label: string;
  icon?: ReactNode;
  path?: string;
  onClick?: () => void;
  roles?: string[];
  badge?: string | number;
  /** Leading colored dot (CSS color). Useful for category items like groups. */
  dotColor?: string;
  children?: SidebarItemConfig[];
  divider?: boolean;
}

export interface SidebarSectionActionConfig {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

export interface SidebarSectionConfig {
  id?: string;
  /** Section header label (rendered uppercase). Omit for an unlabeled section. */
  label?: string;
  /** If true, label can be clicked to collapse the section. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  items: SidebarItemConfig[];
  /** Action button rendered after the items (e.g. "+ New Group"). */
  action?: SidebarSectionActionConfig;
}

export interface SidebarBrandConfig {
  logo?: ReactNode;
  title?: string;
  /** Navigate here on brand click. */
  href?: string;
  /** Show the in-sidebar collapse toggle. Default: true. */
  showToggle?: boolean;
}

export interface SidebarConfig {
  brand?: SidebarBrandConfig;
  /** Structured sections. Rendered in order. */
  sections?: SidebarSectionConfig[];
  /** Footer slot. If omitted and `user` is set, renders the user profile chip. */
  footer?: ReactNode;
}

/* ── Navbar ──────────────────────────────────────────── */

export interface NavbarConfig {
  /** Fallback title when no breadcrumb is available. */
  title?: string;
  logo?: ReactNode;
  showToggle?: boolean;
  sticky?: boolean;
  /** Show breadcrumb on the left. Default: true. */
  showBreadcrumb?: boolean;
  /** Override breadcrumb source. Otherwise pulled from RouteKit. */
  breadcrumbProvider?: () => Array<{ label: string; path: string; isActive: boolean }>;
}

/* ── Notifications ───────────────────────────────────── */

export interface NotificationConfig {
  id: string;
  title: string;
  description?: string;
  time: string;
  read: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

export interface NotificationsConfig {
  /** Static list. Use `provider` for dynamic. */
  items?: NotificationConfig[];
  /** Dynamic provider — called when the bell opens. */
  provider?: () => NotificationConfig[] | Promise<NotificationConfig[]>;
  /** Called when an item is clicked. Receives the item id. */
  onItemClick?: (id: string) => void;
  /** Called when "Mark all as read" is clicked. */
  onMarkAllRead?: () => void;
  /** Optional "View all" navigation handler. */
  onViewAll?: () => void;
  /** Empty-state label. Default: "No notifications". */
  emptyLabel?: string;
}

/* ── Profile ─────────────────────────────────────────── */

export interface ProfileMenuItemConfig {
  label: string;
  icon?: ReactNode;
  /** Variant for styling — e.g. "danger" for Sign out. */
  variant?: "default" | "danger";
  onClick: () => void;
  divider?: boolean;
}

export interface UserConfig {
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

/* ── Bottom Nav ──────────────────────────────────────── */

export interface BottomNavItemConfig {
  label: string;
  icon: ReactNode;
  path: string;
  badge?: string | number;
}

/* ── Root setup ──────────────────────────────────────── */

export interface DashboardSetupConfig {
  theme?: ThemeType;
  /** Structured sidebar config (preferred). */
  sidebar?: SidebarConfig;
  /**
   * Legacy flat list of items. Merged with route-derived items into a single
   * unnamed section. Use `sidebar.sections` for richer layouts.
   */
  sidebarItems?: SidebarItemConfig[];
  bottomNavItems?: BottomNavItemConfig[];
  navbar?: NavbarConfig;
  user?: UserConfig;
  profileMenu?: ProfileMenuItemConfig[];
  notifications?: NotificationsConfig;
  sidebarWidth?: number;
  sidebarCollapsedWidth?: number;
  mobileBreakpoint?: number;
}
