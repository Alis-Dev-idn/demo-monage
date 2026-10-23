/**
 * Lightweight factory for the "Kit" singleton pattern shared by NotifyKit,
 * ModalKit, ConfirmKit, RouteKit, DashboardKit, MapKit, AxiosKit.
 *
 * Each Kit exposes a `setup(partial)` and `getConfig()` API backed by a
 * single mutable config object. Use this helper to avoid duplicating the
 * boilerplate.
 *
 * @example
 * ```ts
 * const NOTIFY_DEFAULTS = { position: "top-right", duration: 3000 } as const;
 * export const NotifyKit = createKit(NOTIFY_DEFAULTS);
 * NotifyKit.setup({ duration: 5000 });
 * NotifyKit.getConfig().duration; // 5000
 * ```
 *
 * For nested objects, pass `deepMergeKeys` so those sub-objects are merged
 * instead of replaced:
 * ```ts
 * const KIT = createKit(defaults, { deepMergeKeys: ["animation", "backdrop"] });
 * ```
 */
export interface KitInstance<T> {
  setup(partial: Partial<T>): void;
  getConfig(): T;
  /** Reset to the original defaults (useful for tests). */
  reset(): void;
}

export interface CreateKitOptions<T> {
  /** Keys whose values are objects that should be shallow-merged on setup. */
  deepMergeKeys?: ReadonlyArray<keyof T>;
}

export function createKit<T extends object>(
  defaultConfig: T,
  options: CreateKitOptions<T> = {}
): KitInstance<T> {
  const initial = cloneShallow(defaultConfig);
  let config: T = cloneShallow(defaultConfig);
  const deepKeys = new Set<keyof T>(options.deepMergeKeys ?? []);

  return {
    setup(partial: Partial<T>): void {
      const next = { ...config, ...partial } as T;
      for (const key of deepKeys) {
        const base = config[key] as unknown;
        const incoming = partial[key] as unknown;
        if (
          base && typeof base === "object" && !Array.isArray(base) &&
          incoming && typeof incoming === "object" && !Array.isArray(incoming)
        ) {
          (next as Record<keyof T, unknown>)[key] = { ...(base as object), ...(incoming as object) };
        }
      }
      config = next;
    },
    getConfig(): T {
      return config;
    },
    reset(): void {
      config = cloneShallow(initial);
    },
  };
}

function cloneShallow<T extends object>(obj: T): T {
  return { ...obj };
}
