import type {RouteConfig} from "@dep/route";


export const LandingRoute: RouteConfig[] = [
    {
        path: "/",
        component: () => import("@pages/landing/LandingPage"),
        breadcrumb: "Landing Page"
    }
]