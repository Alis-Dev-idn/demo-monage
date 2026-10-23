import { useCallback, useMemo } from "react";
import type { ConfirmOptions, AlertOptions, PromptOptions } from "../types";
import { confirm as imperativeConfirm } from "../imperative/confirm";
import { alert as imperativeAlert } from "../imperative/alert";
import { prompt as imperativePrompt } from "../imperative/prompt";
import { ConfirmContainer } from "../components/ConfirmContainer";

export interface UseConfirmResult {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  ConfirmDialog: React.FC;
}

/**
 * Hook for using confirmation dialogs within a component.
 */
export function useConfirm(): UseConfirmResult {
  const confirm = useCallback((options: ConfirmOptions) => imperativeConfirm(options), []);
  const alert = useCallback((options: AlertOptions) => imperativeAlert(options), []);
  const prompt = useCallback((options: PromptOptions) => imperativePrompt(options), []);

  const ConfirmDialog = useMemo(() => () => <ConfirmContainer />, []);

  return {
    confirm,
    alert,
    prompt,
    ConfirmDialog,
  };
}
