import type { RouteConfig } from "@dep/route";

const invitationRoutes: RouteConfig[] = [
  {
    path: "/invitations/accept",
    component: () => import("@pages/invitation/InvitationAcceptPage"),
    breadcrumb: "Undangan",
  },
];

export default invitationRoutes;
