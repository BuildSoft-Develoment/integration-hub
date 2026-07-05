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

## Diseño propuesto (bounded, sin reenvío)

1. **Guard de resolución** (repositorio): contar fragmentos de la ejecución aún sin resolver
   (`select count(*) from mt101_build_fragment where process_execution_id = ? and status in ('UNCERTAIN','DISPATCHING')`).
   0 ⇒ todos los fragmentos alcanzaron un estado terminal.
2. **Servicio** `closeReconciledExecution(processExecutionId, executedBy, reason)`:
   - exige `status == NEEDS_RECONCILIATION`;
   - si aún hay fragmentos `UNCERTAIN`/`DISPATCHING` → **rechaza** (hay que resolverlos primero por STATUS/RECONCILE);
   - si todos resueltos → cierra: `COMPLETED` si no hubo `REJECTED`, o `COMPLETED_WITH_ERRORS` si hubo algún
     `REJECTED` (usa las transiciones existentes). Audita el cierre (quién, motivo, conteos).
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
