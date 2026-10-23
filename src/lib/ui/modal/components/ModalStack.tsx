import React, { useEffect, useState } from "react";
import { modalStore } from "../core/ModalStore";
import type { ModalInstance } from "../types";
import { ModalKit } from "../core/ModalKit";
import { Modal } from "./Modal";

export const ModalStack: React.FC = () => {
  const [modals, setModals] = useState<ModalInstance[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = modalStore.subscribe((newModals) => {
      setModals(newModals);
    });
    return unsubscribe;
  }, []);

  if (!mounted) return null;

  return (
    <>
      {modals.map((m) => {
        const animationDuration =
          m.animation?.duration ?? ModalKit.getConfig().animation.duration ?? 200;
        // Small buffer over animation duration to ensure exit completes
        const cleanupDelay = animationDuration + 50;
        return (
          <Modal
            key={m.id}
            {...m}
            isOpen={m.isOpen}
            onClose={() => {
              modalStore.closeModal(m.id);
              if (m.onClose) m.onClose();
              setTimeout(() => modalStore.removeModal(m.id), cleanupDelay);
            }}
          >
            {m.content}
          </Modal>
        );
      })}
    </>
  );
};
