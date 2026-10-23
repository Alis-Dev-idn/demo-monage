import type {RouteConfig} from "@dep/route";


const ErrorPage: RouteConfig[] = [
    {
        path: "/403",
        component: () => import("@pages/error/Error403"),
        breadcrumb: "404 Not Found"
    },
    {
        path: "/404",
        component: () => import("@pages/error/Error404"),
        breadcrumb: "404 Not Found"
    },
]

export default ErrorPage;