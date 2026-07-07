# Análisis — claim atómico distribuido de `process_execution` (pendiente #8, cluster-readiness)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Origen: app_htoh(55) #8. La transición global `PENDING → RUNNING` no es un claim atómico distribuido.

## Qué hace hoy el código (verificado)

- **Dispatcher** `BackgroundProcessExecutionDispatcher.pumpPendingExecutions` es un `@Scheduled(every 2s,
  concurrentExecution=SKIP)`. `SKIP` evita solapamiento **en el mismo nodo**; el scheduler simple de Quarkus **no es
  clustered** por defecto → en cluster **cada nodo** ejecuta el pump cada 2s.
- `dispatchPendingExecutions` está `synchronized(dispatchMonitor)` — un monitor **JVM-local**: serializa dentro de un
  proceso, no entre nodos.
- La reclamación es `ProcessExecutionStateService.markProcessRunningIfPending` (`@Transactional REQUIRES_NEW`):
  ```java
  var execution = repo.findById(id);
  if (execution == null || execution.status != PENDING) return false;
  execution.status = RUNNING;   // dirty-write JPA, flush al commit
  return true;
  ```
  Es **read-then-write**, NO un `UPDATE ... WHERE status='PENDING'` atómico ni un lock de fila (`SELECT ... FOR
  UPDATE`).
- `process_execution` (V1) = `id, process_definition_id, status, started_at, finished_at, details` (+ columnas
  posteriores de payload/trigger). **NO** hay `execution_owner`, `execution_token`, `execution_lease_until`,
  `execution_heartbeat_at`, `execution_attempt`.
- **No existe recuperación de RUNNING colgados**: ningún `@Scheduled` reencola un `process_execution` RUNNING
  huérfano (los schedulers son audit-spool, async-task, relay, suspension-expiry, scatter-recovery). Un nodo que cae
  mid-RUNNING deja su ejecución RUNNING para siempre.

## Veredicto

| Aspecto | Verdicto |
|---|---|
| Doble dispatch en cluster (dos nodos leen el mismo PENDING → ambos RUNNING → ejecutan 2x) | **REAL, solo cluster** |
| Bug en el despliegue single-node actual | **NO** (protegido por `synchronized` + `SKIP` en un solo JVM) |
| Recuperación de RUNNING huérfano | **No existe** (seguro: sin auto-reanudar; pero sin liveness) |

### Matiz money-path importante (defensa en capas ya existente)

El peor caso del doble-dispatch es un proceso con `MT101_PAY`. Pero tras **v51/v52** el envío está protegido a nivel de
**fragmento**, no solo de proceso:
- PAY correctivo: claim por-fragmento contra la revisión ACTIVE inmutable + ledger.
- PAY normal (v51): claim atómico `ARCHIVED → DISPATCHING` por página (un segundo run no reclama lo ya reclamado) +
  `UNCERTAIN` durable.

Por tanto, **aunque un proceso se despache dos veces en cluster, el segundo run NO reenvía** los fragmentos ya
reclamados/enviados: el doble-dispatch de proceso ya no es un P0 de doble-pago — es un problema de **corrección/eficiencia/
limpieza de auditoría** (dos ejecuciones compitiendo, trabajo duplicado no-idempotente en tareas NO money-path, ruido).
El claim distribuido lo cierra de raíz y habilita recuperación segura.

## Diseño propuesto (para cuando se adopte cluster)

1. **Migración**: añadir a `process_execution` → `execution_owner varchar`, `execution_token uuid/varchar`,
   `execution_lease_until timestamp`, `execution_heartbeat_at timestamp`, `execution_attempt int default 0`.
2. **Claim atómico** (reemplaza `markProcessRunningIfPending`):
   ```sql
   update process_execution
      set status='RUNNING', execution_owner=?, execution_token=?, execution_attempt=execution_attempt+1,
          execution_lease_until = now() + interval, execution_heartbeat_at = now(),
          started_at = coalesce(started_at, now())
    where id=? and status='PENDING';   -- 1 fila afectada = ganador; 0 = otro nodo lo tomó
   ```
   Solo el nodo cuyo UPDATE afecta 1 fila despacha. Sin `synchronized` entre nodos (queda como optimización local).
3. **Heartbeat**: el `ProcessExecutionRunner` renueva `execution_lease_until`/`execution_heartbeat_at`
   periódicamente mientras corre (patrón ya usado en el reproceso correctivo con `renewReservation`).
4. **Recuperación** (nuevo `@Scheduled`): reclama ejecuciones `RUNNING` con lease vencido (heartbeat stale). **PERO**
   con la regla de seguridad crítica:
   - si la ejecución **NO** había iniciado un efecto no-idempotente (PAY) → re-encolar (`PENDING`, nuevo token);
   - si **YA** había iniciado PAY (algún `MT101_PAY` en DISPATCHING/enviado, o fragmentos en DISPATCHING/SENT/UNCERTAIN)
     → **`NEEDS_RECONCILIATION`**, nunca re-ejecutar a ciegas. La resolución usa STATUS/RECONCILE (correctivo) o
     `resolve-uncertain-normal-pay` (v52) — que ya NO reenvían.
5. **Detección de "ya inició PAY"**: consultar si existe un `process_task_execution` de tipo `MT101_PAY` iniciado, o
   fragmentos del set en un estado post-claim. (Es la parte con más diseño.)

## Recomendación

- **No es un bug del despliegue actual** (single-node) y el doble-pago ya está mitigado a nivel de fragmento por
  v51/v52. Clasificarlo como **cluster-readiness**, no P0.
- Implementarlo **cuando se decida ir a multi-nodo** (o antes, si se quiere liveness: recuperar RUNNING huérfanos con
  la regla `NEEDS_RECONCILIATION`). Es un cambio mediano (migración + claim SQL + heartbeat + scheduler de
  recuperación + la detección de "ya inició PAY" + tests).
- Prerrequisito operativo: si se activa el scheduler de recuperación, definir el umbral de lease/heartbeat y la
  política de `NEEDS_RECONCILIATION` con el equipo de operación.

## Conclusión

El claim distribuido es **REAL pero de alcance cluster**, no un bug vigente. La garantía money-path "plan aprobado =
plan ejecutado" NO depende de él hoy: el claim por-fragmento (v51/v52) impide el doble-envío aun con doble-dispatch de
proceso. El valor del #8 es corrección/eficiencia en cluster + habilitar recuperación segura de ejecuciones huérfanas
con la regla estricta de no auto-reanudar un proceso que ya inició PAY.
