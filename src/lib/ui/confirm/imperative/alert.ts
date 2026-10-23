import type { AlertOptions, DialogInstance } from "../types";
import { confirmStore } from "../core/ConfirmStore";
import { uid } from "../../../_shared/uid";

/**
 * Show an alert dialog.
 * Resolves when the user clicks OK.
 */
export function alert(options: AlertOptions): Promise<void> {
  return new Promise<void>((resolve) => {
    const id = options.id || uid("alert");

    const instance: DialogInstance = {
      id,
      type: "alert",
      options,
      resolve: resolve as (value: unknown) => void,
      isOpen: true,
      createdAt: Date.now(),
    };

    confirmStore.addDialog(instance);
  });
}
