# F2 — Progreso en vivo en el detalle de ejecución (frontend) — 2026-07-04

## Objetivo
Dar visibilidad del avance de una ejecución a escala (1M+): en vez de solo el estado terminal, mostrar
progreso por tarea en vivo consumiendo `GET /api/query/process-executions/{id}/progress` (ADR-015).

## Alcance entregado
- **`ExecutionApiService.progress(id)`** + modelos `ExecutionProgress`/`TaskScatterProgress`/
  `SyncTaskProgress`/`DlqPipelineSummary` (espejo del backend).
- **Polling en `ExecutionDetailStore`** (capa de datos, no en el editor presentacional — corrección del
  doble check del análisis): `effect` reactivo a `selectedExecutionId` + `drawerOpen`; tick silencioso
  (sin spinner) que refresca detalle+tareas+progreso; **se auto-detiene al llegar a estado terminal** y
  **re-apunta solo** al navegar entre ejecuciones relacionadas; corta al cerrar el drawer. Fetch inicial
  best-effort al abrir; reset del progreso al cambiar de ejecución.
- **Render inline en el tab Tasks** (`ih-execution-task-list`), correlacionado por `taskDefinitionId`:
  scatter materializado → barra `%` determinada; scatter streaming (`percent=null`) → **indeterminada**
  (sin % ni ETA falsos); sync → contador `recordsProcessed` (barra indeterminada solo si la tarea corre);
  sin record → sin barra. **Chip de salud del pipeline** (DlqSummary) con enlace a la consola DLQ (F1).
- i18n `executions.progress.*` (es/en).

## Doble check con e2e — bug real encontrado
El e2e Playwright destapó un **hueco de integración** que los unit tests aislados no veían: el `progress`
estaba enhebrado en el viewModel, en el input del editor y en el task-list, **pero faltaba el binding
`[progress]="viewModel().editor.progress"` en el elemento `<ih-execution-editor>` de la página** → el input
quedaba en null y no renderizaba nada. Corregido. (Este es exactamente el valor del e2e: un fallo de
cableado página→editor que el unit del store y del task-list, correctos por separado, no podían detectar.)

## Pruebas
- **Unit** (`nx test web`, 10/10):
  - `ExecutionDetailStore` (5): carga+drawer, **progreso al seleccionar**, **reset al cambiar de ejecución**,
    navegación de linaje, refresh por id.
  - `ExecutionTaskListComponent` (5): correlación scatter/sync por `taskDefinitionId`, streaming
    indeterminado (percent null), salud del pipeline + conteo, sin-progreso no correlaciona.
- **Build** `nx build web` OK (incluye el binding y el fix de tipo `total ?? 0`).
- **Live API**: `GET /process-executions/{id}/progress` → HTTP 200 con la forma exacta
  `{executionId, scatterTasks[], syncTasks[], pipeline{}}` contra el stack real (token Keycloak admin).
- **E2E Playwright** (`apps/web-e2e`, "shows live progress in the execution detail"): mockea `/tasks` y
  `/progress` (lista real), abre el drawer, tab Tareas, expande paneles y asegura barra `75%`, contador
  `420000 registros procesados` y el chip de salud. Corriendo contra Quinoa (:8080) validó render del
  drawer/tabs/tareas y destapó el binding faltante (ya corregido). Runs posteriores cayeron en la
  inestabilidad conocida de Quinoa (rebuild) / Keycloak; el spec queda para CI (front construido en el
  mismo origen). Lint web-e2e limpio.

## Pendiente
- F3: tile de salud async en overview (reutiliza `AsyncDlqApiService`).
