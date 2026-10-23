import type {ReactNode, ComponentType} from "react";

export type AuthCheckFn = () => boolean | Promise<boolean>;
export type GetRolesFn = () => string[] | Promise<string[]>;

/** Lazy-loadable component: either a direct ComponentType or an async import */
export type LazyComponent = ComponentType | (() => Promise<{ default: ComponentType }>);

export interface RouteKitConfig {
  authCheck?: AuthCheckFn;
  authStore?: () => unknown;
  authSelector?: (state: unknown) => boolean;
  getRoles?: GetRolesFn;
  roleStore?: () => unknown;
  roleSelector?: (state: unknown) => string[];
  loginPath?: string;
  unauthorizedPath?: string;
  notFoundPath?: string;
  notFoundComponent?: ComponentType;
  suspenseFallback?: ReactNode;
}

export interface RouteSidebarMeta {
  /** Icon element displayed in sidebar */
  icon?: ReactNode;
  /** Override label (defaults to breadcrumb or path) */
  label?: string;
  /** Whether to show this route in sidebar (default: true if sidebar meta exists) */
  show?: boolean;
  /** Badge content (e.g., notification count) */
  badge?: string | number;
  /** Sort order in sidebar (lower = higher) */
  order?: number;
}

export interface RouteConfig {
  path: string;
  component: LazyComponent;
  lazy?: boolean;
  auth?: boolean;
  roles?: string[];
  breadcrumb?: string | ((params: Record<string, string>) => string | Promise<string>);
  children?: RouteConfig[];
  index?: boolean;
  layout?: ComponentType<{ children: ReactNode }>;
  /** Sidebar metadata — if present, this route appears in the sidebar */
  sidebar?: RouteSidebarMeta;
  /** Arbitrary metadata for app-specific extension (feature flags, ACL, etc.) */
  meta?: Record<string, unknown>;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}
