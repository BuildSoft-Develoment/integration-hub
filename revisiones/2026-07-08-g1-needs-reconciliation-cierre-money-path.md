# G1 — cierre del money-path en `NEEDS_RECONCILIATION` (dinero ambiguo nunca queda COMPLETED silencioso)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis "resolveNormalPay obligatorio" (validado + doble-check contra código real).

## Hueco cerrado (revelado por el doble-check)

El análisis pedía un validador de definición que obligara a un STATUS/RECONCILE resolutor. El **doble-check corrigió
dos hechos** y reorientó la solución:

1. El estado actual de un `MT101_PAY` normal que deja `UNCERTAIN` **no** era `COMPLETED_WITH_ERRORS`. El motor
   ([ProcessExecutionService](../platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessExecutionService.java))
   hacía:
   - `continueOnFailure=false` (default) → `failProcess` → **`FAILED`** (opaco, parece error de infra) y **el STATUS
     posterior nunca corre**;
   - `continueOnFailure=true` → `completeProcess` → **`COMPLETED` silencioso con dinero UNCERTAIN pendiente** 🔴.
2. Para que un `MT101_STATUS(resolveNormalPay=true)` posterior corra tras un UNCERTAIN, el PAY **debe** llevar
   `continueOnFailure=true` — si no, `failProcess` detiene el proceso antes.

Un validador de definición **no cierra** esto (es estático, no clasifica normal/correctivo —`correctivePayRunId` es
runtime— y es bypasseable importando procesos). La solución correcta es **en runtime**: el motor no debe cerrar
`COMPLETED`/`FAILED` una ejecución con dinero ambiguo → la enruta a **`NEEDS_RECONCILIATION`** (estado que ya tiene
ciclo de cierre, v53/v54).

## Cambio (SOLID, señales genéricas, sin acoplar el motor a MT101)

- **`TaskResult.needsReconciliation(details, outputs)`** (SPI): señal genérica de "resultado no-exitoso con dinero
  ambiguo". Cualquier provider de money-path puede emitirla; el motor no conoce MT101.
- **`TaskResult.resolvedReconciliation(details, outputs)`** (SPI, opción B): señal <b>exitosa</b> de un resolutor que
  resolvió TODA la ambigüedad previa → el motor <b>limpia</b> el flag (el proceso puede cerrar `COMPLETED`).
- **`TaskRunResult`** (wrapper del motor): propaga ambas señales desde el `TaskResult` del provider.
- **`Mt101PayTaskProvider`**: si `uncertainCount > 0` → `needsReconciliation` (antes: `failure`). Un `REJECTED` sin
  UNCERTAIN sigue siendo `failure` (fallo de negocio probado); éxito solo si todo `SENT`.
- **`Mt101StatusTaskProvider` (`resolveNormalPay`)**: tras resolver, señaliza — todo cerrado (0 pending, 0 conflicts, 0
  gatewayErrors) → `resolvedReconciliation` (limpia el flag → `COMPLETED`); si queda algo ambiguo →
  `needsReconciliation` (el proceso queda `NEEDS_RECONCILIATION`, cubre también un STATUS ejecutado standalone).
- **Motor** ([ProcessExecutionService](../platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessExecutionService.java)):
  flag `executionNeedsReconciliation`. En el bloque de no-éxito, si `needsReconciliation`: la tarea queda
  `COMPLETED_WITH_ERRORS` (no `FAILED`); con `continueOnFailure` sigue el pipeline (el resolutor posterior puede correr)
  y el terminal se decide al final; sin él, cierra ya. En el camino de éxito, si `reconciliationResolved` → limpia el
  flag. Al final del pipeline, si el flag sigue activo → `markNeedsReconciliation` en vez de `completeProcess`.
- **`ProcessExecutionStateService.markNeedsReconciliation`**: transición terminal a `NEEDS_RECONCILIATION` guardada por
  token+RUNNING (fencing), igual que los demás terminales. Reusa el cierre existente (`closeReconciled`).

**Sin bandera ni camino legacy:** se cierra el hueco en runtime, pase lo que pase con la config del diseñador; no se
puede bypassear importando procesos. No quita gobierno (marca, no auto-resuelve).

**Doble-check (opción B):** el flag NO es "pegajoso": si un resolutor (STATUS con `resolveNormalPay`) resuelve toda la
ambigüedad en la MISMA ejecución, limpia el flag y el proceso cierra `COMPLETED` — no queda un falso
`NEEDS_RECONCILIATION`. Si el resolutor deja algo pendiente, o corre standalone y encuentra dinero incierto, el proceso
queda `NEEDS_RECONCILIATION`. Fallo seguro: solo se limpia con prueba de resolución total.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `ProcessExecutionFailurePropagationIT` | **5 / 0 / 0** | +3 G1 (Postgres real, motor completo): dinero ambiguo default → **`NEEDS_RECONCILIATION`** + detiene downstream; con `continueOnFailure` → downstream corre pero **igual `NEEDS_RECONCILIATION`**; **resolutor que resolvió todo → limpia el flag → `COMPLETED`** (opción B) |
| `Mt101StatusTaskProviderTest` | **24 / 0 / 0** | `resolveNormalPay`: pending/conflicts restantes → `needsReconciliation`; todo resuelto → `resolvedReconciliation` |
| `Mt101PayDirectListDurableTest` | **4 / 0 / 0** | `MT101_PAY` con UNCERTAIN emite `needsReconciliation` |
| Regresión completa `platform-app` | **(ver corrida)** | el cambio toca el motor central (TaskResult/TaskRunResult/ProcessExecutionService/StateService/StatusProvider) — regresión de módulo verde |

## Alcance / descartado (coherente con el doble-check)

- **Descartado el validador de definición (G2):** estático, no clasifica normal/correctivo (`correctivePayRunId`
  runtime), bypasseable, y **no cierra correctitud** (G1 lo cubre en runtime). El flag mandatorio-por-defecto sigue
  descartado (quita gobierno).
- **No abordado (borde):** un `DISPATCHING` colgado por crash de un run PREVIO ya lo cubre la recuperación de lease
  huérfano (v53 → `NEEDS_RECONCILIATION`). G1 cubre el UNCERTAIN de ESTE run.

- **Borde aceptado y documentado (flag global vs. resolución por set):** el flag `executionNeedsReconciliation` es
  global por ejecución, pero la resolución del STATUS es por `fragmentSetId`. Si en la MISMA ejecución `PAY(setA)` deja
  UNCERTAIN y un `STATUS(resolveNormalPay, setB)` resuelve un set **distinto** por completo, limpia el flag y el proceso
  cierra `COMPLETED` aunque `setA` siga UNCERTAIN. **Sin impacto de money-safety:** `setA` sigue durable-UNCERTAIN y
  **excluido de re-PAY** (`FRAGMENT_READ_STATUSES=["ARCHIVED"]`) → nunca doble pago; el único efecto es la semántica del
  estado del proceso, y **solo** bajo esa misconfiguración. La topología correcta (STATUS usa el **mismo** set que pagó
  PAY, derivado del build/archive upstream) no lo dispara — es la "Regla 2" (mismo set/ruta) que el validador de
  definición diferido (G2) haría cumplir. **Decisión:** aceptado; un tracking de reconciliación por-scope sería
  desproporcionado (misconfiguración, sin doble-pago) y acoplaría el motor a la semántica de sets.
- **Async/scatter:** `MT101_PAY` corre síncrono en el loop ordenado (no scatter); la señal viaja por el camino
  síncrono. El camino async no ejercita PAY.
