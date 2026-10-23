import type { FC } from "react";
import { Modal as ModalBase } from "./components/Modal";
import { ModalHeader, ModalBody, ModalFooter } from "./components/ModalSubComponents";
import { ModalStack } from "./components/ModalStack";
import { useModal } from "./hooks/useModal";
import { ModalKit } from "./core/ModalKit";
import { modal } from "./imperative/modal";
import type { ModalProps } from "./types";

export type ModalComponent = FC<ModalProps> & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
};

export const Modal = ModalBase as ModalComponent;
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { useModal, ModalKit, ModalStack, modal };
export type { ModalProps };
export * from "./types";
