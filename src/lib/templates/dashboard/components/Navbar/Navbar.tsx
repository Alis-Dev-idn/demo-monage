import { Fragment, useEffect, useRef, useState, type FC, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useRouteInfo } from "@dep/route";
import { useDashboard } from "../../hooks/useDashboard";
import { DashboardKit } from "../../core/DashboardKit";
import type { NotificationConfig } from "../../types";

/* ── Navbar Root ─────────────────────────────────────── */

interface NavbarProps {
  className?: string;
  children?: ReactNode;
}

export const Navbar: FC<NavbarProps> = ({ className = "", children }) => {
  const config = DashboardKit.getConfig();
  const navbarConfig = config.navbar;

  return (
    <header
      className={`flex items-center justify-between gap-4 h-[var(--db-navbar-height)] px-6 max-md:px-4 flex-shrink-0 z-[100] bg-[var(--db-navbar-bg)] backdrop-blur-[10px] border-b border-[var(--db-navbar-border)] ${
        navbarConfig?.sticky ? "sticky top-0" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {navbarConfig?.showToggle && <NavbarToggle />}
        {navbarConfig?.showBreadcrumb !== false ? (
          <NavbarBreadcrumb />
        ) : (
          <>
            {navbarConfig?.logo && <div>{navbarConfig.logo}</div>}
            {navbarConfig?.title && (
              <h1 className="text-base font-bold text-[var(--db-text-primary)] m-0 whitespace-nowrap">
                {navbarConfig.title}
              </h1>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {children ?? (
          <>
            <NavbarNotifications />
            <NavbarUser />
          </>
        )}
      </div>
    </header>
  );
};

/* ── Toggle ──────────────────────────────────────────── */

const NavbarToggle: FC = () => {
  const { toggleSidebar, isMobile, openDrawer } = useDashboard();
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--db-radius-sm)] border-none bg-transparent text-[var(--db-text-secondary)] cursor-pointer transition-colors hover:bg-[var(--db-sidebar-hover)] hover:text-[var(--db-text-primary)]"
      onClick={() => (isMobile ? openDrawer() : toggleSidebar())}
      aria-label="Toggle sidebar"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
};

/* ── Breadcrumb ──────────────────────────────────────── */

const NavbarBreadcrumb: FC = () => {
  const config = DashboardKit.getConfig();
  const navigate = useNavigate();
  const { breadcrumbs: routeCrumbs } = useRouteInfo();
  const crumbs = config.navbar?.breadcrumbProvider
    ? config.navbar.breadcrumbProvider()
    : routeCrumbs;

  if (!crumbs.length) {
    return config.navbar?.title ? (
      <h1 className="text-base font-bold text-[var(--db-text-primary)] m-0 whitespace-nowrap">
        {config.navbar.title}
      </h1>
    ) : null;
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 flex-wrap list-none m-0 p-0">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li
              key={c.path}
              className="inline-flex items-center gap-1.5 text-[0.85rem] text-[var(--db-text-secondary)] max-[480px]:not-[:last-child]:not-[:nth-last-child(2)]:hidden"
            >
              {isLast ? (
                <span className="text-[var(--db-text-primary)] font-semibold">{c.label}</span>
              ) : (
                <button
                  type="button"
                  className="bg-transparent border-none text-inherit cursor-pointer px-1.5 py-1 rounded-md transition-colors hover:text-[var(--db-text-primary)] hover:bg-[var(--db-sidebar-hover)]"
                  onClick={() => navigate(c.path)}
                >
                  {c.label}
                </button>
              )}
              {!isLast && <span className="text-[var(--db-text-muted)]" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/* ── Notifications ───────────────────────────────────── */

const NavbarNotifications: FC = () => {
  const config = DashboardKit.getConfig();
  const notifCfg = config.notifications;
  const { notifications, setNotifications, markNotificationRead, markAllRead, unreadCount } =
    useDashboard();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const hasSource = !!(notifCfg?.items || notifCfg?.provider);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!hasSource) return null;

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && notifCfg?.provider) {
      try {
        const items = await notifCfg.provider();
        setNotifications(items);
      } catch {
        setNotifications([]);
      }
    }
  };

  const handleItemClick = (n: NotificationConfig) => {
    if (!n.read) markNotificationRead(n.id);
    notifCfg?.onItemClick?.(n.id);
    n.onClick?.();
  };

  const handleMarkAll = () => {
    markAllRead();
    notifCfg?.onMarkAllRead?.();
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-[var(--db-radius-sm)] border border-[var(--db-border)] bg-[var(--db-surface)] text-[var(--db-text-secondary)] cursor-pointer transition-colors hover:text-[var(--db-text-primary)] hover:border-[var(--db-border-strong)]"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-[var(--db-danger)] text-white text-[0.65rem] font-bold rounded-full inline-flex items-center justify-center border-2 border-[var(--db-navbar-bg)]"
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          ref={popRef}
          role="menu"
          className="db-popover-in absolute right-0 max-md:right-2 top-[calc(100%+8px)] w-[min(360px,calc(100vw-32px))] bg-[var(--db-surface-elev)] border border-[var(--db-border)] rounded-[var(--db-radius)] shadow-[var(--db-shadow-pop)] z-[300] overflow-hidden"
        >
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-[var(--db-border)] text-[0.85rem] font-semibold">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="bg-transparent border-none text-[var(--db-accent)] text-[0.78rem] font-medium cursor-pointer hover:underline"
                onClick={handleMarkAll}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-3.5 py-8 text-center text-[var(--db-text-muted)] text-[0.85rem]">
                {notifCfg?.emptyLabel ?? "No notifications"}
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`flex items-start gap-2.5 w-full px-3.5 py-3 bg-transparent border-none border-b border-[var(--db-border)] last:border-b-0 cursor-pointer text-left transition-colors hover:bg-[var(--db-sidebar-hover)] ${
                    n.read ? "" : "bg-[var(--db-accent-soft)] hover:bg-[var(--db-accent-soft)]"
                  }`}
                  onClick={() => handleItemClick(n)}
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--db-surface-2)] text-[var(--db-text-secondary)] inline-flex items-center justify-center flex-shrink-0">
                    {n.icon ?? <BellDotIcon />}
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[0.85rem] font-semibold text-[var(--db-text-primary)]">{n.title}</span>
                    {n.description && (
                      <span className="text-[0.78rem] text-[var(--db-text-secondary)]">{n.description}</span>
                    )}
                    <span className="text-[0.7rem] text-[var(--db-text-muted)] mt-0.5">{n.time}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          {notifCfg?.onViewAll && (
            <div className="p-2 border-t border-[var(--db-border)] text-center">
              <button
                type="button"
                className="bg-transparent border-none text-[var(--db-accent)] font-semibold text-[0.85rem] cursor-pointer px-3 py-1.5 rounded-md hover:bg-[var(--db-accent-soft)]"
                onClick={() => {
                  setOpen(false);
                  notifCfg.onViewAll!();
                }}
              >
                View all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── User (profile menu) ─────────────────────────────── */

interface NavbarUserProps {
  className?: string;
  children?: ReactNode;
}

export const NavbarUser: FC<NavbarUserProps> = ({ className = "", children }) => {
  const { user } = useDashboard();
  const config = DashboardKit.getConfig();
  const profileMenu = config.profileMenu ?? [];
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 max-md:px-1 border border-[var(--db-border)] bg-[var(--db-surface)] rounded-full cursor-pointer transition-colors hover:border-[var(--db-border-strong)]"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.avatar ? (
          <img className="w-8 h-8 rounded-full object-cover flex-shrink-0" src={user.avatar} alt={user.name} />
        ) : (
          <div className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-[var(--db-accent)] text-white font-bold text-[0.8rem] flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex flex-col leading-tight max-md:hidden">
          <span className="text-[0.85rem] font-semibold text-[var(--db-text-primary)]">{user.name}</span>
          {user.role && <span className="text-[0.7rem] text-[var(--db-text-muted)]">{user.role}</span>}
        </div>
        {children}
      </button>
      {open && (profileMenu.length > 0 || user.email) && (
        <div
          ref={popRef}
          role="menu"
          className="db-popover-in absolute right-0 max-md:right-2 top-[calc(100%+8px)] w-[min(280px,calc(100vw-32px))] bg-[var(--db-surface-elev)] border border-[var(--db-border)] rounded-[var(--db-radius)] shadow-[var(--db-shadow-pop)] z-[300] overflow-hidden"
        >
          <div className="px-3.5 py-3.5 border-b border-[var(--db-border)]">
            <div className="font-semibold text-[var(--db-text-primary)]">{user.name}</div>
            {user.email && (
              <div className="text-[0.78rem] text-[var(--db-text-muted)] mt-0.5">{user.email}</div>
            )}
          </div>
          {profileMenu.length > 0 && (
            <div>
              {profileMenu.map((m, i) => (
                <Fragment key={i}>
                  {m.divider && <div className="h-px bg-[var(--db-border)] my-1" />}
                  <button
                    type="button"
                    className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-[0.85rem] text-left transition-colors ${
                      m.variant === "danger"
                        ? "text-[var(--db-danger)] hover:bg-[var(--db-danger-soft)]"
                        : "text-[var(--db-text-primary)] hover:bg-[var(--db-sidebar-hover)]"
                    }`}
                    onClick={() => {
                      setOpen(false);
                      m.onClick();
                    }}
                  >
                    {m.icon && <span className="inline-flex">{m.icon}</span>}
                    <span>{m.label}</span>
                  </button>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Icons ────────────────────────────────────────────── */

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const BellDotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
