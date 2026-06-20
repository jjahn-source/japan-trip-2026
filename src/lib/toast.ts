export type ToastType = "error" | "success" | "info";
export type ToastEvent = { id: number; message: string; type: ToastType };

let nextId = 0;
const listeners = new Set<(e: ToastEvent) => void>();

function emit(message: string, type: ToastType) {
  const event: ToastEvent = { id: nextId++, message, type };
  listeners.forEach((fn) => fn(event));
}

export const toast = {
  error: (message: string) => emit(message, "error"),
  success: (message: string) => emit(message, "success"),
  info: (message: string) => emit(message, "info"),
  subscribe: (fn: (e: ToastEvent) => void): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
