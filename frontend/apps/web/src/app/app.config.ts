import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { importProvidersFrom } from '@angular/core';
import {
  provideConnectionProviders,
  provideReaderProviders,
  provideSourceProviders,
} from '@integration-hub/core/providers';
import { appRoutes } from './app.routes';
import {
  authInterceptor,
  AuthService,
  httpErrorInterceptor,
  PaginatorIntlService,
} from '@integration-hub/core/services';

import { appNavigationProvider } from './app-navigation.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    importProvidersFrom(MatSnackBarModule),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
    provideRouter(appRoutes, withHashLocation()),
    provideSourceProviders(),
    provideReaderProviders(),
    provideConnectionProviders(),
    appNavigationProvider,
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'fill',
        subscriptSizing: 'dynamic',
      },
    },
    {
      provide: MatPaginatorIntl,
      useExisting: PaginatorIntlService,
    },
    provideAppInitializer(async () => {
      await inject(AuthService).initialize();
    }),
  ],
};

