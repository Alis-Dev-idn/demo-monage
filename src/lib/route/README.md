# Route Kit (`@dep/route`)

Mesin pembentuk arsitektur navigasi berbasis `react-router-dom`. Mengintegrasikan **proteksi rute (auth & role guards)**, **lazy loading otomatis**, **breadcrumb**, dan **404 handling** secara deklaratif lewat objek konfigurasi.

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Struktur Folder](#struktur-folder)
3. [Quick Start](#quick-start)
4. [Setup `RouteKit`](#setup-routekit)
5. [`RouteConfig` — Anatomi Rute](#routeconfig--anatomi-rute)
6. [`createRoutes`](#createroutes)
7. [Guards: `AuthRoute` & `RoleRoute`](#guards-authroute--roleroute)
8. [Hook `useRouteInfo`](#hook-userouteinfo)
9. [Type Reference](#type-reference)
10. [Pola & Resep](#pola--resep)

---

## Fitur Utama
1. **Deklaratif** — Rute didefinisikan sebagai array objek; `roles`, `auth`, `layout`, `breadcrumb` tinggal isi properti.
2. **Auto lazy** — Fungsi `() => import('...')` otomatis dibungkus `React.lazy` + `Suspense`.
3. **Built-in guards** — `auth: true` → cek login; `roles: [...]` → cek peran. Redirect otomatis ke path yang dikonfigurasi.
4. **Breadcrumb** — Bisa string statis, fungsi dinamis, atau auto-generate dari path.
5. **Sidebar metadata** — `route.sidebar` dipakai oleh `DashboardLayout` untuk auto-generate menu (lihat `@dep/templates/dashboard`).

---

## Struktur Folder

```
src/lib/route/
├── index.ts                       # Public API
├── types/index.ts                 # Type publik (RouteConfig, dll)
├── core/
│   ├── RouteKit.ts                # Singleton config + route registry
│   └── createRoutes.tsx           # Renderer RouteConfig → <Route>
├── components/
│   └── Guards.tsx                 # <AuthRoute>, <RoleRoute>
└── hook/
    └── useRouteInfo.ts            # Hook: active route + breadcrumbs
```

---

## Quick Start

```tsx
// App.tsx
import { BrowserRouter, Routes } from "react-router-dom";
import { RouteKit, createRoutes } from "@dep/route";
import AuthRoute from "@routes/AuthRoute";
import DashboardRoute from "@routes/DashboardRoute";
import ErrorRoute from "@routes/ErrorRoute";

RouteKit.setup({
  authCheck: () => !!localStorage.getItem("token"),
  getRoles: () => JSON.parse(localStorage.getItem("user") || "{}").roles ?? [],
  loginPath: "/auth",
  unauthorizedPath: "/403",
  notFoundPath: "/404",
  suspenseFallback: <div className="p-10">Memuat…</div>,
});

const App = () => (
  <BrowserRouter>
    <Routes>
      {createRoutes(AuthRoute, DashboardRoute, ErrorRoute)}
    </Routes>
  </BrowserRouter>
);
```

```tsx
// src/routes/DashboardRoute.tsx
import type { RouteConfig } from "@dep/route";
import { DashboardLayout } from "@dep/templates/dashboard";

const DashboardRoute: RouteConfig[] = [
  {
    path: "/dashboard",
    component: DashboardLayout,
    auth: true,
    children: [
      {
        index: true,
        component: () => import("@pages/Home"),
        sidebar: { icon: "🏠", label: "Home", order: 1 },
      },
      {
        path: "users",
        component: () => import("@pages/Users"),
        roles: ["ADMIN"],
        sidebar: { icon: "👥", label: "Users", order: 2 },
      },
    ],
  },
];
```

---

## Setup `RouteKit`

```typescript
RouteKit.setup(config: RouteKitConfig, routes?: RouteConfig[]): void
RouteKit.setRoutes(routes: RouteConfig[]): void
RouteKit.getRoutes(): RouteConfig[]
RouteKit.getConfig(): RouteKitConfig
```

### `RouteKitConfig` lengkap

| Opsi | Tipe | Default | Keterangan |
|---|---|---|---|
| `authCheck` | `() => boolean \| Promise<boolean>` | — | Validator login. Dipakai oleh `<AuthRoute>`. |
| `authStore` | `() => unknown` | — | Alternatif: getter store (Redux/Zustand). |
| `authSelector` | `(state) => boolean` | — | Selector login dari store. |
| `getRoles` | `() => string[] \| Promise<string[]>` | — | Pembaca roles. Dipakai oleh `<RoleRoute>`. |
| `roleStore` | `() => unknown` | — | Alternatif: getter store untuk roles. |
| `roleSelector` | `(state) => string[]` | — | Selector roles dari store. |
| `loginPath` | `string` | `"/login"` | Redirect saat tidak login. |
| `unauthorizedPath` | `string` | `"/403"` | Redirect saat role tidak cocok. |
| `notFoundPath` | `string` | `"/404"` | Redirect untuk catch-all `*`. |
| `notFoundComponent` | `ComponentType` | — | Override redirect dengan render komponen. |
| `suspenseFallback` | `ReactNode` | `null` | Loading UI saat lazy-loaded. |

**Urutan resolusi auth:** jika `authStore + authSelector` keduanya ada → pakai store. Else if `authCheck` ada → pakai fungsi async. Else → anggap user authorized.

---

## `RouteConfig` — Anatomi Rute

```typescript
interface RouteConfig {
  path: string;                     // Path URL (relatif atau absolut)
  component: LazyComponent;         // Komponen / dynamic import
  lazy?: boolean;                   // Force lazy mode (auto-detected jika tidak diset)
  auth?: boolean;                   // Wajib login
  roles?: string[];                 // Wajib salah satu role di list (OR logic)
  breadcrumb?: string | ((params) => string | Promise<string>);
  children?: RouteConfig[];         // Nested routes
  index?: boolean;                  // Index route (default child)
  layout?: ComponentType<{ children: ReactNode }>; // Wrapper layout
  sidebar?: RouteSidebarMeta;       // Metadata untuk dashboard sidebar
}

interface RouteSidebarMeta {
  icon?: ReactNode;
  label?: string;                   // Default: breadcrumb atau path
  show?: boolean;                   // Default: true jika `sidebar` ada
  badge?: string | number;
  order?: number;                   // Lower = lebih atas
}
```

### Contoh berbagai pola

```tsx
// Public route — auto lazy
{
  path: "/login",
  component: () => import("@pages/Login"),
  breadcrumb: "Login",
}

// Protected + layout + nested
{
  path: "/admin",
  layout: AdminLayout,
  auth: true,
  children: [
    {
      index: true,                                  // /admin
      component: () => import("@pages/AdminHome"),
    },
    {
      path: "users/:id",                            // /admin/users/:id
      component: () => import("@pages/UserDetail"),
      breadcrumb: (params) => `User #${params.id}`, // dinamis
    },
    {
      path: "settings",                             // /admin/settings
      component: () => import("@pages/Settings"),
      roles: ["SUPERADMIN"],
    },
  ],
}
```

---

## `createRoutes`

```typescript
function createRoutes(...routeGroups: RouteConfig[][]): ReactNode
```

- Menerima 1+ grup route (variadic), lalu meng-flatten.
- Otomatis register ke `RouteKit.setRoutes` (dipakai `useRouteInfo`).
- Otomatis wrap dengan `<AuthRoute>` jika `auth: true`.
- Otomatis wrap dengan `<RoleRoute>` jika `roles` ada.
- Otomatis wrap dengan `<Suspense>` untuk lazy components.
- Otomatis tambahkan catch-all 404:
  - Jika `notFoundComponent` → render komponen di setiap group.
  - Else jika `notFoundPath` → `<Navigate to={notFoundPath} replace />`.

```tsx
<Routes>
  {createRoutes(AuthRoute, DashboardRoute, ErrorRoute)}
</Routes>
```

---

## Guards: `AuthRoute` & `RoleRoute`

Keduanya **otomatis dipasang** oleh `createRoutes` berdasarkan `route.auth` dan `route.roles`. Pemanggilan manual jarang diperlukan, tetapi tetap diekspor:

```tsx
import { AuthRoute, RoleRoute } from "@dep/route";

<AuthRoute fallback={<Spinner />}>
  <ProtectedView />
</AuthRoute>

<RoleRoute roles={["ADMIN", "STAFF"]}>
  <AdminPanel />
</RoleRoute>
```

### Perilaku

| Hasil cek | `<AuthRoute>` | `<RoleRoute>` |
|---|---|---|
| Loading (cek sedang berjalan) | Render `fallback` | Render `null` |
| OK | Render `children` | Render `children` |
| Gagal | `navigate(loginPath)` | `navigate(unauthorizedPath)` |
| Error/throw | `navigate(loginPath)` | `navigate(unauthorizedPath)` |

> `RoleRoute` memakai logika **OR** — user butuh salah satu role di list.

---

## Hook `useRouteInfo`

```typescript
const {
  activeRoute,    // RouteConfig | null
  breadcrumbs,    // BreadcrumbItem[]
  params,         // Record<string, string | undefined>
  pathname,
  search,
  hash,
  isActive,       // (path: string, exact?: boolean) => boolean
} = useRouteInfo();
```

### Render breadcrumbs

```tsx
const { breadcrumbs } = useRouteInfo();

return (
  <nav className="flex gap-2 text-sm">
    {breadcrumbs.map((b, i) => (
      <span key={i}>
        {b.isActive ? <strong>{b.label}</strong> : <Link to={b.path}>{b.label}</Link>}
        {i < breadcrumbs.length - 1 && <span> / </span>}
      </span>
    ))}
  </nav>
);
```

### Active link styling

```tsx
const { isActive } = useRouteInfo();

<NavLink className={isActive("/admin/users") ? "active" : ""}>Users</NavLink>
<NavLink className={isActive("/admin", true) ? "active" : ""}>Dashboard</NavLink>
```

### Breadcrumb dinamis

```tsx
// RouteConfig
{
  path: "/users/:id",
  component: UserDetail,
  breadcrumb: (params) => `User #${params.id}`,
}

// Async breadcrumb (eksperimental — menampilkan "Loading..." selama promise belum resolve)
{
  path: "/orders/:id",
  component: OrderDetail,
  breadcrumb: async (params) => {
    const order = await fetchOrderName(params.id);
    return order.name;
  },
}
```

---

## Type Reference

```typescript
type AuthCheckFn  = () => boolean | Promise<boolean>;
type GetRolesFn   = () => string[] | Promise<string[]>;
type LazyComponent = ComponentType | (() => Promise<{ default: ComponentType }>);

interface RouteKitConfig    { /* lihat tabel */ }
interface RouteSidebarMeta  { icon?, label?, show?, badge?, order? }
interface RouteConfig       { path, component, lazy?, auth?, roles?, breadcrumb?,
                              children?, index?, layout?, sidebar? }
interface BreadcrumbItem    { label: string; path: string; isActive: boolean }
```

---

## Pola & Resep

### Login → langsung dashboard

```typescript
// Setelah login sukses
localStorage.setItem("token", res.accessToken);
localStorage.setItem("user", JSON.stringify(res.user));
navigate("/dashboard");
```

`RouteKit.setup` membaca dari `localStorage` di setiap mount `<AuthRoute>`, jadi perubahan langsung terlihat.

### Logout & invalidasi

```typescript
localStorage.removeItem("token");
localStorage.removeItem("user");
navigate("/auth");
```

### Override redirect dengan custom 404 component

```typescript
RouteKit.setup({
  notFoundComponent: NotFoundPage,  // render alih-alih redirect
  // ...
});
```

Dengan ini, URL tidak berubah saat 404 — UX lebih baik untuk SEO.

### Lazy with manual `React.lazy`

Mode auto-lazy mendeteksi fungsi yang isinya `import()`. Anda juga bisa eksplisit:

```tsx
import { lazy } from "react";
const Heavy = lazy(() => import("@pages/Heavy"));

const routes: RouteConfig[] = [
  { path: "/heavy", component: Heavy, lazy: true }
];
```

### Multi-layout

```tsx
const routes: RouteConfig[] = [
  {
    path: "/marketing",
    layout: MarketingLayout,
    children: [
      { index: true, component: () => import("@pages/Landing") },
      { path: "pricing", component: () => import("@pages/Pricing") },
    ],
  },
  {
    path: "/app",
    layout: DashboardLayout,
    auth: true,
    children: [/* … */],
  },
];
```

---

*Lihat [src/lib/ISSUES.md](../ISSUES.md) untuk catatan perbaikan & saran peningkatan modul ini.*
