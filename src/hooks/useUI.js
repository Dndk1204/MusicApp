import { create } from 'zustand';

const useUI = create((set, get) => ({
  // Trạng thái mặc định
  popup: {
    isOpen: false,
    type: 'info', // 'info', 'success', 'error', 'confirm'
    title: '',
    message: '',
    resolve: null, // Dùng cho hộp thoại Confirm
  },

  // 1. Hàm hiện thông báo đơn giản (thay thế alert)
  alert: (message, type = 'info', title = 'NOTIFICATION') => {
    set({
      popup: {
        isOpen: true,
        type,
        title,
        message,
        resolve: null,
      },
    });
  },

  // 2. Hàm xác nhận (thay thế confirm) - Trả về Promise (true/false)
  confirm: (message, title = 'CONFIRM_ACTION') => {
    return new Promise((resolve) => {
      set({
        popup: {
          isOpen: true,
          type: 'confirm',
          title,
          message,
          resolve, // Lưu hàm resolve để gọi khi bấm nút
        },
      });
    });
  },

  // 3. Hàm đóng popup
  closePopup: () => {
    const { popup } = get();
    // Nếu đang là confirm mà đóng đột ngột -> trả về false
    if (popup.type === 'confirm' && popup.resolve) {
      popup.resolve(false);
    }
    set({
      popup: { ...popup, isOpen: false, resolve: null },
    });
  },

  // 4. Hàm xác nhận đồng ý (Cho nút OK)
  confirmAction: () => {
    const { popup } = get();
    if (popup.resolve) {
      popup.resolve(true);
    }
    set({
      popup: { ...popup, isOpen: false, resolve: null },
    });
  },
}));

export default useUI;