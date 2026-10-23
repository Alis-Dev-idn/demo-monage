import React, { useEffect, useRef, useState, useCallback } from "react";
import { ConfirmKit } from "../core/ConfirmKit";
import type { DialogInstance } from "../types";
import { confirmStore } from "../core/ConfirmStore";

interface DialogWrapperProps {
  instance: DialogInstance;
  children: (props: {
    close: (value: unknown) => void;
    countdown?: number;
  }) => React.ReactNode;
}

type AnimName = "fade" | "zoom" | "slide" | "bounce";

/** Tailwind transform classes for each animation: [enter-rest, enter-from]. */
const ANIM_CLASSES: Record<AnimName, { active: string; idle: string; extra?: string }> = {
  fade:   { active: "opacity-100",                    idle: "opacity-0" },
  zoom:   { active: "opacity-100 scale-100",          idle: "opacity-0 scale-90" },
  slide:  { active: "opacity-100 translate-y-0",      idle: "opacity-0 translate-y-5" },
  bounce: { active: "opacity-100 scale-100",          idle: "opacity-0 scale-50", extra: "confirm-bounce" },
};

export const DialogWrapper: React.FC<DialogWrapperProps> = ({ instance, children }) => {
  const { options, resolve, id } = instance;
  const config = ConfirmKit.getConfig();
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState<number | undefined>(
    options.timeout?.showCountdown ? Math.ceil(options.timeout.duration / 1000) : undefined
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const animationName: AnimName =
    (options.animation?.in as AnimName) || (config.animation.in as AnimName) || "fade";
  const animValid: AnimName = (["fade", "zoom", "slide", "bounce"] as AnimName[]).includes(
    animationName
  )
    ? animationName
    : "fade";
  const duration = options.animation?.duration || config.animation.duration;

  const backdrop = { ...config.backdrop, ...options.backdrop };

  const close = useCallback(
    (value: unknown) => {
      setIsAnimating(false);
      setTimeout(() => {
        resolve(value);
        confirmStore.removeDialog(id);
        if (previousFocus.current) {
          previousFocus.current.focus();
        }
      }, duration);
    },
    [resolve, id, duration]
  );

  const onBackdropClick = () => {
    if (backdrop.dismissible && !options.preventClose) {
      close(instance.type === "prompt" ? null : false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === config.keyboard.cancel && !options.preventClose) {
        close(instance.type === "prompt" ? null : false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config.keyboard.cancel, options.preventClose, close, instance.type]);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAnimating(true);

    if (config.keyboard.trapFocus && wrapperRef.current) {
      const focusableElements = wrapperRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) firstElement.focus();
    }
  }, [config.keyboard.trapFocus]);

  useEffect(() => {
    if (options.timeout) {
      const timer = setTimeout(() => {
        close(
          options.timeout?.action === "confirm"
            ? true
            : instance.type === "prompt"
              ? null
              : false
        );
      }, options.timeout.duration);

      let interval: ReturnType<typeof setInterval>;
      if (options.timeout.showCountdown) {
        interval = setInterval(() => {
          setCountdown((prev) => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);
      }

      return () => {
        clearTimeout(timer);
        if (interval) clearInterval(interval);
      };
    }
  }, [options.timeout, close, instance.type]);

  const breakpoint = (config as { mobileBreakpoint?: number }).mobileBreakpoint ?? 768;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
      : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  const anim = ANIM_CLASSES[animValid];
  // Mobile: bottom-sheet slide-up overrides desktop animation
  const mobileSheetIdle = "translate-y-full opacity-0";
  const mobileSheetActive = "translate-y-0 opacity-100";
  const dialogAnim = isMobile
    ? isAnimating
      ? mobileSheetActive
      : mobileSheetIdle
    : isAnimating
      ? anim.active
      : anim.idle;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      data-confirm-theme={config.theme}
      className={`fixed inset-0 flex justify-center z-[9999] transition-opacity ease-out p-4 max-md:p-0 ${
        isMobile ? "items-end" : "items-center"
      } ${isAnimating ? "opacity-100" : "opacity-0"}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {backdrop.enabled && (
        <div
          className={`absolute inset-0 bg-[var(--confirm-backdrop)] ${
            backdrop.blur ? "backdrop-blur" : ""
          }`}
          onClick={onBackdropClick}
        />
      )}
      <div
        ref={wrapperRef}
        className={`relative w-full max-w-[480px] max-md:max-w-full flex flex-col overflow-hidden bg-[var(--confirm-bg)] text-[var(--confirm-text)] shadow-[var(--confirm-shadow)] transition-all ease-out rounded-[var(--confirm-radius)] max-md:rounded-t-[var(--confirm-radius-sheet)] max-md:rounded-b-none ${
          anim.extra ?? ""
        } ${dialogAnim}`}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {isMobile && (
          <div className="w-10 h-1 bg-[var(--confirm-border)] rounded-sm mx-auto my-2" />
        )}
        {/* eslint-disable-next-line react-hooks/refs */}
        {children({ close, countdown })}
      </div>
    </div>
  );
};
