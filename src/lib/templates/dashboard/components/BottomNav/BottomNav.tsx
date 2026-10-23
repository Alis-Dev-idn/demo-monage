import { useSyncExternalStore, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useRouteInfo } from "@dep/route";
import {
  getDashboardConfigSnapshot,
  subscribeDashboardConfig,
} from "../../core/DashboardKit";
import type { BottomNavItemConfig } from "../../types";

interface BottomNavProps {
  className?: string;
  items?: BottomNavItemConfig[];
}

export const BottomNav: FC<BottomNavProps> = ({ className = "", items: itemsProp }) => {
  const config = useSyncExternalStore(
    subscribeDashboardConfig,
    getDashboardConfigSnapshot,
  );
  const items = itemsProp ?? config.bottomNavItems ?? [];
  const navigate = useNavigate();
  const { isActive } = useRouteInfo();

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Bottom navigation"
      className={`hidden max-md:flex bg-[var(--db-surface)] border-t border-[var(--db-border)] flex-shrink-0 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] ${className}`}
    >
      {items.map((item, i) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path ?? i}
            type="button"
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2 bg-transparent border-none cursor-pointer transition-colors ${
              active ? "text-[var(--db-accent)]" : "text-[var(--db-text-secondary)]"
            } ${
              active
                ? "before:content-[''] before:absolute before:top-0 before:left-[28%] before:right-[28%] before:h-[3px] before:rounded-b before:bg-[var(--db-accent)]"
                : ""
            }`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            <span className="inline-flex text-[1.1rem]" aria-hidden="true">{item.icon}</span>
            <span className="text-[0.68rem] font-semibold">{item.label}</span>
            {item.badge !== undefined && (
              <span
                className="absolute top-1 right-[calc(50%-18px)] min-w-[16px] px-1.5 bg-[var(--db-danger)] text-white text-[0.6rem] font-bold rounded-full text-center"
                aria-label={`${item.badge} notifications`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
