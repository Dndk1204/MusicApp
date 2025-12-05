import { create } from 'zustand';

const useUploadModal = create((set) => ({
  isOpen: false, // Mặc định là false để không tự hiện khi load trang
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useUploadModal;