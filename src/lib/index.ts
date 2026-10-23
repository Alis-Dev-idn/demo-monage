/**
 * Single entry-point for the in-project `src/lib` collection.
 *
 * Two consumption styles are supported:
 *
 *   1. Namespaced (recommended — keeps auto-completion scoped):
 *      ```ts
 *      import { AxiosLib, NotifyLib, UI } from "@/lib";
 *      AxiosLib.AxiosKit.register(...);
 *      NotifyLib.notify.success("Hi");
 *      UI.Modal.modal.open(...);
 *      ```
 *
 *   2. Direct sub-path (existing usage continues to work):
 *      ```ts
 *      import { AxiosKit } from "@dep/axios";
 *      import { notify } from "@dep/notify";
 *      ```
 *
 * Add new modules here whenever they are introduced under `src/lib/`.
 */

// ── Cross-module utilities ───────────────────────────────────────────────────
export * as Shared from "./_shared";

// ── Core libs ────────────────────────────────────────────────────────────────
export * as AxiosLib from "./axios";
export * as NotifyLib from "./notify";
export * as RouteLib from "./route";

// ── UI primitives & feature components ───────────────────────────────────────
export * as UI from "./ui";

// ── Page-scale templates ─────────────────────────────────────────────────────
export * as Templates from "./templates";
