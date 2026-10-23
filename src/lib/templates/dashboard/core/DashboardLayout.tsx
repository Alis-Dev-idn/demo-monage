import {
  useState,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type FC,
  type ReactNode,
} from "react";
import { RouteKit } from "@dep/route";
import { Dashboard, DashboardBody } from "../components/Dashboard";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Navbar } from "../components/Navbar/Navbar";
import { Content } from "../components/Content/Content";
import { BottomNav } from "../components/BottomNav/BottomNav";
import {
  getDashboardConfigSnapshot,
  subscribeDashboardConfig,
} from "./DashboardKit";
import { createSidebarFromRoutes } from "./createSidebarFromRoutes";
import type {
  BottomNavItemConfig,
  SidebarItemConfig,
  SidebarSectionConfig,
} from "../types";

function buildSidebarSkeletonItems(count: number): SidebarItemConfig[] {
  return Array.from({ length: count }, () => ({
    label: "",
    icon: <span className="db-skeleton inline-block w-5 h-5 rounded-md" aria-hidden="true" />,
    onClick: () => {},
  }));
}

interface DashboardLayoutProps {
  children?: ReactNode;
}

/**
 * DashboardLayout: A ready-to-use layout component that integrates with RouteKit.
 *
 * - Resolves user roles via RouteKit and filters route-derived sidebar items.
 * - Merges manual sections (`DashboardKit.sidebar.sections`) with auto-generated
 *   sidebar items from RouteKit routes — auto items go into a default section
 *   labelled by `sidebar.defaultSectionLabel` (or unlabelled).
 * - Renders Navbar (breadcrumb + notifications + profile), Sidebar (brand +
 *   sections + user footer), Content (<Outlet />), and BottomNav for mobile.
 */
export const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  // Reaktif terhadap `DashboardKit.setup()` (mis. ganti pembukuan) — tanpa ini
  // sections di-cache & sidebar "satu langkah di belakang" sampai render lain.
  const config = useSyncExternalStore(
    subscribeDashboardConfig,
    getDashboardConfigSnapshot,
  );
  const routeConfig = RouteKit.getConfig();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const needsAsyncRoles =
    !(routeConfig.roleStore && routeConfig.roleSelector) && !!routeConfig.getRoles;
  const [rolesReady, setRolesReady] = useState(!needsAsyncRoles);

  useEffect(() => {
    let alive = true;
    const resolveRoles = async () => {
      try {
        if (routeConfig.roleStore && routeConfig.roleSelector) {
          const state = routeConfig.roleStore();
          if (!alive) return;
          setUserRoles(routeConfig.roleSelector(state));
          setRolesReady(true);
        } else if (routeConfig.getRoles) {
          const roles = await routeConfig.getRoles();
          if (!alive) return;
          setUserRoles(roles);
          setRolesReady(true);
        } else {
          setRolesReady(true);
        }
      } catch {
        if (!alive) return;
        setUserRoles([]);
        setRolesReady(true);
      }
    };
    resolveRoles();
    return () => {
      alive = false;
    };
  }, [routeConfig]);

  // Build sections: prepend user-defined `sidebar.sections`, then add a
  // route-derived "auto" section if it produces items.
  const sections: SidebarSectionConfig[] = useMemo(() => {
    const userSections = config.sidebar?.sections ?? [];
    const manualLegacy = config.sidebarItems ?? [];

    if (!rolesReady) {
      // Show a skeleton-only single section while roles resolve so the
      // layout doesn't flash empty → populated.
      return [{ id: "__skeleton", items: buildSidebarSkeletonItems(6) }];
    }

    const autoItems = createSidebarFromRoutes(RouteKit.getRoutes(), userRoles);
    const merged: SidebarSectionConfig[] = [...userSections];

    if (manualLegacy.length || autoItems.length) {
      // If user already has an unlabeled section, append to it. Otherwise
      // create one.
      const idx = merged.findIndex((s) => !s.label && !s.id);
      const autoSection: SidebarSectionConfig = {
        items: [...manualLegacy, ...autoItems],
      };
      if (idx >= 0) {
        merged[idx] = {
          ...merged[idx],
          items: [...merged[idx].items, ...autoSection.items],
        };
      } else {
        merged.unshift(autoSection);
      }
    }

    return merged;
  }, [config.sidebar, config.sidebarItems, rolesReady, userRoles]);

  const bottomNavItems: BottomNavItemConfig[] = useMemo(() => {
    if (config.bottomNavItems?.length) return config.bottomNavItems;
    const allItems = sections.flatMap((s) => s.items);
    return allItems
      .filter((item) => item.path && item.icon)
      .slice(0, 5)
      .map((item) => ({
        label: item.label,
        icon: item.icon!,
        path: item.path!,
        badge: item.badge,
      }));
  }, [config.bottomNavItems, sections]);

  return (
    <Dashboard>
      <Sidebar sections={sections} />
      <DashboardBody>
        <Navbar />
        <Content>{children}</Content>
        <BottomNav items={bottomNavItems} />
      </DashboardBody>
    </Dashboard>
  );
};
