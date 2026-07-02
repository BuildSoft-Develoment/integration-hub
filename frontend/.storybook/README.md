# UI kit — dos visores, roles distintos

El UI kit tiene **dos visores complementarios**. No es duplicación: cada uno cubre algo que el
otro no puede. Elige según la tarea. (Las primitivas presentacionales viven en el paquete
publicable `@integration-hub/plugin-ui-kit`; `catalog-list` y demás en `@integration-hub/shared/ui`.)

| | **Storybook** (esta carpeta) | **Galería in-app** (`/#/ui-kit`) |
|---|---|---|
| Dónde | Herramienta de desarrollo, fuera de la app | Dentro del producto (una ruta, gated `admin`) |
| Para qué | Desarrollar/aislar un componente, tocar sus inputs (Controls) y **auditar accesibilidad** (addon axe) | Referencia **en producto**: ver el kit vivo, con **modo oscuro** real (toggle del shell) |
| Componentes | Presentacionales de hoja: `status-badge`, `empty-state`, `loading`, `icon` | **Todos, incl. `catalog-list`** con su DI/servicios reales |
| Cómo | `npm run storybook` (dev, :4400) · `npm run build-storybook` (estático) | Login en la app → `/#/ui-kit` o el enlace "UI kit" en `/plugins` |

## ¿Por qué `catalog-list` no está en Storybook?

`catalog-list` importa el barrel `@integration-hub/core/services`, que arrastra todo el grafo de
servicios (`core/providers`). Bajo la AOT estricta de Storybook eso destapa un error de tipo
**latente y preexistente** en `core/providers`, ajeno al kit. En vez de tocar código de app para
forzar una story, ese componente (que además vive de su DI) se muestra en la galería in-app.

## Notas de configuración (no obvias)

- Storybook 10 para Angular **exige un builder de Angular CLI** → hay un `angular.json` mínimo con
  el proyecto `ui-kit-storybook` (Nx lo ignora: `nx show projects` sigue en `[sample-plugin,
  web-e2e, web]`).
- El target `ui-kit-storybook:build` usa `aot:false`/`optimization:false`. **No lo pongas en
  AOT/optimización ni añadas `noEmit` al `tsconfig`**: eso elide los exports CSF y las stories
  dejan de renderizar (bundle vacío → `MissingStoryFromCsfFileError`).
- Los tokens `--ih-*` + tema Material se cargan por el array `styles` de ese target (no por
  `import` en `preview.ts`, que sin sass-loader falla al parsear el SCSS).
