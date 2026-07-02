# Evidencia P3: UI kit para plugins externos - 2026-07-02

Habilita que un plugin remoto instalado desde fuera consiga el **look-and-feel nativo**
consumiendo el UI kit de la plataforma (`@integration-hub/shared/ui`). Cierra el objetivo
"instalar plugins de fuera" con plugins que se ven como parte del producto, no ajenos.

> **Corrección tras doble check:** el `remoteEntry` del sample-plugin comparte los `@angular/*`
> pero **no** `@integration-hub/shared/ui` — Native Federation **empaqueta** los libs de
> workspace (path de tsconfig, sin versión) en vez de compartirlos como singleton. El plugin
> **sí consume el kit** y se ve nativo (los design tokens son CSS global en `:root`), pero la
> primitiva va **bundled**, no como singleton del host. El sharing singleton real requiere
> publicar el kit como paquete versionado (`@integration-hub/plugin-ui-kit`) — follow-up.

## Cambios

- **`StatusBadgeComponent`** (`ih-status-badge`, en `shared/ui`): badge de estado semántico
  (`success`/`error`/`warning`/`info`/`neutral`) con los design tokens (`--ih-status-*`),
  label proyectada. Primera pieza "kit" reutilizable extraída del patrón de badge.
- **`apps/sample-plugin`**: el widget expuesto (`./Widget`) ahora renderiza con
  `ih-icon` + `ih-status-badge` + tokens (`--ih-space-*`, `--ih-surface-alt`, `--ih-text`),
  demostrando el look nativo.
- **`apps/sample-plugin/federation.config.js`**: comparte `@integration-hub/shared/ui` y
  `@integration-hub/core/services` como singletons (el remote reusa la instancia, tema e
  `I18nService` del host).
- **Guía de autor** (`guia-autor-plugins.md`): nueva sección "UI kit del plugin" con la tabla
  de primitivas (`ih-catalog-list`, `ih-status-badge`, `ih-empty-state`, `ih-loading`,
  `ih-icon`, tokens, i18n) y cómo compartirlas.

## Pruebas

### Unit (`npx nx test web`)

- **PASS. Test files: 82. Tests: 394** (+2 del badge: proyección de label + `data-status`,
  y reflejo de cambio de estado). Sin regresión.

### Build del remote (`npx nx build sample-plugin`)

- **Successfully ran target build for project sample-plugin** — el remote **compila
  consumiendo el UI kit** (`ih-status-badge` + `ih-icon`) y con el kit declarado como
  singleton en la federación. Es la prueba de que un plugin externo puede usar el kit.

## Alcance / follow-up

- Entregado: primitiva `ih-status-badge` + consumo end-to-end del kit por el sample-plugin +
  federación singleton + documentación.
- Follow-up (bajo riesgo): dogfood — migrar los badges inline de la consola `/plugins` a
  `ih-status-badge`; añadir más primitivas al kit (form-kit sobre `managed-editor`).
- Siguiente del roadmap: **P2** (slots/outlets para que los plugins enriquezcan páginas
  existentes).
