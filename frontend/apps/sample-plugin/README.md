# sample-plugin — ejemplo de plugin frontend remoto

Remote **Native Federation** de referencia para autores de plugins de interfaz
instalables desde fuera. El host lo carga en runtime desde el catálogo
(`/plugins/catalog.json`) y monta el componente expuesto tras verificar integridad
(SRI) y firma (ECDSA P-256). Ver ADR-012 / ADR-013 y la guía de autor:
[docs/fase-3-arquitectura/guia-autor-plugins.md](../../../docs/fase-3-arquitectura/guia-autor-plugins.md).

## Estructura

| Fichero | Rol |
|---|---|
| `src/app/widget.component.ts` | Componente standalone expuesto como `./Widget`. |
| `federation.config.js` | Config Native Federation (`exposes`, `shared` singletons). |
| `manifest.json` | Manifiesto publicable (`AppPluginManifest`) que el host consume. |
| `sign-remote.mjs` | Calcula `integrity` (SRI) y `signature` (`keyId:base64`) del `remoteEntry`. |

## Reglas del contrato (las valida el host `AppPluginRuntimeRegistry`)

- `platformVersion` compatible con `FRONTEND_EXTENSION_PLATFORM_VERSION` (hoy `1.0.0`).
- Un manifiesto externo **no puede declarar rutas Angular**: el código llega por `remote`.
  `navigation`/`workspaces`/`actions` con ruta deben apuntar a **rutas existentes**; las
  acciones nuevas se modelan como `command` (+ `provideAppActionCommandHandlers`).
- Toda clave i18n contribuida debe caer bajo los `i18nNamespaces` declarados
  (traducciones en runtime vía `I18nService.registerMessages`).
- `remote`: `https://`, `integrity` SRI válida, `signature` `keyId:base64`.
- Origen en `APP_PLUGIN_REMOTE_ALLOWED_ORIGINS` y `keyId` en
  `APP_PLUGIN_REMOTE_TRUSTED_KEYS` (ambos vacíos por defecto — *fail-safe*).

## Publicar

```bash
# 1) Construir el remote
npx nx build sample-plugin

# 2) Firmar el remoteEntry (obtiene integrity + signature; genera par de claves si no das uno)
node apps/sample-plugin/sign-remote.mjs dist/apps/sample-plugin/remoteEntry.json sample-plugin-key-1

# 3) Pegar integrity/signature en manifest.json y hospedar remoteEntry.json en tu origen https
```

Después, el operador añade el origen y el `keyId` a los allowlists y el manifiesto al
catálogo `apps/web/public/plugins/catalog.json`:

```json
{ "manifests": [ /* contenido de apps/sample-plugin/manifest.json */ ] }
```

## Seguridad (fail-safe)

Si el origen o la clave no están en el allowlist, o falla integridad/firma, el plugin
queda **en cuarentena** (visible en `/plugins`) sin romper el shell ni bloquear el resto
del catálogo. Cubierto por la e2e `quarantines an untrusted external frontend plugin`
y por los tests de `AppPluginRuntimeRegistry`.
