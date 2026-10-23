import { useState, useSyncExternalStore, type FC, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useRouteInfo } from "@dep/route";
import { useDashboard } from "../../hooks/useDashboard";
import {
  DashboardKit,
  getDashboardConfigSnapshot,
  subscribeDashboardConfig,
} from "../../core/DashboardKit";
import type {
  SidebarItemConfig,
  SidebarSectionConfig,
} from "../../types";

/* ── Sidebar Root ─────────────────────────────────────── */

interface SidebarProps {
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  items?: SidebarItemConfig[];
  sections?: SidebarSectionConfig[];
}

const SIDEBAR_BASE =
  "flex flex-col flex-shrink-0 overflow-hidden bg-[var(--db-sidebar-bg)] text-[var(--db-sidebar-text)] border-r border-[var(--db-border)] z-[200] transition-[width] duration-200 ease-out";

export const Sidebar: FC<SidebarProps> = ({
  header,
  footer,
  className = "",
  items: itemsProp,
  sections: sectionsProp,
}) => {
  const { sidebarState, isMobile, isDrawerOpen, closeDrawer, toggleSidebar } = useDashboard();
  // Reaktif: re-render saat DashboardKit.setup() dipanggil (mis. ganti pembukuan
  // bisnis ↔ biasa) sehingga menu langsung berubah tanpa perlu klik dulu.
  const config = useSyncExternalStore(
    subscribeDashboardConfig,
    getDashboardConfigSnapshot,
  );
  const sidebarCfg = config.sidebar ?? {};

  const sections: SidebarSectionConfig[] = sectionsProp
    ?? sidebarCfg.sections
    ?? (itemsProp || config.sidebarItems
        ? [{ items: itemsProp ?? config.sidebarItems ?? [] }]
        : []);

  const collapsed = !isMobile && sidebarState === "collapsed";

  // Mobile: drawer overlay
  if (isMobile) {
    return (
      <>
        {isDrawerOpen && (
          <div
            className="fixed inset-0 z-[199] bg-black/55 backdrop-blur-[2px]"
            onClick={closeDrawer}
          />
        )}
        <aside
          className={`${SIDEBAR_BASE} fixed top-0 left-0 h-screen w-[min(86vw,320px)] shadow-[var(--db-shadow-md)] transform transition-transform duration-200 ease-out ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          } ${className}`}
        >
          <SidebarBrand collapsed={false} onToggle={closeDrawer} mobileCloseIcon />
          {header && <div className="p-4 flex-shrink-0">{header}</div>}
          <nav
            className="db-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-4"
            aria-label="Main navigation"
          >
            {sections.map((section, i) => (
              <SidebarSection key={section.id ?? i} section={section} collapsed={false} />
            ))}
          </nav>
          <SidebarFooter custom={footer ?? sidebarCfg.footer} collapsed={false} />
        </aside>
      </>
    );
  }

  if (sidebarState === "hidden") return null;

  return (
    <aside
      className={`${SIDEBAR_BASE} ${
        collapsed ? "w-[var(--db-sidebar-width-collapsed)]" : "w-[var(--db-sidebar-width-full)]"
      } ${className}`}
    >
      <SidebarBrand collapsed={collapsed} onToggle={toggleSidebar} />
      {header && <div className="p-4 flex-shrink-0">{header}</div>}
      <nav
        className="db-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-4"
        aria-label="Main navigation"
      >
        {sections.map((section, i) => (
          <SidebarSection key={section.id ?? i} section={section} collapsed={collapsed} />
        ))}
      </nav>
      <SidebarFooter custom={footer ?? sidebarCfg.footer} collapsed={collapsed} />
    </aside>
  );
};

/* ── Brand header ─────────────────────────────────────── */

interface SidebarBrandProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileCloseIcon?: boolean;
}

const SidebarBrand: FC<SidebarBrandProps> = ({ collapsed, onToggle, mobileCloseIcon }) => {
  const navigate = useNavigate();
  const config = DashboardKit.getConfig();
  const brand = config.sidebar?.brand;
  const navbarTitle = config.navbar?.title;
  const navbarLogo = config.navbar?.logo;

  const logo = brand?.logo ?? navbarLogo;
  const title = brand?.title ?? navbarTitle;
  const showToggle = brand?.showToggle !== false;

  return (
    <div
      className={`flex items-center justify-between h-[var(--db-navbar-height)] border-b border-[var(--db-border)] flex-shrink-0 ${
        collapsed ? "px-2" : "pl-4 pr-3"
      }`}
    >
      <button
        type="button"
        className="flex items-center gap-2.5 flex-1 min-w-0 bg-transparent border-none cursor-pointer rounded-[var(--db-radius-sm)] px-1 py-1.5 text-[var(--db-text-primary)]"
        onClick={() => brand?.href && navigate(brand.href)}
        aria-label={title ?? "Brand"}
      >
        {logo && (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-[10px] bg-[var(--db-accent)] text-white font-bold flex-shrink-0 shadow-[0_6px_14px_-6px_var(--db-accent)]">
            {logo}
          </span>
        )}
        {!collapsed && title && (
          <span className="font-bold text-base tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
          </span>
        )}
      </button>
      {showToggle && (
        <button
          type="button"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-[var(--db-text-secondary)] cursor-pointer transition-colors hover:bg-[var(--db-sidebar-hover)] hover:text-[var(--db-text-primary)]"
          onClick={onToggle}
          aria-label={mobileCloseIcon ? "Close menu" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {mobileCloseIcon ? <CloseIcon /> : collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      )}
    </div>
  );
};

/* ── Section ──────────────────────────────────────────── */

interface SidebarSectionProps {
  section: SidebarSectionConfig;
  collapsed: boolean;
}

const SidebarSection: FC<SidebarSectionProps> = ({ section, collapsed }) => {
  const [open, setOpen] = useState(!section.defaultCollapsed);
  const isOpen = section.collapsible ? open : true;

  const showLabel = !collapsed && section.label;
  const showAction = !collapsed && section.action && isOpen;

  return (
    <div className="[&+&]:mt-[18px]">
      {showLabel && (
        section.collapsible ? (
          <button
            type="button"
            className="flex items-center justify-between w-full px-2.5 pt-1.5 pb-2 bg-transparent border-none text-left text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-[var(--db-text-muted)] cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={isOpen}
          >
            <span>{section.label}</span>
            <span
              className={`inline-flex text-[var(--db-text-muted)] transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <ChevronDownIcon />
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2 text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-[var(--db-text-muted)]">
            {section.label}
          </div>
        )
      )}
      {isOpen && (
        <div className="flex flex-col gap-0.5">
          {section.items.map((item, i) => (
            <SidebarItem
              key={item.path ?? `${section.id ?? "s"}-${i}`}
              item={item}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
      {showAction && (
        <button
          type="button"
          className="flex items-center gap-2.5 w-[calc(100%-8px)] mx-1 mt-2 px-3 py-2 bg-transparent border border-dashed border-[var(--db-border-strong)] rounded-[var(--db-radius-sm)] text-[var(--db-text-secondary)] cursor-pointer text-[0.83rem] transition-colors hover:bg-[var(--db-sidebar-hover)] hover:text-[var(--db-text-primary)] hover:border-[var(--db-accent)]"
          onClick={section.action!.onClick}
        >
          {section.action!.icon ?? <PlusIcon />}
          <span>{section.action!.label}</span>
        </button>
      )}
    </div>
  );
};

/* ── Sidebar Item ─────────────────────────────────────── */

interface SidebarItemProps {
  item: SidebarItemConfig;
  collapsed: boolean;
  depth?: number;
}

const SidebarItem: FC<SidebarItemProps> = ({ item, collapsed, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isActive } = useRouteInfo();
  const { closeDrawer, isMobile } = useDashboard();

  if (item.divider) {
    return <div className="h-px bg-[var(--db-border)] my-3 mx-1" />;
  }

  const hasChildren = !!item.children && item.children.length > 0;
  const active = item.path ? isActive(item.path) : false;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen((prev) => !prev);
      return;
    }
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
      if (isMobile) closeDrawer();
    }
  };

  const baseBtn =
    "relative flex items-center gap-3 w-full border-none cursor-pointer text-left text-[0.88rem] font-medium rounded-[var(--db-radius-sm)] transition-colors whitespace-nowrap overflow-hidden";

  const activeBtn = active
    ? "bg-[var(--db-sidebar-active-bg)] text-[var(--db-sidebar-active-text)] before:content-[''] before:absolute before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-[3px] before:bg-[var(--db-sidebar-active-bar)] before:left-0"
    : "bg-transparent text-[var(--db-sidebar-text)] hover:bg-[var(--db-sidebar-hover)] hover:text-[var(--db-text-primary)]";

  const padBtn = collapsed ? "justify-center py-2.5 px-0" : "py-2.5 px-3";

  return (
    <div className="w-full">
      <button
        type="button"
        className={`${baseBtn} ${activeBtn} ${padBtn}`}
        onClick={handleClick}
        title={collapsed ? item.label : undefined}
        style={!collapsed ? { paddingLeft: `${depth * 12 + 12}px` } : undefined}
        aria-label={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        {item.dotColor && (
          <span
            className="inline-block w-2 h-2 rounded-full mx-1.5 flex-shrink-0"
            style={{ background: item.dotColor }}
            aria-hidden="true"
          />
        )}
        {item.icon && !item.dotColor && (
          <span className="inline-flex items-center justify-center w-5 h-5 flex-shrink-0" aria-hidden="true">
            {item.icon}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="flex-1 overflow-hidden text-ellipsis">{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 min-w-[22px] text-center ${
                  active
                    ? "bg-[var(--db-accent)] text-white"
                    : "bg-[var(--db-surface-2)] text-[var(--db-text-secondary)]"
                }`}
                aria-label={`${item.badge} notifications`}
              >
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <span
                className={`inline-flex text-[var(--db-text-muted)] flex-shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <ChevronDownIcon />
              </span>
            )}
          </>
        )}
      </button>

      {hasChildren && isOpen && !collapsed && (
        <div className="mt-0.5 ml-[18px] pl-2 border-l border-[var(--db-border)]" role="group">
          {item.children!.map((child, i) => (
            <SidebarItem
              key={child.path ?? i}
              item={child}
              collapsed={false}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Footer (user chip) ──────────────────────────────── */

interface SidebarFooterProps {
  custom?: ReactNode;
  collapsed: boolean;
}

const SidebarFooter: FC<SidebarFooterProps> = ({ custom, collapsed }) => {
  const { user } = useDashboard();
  if (custom) {
    return <div className="border-t border-[var(--db-border)] p-3 flex-shrink-0">{custom}</div>;
  }
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="border-t border-[var(--db-border)] p-3 flex-shrink-0">
      <div
        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--db-radius-sm)] transition-colors hover:bg-[var(--db-sidebar-hover)] ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="w-[34px] h-[34px] rounded-full bg-[var(--db-accent)] text-white inline-flex items-center justify-center text-[0.8rem] font-bold flex-shrink-0 overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[0.85rem] font-semibold text-[var(--db-text-primary)] truncate">
              {user.name}
            </span>
            {(user.email ?? user.role) && (
              <span className="text-[0.72rem] text-[var(--db-text-muted)] truncate">
                {user.email ?? user.role}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Icons ────────────────────────────────────────────── */

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
