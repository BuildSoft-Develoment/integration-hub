import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AppFeedbackService } from '../ui/app-feedback.service';

export const SKIP_GLOBAL_ERROR_FEEDBACK = new HttpContextToken<boolean>(() => false);

export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const feedback = inject(AppFeedbackService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        !request.context.get(SKIP_GLOBAL_ERROR_FEEDBACK)
      ) {
        feedback.handleHttpError(error);
      }
      return throwError(() => error);
    })
  );
};
