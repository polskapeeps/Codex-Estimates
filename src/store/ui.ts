import { create } from 'zustand';
import { newId } from '../lib/ids';

export type ToastTone = 'success' | 'error' | 'info';
export type ThemeMode = 'dark' | 'light';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

const THEME_KEY = 'estimator-theme';

function initialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

interface UIState {
  toasts: Toast[];
  theme: ThemeMode;
  toast: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUI = create<UIState>((set) => ({
  toasts: [],
  theme: initialTheme(),
  toast: (message, tone = 'success') => {
    const id = newId();
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme);
    }
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const theme: ThemeMode = s.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_KEY, theme);
      }
      return { theme };
    }),
}));
