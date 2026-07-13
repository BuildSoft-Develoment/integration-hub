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
  APP_PLUGIN_CATALOG_FETCH,
  AppPluginRuntimeRegistry,
  provideAppPluginRegistryValidation,
  provideAppPluginRemoteKeys,
  provideAppPluginRemoteModuleLoader,
  provideAppPluginRemoteOrigins,
  provideAppPluginRemoteTrustedKeys,
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
    // Fetch autenticado para los catalogos de manifests: el catalogo backend
    // (/api/plugins/ui-catalog) esta securizado, asi que sin bearer token daba 401 y el
    // widget se descartaba en silencio. Adjunta el token (freshToken refresca si vence).
    // La CARGA de catalogos se hace en el initializer de auth de mas abajo, para que corra
    // DESPUES de auth.initialize() y el token ya exista.
    {
      provide: APP_PLUGIN_CATALOG_FETCH,
      useFactory: () => {
        const auth = inject(AuthService);
        return async (url: string, init?: RequestInit) => {
          const token = await auth.freshToken();
          const headers = new Headers(init?.headers);
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return fetch(url, { ...init, headers });
        };
      },
    },
    // Confianza de widgets remotos (ADR-013): clave publica JWK por keyId + origenes
    // permitidos. Wiring DEV/DEMO para el plugin de ejemplo demo-transform-widget
    // (ejemplos/plugin-demo/frontend-widget); en produccion estas claves/origenes se
    // gestionan por release, no se agregan claves de prueba.
    provideAppPluginRemoteKeys({
      'demo-transform-key-1': {
        key_ops: ['verify'],
        ext: true,
        kty: 'EC',
        x: 'YjnZUPQvq-l7WyCWjvs9_MR2eJeq8h8_eDWs3IBP2II',
        y: 'fNrBBDMdCZP2BINVggn0fnW38Ob7OxLSjzAObUd7Ezg',
        crv: 'P-256',
      },
    }),
    provideAppPluginRemoteTrustedKeys(['demo-transform-key-1']),
    provideAppPluginRemoteOrigins(['http://localhost:4300']),
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
      // Capturar refs en contexto de inyeccion ANTES del await (el contexto se pierde tras el).
      const auth = inject(AuthService);
      const pluginRegistry = inject(AppPluginRuntimeRegistry);
      await auth.initialize();
      // Cargar los catalogos DESPUES de auth: el catalogo backend esta securizado y el fetch
      // (APP_PLUGIN_CATALOG_FETCH) adjunta el token, que ya existe aqui. Estatico + backend,
      // ambos opcionales/no-fatales.
      await pluginRegistry.loadExternalManifestCatalogs([
        { url: '/plugins/catalog.json' },
        { url: '/api/plugins/ui-catalog' },
      ]);
    }),
  ],
};

