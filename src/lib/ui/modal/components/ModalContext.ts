import { createContext, useContext } from "react";
import type { CloseButtonStyle } from "../types";

export interface ModalContextValue {
  close: () => void;
  closeButtonStyle?: CloseButtonStyle;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

export function useModalContext(): ModalContextValue | null {
  return useContext(ModalContext);
}
