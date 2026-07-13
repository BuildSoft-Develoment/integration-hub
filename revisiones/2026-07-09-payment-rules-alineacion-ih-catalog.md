# payment-rules — alineación al design system `ih-catalog` (opción B, full)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** feedback de UI del usuario — la pantalla `/#/payment-rules` no cumplía el estándar visual de las demás
pantallas de catálogo (p.ej. `/#/sources`).

## Diagnóstico

`sources` (y `audit`/`executions`/`schedules`) usan el design system compartido `ih-catalog-*`: `ih-catalog-grid` +
`mat-drawer-container`, toolbar (`ih-catalog-toolbar`), lista sobre el shell `ih-catalog-list` (header/estados/paginación/
teclado) y **editor en un drawer lateral** (`ih-managed-editor-shell`), con la lógica en un **store**.

`payment-rules` era un **componente monolítico** (~400 líneas) con editor inline en 2 columnas, filtros sueltos,
`mat-table` crudo y 163 líneas de CSS propio: **0** clases `ih-catalog-*`, **0** `mat-drawer`.

## Cambio (full alignment, solo frontend, sin tocar API/models)

Descomposición espejo de `sources`:
- **`PaymentRulesCatalogStore`**: dueño de lista, filtros, paginación, draft, drawer (vistas `edit`/`bulk`) e
  import/export. Preserva **toda** la lógica: guards de severidad E, arm/confirm de sobrescritura e import, clone,
  format JSON, export/copy/download.
- **`payment-rules-toolbar`**: `ih-catalog-toolbar` (título + Crear + Import/Export + filtros).
- **`payment-rules-list`**: shell `ih-catalog-list` con filas proyectadas (`ih-catalog-table-row`), chip de severidad,
  estado y acciones edit/clone/toggle. Fila clickeable → abre el editor.
- **`payment-rules-editor`**: drawer con `ih-managed-editor-shell` + header estándar; dos vistas (`edit` = formulario de
  la regla; `bulk` = import/export). Acciones custom para conservar el patrón arm/confirm.
- **page shell**: `ih-catalog-grid` + `mat-drawer-container`, provee el store y compone los sub-componentes.

Los componentes de presentación **inyectan el store** (fuente única de verdad), minimizando el prop-drilling.

## Bug encontrado y corregido en el camino

**NG8011**: al envolver los dos slots proyectados (`[editor-header]` + `[editor-form]`) en un `@if` con múltiples nodos
raíz, Angular **no** los proyectaba a los slots del shell → el editor no habría renderizado. Corregido con **un solo
shell**, header con inputs condicionales y un `<div editor-form>` que contiene el `@if` de vistas **adentro**.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `PaymentRulesCatalogStore` (unit, nuevo) | **4/4** | load con filtros default; rechaza JSON inválido antes de guardar; import requiere doble confirmación; toggle de severidad E se arma |
| `PaymentValidationRulesPageComponent` (smoke) | **1/1** | monta el árbol grid+toolbar+list+editor y dispara la carga inicial |
| Frontend `web` vitest | **521/521** | incl. paridad i18n en/es (4 claves nuevas de secciones) |
| `nx build web` | **OK, sin warnings** | typecheck de plantillas + TS; NG8011 resuelto |

**Pendiente de validación visual:** el usuario debe ver el render en `/#/payment-rules` tras un rebuild de Quinoa
(reinicio del dev app), ya que no hay navegador conectado para verificarlo automáticamente.
