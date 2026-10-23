import React from "react";
import { useModalContext } from "./ModalContext";

interface ModalHeaderProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  showCloseButton = true,
  onClose,
}) => {
  const ctx = useModalContext();
  const handleClose = onClose ?? ctx?.close;
  const style = ctx?.closeButtonStyle ?? "windows";

  return (
    <div className="flex items-center px-6 py-4 border-b border-[var(--mdl-border)]">
      {style === "macos" && (
        <div className="flex gap-2 mr-4">
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] cursor-pointer border-none p-0"
          />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-50" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] opacity-50" />
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
      {showCloseButton && style !== "macos" && (
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className={
            style === "button"
              ? "ml-auto inline-flex items-center justify-center px-3 py-1 text-sm rounded-md border border-[var(--mdl-border)] bg-transparent hover:bg-gray-100 cursor-pointer"
              : "ml-auto bg-transparent border-none text-2xl leading-none cursor-pointer text-gray-500 hover:text-gray-900 transition-colors"
          }
        >
          {style === "button" ? "Close" : "×"}
        </button>
      )}
    </div>
  );
};

interface ModalBodyProps {
  children: React.ReactNode;
  padding?: string | number;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, padding }) => {
  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-6"
      style={padding !== undefined ? { padding } : undefined}
    >
      {children}
    </div>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  divider?: boolean;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  align = "right",
  divider = true,
}) => {
  const justify =
    align === "left" ? "justify-start" : align === "center" ? "justify-center" : "justify-end";
  return (
    <div
      className={`flex gap-3 px-6 py-4 ${justify} ${
        divider ? "border-t border-[var(--mdl-border)]" : ""
      }`}
    >
      {children}
    </div>
  );
};
