import React from "react";
import type { DialogInstance, ConfirmOptions } from "../types";
import { DialogWrapper } from "../components/DialogWrapper";

const BTN_BASE =
  "px-4 py-2 rounded-md font-medium text-sm border-none cursor-pointer transition-opacity hover:opacity-90";
const BTN_CONFIRM =
  "bg-[var(--confirm-btn-confirm-bg)] text-[var(--confirm-btn-confirm-text)]";
const BTN_CANCEL =
  "bg-[var(--confirm-btn-cancel-bg)] text-[var(--confirm-btn-cancel-text)]";

export const ConfirmDialog: React.FC<{ instance: DialogInstance }> = ({ instance }) => {
  const options = instance.options as ConfirmOptions;

  return (
    <DialogWrapper instance={instance}>
      {({ close, countdown }) => (
        <>
          <div className="p-6">
            {options.component ? (
              typeof options.component === "function"
                ? options.component({ close: (v) => close(v ?? false) })
                : options.component
            ) : (
              <>
                <h3 className="text-xl font-semibold m-0 mb-2">{options.title}</h3>
                {options.message && (
                  <p className="text-base m-0 text-[var(--confirm-text-muted)]">
                    {options.message}
                  </p>
                )}
              </>
            )}
            {countdown !== undefined && (
              <div className="text-xs opacity-60 mt-2">Auto-closing in {countdown}s</div>
            )}
          </div>
          {!options.component && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--confirm-border)]">
              <button className={`${BTN_BASE} ${BTN_CANCEL}`} onClick={() => close(false)}>
                {options.cancelLabel || "Cancel"}
              </button>
              <button className={`${BTN_BASE} ${BTN_CONFIRM}`} onClick={() => close(true)}>
                {options.confirmLabel || "Confirm"}
              </button>
            </div>
          )}
        </>
      )}
    </DialogWrapper>
  );
};
