import type { RouteConfig } from "@dep/route/types";
import type { SidebarItemConfig } from "../types";

/**
 * Converts RouteConfig[] into SidebarItemConfig[] automatically.
 * 
 * - Only includes routes that have `sidebar` metadata defined
 * - Respects `sidebar.show` (defaults to true)
 * - Recursively processes children
 * - Filters by user roles if `userRoles` is provided
 * - Sorts by `sidebar.order` if specified
 *
 * @param routes - The route configurations
 * @param userRoles - Current user's roles (for filtering role-protected items)
 * @param parentPath - Internal use for building full paths
 */
const MAX_SIDEBAR_DEPTH = 5;

export function createSidebarFromRoutes(
  routes: RouteConfig[],
  userRoles?: string[],
  parentPath = "",
  depth = 0
): SidebarItemConfig[] {
  if (depth >= MAX_SIDEBAR_DEPTH) {
    console.warn(
      `[createSidebarFromRoutes] Reached max depth (${MAX_SIDEBAR_DEPTH}). ` +
      `Truncating to prevent stack overflow — check for cyclic route definitions.`
    );
    return [];
  }

  const items: SidebarItemConfig[] = [];

  for (const route of routes) {
    const meta = route.sidebar;

    // Skip routes without sidebar metadata
    if (!meta) {
      // But still recurse into children (they might have sidebar meta)
      if (route.children) {
        const fullPath = buildPath(parentPath, route.path);
        const childItems = createSidebarFromRoutes(route.children, userRoles, fullPath, depth + 1);
        items.push(...childItems);
      }
      continue;
    }

    // Skip if explicitly hidden
    if (meta.show === false) continue;

    // Skip if user doesn't have required roles
    if (route.roles && userRoles) {
      const hasAccess = route.roles.some((r) => userRoles.includes(r));
      if (!hasAccess) continue;
    }

    const fullPath = buildPath(parentPath, route.path);

    // Resolve label: sidebar.label > breadcrumb (string) > path segment
    const label = meta.label
      ?? (typeof route.breadcrumb === "string" ? route.breadcrumb : null)
      ?? formatPathSegment(route.path);

    const item: SidebarItemConfig = {
      label,
      icon: meta.icon,
      path: fullPath,
      badge: meta.badge,
      roles: route.roles,
    };

    // Process children recursively
    if (route.children) {
      const childItems = createSidebarFromRoutes(route.children, userRoles, fullPath, depth + 1);
      if (childItems.length > 0) {
        item.children = childItems;
      }
    }

    items.push(item);
  }

  // Sort by order (lower first), items without order go last
  items.sort((a, b) => {
    const orderA = getOrderFromRoutes(routes, a.path);
    const orderB = getOrderFromRoutes(routes, b.path);
    return orderA - orderB;
  });

  return items;
}

/* ── Helper functions ────────────────────────────────── */

function buildPath(parent: string, child: string): string {
  if (child.startsWith("/")) return child;
  return `${parent}/${child}`.replace(/\/+/g, "/");
}

function formatPathSegment(path: string): string {
  const segment = path.replace(/^\//, "").split("/").pop() ?? "";
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Home";
}

function getOrderFromRoutes(routes: RouteConfig[], path?: string): number {
  const route = routes.find((r) => {
    const rPath = r.path.startsWith("/") ? r.path : `/${r.path}`;
    return rPath === path || path?.endsWith(r.path);
  });
  return route?.sidebar?.order ?? 999;
}
