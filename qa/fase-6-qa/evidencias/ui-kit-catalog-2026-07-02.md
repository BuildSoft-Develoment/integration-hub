# Evidencia P4: catálogo vivo del UI kit (rol de Storybook) - 2026-07-02

## Contexto y decisión (Storybook bloqueado en Angular 21)

El objetivo de P4 era **descubribilidad del UI kit** para autores de plugins (lo que aporta
Storybook: un catálogo navegable de componentes en sus estados). Se intentó Storybook y se
descartó por un **bloqueo real de compatibilidad**, no por preferencia:

```
$ npm install --save-dev --dry-run storybook@latest @storybook/angular@latest @storybook/addon-a11y@latest
npm error code ERESOLVE
npm error   peer @angular/common@"20.0.7" from @angular/platform-browser-dynamic@20.0.7
npm error   node_modules/@angular/platform-browser-dynamic
npm error     peer ... from @storybook/angular@10.4.6
Found: @angular/common@21.2.17
```

`@storybook/angular@10.4.6` (última) arrastra `@angular/platform-browser-dynamic@20.0.7`
(Angular **20**), incompatible con el `@angular/common@21.2.17` del proyecto. Forzarlo
(`--legacy-peer-deps`) metería Angular 20 en el `node_modules` que **comparte el dev en
marcha** (Quinoa/Nx) → riesgo de romper la stack, y produciría un Storybook frágil.

**Solución equivalente sin dependencias nuevas:** un catálogo del UI kit **dentro de la app**
(ruta `/ui-kit`), que renderiza cada primitiva de `@integration-hub/shared/ui` en sus estados
con los **tokens `--ih-*` reales**. Ventajas frente a Storybook aquí:

- Cero deps nuevas, cero riesgo de compat, cero disrupción del `node_modules` compartido.
- Usa los tokens globales reales → el **modo oscuro** sale gratis (toggle de tema del shell).
- Es una referencia **viva** que el autor ve dentro del propio producto.

## Qué se entregó

- **`UiKitGalleryComponent`** (`apps/web/src/app/features/ui-kit/ui-kit-gallery.component.ts`):
  secciones para **status badges** (5 kinds), **icons**, **loading** (bar + skeleton),
  **empty-state** y un **catalog-list vivo** con datos de ejemplo y un selector de estado
  (datos / loading / empty / error) para ver los 4 estados del shell.
- **Ruta `/ui-kit`** en `PLATFORM_ROUTE_CONTRIBUTIONS`, gated a `admin`, **sin entrada de
  navegación** (no ensucia el menú; es referencia de autor).
- Claves i18n nuevas y reutilizables: `uiKit.title`, `common.error`, `common.empty` (en/es,
  con paridad).

## Pruebas

### Unit (`npx nx test web --skip-nx-cache`)

- **PASS. Test files: 84 (+1). Tests: 399 (+2).** Nuevos:
  - Renderiza los 5 kinds de badge + las primitivas (`ih-empty-state`, `ih-loading`,
    `ih-catalog-list`, `ih-icon`).
  - Estado por defecto = 3 filas de ejemplo; al pasar a `empty`/`error` se vacían las filas
    y aparece el mensaje de error del shell (`.ih-catalog-error__message`).
- Build de producción: **OK** (chunk `ui-kit-gallery-component` generado).

### e2e (Playwright, chromium, stack real en :8080)

- **1 passed** (25.8s): "renders the UI kit catalog with the shared primitives":
  navega a `/#/ui-kit`, verifica el heading `UI kit`, **≥5** `ih-status-badge`, el
  `ih-catalog-list` con **3** filas por defecto, y que el toggle a `empty` **vacía** las filas
  y muestra `ih-empty-state`.

## Alcance / follow-up

- Entregado: el catálogo del UI kit + ruta + estados + a11y de las propias primitivas
  (ya cubierta por P1/P3: headers `columnheader`, teclado, focus-visible).
- El addon `axe` de Storybook no aplica (Storybook descartado); la a11y de las piezas se
  valida por sus specs y por los e2e de P1 (`columnheader`, roving-tabindex, outline).
- Cuando `@storybook/angular` soporte Angular 21 limpiamente, este catálogo puede migrarse a
  Storybook reutilizando estos mismos componentes como stories.
- Documentado en `guia-autor-plugins.md` (sección 2b).

## Doble check + cierre (dogfooding y descubribilidad)

El doble check destapó dos huecos reales, ya cerrados:

1. **Descubribilidad**: `/ui-kit` estaba gated sin entrada de nav → indescubrible, justo lo
   que P4 debía resolver. Añadido un **enlace "UI kit"** en la cabecera de `/plugins`
   (`href="#/ui-kit"`), la página de autor/operador.
2. **Dogfooding del kit**: la consola `/plugins` usaba un badge propio (`.plugin-badge` con
   `[data-status]`), una **reimplementación paralela** de `ih-status-badge`. Migrados los **7**
   badges a `ih-status-badge` con un helper `badgeKind()` (active→success, degraded→error,
   untrusted→warning, resto→neutral) y **eliminado** el CSS duplicado. La plataforma ahora
   consume su propio kit → prueba de que es infraestructura de verdad.

Verificación del cierre:

- Unit: **400/400** (+1): renderiza `ih-status-badge` (no `.plugin-badge`) y `badgeKind()`
  mapea exhaustivamente con fallback `neutral`.
- e2e (chromium, :8080): **7 passed** (consola de plugins + acciones backend + preview/install
  + salud + cuarentena + catálogo UI kit) sin regresión por el cambio de markup, y **enlace
  descubrible** verificado (`link "UI kit"` visible con `href="#/ui-kit"`).

## Estado del roadmap UI/UX

- **P1** (shell `ih-catalog-list`, 7 catálogos) ✅ · **P3** (UI kit para plugins) ✅ ·
  **P2** (slots/outlets) ✅ · **P4** (catálogo vivo del UI kit + dogfood en `/plugins`) ✅.
