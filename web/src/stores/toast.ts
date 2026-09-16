import { create } from "zustand";

export interface ToastData {
  id: string;
  /** 通知来源图标 */
  icon?: string;
  /** 通知主题 */
  title: string;
  /** 通知内容 */
  message: string;
  /** 延后回调 */
  onPostpone?: () => void;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自动消失时间（毫秒），默认 5000 */
  duration?: number;
}

interface ToastState {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id">) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++nextId}`;
    const duration = toast.duration ?? 5000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));
