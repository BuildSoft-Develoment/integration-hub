# Guía de autor de plugins (frontend + backend)

Guía práctica para construir, firmar y publicar un plugin instalable desde fuera. Cubre
el contrato, el modelo de seguridad y el versionado. Complementa ADR-012 (frontend
modular), ADR-013 (module federation remotos) y ADR-014 (backend modular).

Ejemplo funcional de referencia: [frontend/apps/sample-plugin](../../frontend/apps/sample-plugin)
(remote Native Federation, frontend) y [ejemplos/backend-plugin-sidecar](../../ejemplos/backend-plugin-sidecar)
(backend).

---

## 1. Qué puede aportar un plugin

| Contribución | Frontend (`AppPluginManifest`) | Backend (sidecar) |
|---|---|---|
| Vista/UI | `remote` (Native Federation) | — |
| Navegación / workspaces | `navigation`, `workspaces` (a rutas existentes) | — |
| Acciones + comando | `actions` con `command` + handler (`provideAppActionCommandHandlers`) | — |
| Widget en página existente (**slot**) | `provideAppSlotContributions([{ slot, component, requiredCapability? }])` | — |
| Traducciones | `i18nNamespaces` + `I18nService.registerMessages` en runtime | — |
| Tipos de tarea / fuentes / lectores | vía el remote | `providedTypes` en el descriptor |
| RBAC | `requiredCapability` en cada contribución | `@RolesAllowed` en el sidecar |

## 2. Contrato frontend (`AppPluginManifest`)

Campos y reglas (validadas por `AppPluginRuntimeRegistry`):

- **`id`, `version`, `displayName`**: obligatorios y únicos.
- **`platformVersion`**: compatible con `FRONTEND_EXTENSION_PLATFORM_VERSION` (hoy `1.0.0`;
  se acepta el mismo *major* si el host lo habilita).
- **`routes`**: **prohibido** en manifiestos externos. El código llega por `remote`; el host
  lo monta en un punto controlado, no en rutas arbitrarias.
- **`navigation` / `workspaces` / `actions` con ruta**: deben apuntar a **rutas ya
  registradas** por la plataforma. Para acciones nuevas usa `command` (sin ruta) y registra
  su handler con `provideAppActionCommandHandlers`.
- **`i18nNamespaces`**: si se declaran, **toda** clave i18n contribuida debe caer bajo uno
  de ellos (evita colisiones con la plataforma u otros plugins).
- **`remote`**: `url` `https://`, `exposedModule`, `integrity` (SRI `sha256|384|512`),
  `signature` (`keyId:base64`).

## 2b. UI kit del plugin (look-and-feel nativo)

Un remote consigue la apariencia nativa importando el **UI kit** de la plataforma desde
`@integration-hub/shared/ui`. La apariencia es nativa porque los **design tokens son CSS
global** (`:root`), así que los componentes los leen aunque vengan empaquetados.

> Nota de sharing: un plugin que dependa del kit como **paquete publicado y versionado**
> (p.ej. `@integration-hub/plugin-ui-kit`) puede compartirlo como **singleton** del host
> (reusa la instancia e `I18nService`). Un remote que lo importe por el path de workspace
> (sin versión) lo **empaqueta** (Native Federation no dedupe libs de workspace). Ambos se
> ven nativos; el singleton solo evita duplicar el bundle.

Primitivas disponibles (entre otras):

| Import | Uso |
|---|---|
| `CatalogListComponent` (`ih-catalog-list`) | catálogo con header sortable, estados, paginación, teclado y a11y; proyecta las filas. |
| `StatusBadgeComponent` (`ih-status-badge`) | badge de estado (`success`/`error`/`warning`/`info`/`neutral`) con tokens. |
| `EmptyStateComponent` (`ih-empty-state`), `LoadingComponent` (`ih-loading`), `IconComponent` (`ih-icon`) | estados e iconografía. |
| Design tokens (`--ih-*`) e `I18nService` (`registerMessages`) | color/tipografía/espaciado y traducciones. |

Compártelas en `federation.config.js`:

```js
shared: {
  ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  '@integration-hub/shared/ui': { singleton: true, strictVersion: false, requiredVersion: false },
  '@integration-hub/core/services': { singleton: true, strictVersion: false, requiredVersion: false },
}
```

Ejemplo: `apps/sample-plugin/src/app/widget.component.ts` renderiza con `ih-icon` +
`ih-status-badge` + tokens.

> **Referencias del kit** (dos, complementarias):
> - **Storybook** (`npm run storybook`, :4400): componentes presentacionales aislados
>   (`status-badge`, `empty-state`, `loading`, `icon`) con tokens `--ih-*` + tema Material y
>   addon `a11y` (axe). Build estático: `npm run build-storybook`.
> - **Catálogo in-app** (`/#/ui-kit`, gated `admin`): el flagship `catalog-list` y demás piezas
>   con su DI real, en sus estados y con modo oscuro (toggle del shell).
>
> Detalle de por qué `catalog-list` va en la galería y no en Storybook, y de la alineación de la
> familia Angular que habilitó Storybook: `qa/fase-6-qa/evidencias/ui-kit-catalog-2026-07-02.md`.

## 2c. Slots/outlets (enriquecer páginas existentes)

Además de añadir pantallas, un plugin puede **inyectar un widget dentro de una página
existente** en un *slot* con nombre. El host expone el punto de inserción con
`<ih-slot name="overview.widgets" />` y el plugin registra su componente:

```ts
provideAppSlotContributions([
  { slot: 'overview.widgets', component: MyWidgetComponent, order: 10, requiredCapability: 'ops' },
])
```

- Las contribuciones se resuelven ordenadas (`order`) y **filtradas por RBAC**
  (`requiredCapability` vía `AuthAccessService`).
- Se registran en el **injector raíz** (`AppSlotRegistry` es `providedIn: 'root'`).
- Slots disponibles hoy: `overview.widgets` (dashboard). Añadir más es colocar otro
  `<ih-slot name="...">` en la página anfitriona.

## 3. Modelo de seguridad (fail-safe)

1. **Allowlist de origen**: el `origin` del `remote.url` debe estar en
   `APP_PLUGIN_REMOTE_ALLOWED_ORIGINS` (`provideAppPluginRemoteOrigins([...])`). Vacío por
   defecto.
2. **Allowlist de clave**: el `keyId` de la firma debe estar en
   `APP_PLUGIN_REMOTE_TRUSTED_KEYS` (`provideAppPluginRemoteTrustedKeys([...])`). Vacío por
   defecto.
3. **Integridad + firma**: en tiempo de carga, el host verifica el SRI del `remoteEntry` y
   la firma ECDSA P-256 sobre esos bytes antes de montar el código.
4. **Aislamiento**: cualquier manifiesto que falle una comprobación queda **en cuarentena**
   (visible en `/plugins`), sin romper el shell ni bloquear el resto del catálogo. Si el
   código verifica pero falla al montar, el plugin queda **degradado**.

## 4. Publicar un plugin frontend (paso a paso)

1. Implementa el componente y expón el módulo (ver `apps/sample-plugin/federation.config.js`).
2. `npx nx build sample-plugin` → genera `remoteEntry.json`.
3. Fírmalo: `node apps/sample-plugin/sign-remote.mjs dist/apps/sample-plugin/remoteEntry.json <keyId>`
   → `integrity` + `signature`.
4. Rellena `manifest.json` y hospeda `remoteEntry.json` en tu origen `https://`.
5. El operador añade origen + `keyId` a los allowlists y el manifiesto al catálogo
   `apps/web/public/plugins/catalog.json` (`{ "manifests": [ ... ] }`).
6. Recarga: el host carga `/plugins/catalog.json` en el arranque, verifica y monta.

## 5. Publicar un plugin backend

Ver ADR-014 y `ejemplos/backend-plugin-sidecar`: se registra vía el marketplace firmado
(`POST /api/plugins/marketplace/install`), con trust policy, canales (canary/stable) y
métricas de promoción (`/api/plugins/canary/metrics`). La consola `/plugins` gestiona el
ciclo de vida (preview, instalar, activar/desactivar, versiones, canary).

## 6. Versionado y compatibilidad

- El contrato frontend versiona con `FRONTEND_EXTENSION_PLATFORM_VERSION`; el backend con
  `spiVersion` por descriptor.
- Política recomendada: cambios compatibles suben *minor*; rupturas suben *major* con una
  ventana de deprecación anunciada. El host puede aceptar el mismo *major* si se habilita
  `allowCompatibleMajor`.
- Un plugin que declare un `platformVersion`/`spiVersion` incompatible se rechaza con un
  mensaje explícito, sin afectar a los demás.
