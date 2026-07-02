# Evidencia P4: catálogo vivo del UI kit (rol de Storybook) - 2026-07-02

## Contexto y decisión (por qué in-app y no Storybook — corregido)

El objetivo de P4 era **descubribilidad del UI kit** para autores de plugins (lo que aporta
Storybook: un catálogo navegable de componentes en sus estados).

> **Corrección importante.** Una versión anterior de este doc afirmó que "Storybook no
> soporta Angular 21". **Es falso.** `@storybook/angular@10.4.6` declara peers Angular
> `>=18.0.0 < 22.0.0` (incluye 21), y `@angular/platform-browser-dynamic@21.2.x` existe.
> Storybook 10 **es compatible** con Angular 21.

El bloqueo real, comprobado empíricamente, es **del propio proyecto**, no de Storybook:

1. La familia Angular del workspace está en **patches mezclados**: `@angular/core@21.2.7`,
   `@angular/common@21.2.17`, `@angular/forms@21.2.7`, `@angular/material`/`cdk@21.2.5`.
2. Storybook necesita `@angular/platform-browser-dynamic`, un paquete **interno de Angular
   con peers de versión exacta**. Añadirlo a cualquier patch choca con algún paquete Angular
   fijado en otro → `ERESOLVE` en un `npm install` normal.
3. El atajo `--legacy-peer-deps` es **destructivo aquí**: al ignorar peers, npm **poda**
   dependencias peer-only reales — se probó y **eliminó `@foblex/mediator`/`2d`/`platform`**
   (usados por el diagrama de flujo), y el build de la app falló con
   `Could not resolve "@foblex/mediator"`. Revertido; app de nuevo verde (400/400, salud 200).

Se resolvió el bloqueo **alineando toda la familia Angular a un único patch** (`21.2.17`
framework; `21.2.14` material/cdk) editando los rangos de `package.json` a versión exacta y
reconciliando con `npm install --force` (a diferencia de `--legacy-peer-deps`, `--force` **sí**
instala peers → **no** poda `@foblex/*`). Resultado: **foblex intacto, app compila, unit 400/400**.

**Entregado (dos piezas complementarias):**

1. **Storybook real** (`@storybook/angular@10.4.6`) para los **componentes presentacionales de
   hoja** del kit — `status-badge`, `empty-state`, `loading`, `icon` — con tokens `--ih-*` +
   tema Material cargados y **addon `a11y` (axe)**. Es el punto fuerte de Storybook: componentes
   aislados con auditoría de accesibilidad.
2. **Catálogo in-app** (`/ui-kit`) para el componente insignia **`catalog-list`** (y el resto),
   donde su **DI/servicios** (`I18nService`) se resuelve de verdad. `catalog-list` se deja fuera
   de Storybook a propósito: importa el barrel `@integration-hub/core/services`, que arrastra
   todo el grafo de servicios de la app; bajo la AOT estricta de Storybook eso destapa un error
   de tipo **latente y preexistente** en `core/providers` (`rest-call-task.provider.ts:53`,
   `string`→`ProcessTaskExecutionMode`), ajeno a P4. No se toca código de app para forzar una
   story; el grafo con DI se cubre mejor en la galería in-app.

> **Nota Storybook 10 + Nx:** Storybook 10 eliminó `storybook build` directo para Angular;
> exige el **builder de Angular CLI**. Como el workspace es Nx (sin `angular.json`), se añadió
> un `angular.json` mínimo con el proyecto `ui-kit-storybook` (targets `storybook` /
> `build-storybook`, `tsConfig` = `.storybook/tsconfig.json`). Nx lo ignora: `nx show projects`
> sigue devolviendo `[sample-plugin, web-e2e, web]` y `nx build web` queda verde.

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
### Storybook (`ng run ui-kit-storybook:build-storybook`) — con corrección

> **Falso positivo corregido.** El primer intento reportó "build OK", pero al **revisar en el
> navegador** (preview MCP) las stories NO renderizaban: `MissingStoryFromCsfFileError`. El
> bundle compilado de cada story eran **172 bytes con el módulo vacío** (`...stories.ts(){}`):
> el `.storybook/tsconfig.json` tenía `"noEmit": true`, así que el compilador **no emitía** los
> exports CSF. "Build completado" ≠ "stories renderizan"; la verificación anterior fue incompleta.

- **Fix**: (1) quitar `noEmit` del tsconfig de Storybook; (2) dar al builder un **target de build
  Angular real** (`ui-kit-storybook:build`, `@angular-devkit/build-angular:browser`, `aot:false`
  `optimization:false`) referenciado por `browserTarget` — esto además habilita el **dev server**
  (`start-storybook` lo exige); (3) cargar los estilos vía el array `styles` de ese target
  (Angular procesa el SCSS de `apps/web/src/styles.scss` nativamente).
- **Verificado en navegador** tras el fix: el bundle de `empty-state` pasa a **12.9 KB** con
  `Default`/`WithCta`/`NoIcon`/`__namedExportsOrder`; la story `empty-state--default` renderiza
  el icono + "No hay elementos todavía." con la tipografía/colores del tema; `status-badge
  --all-kinds` pinta los **5** badges con los colores de `--ih-status-*`. Sin errores en consola.
- 4 stories: `status-badge` (5 kinds + AllKinds), `empty-state`, `loading`, `icon`; addon `a11y`.
- Scripts: `npm run storybook` (dev, :4400) y `npm run build-storybook` (estático).
- Regresión Nx verificada: `nx show projects` = `[sample-plugin, web-e2e, web]`, `nx build web`
  y `nx test web` (400/400) verdes con el `angular.json` presente.

### Follow-up

- Meter `catalog-list` en Storybook exigiría sanear el error de tipo latente de `core/providers`
  (y posibles cascadas bajo AOT estricta) o desacoplar su import del barrel de servicios; hoy
  se cubre en la galería in-app.
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
  **P2** (slots/outlets) ✅ · **P4** (Storybook real + catálogo in-app + dogfood en `/plugins`) ✅.
- Bonus: **familia Angular alineada a 21.2.17** (antes en patches mezclados 21.2.5/.7/.17).
