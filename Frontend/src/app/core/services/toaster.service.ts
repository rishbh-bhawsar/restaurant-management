import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
  private toastsSignal = signal<ToastMessage[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: ToastMessage['type'] = 'info', title?: string, duration: number = 4500): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = {
      id,
      type,
      title: title || this.getDefaultTitle(type),
      message,
      duration,
      createdAt: new Date()
    };

    this.toastsSignal.update((current) => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title?: string, duration?: number): string {
    return this.show(message, 'success', title || 'Success', duration);
  }

  error(message: string, title?: string, duration: number = 6000): string {
    return this.show(message, 'error', title || 'Error', duration);
  }

  warning(message: string, title?: string, duration?: number): string {
    return this.show(message, 'warning', title || 'Warning', duration);
  }

  info(message: string, title?: string, duration?: number): string {
    return this.show(message, 'info', title || 'Information', duration);
  }

  remove(id: string): void {
    this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toastsSignal.set([]);
  }

  private getDefaultTitle(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Action Failed';
      case 'warning':
        return 'Attention';
      case 'info':
      default:
        return 'Notice';
    }
  }
}
