import type {RouteKitConfig, RouteConfig} from "../types";

const DEFAULT_CONFIG: RouteKitConfig = {
  loginPath: "/login",
  unauthorizedPath: "/403",
  notFoundPath: "/404",
  suspenseFallback: null,
};

export class RouteKit {
  private static config: RouteKitConfig = { ...DEFAULT_CONFIG };
  private static routes: RouteConfig[] = [];

  static setup(config: RouteKitConfig, routes?: RouteConfig[]): void {
    this.config = { ...this.config, ...config };
    if (routes) this.routes = routes;
  }

  static setRoutes(routes: RouteConfig[]): void {
    this.routes = routes;
  }

  static getRoutes(): RouteConfig[] {
    return this.routes;
  }

  static getConfig(): RouteKitConfig {
    return this.config;
  }
}
