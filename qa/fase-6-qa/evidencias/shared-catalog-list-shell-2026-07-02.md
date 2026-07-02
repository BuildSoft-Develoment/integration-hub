# Evidencia P1: shell de catálogo compartido `ih-catalog-list` - 2026-07-02

Primer paso de la mejora UI/UX: extraer el "shell" duplicado de los catálogos de features a
un componente reutilizable, a11y-first. Elimina el boilerplate (header sortable, estados,
paginación y **navegación por teclado**) que estaba copiado en 7-9 componentes `*-list`.

## Hallazgo que lo motiva

Los 9 `*-list` (audit, connection, execution, execution-task, process, process-task, reader,
schedules, source) **no son tablas planas**: son catálogos ricos con header sortable, filas
`<button>` con roving-tabindex, selección, avatar/copy y estados. **7 de 9 duplicaban** la
navegación por teclado (`HostListener`/ArrowUp-Down/focusedIndex).

## Diseño

- `CatalogListComponent` (`ih-catalog-list`, en `shared/ui`): aporta
  - header sortable declarativo (config `columns` con `labelKey`/`sortKey`, `aria-sort`),
  - estados loading (skeleton) / error (con retry) / empty (`ih-empty-state`),
  - paginación (`mat-paginator`),
  - **roving-tabindex por teclado** (ArrowUp/Down enfocan `[data-row-index]`),
  - foco visible en headers.
- Las **filas ricas se proyectan** (`<ng-content>`), conservando el render por feature.
- Alineación de columnas header↔filas por **custom property heredada** `--ih-catalog-columns`
  (set desde `gridColumns`), sin acoplar vistas.

## Migración de prueba: readers

- `reader-list` pasa a usar `ih-catalog-list`: se eliminan el header manual, los estados, el
  paginador, la navegación por teclado y el CSS de sort (ahora en el shell). Conserva el render
  de fila (avatar + chip de tipo + estado). Comportamiento idéntico.

## Pruebas

### Unit (`npx nx test web`)

- **PASS. Test files: 81. Tests: 391** (+7 del shell: headers sortable + aria-sort, emisión de
  sort, proyección de filas, estados empty/loading/error+retry, roving por teclado).
- La migración de readers compila y sus stores/tests siguen verdes.
- Build de producción: `npx nx build web` **OK** (compila limpio bajo native-federation).

### e2e (Playwright, chromium, stack real)

- Suite completa: **9 passed (1.8m)**.
- Nuevo test "renders the readers catalog on the shared catalog-list shell": en `/#/readers`
  verifica `ih-catalog-list`, los `columnheader` (Nombre/Tipo) y el frame del catálogo.

## Estado: P1 COMPLETO

Los **7 catálogos** están migrados al shell (commits sucesivos):
readers, sources, processes, schedules, executions, audit y connections.

- `connections` requirió extender el shell con un **slot de bulk-select** (checkbox
  "seleccionar todo" en el header + `selectable`/`allSelected`/`someSelected`/`toggleSelectAll`);
  la fila conserva su checkbox por elemento. La columna se inserta ajustando `gridColumns`.
- `execution-task`/`process-task` no son el patrón de catálogo (listas anidadas) — fuera de alcance.
- Validación acumulada: **unit 392/392** (shell +8), **build de producción OK**, **e2e catálogos 7/7**
  (readers/sources/processes/schedules/executions/audit/connections contra el app real).

## Siguientes (roadmap P1→P3→P2)

- **P3**: empaquetar el shell + form-kit (`managed-editor`) + design tokens como un
  `plugin-ui-kit` para que los plugins remotos externos consigan el look-and-feel nativo.
- **P2**: sistema de *slots/outlets* para que los plugins enriquezcan páginas existentes.
