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
