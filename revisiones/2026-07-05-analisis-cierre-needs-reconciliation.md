# Análisis — cierre del ciclo de vida de `NEEDS_RECONCILIATION` (follow-up de v53)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: v53 añadió la recuperación de ejecuciones huérfanas (lease vencido). Una que **ya inició PAY** pasa a
`NEEDS_RECONCILIATION` (nunca re-ejecución a ciegas). Falta el flujo que **cierra** ese estado tras reconciliar.

## Estado hoy (verificado)

- `ExecutionStatus.NEEDS_RECONCILIATION` solo se **escribe** (en `recoverExpiredExecutions`); nadie lo **lee** salvo
  como estado de consulta (`ExecutionQueryResource` / `ProcessExecutionResource` lo exponen).
- **No existe** endpoint ni servicio que transicione un `process_execution` desde `NEEDS_RECONCILIATION` a un estado
  terminal. Existen `ProcessExecutionStateService.completeProcess` / `completeProcessWithErrors` / `failProcess`, pero
  ninguno se invoca para cerrar una reconciliación.
- Enlace ejecución↔fragmentos: `mt101_build_fragment.process_execution_id` (los fragmentos normales llevan el id de
  la ejecución que los creó). Así, dado un `process_execution`, se pueden consultar sus fragmentos y su estado.

**Conclusión del gap:** una ejecución en `NEEDS_RECONCILIATION` es un **callejón sin salida en el motor**: tras
resolver sus fragmentos (por `resolve-uncertain-normal-pay` v52 o el correctivo), el `process_execution` queda en ese
estado para siempre. Es seguro (no re-ejecuta), pero incompleto operativamente. Es la contraparte natural de v53:
v53 marca la reconciliación pendiente; falta cerrarla.

## Corrección del doble-check — el guard NO puede ser solo UNCERTAIN/DISPATCHING

La recuperación (v53) marca `NEEDS_RECONCILIATION` si existe un `process_task_execution` de `MT101_PAY` **iniciado**
(`hasStartedTaskType`). "PAY iniciado" **no** implica "PAY envió". Un PAY que arrancó pero cayó **antes de enviar**
deja fragmentos en `ARCHIVED` (nunca despachados). Si el guard solo contara `UNCERTAIN`/`DISPATCHING`, esos casos
darían 0 sin-resolver y el cierre marcaría `COMPLETED` **con pagos jamás enviados** → falso-completado. **Bug evitado.**

Guard correcto: exigir que **todos** los fragmentos de la ejecución estén en un estado **terminal de despacho**
(`SENT` / `REJECTED` / `SUPERSEDED`), es decir que **ninguno** siga en un estado no-terminal
(`BUILT` / `VALIDATED` / `ARCHIVED` / `ROUTED` / `DISPATCHING` / `UNCERTAIN`). Un fragmento `ARCHIVED` (pendiente de
enviar) **bloquea** el cierre: el operador debe completar el envío (re-ejecutar / re-despachar) o resolver el
incierto antes de cerrar.

## Diseño propuesto (bounded, sin reenvío)

1. **Guard de terminalidad** (repositorio): contar fragmentos de la ejecución en estado NO terminal
   (`select count(*) from mt101_build_fragment where process_execution_id = ? and status not in
   ('SENT','CONFIRMED','RECONCILED','REJECTED','SUPERSEDED')`). El conjunto terminal coincide con el
   `NON_REPROCESSABLE` del reproceso (`SENT/CONFIRMED/RECONCILED/SUPERSEDED`) más `REJECTED`. 0 ⇒ todos los fragmentos
   alcanzaron un terminal; >0 ⇒ hay pendientes (ARCHIVED sin enviar, o UNCERTAIN/DISPATCHING sin resolver) → no se
   puede cerrar.
   - Requiere que `mt101_build_fragment.process_execution_id` esté poblado (lo está en el flujo normal;
     documentar el supuesto).
2. **Servicio** `closeReconciledExecution(processExecutionId, executedBy, reason)`:
   - exige `status == NEEDS_RECONCILIATION` (los métodos de cierre existentes NO asertan estado, así que el guard
     vive aquí);
   - si hay fragmentos no-terminales → **rechaza** con el detalle de cuántos y en qué estado;
   - si todos terminales → cierra: `COMPLETED` si no hubo `REJECTED`, o `COMPLETED_WITH_ERRORS` si hubo algún
     `REJECTED` (reusa `completeProcess`/`completeProcessWithErrors`). Audita el cierre (quién, motivo, conteos).
   - **nunca** re-ejecuta ni reenvía; solo cierra el estado del motor tras la reconciliación de datos.
3. **Endpoint** `POST /api/process-executions/{id}/close-reconciled?reason=` (roles operador/admin).

### Notas
- Un `DISPATCHING` nunca-enviado (crash pre-envío que el gateway no confirma) **bloquea** el cierre — correcto: es
  genuinamente irresuelto; el operador debe re-armarlo o decidir manualmente antes de cerrar.
- Una ejecución puede tener más de un `fragment_set` (correctivos derivados). El guard por `process_execution_id`
  cubre los fragmentos normales de esa ejecución; los sets correctivos derivados tienen su propia ejecución/ciclo.

## Viabilidad

- **Bounded**: un count en el repositorio + un método de servicio que reusa las transiciones de cierre existentes +
  un endpoint + tests. Sin migración (usa columnas/estados existentes).
- **En la línea money-path**: completa el ciclo de vida abierto por v53 sin tocar el envío (nunca reenvía).
- Frecuencia baja (solo se alcanza `NEEDS_RECONCILIATION` tras un huérfano recuperado con PAY iniciado), pero
  necesario para operabilidad una vez activa la recuperación en cluster.

## Veredicto

Gap **REAL** de operabilidad (no de doble-envío): sin este flujo, una ejecución reconciliada no tiene salida del
estado `NEEDS_RECONCILIATION`. La solución es bounded y espeja el patrón de resolución (verificar datos resueltos →
cerrar estado, sin reenviar). Recomendado como cierre natural de v53.
