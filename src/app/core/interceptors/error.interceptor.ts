import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notificationService = inject(NotificationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        notificationService.showError(getHttpErrorMessage(error, request.url));
      }

      return throwError(() => error);
    }),
  );
};

function getHttpErrorMessage(error: HttpErrorResponse, url: string): string {
  if (error.status === 0) {
    return 'No hay conexión con el backend. Revisa que FastAPI esté ejecutándose.';
  }

  if (error.status === 401) {
    return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
  }

  if (error.status === 413) {
    return 'El archivo es demasiado grande para procesarlo.';
  }

  if (error.status === 429) {
    if (url.includes('/meeting-minutes/jobs')) {
      return 'DocActa ya tiene un procesamiento en curso. Espera a que termine antes de iniciar otro.';
    }

    return 'Hay demasiadas solicitudes. Espera unos segundos antes de intentarlo otra vez.';
  }

  return readBackendMessage(error) || 'Ocurrió un error inesperado. Intenta nuevamente.';
}

function readBackendMessage(error: HttpErrorResponse): string | null {
  const detail = error.error?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(' ');
  }

  return null;
}
