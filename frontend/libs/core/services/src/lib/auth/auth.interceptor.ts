import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * (1) Adjunta el bearer a cada request, refrescándolo PROACTIVAMENTE antes de enviarlo. Así cada petición lleva un
 * token vigente aunque el usuario haya trabajado en memoria sin peticiones (el refresh ya no depende solo del timer
 * de fondo, que se estrangula con la pestaña en segundo plano / OS suspendido). {@code freshToken} no hace red si el
 * token aún es válido, así que el costo por-request es un chequeo local de expiración.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  // Sin sesión (no configurado / invitado): pasa tal cual, sin Authorization.
  if (!authService.authenticated()) {
    return next(request);
  }

  return from(authService.freshToken(30)).pipe(
    switchMap((token) =>
      next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request)
    )
  );
};
