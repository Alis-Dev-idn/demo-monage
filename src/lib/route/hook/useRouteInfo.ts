import { useLocation, useParams, matchPath } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { RouteKit } from "../core/RouteKit";
import type { RouteConfig, BreadcrumbItem } from "../types";

interface BreadcrumbDraft extends BreadcrumbItem {
  /** Cache key for an async breadcrumb; undefined for sync labels. */
  asyncKey?: string;
  /** Promise resolver invoked when an async breadcrumb returns. */
  pending?: Promise<string>;
}

export function useRouteInfo() {
  const location = useLocation();
  const params = useParams();
  const routes = RouteKit.getRoutes();

  // Cache async breadcrumb results across renders so they don't flicker
  // back to "Loading..." once resolved. Kept in state (not a ref) — reading
  // a ref's `.current` during render is unsafe; state is the correct way to
  // feed a render-phase computation (the `useMemo` below).
  const [asyncCache, setAsyncCache] = useState<Map<string, string>>(new Map());

  const { activeRoute, breadcrumbs, drafts, isActive } = useMemo(() => {
    const currentPath = location.pathname;
    const drafts: BreadcrumbDraft[] = [];
    let active: RouteConfig | null = null;

    const visit = (
      list: RouteConfig[],
      parentPath = ""
    ): RouteConfig | null => {
      for (const route of list) {
        const fullPath = route.path?.startsWith("/")
          ? route.path
          : `${parentPath}/${route.path}`.replace(/\/+/g, "/");

        const match = matchPath({ path: fullPath, end: route.index ?? false }, currentPath);

        if (match) {
          active = route;

          let label = "";
          let asyncKey: string | undefined;
          let pending: Promise<string> | undefined;

          if (typeof route.breadcrumb === "function") {
            const result = route.breadcrumb(params as Record<string, string>);
            if (typeof result === "string") {
              label = result;
            } else if (result && typeof (result as Promise<string>).then === "function") {
              asyncKey = `${fullPath}::${JSON.stringify(params)}`;
              const cached = asyncCache.get(asyncKey);
              if (cached !== undefined) {
                label = cached;
              } else {
                label = "Loading...";
                pending = result as Promise<string>;
              }
            }
          } else if (typeof route.breadcrumb === "string") {
            label = route.breadcrumb;
          } else if (route.breadcrumb !== null && route.path) {
            const segment = route.path.replace(/^\//, "");
            label = segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Home";
          }

          if (label) {
            drafts.push({
              label,
              path: fullPath,
              isActive: fullPath === currentPath,
              asyncKey,
              pending,
            });
          }

          if (route.children) {
            const childMatch = visit(route.children, fullPath);
            if (childMatch) return childMatch;
          }
          return route;
        }
      }
      return null;
    };

    visit(routes);

    const isActive = (path: string, exact = false) => {
      return !!matchPath({ path, end: exact }, currentPath);
    };

    return {
      activeRoute: active,
      breadcrumbs: drafts.map(({ label, path, isActive }) => ({ label, path, isActive })),
      drafts,
      isActive,
    };
  }, [location, params, routes, asyncCache]);

  // Resolve any pending async breadcrumbs and merge results into cache state.
  useEffect(() => {
    let cancelled = false;
    for (const draft of drafts) {
      if (!draft.asyncKey || !draft.pending) continue;
      const key = draft.asyncKey;
      if (asyncCache.has(key)) continue;
      draft.pending
        .then((resolved) => {
          if (cancelled) return;
          setAsyncCache((prev) => new Map(prev).set(key, resolved));
        })
        .catch(() => {
          if (cancelled) return;
          setAsyncCache((prev) => new Map(prev).set(key, ""));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [drafts, asyncCache]);

  return {
    activeRoute,
    breadcrumbs,
    params,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    isActive,
  };
}
