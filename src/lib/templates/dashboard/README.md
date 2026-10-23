# Dashboard Template (`@dep/templates/dashboard`)

Layout dashboard *ready-to-use* yang terintegrasi penuh dengan `@dep/route`. Cukup definisikan metadata rute satu kali — **sidebar (brand + sections + user footer), navbar (breadcrumb + notifications + profile menu), bottom-nav mobile, guards, dan responsive switching** otomatis terbentuk.

Versi baru: struktur **modern shell** ala app dashboard SaaS modern (sidebar kiri penuh-tinggi dengan brand di atas, navbar tipis di kanan, profile chip di sidebar footer, popover notifikasi & profil di navbar).

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Arsitektur](#arsitektur)
3. [Quick Start](#quick-start)
4. [Setup `DashboardKit`](#setup-dashboardkit)
5. [Sidebar: Brand + Sections + Items](#sidebar-brand--sections--items)
6. [Navbar: Breadcrumb + Notifications + Profile](#navbar-breadcrumb--notifications--profile)
7. [Bottom Nav (Mobile)](#bottom-nav-mobile)
8. [Hook `useDashboard`](#hook-usedashboard)
9. [`createSidebarFromRoutes`](#createsidebarfromroutes)
10. [Responsive Behavior](#responsive-behavior)
11. [Type Reference](#type-reference)
12. [Theming via CSS Variables](#theming-via-css-variables)

---

## Fitur Utama

1. **Sidebar dengan brand & sections** — header brand (logo + judul + toggle), sections berlabel (collapsible) dengan action button (mis. "+ New Group"), profile chip di footer.
2. **Navbar modern** — breadcrumb otomatis dari `RouteKit`, tombol notifikasi dengan badge unread + dropdown, profile chip dengan dropdown menu (Profile / Security / Sign out variant `danger`).
3. **Auto sidebar dari routes** — Tambahkan `sidebar` metadata di `RouteConfig`, item muncul otomatis dan ter-filter berdasarkan role.
4. **Semua konten dari config** — tidak ada hardcoded label/data; hanya **variant styling** yang fixed (mis. badge warna, dot color per item, danger style untuk Sign out).
5. **Fully responsive** — Desktop: sidebar + navbar + content. Mobile: drawer + bottom-nav, breadcrumb dipersingkat, popover full-width.
6. **Dark / light theme** via `data-dashboard-theme`. Default tokens cocok untuk dashboard berlatar gelap (lihat screenshot di issue).

---

## Arsitektur

```
                ┌─────────── dashboard-root (flex row) ──────────┐
                │                                                 │
  ┌─────────────┴────────────┐    ┌──────────────────────────────┴───┐
  │      Sidebar             │    │   DashboardBody (flex column)    │
  │  ┌────────────────────┐  │    │ ┌──────────────────────────────┐ │
  │  │ Brand (logo+title) │  │    │ │ Navbar                       │ │
  │  ├────────────────────┤  │    │ │  ├ toggle (mobile)            │ │
  │  │ Section: items     │  │    │ │  ├ breadcrumb (RouteKit)      │ │
  │  │   item             │  │    │ │  └ notifications + profile    │ │
  │  │   item             │  │    │ ├──────────────────────────────┤ │
  │  ├────────────────────┤  │    │ │ Content (<Outlet/>)          │ │
  │  │ Section: My Groups │  │    │ ├──────────────────────────────┤ │
  │  │   item • badge     │  │    │ │ BottomNav (mobile only)      │ │
  │  │   + New Group      │  │    │ └──────────────────────────────┘ │
  │  ├────────────────────┤  │    └──────────────────────────────────┘
  │  │ Footer: user chip  │  │
  │  └────────────────────┘  │
  └──────────────────────────┘
```

> Catatan: hanya **`DashboardLayout`** yang biasa Anda render. Komponen di dalamnya otomatis dirakit dari config + RouteKit.

---

## Quick Start

```tsx
// App.tsx
import { RouteKit, createRoutes } from "@dep/route";
import { DashboardKit } from "@dep/templates/dashboard";

RouteKit.setup({
  authCheck: () => !!localStorage.getItem("token"),
  getRoles: () => JSON.parse(localStorage.getItem("user") || "{}").roles ?? [],
  loginPath: "/auth",
});

DashboardKit.setup({
  theme: "dark",
  // Sidebar: brand + structured sections
  sidebar: {
    brand: { title: "SiMonit", logo: <Logo />, href: "/dashboard", showToggle: true },
    sections: [
      {
        items: [
          { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
          { label: "Devices",   icon: <DevicesIcon />,   path: "/dashboard/devices" },
          { label: "Groups",    icon: <GroupsIcon />,    path: "/dashboard/groups" },
          { label: "Team",      icon: <TeamIcon />,      path: "/dashboard/team" },
        ],
      },
      {
        id: "groups",
        label: "My Groups",
        collapsible: true,
        items: groups.map((g) => ({
          label:   g.name,
          dotColor: g.color,      // titik warna sebelum label
          badge:   g.count,
          path:    `/dashboard/groups/${g.id}`,
        })),
        action: { label: "New Group", onClick: () => openCreateGroup() },
      },
    ],
  },
  // Navbar + profile + notifications
  navbar: { showBreadcrumb: true, showToggle: true, sticky: true },
  user: {
    name: "Budi Santoso",
    email: "budi@example.com",
    avatar: "/avatar.jpg",
    role: "Admin",
  },
  profileMenu: [
    { label: "Profile",  icon: <UserIcon />,   onClick: () => navigate("/profile") },
    { label: "Security", icon: <ShieldIcon />, onClick: () => navigate("/security") },
    { divider: true, label: "Sign out", icon: <LogoutIcon />, variant: "danger", onClick: signOut },
  ],
  notifications: {
    provider: async () => api.get("/notifications").then((r) => r.data),
    onItemClick: (id) => api.post(`/notifications/${id}/read`),
    onMarkAllRead: () => api.post("/notifications/read-all"),
    onViewAll: () => navigate("/notifications"),
  },
});
```

```tsx
// src/routes/DashboardRoute.ts
import type { RouteConfig } from "@dep/route";
import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@dep/templates/dashboard";

const DashboardRoute: RouteConfig[] = [{
  path: "/dashboard",
  layout: DashboardLayout,
  component: Outlet,
  auth: true,
  children: [
    {
      index: true,
      component: () => import("@pages/dashboard/DashboardPage"),
      breadcrumb: "Dashboard",
    },
    {
      path: "devices",
      component: () => import("@pages/dashboard/DevicesPage"),
      breadcrumb: "Devices",
      sidebar: { icon: <DevicesIcon />, order: 2 },  // optional auto-injection
    },
  ],
}];
```

### Realtime Case
Untuk notifikasi realtime (WebSocket / SSE), panggil `setNotifications` di dalam listener:

```tsx
// src/features/notifications/NotificationsRealtime.tsx
import { useEffect } from "react";
import { useDashboard, type NotificationConfig } from "@dep/templates/dashboard";

type WsEvent =
  | { type: "notification.new";       payload: NotificationConfig }
  | { type: "notification.read";      payload: { id: string } }
  | { type: "notification.read_all" }
  | { type: "notification.removed";   payload: { id: string } }
  | { type: "notification.bulk";      payload: NotificationConfig[] };

export function NotificationsRealtime() {
  const {
    setNotifications,
    addNotification,
    markNotificationRead,
    markAllRead,
    removeNotification,
  } = useDashboard();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry = 0;
    let aborted = false;
    let retryTimer: number | undefined;

    const connect = () => {
      ws = new WebSocket(import.meta.env.VITE_WS_URL + "/notifications");

      ws.onopen = () => {
        retry = 0;
        // Optional: kirim auth/last-seen agar server kirim history
        ws?.send(JSON.stringify({ type: "subscribe", since: Date.now() }));
      };

      ws.onmessage = (e) => {
        let msg: WsEvent;
        try { msg = JSON.parse(e.data); } catch { return; }
        switch (msg.type) {
          case "notification.new":      addNotification(msg.payload); break;
          case "notification.read":     markNotificationRead(msg.payload.id); break;
          case "notification.read_all": markAllRead(); break;
          case "notification.removed":  removeNotification(msg.payload.id); break;
          case "notification.bulk":     setNotifications(msg.payload); break;
        }
      };

      // Auto-reconnect dengan exponential backoff (max 30s)
      ws.onclose = () => {
        if (aborted) return;
        const delay = Math.min(1000 * 2 ** retry++, 30000);
        retryTimer = window.setTimeout(connect, delay);
      };
      ws.onerror = () => ws?.close();
    };

    connect();

    return () => {
      aborted = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [setNotifications, addNotification, markNotificationRead, markAllRead, removeNotification]);

  return null; // headless
}
```

### Setup Realtime
```tsx
// src/routes/DashboardRoute.ts → child component, mis. DashboardShell
import { Outlet } from "react-router-dom";
import { NotificationsRealtime } from "@/features/notifications/NotificationsRealtime";

export default function DashboardShell() {
  return (
    <>
      <NotificationsRealtime />
      <Outlet />
    </>
  );
}
```

> **Penting:** gunakan `layout: DashboardLayout` + `component: Outlet` agar child route ditampilkan di dalam layout. Jangan pakai `component: DashboardLayout` (DashboardLayout butuh `children` prop).

---

## Setup `DashboardKit`

```typescript
DashboardKit.setup(config: DashboardSetupConfig): void
DashboardKit.getConfig(): DashboardSetupConfig
DashboardKit.updateUser(user?: UserConfig): void
DashboardKit.updateNotifications(notif?: NotificationsConfig): void
```

### `DashboardSetupConfig`

| Opsi | Tipe | Default | Keterangan |
|---|---|---|---|
| `theme` | `"light" \| "dark" \| "auto"` | `"light"` | Set `data-dashboard-theme` di root. |
| `sidebar` | `SidebarConfig` | — | Brand + sections + footer (lihat di bawah). |
| `sidebarItems` *(legacy)* | `SidebarItemConfig[]` | `[]` | Item flat — digabung ke section default bersama item auto. |
| `bottomNavItems` | `BottomNavItemConfig[]` | auto | Default: 5 item pertama dari sidebar yang punya `path` + `icon`. |
| `navbar` | `NavbarConfig` | — | Breadcrumb / toggle / sticky. |
| `user` | `UserConfig` | — | Render di profile chip + sidebar footer. |
| `profileMenu` | `ProfileMenuItemConfig[]` | — | Dropdown profile. `variant: "danger"` untuk Sign out merah. |
| `notifications` | `NotificationsConfig` | — | Static `items` ATAU dynamic `provider`. |
| `sidebarWidth` | `number` (px) | `260` | Lebar full. |
| `sidebarCollapsedWidth` | `number` (px) | `72` | Lebar collapsed. |
| `mobileBreakpoint` | `number` (px) | `768` | Threshold mobile/desktop. |

---

## Sidebar: Brand + Sections + Items

### `SidebarConfig`

```typescript
interface SidebarConfig {
  brand?: {
    logo?: ReactNode;
    title?: string;
    href?: string;          // navigate on click
    showToggle?: boolean;   // collapse button (default: true)
  };
  sections?: SidebarSectionConfig[];
  footer?: ReactNode;       // override user-chip footer
}
```

### `SidebarSectionConfig`

```typescript
interface SidebarSectionConfig {
  id?: string;
  label?: string;             // uppercase section header
  collapsible?: boolean;      // klik label → collapse/expand items
  defaultCollapsed?: boolean;
  items: SidebarItemConfig[];
  action?: {                  // tombol "+ Action" di bawah items
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}
```

### `SidebarItemConfig` (yang baru)

```typescript
interface SidebarItemConfig {
  label: string;
  icon?: ReactNode;
  path?: string;
  onClick?: () => void;
  roles?: string[];
  badge?: string | number;
  dotColor?: string;          // 🆕 titik warna sebelum label (mis. category)
  children?: SidebarItemConfig[];
  divider?: boolean;
}
```

`dotColor` dipakai untuk daftar kategori (group dengan warna identitas). Bila `dotColor` di-set, `icon` di-skip.

### Auto-sidebar dari routes

`DashboardLayout` otomatis memanggil `createSidebarFromRoutes(RouteKit.getRoutes(), userRoles)` dan menggabungkan hasilnya dengan section unlabeled pertama (atau membuatnya bila belum ada). Sehingga Anda bisa kombinasikan:

- Manual structured sections (mis. "My Groups" dengan badge & action), DAN
- Auto items dari `RouteConfig.sidebar` metadata.

---

## Navbar: Breadcrumb + Notifications + Profile

`<Navbar />` (otomatis dirender oleh `DashboardLayout`) terdiri dari:

1. **Toggle** — hamburger (collapse di desktop, drawer di mobile). Disetel via `navbar.showToggle`.
2. **Breadcrumb** — dibangun otomatis dari `useRouteInfo()`. Bisa di-override:
   ```ts
   navbar: { breadcrumbProvider: () => [{ label: "Home", path: "/", isActive: false }, ...] }
   ```
3. **Notifications** — tombol lonceng dengan badge `unreadCount`. Klik untuk dropdown popover.
4. **Profile chip** — avatar + name + role. Klik untuk dropdown dengan `user.email` di header dan `profileMenu` di bawah.

### `NotificationsConfig`

```typescript
interface NotificationsConfig {
  items?: NotificationConfig[];                    // static
  provider?: () => NotificationConfig[] | Promise<NotificationConfig[]>; // dynamic, dipanggil saat dropdown dibuka
  onItemClick?: (id: string) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  emptyLabel?: string;                             // default: "No notifications"
}

interface NotificationConfig {
  id: string;
  title: string;
  description?: string;
  time: string;
  read: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}
```

Tanpa `items` maupun `provider`, lonceng **tidak dirender** sama sekali.

### `ProfileMenuItemConfig`

```typescript
interface ProfileMenuItemConfig {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "danger";  // danger → teks merah + hover merah
  onClick: () => void;
  divider?: boolean;               // garis pemisah di atas item ini
}
```

---

## Bottom Nav (Mobile)

Otomatis ditampilkan di `< mobileBreakpoint`. Default isinya 5 item pertama dari sidebar yang punya `path` + `icon`. Override penuh via `bottomNavItems`:

```ts
bottomNavItems: [
  { label: "Home",    icon: <HomeIcon />,    path: "/dashboard" },
  { label: "Devices", icon: <DevicesIcon />, path: "/dashboard/devices" },
]
```

Item active mendapat garis top accent + warna brand.

---

## Hook `useDashboard`

```typescript
const {
  sidebarState,        // "full" | "collapsed" | "hidden"
  setSidebarState,
  toggleSidebar,
  isMobile,
  isDrawerOpen,
  openDrawer,
  closeDrawer,
  user,
  setUser,
  notifications,       // NotificationConfig[]
  setNotifications,
  unreadCount,         // jumlah item dengan read === false
} = useDashboard();
```

Wajib dipakai di dalam `<DashboardLayout>` / `<Dashboard>`. Pakai `setNotifications` untuk push notifikasi realtime (WebSocket / SSE).

### Resep: sinkronisasi user setelah login

```tsx
function ProfileSync() {
  const { setUser } = useDashboard();
  useEffect(() => {
    api.get("/users/me").then((u) => {
      setUser({ name: u.name, email: u.email, role: u.role, avatar: u.avatarUrl });
    });
  }, [setUser]);
  return null;
}
```

---

## `createSidebarFromRoutes`

```typescript
function createSidebarFromRoutes(
  routes: RouteConfig[],
  userRoles?: string[],
  parentPath?: string,
): SidebarItemConfig[]
```

- Hanya route dengan `sidebar` metadata yang ikut.
- Recursive untuk `children`.
- Filter berdasarkan `route.roles` ↔ `userRoles`.
- Sort by `sidebar.order` (asc).
- Resolusi label: `sidebar.label` → `breadcrumb` (string) → segment path di-Title Case.

---

## Responsive Behavior

| | `< mobileBreakpoint` | `>= mobileBreakpoint` |
|---|---|---|
| Sidebar | Drawer overlay (slide-in) + backdrop | Full panel (toggle full ↔ collapsed) |
| Sidebar trigger | Hamburger → `openDrawer()` | Hamburger → `toggleSidebar()` |
| Breadcrumb | Hanya 2 segment terakhir (≤ 480px) | Lengkap |
| Profile chip name/role | Tersembunyi (hanya avatar) | Tampil |
| Bottom nav | Aktif | Hidden |
| Popover | Lebar pinggir layar - 32px | 360px (notif) / 280px (profile) |
| Content padding | 16px (bottom 80px untuk bottom-nav) | 24px |

Data attribute di root:
- `data-dashboard-theme="light | dark"`
- `data-sidebar-state="full | collapsed | hidden"`
- `data-mobile="true | false"`

---

## Type Reference

Lihat [`types/index.ts`](./types/index.ts) untuk daftar lengkap:

- `SidebarState`, `ThemeType`
- `SidebarItemConfig`, `SidebarSectionConfig`, `SidebarSectionActionConfig`, `SidebarBrandConfig`, `SidebarConfig`
- `NavbarConfig`
- `NotificationConfig`, `NotificationsConfig`
- `ProfileMenuItemConfig`, `UserConfig`
- `BottomNavItemConfig`
- `DashboardSetupConfig`

---

## Theming via CSS Variables

Override di `:root` atau di `[data-dashboard-theme="..."]`. Token utama:

```css
:root {
  /* Surfaces */
  --db-bg:            #f5f7fb;
  --db-surface:       #ffffff;
  --db-surface-2:     #f1f5f9;
  --db-surface-elev:  #ffffff;
  --db-border:        #e5e9f0;
  --db-border-strong: #d4dae3;

  /* Text */
  --db-text-primary:   #0f172a;
  --db-text-secondary: #64748b;
  --db-text-muted:     #94a3b8;

  /* Sidebar */
  --db-sidebar-bg:          #ffffff;
  --db-sidebar-text:        #475569;
  --db-sidebar-hover:       rgba(15, 23, 42, 0.05);
  --db-sidebar-active-bg:   rgba(59, 130, 246, 0.12);
  --db-sidebar-active-text: #1d4ed8;
  --db-sidebar-active-bar:  #3b82f6;

  /* Navbar */
  --db-navbar-bg:     rgba(255, 255, 255, 0.85);
  --db-navbar-border: #e5e9f0;

  /* Brand / state colors */
  --db-accent:      #3b82f6;
  --db-accent-soft: rgba(59, 130, 246, 0.12);
  --db-danger:      #ef4444;
  --db-danger-soft: rgba(239, 68, 68, 0.12);

  /* Sizing */
  --db-navbar-height: 64px;
  --db-radius-sm: 8px;
  --db-radius:    12px;
  --db-radius-lg: 16px;
  --db-transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  --db-sidebar-width-full: 260px;
  --db-sidebar-width-collapsed: 72px;
}

[data-dashboard-theme="dark"] {
  --db-bg:            #0b1220;
  --db-surface:       #111a2e;
  --db-surface-elev:  #15203a;
  --db-sidebar-bg:    #0d1424;
  --db-accent:        #38bdf8;
  /* ... selengkapnya di dashboard.css */
}
```

---

*Lihat [src/lib/ISSUES.md](../../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
