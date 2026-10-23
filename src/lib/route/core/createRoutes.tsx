import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { Route, Navigate } from "react-router-dom";
import type { RouteConfig } from "../types";
import { AuthRoute, RoleRoute } from "../components/Guards";
import { RouteKit } from "./RouteKit";

/**
 * createRoutes: Generates a list of <Route> elements from the provided config.
 * It automatically handles lazy loading, route guards, and nested 404 handling.
 */
export function createRoutes(...routeGroups: RouteConfig[][]): ReactNode {
  // Flatten all route groups into a single array
  const allRoutes = routeGroups.flat();

  // Register routes for information tracking (hooks, etc.)
  RouteKit.setRoutes(allRoutes);

  const config = RouteKit.getConfig();

  return (
    <>
      {renderRoutes(allRoutes)}
      {/* 
          Global redirect catch-all: 
          Only used if no nested 404 component is defined or if the path 
          doesn't match any top-level routes.
      */}
      {!config.notFoundComponent && config.notFoundPath && (
        <Route
          path="*"
          element={<Navigate to={config.notFoundPath} replace />}
        />
      )}
    </>
  );
}

/**
 * Heuristic to check if a component is a lazy loader function
 */
function isLazyComponent(component: unknown): boolean {
  if (typeof component !== 'function') return false;

  // If it's a class component
  if (component.prototype?.isReactComponent) return false;

  const funcStr = component.toString();
  return funcStr.includes('import(') || funcStr.includes('.then(');
}

function renderRoutes(routes: RouteConfig[], parentKey = "root") {
  const config = RouteKit.getConfig();

  const rendered = routes.map((route, index) => {
    let element: ReactNode;
    const rawComponent = route.component;

    // Detect if we should use Lazy Loading
    const shouldLazy = route.lazy || isLazyComponent(rawComponent);

    if (shouldLazy) {
      const loader = typeof rawComponent === 'function'
        ? (rawComponent as () => Promise<{ default: ComponentType }>)
        : () => Promise.resolve({ default: rawComponent as ComponentType });

      const LazyComponent = lazy(loader);

      element = (
        <Suspense fallback={config.suspenseFallback ?? null}>
          <LazyComponent />
        </Suspense>
      );
    } else {
      const Component = rawComponent as ComponentType;
      element = <Component />;
    }

    // Wrap with Guards
    if (route.roles) {
      element = <RoleRoute roles={route.roles}>{element}</RoleRoute>;
    } else if (route.auth) {
      element = <AuthRoute>{element}</AuthRoute>;
    }

    // Layout
    if (route.layout) {
      const Layout = route.layout;
      element = <Layout>{element}</Layout>;
    }

    if (route.index) {
      return (
        <Route
          key={index}
          index={true}
          element={element}
        />
      );
    }

    const childKey = `${parentKey}-${route.path || index}`;
    return (
      <Route
        key={childKey}
        path={route.path}
        element={element}
      >
        {route.children && renderRoutes(route.children, childKey)}
      </Route>
    );
  });

  // IMPORTANT: Add a local catch-all for this group of routes
  // if a notFoundComponent is defined. This allows "404 inside layout".
  if (config.notFoundComponent) {
    const NotFound = config.notFoundComponent;
    rendered.push(
      <Route key={`404-${parentKey}`} path="*" element={<NotFound />} />
    );
  }

  return rendered;
}
