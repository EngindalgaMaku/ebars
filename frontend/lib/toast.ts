"use client";

interface ToastOptions {
  duration?: number;
  type?: "success" | "error" | "info";
}

class ToastManager {
  private toasts: Array<{
    id: string;
    message: string;
    type: string;
    timeout: NodeJS.Timeout;
  }> = [];

  private createToastElement(message: string, type: string): HTMLDivElement {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg text-white z-50 transition-all duration-300 ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
        ? "bg-red-500"
        : "bg-blue-500"
    }`;
    toast.textContent = message;
    return toast;
  }

  private show(message: string, options: ToastOptions = {}) {
    const { duration = 3000, type = "info" } = options;
    const id = Math.random().toString(36).substr(2, 9);

    const toastElement = this.createToastElement(message, type);
    document.body.appendChild(toastElement);

    const timeout = setTimeout(() => {
      toastElement.remove();
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, duration);

    this.toasts.push({ id, message, type, timeout });
  }

  success(message: string, options?: Omit<ToastOptions, "type">) {
    this.show(message, { ...options, type: "success" });
  }

  error(message: string, options?: Omit<ToastOptions, "type">) {
    this.show(message, { ...options, type: "error" });
  }

  info(message: string, options?: Omit<ToastOptions, "type">) {
    this.show(message, { ...options, type: "info" });
  }
}

const toastManager = new ToastManager();

export const toast = {
  success: (message: string) => toastManager.success(message),
  error: (message: string) => toastManager.error(message),
  info: (message: string) => toastManager.info(message),
};
