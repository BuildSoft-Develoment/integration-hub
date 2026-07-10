import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AppFeedbackService } from '../ui/app-feedback.service';

export const SKIP_GLOBAL_ERROR_FEEDBACK = new HttpContextToken<boolean>(() => false);

export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const feedback = inject(AppFeedbackService);
  const authService = inject(AuthService);

  const showFeedback = (error: HttpErrorResponse) => {
    if (!request.context.get(SKIP_GLOBAL_ERROR_FEEDBACK)) {
      feedback.handleHttpError(error);
    }
  };

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      // (2) Recuperación 401: token vencido/desincronizado del back → fuerza el refresh y reintenta UNA vez.
      // El reintento NO re-entra este interceptor (no hay bucle). Auto-sana el caso "trabajé en memoria y venció
      // el token" sin mostrar el mensaje. Solo si el refresh forzado falla (SSO/refresh-token muerto) o el reintento
      // igual falla, mostramos el mensaje — una sola vez.
      if (error.status === 401 && authService.authenticated()) {
        return from(authService.forceRefresh()).pipe(
          switchMap((token) => {
            if (!token) {
              showFeedback(error);
              return throwError(() => error);
            }
            return next(
              request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            ).pipe(
              catchError((retryError: unknown) => {
                if (retryError instanceof HttpErrorResponse) {
                  showFeedback(retryError);
                }
                return throwError(() => retryError);
              })
            );
          })
        );
      }

      showFeedback(error);
      return throwError(() => error);
    })
  );
};
