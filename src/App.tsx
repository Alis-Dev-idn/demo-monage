import { useEffect } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { NotifyContainer, NotifyKit } from "@dep/notify";
import { ModalStack } from "@dep/ui/modal";
import { ConfirmContainer } from "@dep/ui/confirm";
import { RouteKit, createRoutes } from "@dep/route";
import { DashboardKit } from "@dep/templates/dashboard";
import AuthRoute from "@routes/AuthRoute.ts";
import ErrorRoute from "@routes/ErrorRoute.ts";
import { LandingRoute } from "@routes/LandingRoute.ts";
import { StorefrontRoute } from "@routes/StorefrontRoute.ts";
import DashboardRoute from "@routes/DashboardRoute.ts";
import OnboardingRoute from "@routes/OnboardingRoute.ts";
import InvitationRoute from "@routes/InvitationRoute.ts";
import VerifyEmailRoute from "@routes/VerifyEmailRoute.ts";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { LookupProvider } from "@/contexts/LookupContext";
import { BookProvider } from "@/contexts/BookContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { initSyncEngine } from "@/lib/offline/syncEngine";

NotifyKit.setup({
  position: "top-right",
  duration: 3000,
  dismissible: true,
  pauseOnHover: true,
  maxVisible: 3,
  stack: true,
  gap: 8,
  animation: { in: "fade", out: "fade", duration: 200 },
  interceptApiError: { enabled: false },
});

RouteKit.setup({
  // Access token disimpan di sessionStorage (lihat src/utils/api.ts).
  // Profil user di-cache di localStorage agar nama/avatar muncul cepat
  // saat reload (data sensitif tetap di-validasi server via /auth/me).
  authCheck: () => !!sessionStorage.getItem("monage:auth:accessToken"),
  getRoles: () => {
    try {
      const raw = localStorage.getItem("monage:auth:user");
      const user = raw ? JSON.parse(raw) : {};
      return user.roles ?? [];
    } catch {
      return [];
    }
  },
  loginPath: "/auth",
  unauthorizedPath: "/403",
  notFoundPath: "/404",
});

DashboardKit.setup({
  theme: "light",
  navbar: { title: "Monage", showBreadcrumb: true, showToggle: true, sticky: true },
  sidebar: {
    brand: {
      title: "Monage",
      href: "/dashboard/beranda",
      showToggle: false,
      logo: <img src="/logo.png" alt="Monage" className="h-7 w-7 object-contain" />,
    },
  },
  user: { name: "Pengguna", role: "User" },
  sidebarWidth: 260,
  sidebarCollapsedWidth: 68,
  mobileBreakpoint: 1024,
});

const App = () => {
  // Sync Engine offline (Batch O3): flush Outbox saat online/app aktif.
  useEffect(() => {
    initSyncEngine();
  }, []);

  return (
    <>
      <NotifyContainer />
      <ModalStack />
      <ConfirmContainer />
      <OfflineIndicator />
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <PreferencesProvider>
              <BookProvider>
                <SubscriptionProvider>
                  <LookupProvider>
                    <Routes>
                      {createRoutes(
                        DashboardRoute,
                        OnboardingRoute,
                        InvitationRoute,
                        VerifyEmailRoute,
                        LandingRoute,
                        StorefrontRoute,
                        AuthRoute,
                        ErrorRoute,
                      )}
                    </Routes>
                  </LookupProvider>
                </SubscriptionProvider>
              </BookProvider>
            </PreferencesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
};

export default App;
