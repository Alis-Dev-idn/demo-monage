import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { confirmStore } from "../core/ConfirmStore";
import type {DialogInstance} from "../types";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { AlertDialog } from "../dialogs/AlertDialog";
import { PromptDialog } from "../dialogs/PromptDialog";
import "./confirm.css";

export const ConfirmContainer: React.FC = () => {
  const [dialogs, setDialogs] = useState<DialogInstance[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const unsubscribe = confirmStore.subscribe((newDialogs) => {
      setDialogs(newDialogs);
    });
    return unsubscribe;
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="confirm-container">
      {dialogs.map((dialog) => {
        if (dialog.type === "confirm") {
          return <ConfirmDialog key={dialog.id} instance={dialog} />;
        }
        if (dialog.type === "alert") {
          return <AlertDialog key={dialog.id} instance={dialog} />;
        }
        if (dialog.type === "prompt") {
          return <PromptDialog key={dialog.id} instance={dialog} />;
        }
        return null;
      })}
    </div>,
    document.body
  );
};
