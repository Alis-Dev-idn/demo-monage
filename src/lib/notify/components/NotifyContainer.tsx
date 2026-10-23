import "./notify.css";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {notifyStore} from "../core/NotifyStore";
import {NotifyKit} from "../core/NotifyKit";
import type {NotifyItem as INotifyItem, NotifyPosition} from "../types";

export const NotifyContainer: React.FC<{ position?: NotifyPosition }> = ({ position }) => {
  const [notifications, setNotifications] = useState<INotifyItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const config = NotifyKit.getConfig();
  const activePosition = position || config.position;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return notifyStore.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });
  }, []);

  if (!mounted) return null;

  // Group by position
  const grouped = notifications.reduce((acc, n) => {
    const pos = n.options.position || activePosition;
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(n);
    return acc;
  }, {} as Record<string, INotifyItem[]>);

  return createPortal(
    <>
      {Object.entries(grouped).map(([pos, items]) => (
        <div
          key={pos}
          className={`notify-container notify-container-${pos}`}
          style={{ ["--notify-gap" as never]: `${config.gap}px` }}
        >
          {items.map((n) => (
            <NotifyItemComponent key={n.id} item={n} />
          ))}
        </div>
      ))}
    </>,
    document.body
  );
};

const NotifyItemComponent: React.FC<{ item: INotifyItem }> = ({ item }) => {
  const { id, type, message, options } = item;
  const [remaining, setRemaining] = useState(options.duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Keep `isPaused` accessible inside the rAF tick without re-running the
  // effect every time it changes (which would reset `lastTime`).
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      notifyStore.removeNotification(id);
    }, options.animation.duration);
  }, [id, options.animation.duration]);

  useEffect(() => {
    if (options.duration <= 0 || isExiting) return;

    let animationFrame: number;
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      if (!isPausedRef.current) {
        setRemaining((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            dismiss();
            return 0;
          }
          return next;
        });
      }

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isExiting, options.duration, dismiss]);

  const progress = options.duration > 0 ? (remaining / options.duration) * 100 : 0;
  const config = NotifyKit.getConfig();
  const animType = isExiting ? options.animation.out : options.animation.in;
  const animState = isExiting ? "exit-active" : "enter-active";

  return (
    <div
      role={type === "error" || type === "warning" ? "alert" : "status"}
      aria-live={type === "error" || type === "warning" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`notify-item notify-${type} notify-${animType}-${animState}`}
      onMouseEnter={() => config.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => config.pauseOnHover && setIsPaused(false)}
      style={{ transitionDuration: `${options.animation.duration}ms` }}
    >
      <div className="notify-content">
        <div className="notify-icon" aria-hidden="true">
          {type === "success" && <SuccessIcon />}
          {type === "error" && <ErrorIcon />}
          {type === "warning" && <WarningIcon />}
          {type === "info" && <InfoIcon />}
        </div>
        <div className="notify-message">
          {message}
        </div>
        {options.action && (
          <button type="button" className="notify-action-btn" onClick={options.action.onClick}>
            {options.action.label}
          </button>
        )}
        {options.dismissible && (
          <button
            type="button"
            className="notify-close"
            aria-label="Dismiss notification"
            onClick={dismiss}
          >
            <CloseIcon />
          </button>
        )}
      </div>
      {options.duration > 0 && (
        <div className="notify-progress">
          <div className="notify-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

// Icons
const SuccessIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
);
const ErrorIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
);
const WarningIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
);
const InfoIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
);
