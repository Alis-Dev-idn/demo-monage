export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "full" | { width: string; height?: string };
export type ModalPosition = "center" | "top" | "bottom" | "left" | "right";
export type CloseButtonStyle = "macos" | "windows" | "button";
export type ScrollBehavior = "body" | "outside";
export type AnimationType = "fade" | "slide" | "zoom" | "bounce";

export interface AnimationConfig {
  in?: AnimationType;
  out?: AnimationType;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  size?: ModalSize;
  position?: ModalPosition;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  preventClose?: boolean;
  closeButtonStyle?: CloseButtonStyle;
  closeButton?: React.ReactNode;
  scrollBehavior?: ScrollBehavior;
  animation?: AnimationConfig;
  children: React.ReactNode;
  id?: string;
}

export interface ModalConfig extends Omit<ModalProps, "isOpen" | "onClose" | "children"> {
  content: React.ReactNode;
  id?: string;
  onClose?: () => void;
}

export interface ModalInstance extends ModalConfig {
  id: string;
  isOpen: boolean;
}

export interface DownloadProgress {
  percent: number;
  loaded: number;
  total: number;
  speed: number;
  estimatedTime: number;
}
