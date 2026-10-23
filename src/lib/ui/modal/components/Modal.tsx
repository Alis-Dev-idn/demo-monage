import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ModalProps } from "../types";
import { ModalKit, DEFAULT_MODAL_SIZE_PRESETS } from "../core/ModalKit";
import { modalStack } from "../core/ModalStack";
import { ModalContext } from "./ModalContext";
import { uid } from "../../../_shared/uid";
import "./modal.css";

const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = (props) => {
  const config = ModalKit.getConfig();
  const sizePresets = config.sizePresets ?? DEFAULT_MODAL_SIZE_PRESETS;
  const {
    isOpen,
    onClose,
    children,
    size = "md",
    position = "center",
    closeOnBackdrop = true,
    closeOnEscape = true,
    preventClose = false,
    closeButtonStyle = config.closeButtonStyle,
    scrollBehavior = "body",
    id: providedId,
  } = props;

  const [id] = useState(() => providedId || uid("modal"));
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const duration = props.animation?.duration || config.animation.duration;
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      modalStack.push(id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnimating(true);
      if (props.onOpen) props.onOpen();
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        modalStack.pop(id);
      }, duration);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, id, duration, props.onOpen]);

  const handleClose = useCallback(() => {
    if (!preventClose) onClose();
  }, [preventClose, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && closeOnEscape && modalStack.isTop(id)) {
        handleClose();
        return;
      }
      if (e.key === "Tab" && isOpen && modalStack.isTop(id) && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey && activeEl === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, id, handleClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const raf = requestAnimationFrame(() => {
        const first = contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        first?.focus();
      });
      return () => cancelAnimationFrame(raf);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  if (!mounted || (!isOpen && !isAnimating)) return null;

  const zIndex = modalStack.getZIndex(id);
  const backdropConfig = config.backdrop;
  const opacity =
    (backdropConfig.baseOpacity ?? 0.5) +
    (modalStack.getCount() - 1) * (backdropConfig.opacityIncrement ?? 0.1);

  const width = typeof size === "string" ? sizePresets[size] : size.width;
  const height = typeof size === "object" ? size.height : undefined;

  const scrollOutside = scrollBehavior === "outside";

  // Overlay positioning: center vs bottom (mobile sheet)
  const overlayPosClass =
    position === "bottom"
      ? "items-end max-md:items-end"
      : "items-center";

  const overlayScrollClass = scrollOutside ? "overflow-y-auto items-start py-6" : "";

  // Content visual:
  //  - Sheet mode (position=bottom or mobile-bottom): rounded top, slides up
  //  - Default: rounded all, zoom in
  const isSheet = position === "bottom";
  const contentBase =
    "relative flex flex-col overflow-hidden bg-[var(--mdl-bg)] shadow-[var(--mdl-shadow)] max-w-full transition-all";

  const contentShape = isSheet
    ? "w-screen rounded-t-[var(--mdl-radius-sheet)] rounded-b-none"
    : "rounded-[var(--mdl-radius)]";

  const contentScroll = scrollOutside ? "max-h-none" : "max-h-[90vh]";

  // Animation states
  const overlayAnim = isOpen ? "opacity-100" : "opacity-0";
  const contentAnim = isSheet
    ? isOpen
      ? "translate-y-0 opacity-100"
      : "translate-y-full opacity-0"
    : isOpen
      ? "scale-100 opacity-100"
      : "scale-95 opacity-0";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 flex justify-center z-[1000] transition-opacity ease-out ${overlayPosClass} ${overlayScrollClass} ${overlayAnim}`}
      style={{ zIndex, transitionDuration: `${duration}ms` }}
      data-close-style={closeButtonStyle}
    >
      {backdropConfig.enabled && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: isOpen ? opacity : 0, transitionDuration: `${duration}ms` }}
          onClick={() => closeOnBackdrop && handleClose()}
        />
      )}
      <div
        ref={contentRef}
        className={`${contentBase} ${contentShape} ${contentScroll} ${contentAnim}`}
        style={{ width, height, transitionDuration: `${duration}ms` }}
      >
        <ModalContext.Provider value={{ close: handleClose, closeButtonStyle }}>
          {children}
        </ModalContext.Provider>
      </div>
    </div>,
    document.body
  );
};
