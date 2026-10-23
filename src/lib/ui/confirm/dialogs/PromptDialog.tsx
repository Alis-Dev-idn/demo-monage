import React, { useState } from "react";
import type { DialogInstance, PromptOptions } from "../types";
import { DialogWrapper } from "../components/DialogWrapper";
import { ConfirmKit } from "../core/ConfirmKit";

const BTN_BASE =
  "px-4 py-2 rounded-md font-medium text-sm border-none cursor-pointer transition-opacity hover:opacity-90";
const BTN_CONFIRM =
  "bg-[var(--confirm-btn-confirm-bg)] text-[var(--confirm-btn-confirm-text)]";
const BTN_CANCEL =
  "bg-[var(--confirm-btn-cancel-bg)] text-[var(--confirm-btn-cancel-text)]";

export const PromptDialog: React.FC<{ instance: DialogInstance }> = ({ instance }) => {
  const options = instance.options as PromptOptions;
  const [value, setValue] = useState(options.defaultValue || "");
  const [error, setError] = useState<string | null>(null);
  const confirmKey = ConfirmKit.getConfig().keyboard.confirm ?? "Enter";

  const handleSubmit = (close: (val: unknown) => void) => {
    if (options.validation) {
      const result = options.validation.safeParse(value);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }
    close(value);
  };

  return (
    <DialogWrapper instance={instance}>
      {({ close, countdown }) => (
        <>
          <div className="p-6">
            {options.component ? (
              typeof options.component === "function"
                ? options.component({ close: (v) => close(v ?? null) })
                : options.component
            ) : (
              <>
                <h3 className="text-xl font-semibold m-0 mb-2">{options.title}</h3>
                {options.message && (
                  <p className="text-base m-0 text-[var(--confirm-text-muted)]">
                    {options.message}
                  </p>
                )}
                <input
                  type="text"
                  placeholder={options.placeholder}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === confirmKey) handleSubmit(close);
                  }}
                  className="w-full px-3 py-2.5 mt-4 rounded-md border border-[var(--confirm-border)] bg-[var(--confirm-bg)] text-[var(--confirm-text)] font-[inherit] outline-none focus:border-[var(--confirm-btn-confirm-bg)]"
                />
                {error && (
                  <div className="text-[var(--confirm-error)] text-sm mt-1">{error}</div>
                )}
              </>
            )}
            {countdown !== undefined && (
              <div className="text-xs opacity-60 mt-2">Auto-closing in {countdown}s</div>
            )}
          </div>
          {!options.component && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--confirm-border)]">
              <button className={`${BTN_BASE} ${BTN_CANCEL}`} onClick={() => close(null)}>
                {options.cancelLabel || "Cancel"}
              </button>
              <button
                className={`${BTN_BASE} ${BTN_CONFIRM}`}
                onClick={() => handleSubmit(close)}
              >
                {options.confirmLabel || "Submit"}
              </button>
            </div>
          )}
        </>
      )}
    </DialogWrapper>
  );
};
