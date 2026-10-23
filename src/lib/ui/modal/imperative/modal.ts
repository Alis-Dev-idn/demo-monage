import type { ModalConfig } from "../types";
import { modalStore } from "../core/ModalStore";
import { uid } from "../../../_shared/uid";

export const modal = {
  open: (config: ModalConfig): string => {
    const id = config.id || uid("modal");
    
    modalStore.addModal({
      ...config,
      id,
      isOpen: true,
    });
    
    return id;
  },

  close: (id: string) => {
    modalStore.closeModal(id);
  },

  closeTop: () => {
    modalStore.closeTop();
  },

  closeAll: () => {
    modalStore.closeAll();
  }
};
