import type { ConfirmOptions, DialogInstance } from "../types";
import { confirmStore } from "../core/ConfirmStore";
import { uid } from "../../../_shared/uid";

/**
 * Show a confirmation dialog.
 * Resolves to true if confirmed, false if cancelled.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const id = options.id || uid("confirm");

    const instance: DialogInstance = {
      id,
      type: "confirm",
      options,
      resolve: resolve as (value: unknown) => void,
      isOpen: true,
      createdAt: Date.now(),
    };

    confirmStore.addDialog(instance);
  });
}
