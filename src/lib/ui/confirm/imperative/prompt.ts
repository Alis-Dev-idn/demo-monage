import type { PromptOptions, DialogInstance } from "../types";
import { confirmStore } from "../core/ConfirmStore";
import { uid } from "../../../_shared/uid";

/**
 * Show a prompt dialog.
 * Resolves to the input string if submitted, or null if cancelled.
 */
export function prompt(options: PromptOptions): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const id = options.id || uid("prompt");

    const instance: DialogInstance = {
      id,
      type: "prompt",
      options,
      resolve: resolve as (value: unknown) => void,
      isOpen: true,
      createdAt: Date.now(),
    };

    confirmStore.addDialog(instance);
  });
}
