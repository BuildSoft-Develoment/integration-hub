# UI/UX Etapa 2: badge de despacho async/scatter en el canvas — 2026-07-03

Aplica la Parte 2 de la propuesta: un indicador visual en el nodo del canvas (`process-flow-node`)
cuando la tarea se ejecuta async, distinguiendo offload per-task de scatter distribuido.

## Cómo

El nodo se pinta de `presentation` (por-tipo) + el modelo `ProcessFlowNode` (del mapper, que tiene la
task). El flag async sale del **config de la task**, así que se deriva en el mapper:

- **`ProcessFlowNode.dispatch`** (nuevo): `'async'` (offload per-task) | `'scatter'` (distribuido) |
  ausente (síncrono).
- **`ProcessFlowMapper.createNode`**: `dispatchFor(task)` parsea el config → `async===true` y
  `executionMode∈{batch,per-record}` ⇒ `'scatter'`; async + once ⇒ `'async'`; resto ⇒ ausente.
- **`process-flow-node`**: badge (icono de **rayo**) en la fila de identidad cuando `node().dispatch`;
  modificador `--scatter` (tono distinto) para el distribuido; `title`/`aria-label` con tooltip i18n
  (`flow.dispatchAsync` / `flow.dispatchScatter`).

Beneficio exacto de la propuesta: el operador ve de un vistazo qué pasos van al broker (rayo) y cuáles
se distribuyen (scatter, tono distinto), vs los síncronos (sin badge).

## Estándar

SVG inline (como los iconos existentes del nodo), i18n `i18n.t('flow.*')` (keys es/en), signals
`computed` para el tooltip. Sin dependencias nuevas.

## Pruebas (`nx test web --include=<spec>`)

- **`process-flow.mapper.spec`** (nuevo) **3/3**: async+once ⇒ `async`; async+batch/per-record ⇒
  `scatter`; sync / async:false / JSON inválido ⇒ sin badge.
- El build completo de la app compila el template del nodo con el badge (sin errores TS).

## Estado

Parte 2 cerrada. De la propuesta: Parte 1 (toggle en runtime-panel) y Parte 2 (badge) hechas; Parte 3
(reducción de riesgo operativo) ya existe en gran parte via `ActionDispatcherService`/`auditOperationRisk`
— recomendación: alinear ahí, no duplicar modals.

## Nota de reactividad

El badge se deriva al mapear (carga / re-map de la layout). Si se quisiera actualización **en vivo** al
togglear async en el panel sin re-map, habría que re-derivar `dispatch` en el store ante cambios de
config — follow-up menor; el badge ya es correcto en carga.
