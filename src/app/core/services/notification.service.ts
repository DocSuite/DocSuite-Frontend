import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  message: string;
  type: 'error' | 'success';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly notification = signal<AppNotification | null>(null);
  private timeoutId: number | null = null;

  showError(message: string): void {
    this.show({ message, type: 'error' });
  }

  showSuccess(message: string): void {
    this.show({ message, type: 'success' });
  }

  clear(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.notification.set(null);
  }

  private show(notification: AppNotification): void {
    this.clear();
    this.notification.set(notification);
    this.timeoutId = window.setTimeout(() => this.clear(), 4500);
  }
}
