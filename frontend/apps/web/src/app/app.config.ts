import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation, TitleStrategy } from '@angular/router';
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
import { loadRemoteModule } from '@angular-architects/native-federation';
import {
  provideAppPluginRegistryValidation,
  provideAppPluginRemoteModuleLoader,
  provideExternalAppPluginManifestCatalogs,
} from '@integration-hub/shared/ui';
import { appRoutes } from './app.routes';
import {
  authInterceptor,
  AuthService,
  httpErrorInterceptor,
  I18nTitleStrategy,
  PaginatorIntlService,
} from '@integration-hub/core/services';

import { appNavigationProvider } from './core/app-navigation.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideZonelessChangeDetection(),
    importProvidersFrom(MatSnackBarModule),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
    provideRouter(appRoutes, withHashLocation()),
    { provide: TitleStrategy, useExisting: I18nTitleStrategy },
    provideSourceProviders(),
    provideReaderProviders(),
    provideConnectionProviders(),
    ...appNavigationProvider,
    provideAppPluginRegistryValidation(),
    // Static defaults plus the runtime, backend-managed catalog (both optional/non-fatal).
    provideExternalAppPluginManifestCatalogs([
      { url: '/plugins/catalog.json' },
      { url: '/api/plugins/ui-catalog' },
    ]),
    provideAppPluginRemoteModuleLoader((request) =>
      loadRemoteModule({
        remoteEntry: request.remoteEntry,
        exposedModule: request.exposedModule,
      })
    ),
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

