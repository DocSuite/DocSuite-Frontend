import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

interface ConfirmDialogRequest extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  readonly request = signal<ConfirmDialogRequest | null>(null);

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.request.set({
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        tone: 'default',
        ...options,
        resolve,
      });
    });
  }

  close(confirmed: boolean): void {
    const currentRequest = this.request();
    if (!currentRequest) {
      return;
    }

    currentRequest.resolve(confirmed);
    this.request.set(null);
  }
}
