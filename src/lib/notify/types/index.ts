import type {ReactNode} from "react";

export type NotifyPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type NotifyType = "success" | "error" | "warning" | "info" | "custom";

export interface NotifyAction {
  label: string;
  onClick: () => void;
}

export interface NotifyOptions {
  duration?: number;           // ms, 0 = persistent
  dismissible?: boolean;       // show close button
  action?: NotifyAction;       // optional action button
  position?: NotifyPosition;   // override global position
  animation?: {
    in?: "fade" | "slide" | "zoom" | "bounce";
    out?: "fade" | "slide" | "zoom" | "bounce";
    duration?: number;
  };
}

export interface NotifyItem {
  id: string;
  type: NotifyType;
  message: string | ReactNode;
  options: Required<NotifyOptions>;
  createdAt: number;
  paused: boolean;
  remaining: number;
}

export interface ApiError {
  message: string;
  status: number;
  code: string;
  data: unknown;
}

export interface NotifyKitConfig {
  position?: NotifyPosition;
  duration?: number;
  dismissible?: boolean;
  pauseOnHover?: boolean;
  maxVisible?: number;
  stack?: boolean;
  gap?: number;
  animation?: {
    in?: "fade" | "slide" | "zoom" | "bounce";
    out?: "fade" | "slide" | "zoom" | "bounce";
    duration?: number;
  };
  interceptApiError?: {
    enabled: boolean;
    messageOverride?: (error: ApiError) => string;
  };
}
