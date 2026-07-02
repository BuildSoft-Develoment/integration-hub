# Evidencia: kit publicable `@integration-hub/plugin-ui-kit` - 2026-07-02

## Motivación (habilita al autor externo)

Un autor de plugin **externo** trabaja en su propio repo, no en este monorepo. Hasta ahora el
UI kit era una lib de *workspace* (`@integration-hub/shared/ui`, path de tsconfig): **no
instalable desde fuera** y Native Federation la **empaquetaba** por remote (sin dedupe como
singleton). Este es el gap que impedía consumir el kit desde fuera.

## Qué se hizo

Se extrajo un **subconjunto curado** (las 4 primitivas presentacionales autocontenidas) a una
lib Angular **publicable** con ng-packagr:

- **`libs/plugin-ui-kit`** (`@integration-hub/plugin-ui-kit`, v0.0.1): `StatusBadgeComponent`,
  `EmptyStateComponent`, `LoadingComponent`, `IconComponent` (+ tipos `StatusBadgeKind`,
  `IhIconName`). Peer deps: `@angular/core`/`common`/`material`. **Autocontenido** (sin deps
  `@integration-hub/*`), por eso es publicable.
- Los componentes se **movieron** con `git mv` (historial preservado); los 6 imports internos
  relativos de `shared/ui` se reapuntaron al paquete, y el **barrel `shared/ui` los
  re-exporta** (`export * from '@integration-hub/plugin-ui-kit'`) → **el resto de la app no
  cambia** (sigue importando por `@integration-hub/shared/ui`).
- **`catalog-list` NO se extrajo**: depende de `I18nService` (grafo de servicios de plataforma),
  que rompería la autocontención del paquete. Se queda en `shared/ui` / galería in-app.
- **`sample-plugin`** (el autor externo de referencia) ahora importa de
  `@integration-hub/plugin-ui-kit` y lo comparte como **singleton** en `federation.config.js`
  (una instancia + un set de tokens entre host y remotos, sin bundle por remote).

## Pruebas (todas verdes)

- **`nx build plugin-ui-kit`**: OK con ng-packagr → `dist/libs/plugin-ui-kit` (formato Angular:
  FESM + `.d.ts` + `package.json`). **El paquete se construye como distribuible.**
- **`nx build web`**: OK — el re-export del barrel resuelve; la app compila igual.
- **`nx test web`**: **400/400** (84 files) — el spec de `status-badge` sigue corriendo desde su
  nueva ubicación (`libs/**/*.spec.ts`).
- **`nx build sample-plugin`**: OK — el **path del autor externo** (import del paquete +
  federation singleton) compila y genera los artefactos de federación.
- **Storybook**: rebuild OK, 13 stories; **verificado en navegador** que renderizan
  (`status-badge--all-kinds` pinta los 5 badges, sin `MissingStoryFromCsfFileError`). Se
  actualizaron los globs de `main.ts`/`tsconfig` a `libs/plugin-ui-kit`.
- Salud del stack dev `:8080`: **200**.

## Alcance / follow-up

- **Publicar** el paquete a un registry (npm/privado) es un paso de **ops** (fuera de este
  cambio de código); el paquete ya queda listo (`package.json` con name/version/peerDeps + build).
- Segundo gap del autor externo: **publicar el Storybook estático como sitio de docs** (por CI)
  para que sea navegable sin este repo.
- Posible ampliación: extraer también `catalog-list` desacoplando su i18n (inyección opcional)
  si se quiere en el paquete.
