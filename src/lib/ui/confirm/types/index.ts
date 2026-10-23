import type { ReactNode } from "react";
import type { ZodString } from "zod";

export type AnimationType = "fade" | "slide" | "zoom" | "bounce";
export type StackBehavior = "layer" | "replace";
export type ThemeType = "light" | "dark" | "auto";

export interface AnimationConfig {
  in?: AnimationType;      // default: "fade"
  out?: AnimationType;     // default: "fade"
  duration?: number;       // ms, default: 200
}

export interface BackdropConfig {
  enabled?: boolean;       // default: true
  blur?: boolean;          // default: false
  dismissible?: boolean;   // click backdrop = cancel, default: true
}

export interface KeyboardConfig {
  confirm?: string;        // default: "Enter"
  cancel?: string;         // default: "Escape"
  trapFocus?: boolean;     // default: true
}

export interface TimeoutConfig {
  duration: number;        // ms
  action: "confirm" | "cancel";
  showCountdown?: boolean; // default: true
}

export interface DialogRenderArgs {
  /** Closes the dialog and resolves with the given value (defaults to false / null) */
  close: (value?: unknown) => void;
}

export interface BaseDialogOptions {
  id?: string;
  animation?: AnimationConfig;
  backdrop?: BackdropConfig;
  timeout?: TimeoutConfig;
  /**
   * Override the default dialog UI entirely. Can be:
   * - a ReactNode (no close access), or
   * - a function `(args) => ReactNode` that receives a `close` callback.
   */
  component?: ReactNode | ((args: DialogRenderArgs) => ReactNode);
  preventClose?: boolean;
}

export interface ConfirmOptions extends BaseDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;    // default: "Confirm"
  cancelLabel?: string;     // default: "Cancel"
}

export interface AlertOptions extends BaseDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;    // default: "OK"
}

export interface PromptOptions extends BaseDialogOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;    // default: "Submit"
  cancelLabel?: string;     // default: "Cancel"
  validation?: ZodString;  // Zod schema for input validation
}

export type DialogType = "confirm" | "alert" | "prompt";

export interface DialogInstance {
  id: string;
  type: DialogType;
  options: ConfirmOptions | AlertOptions | PromptOptions;
  resolve: (value: unknown) => void;
  isOpen: boolean;
  createdAt: number;
}
