import type { RouteConfig } from "@dep/route";

const onboardingRoutes: RouteConfig[] = [
  {
    path: "/onboarding",
    component: () => import("@pages/onboarding/OnboardingPage"),
    breadcrumb: "Onboarding",
    auth: true,
  },
];

export default onboardingRoutes;
