import { create } from 'zustand';
import { newId } from '../lib/ids';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface UIState {
  toasts: Toast[];
  toast: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

export const useUI = create<UIState>((set) => ({
  toasts: [],
  toast: (message, tone = 'success') => {
    const id = newId();
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
