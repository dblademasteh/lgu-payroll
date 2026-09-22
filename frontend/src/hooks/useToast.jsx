import { create } from 'zustand';

const TOAST_KEY = 'lgu-payroll-toasts';

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (message, type = 'info') => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => get().dismiss(id), 5000);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function useToast() {
  const push = useToastStore((s) => s.push);
  return push;
}