# Análisis — estado de disponibilidad async real (madurez de plataforma, app_htoh 55)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: la UI de tareas asíncronas consulta `GET /api/messaging/async-status` para avisar si `async:true` tomará
efecto. app_htoh(55) señaló que ese estado no confirma la disponibilidad **real** (relay/broker/consumer) y que la UI
debe **fallar cerrada**.

## Estado hoy (verificado)

`MessagingTransportsResource.asyncStatus()` devuelve **solo** `AsyncStatus(executionEnabled)` — el flag
`tasks.async.execution.enabled` (default `false`). **No** refleja:

- **`tasks.dispatch.enabled`** (default `false`) — gatea el **relay** (`TaskDispatchRelayScheduler`: `if (!enabled)
  return`). Si `execution.enabled=true` pero `dispatch.enabled=false`, las tareas se despachan al **outbox** pero
  **nunca se relayan** al broker → el proceso queda suspendido/atascado. El endpoint reporta "async enabled" igual.
- **Disponibilidad del broker**: `MessageBrokerRegistry.availableTypes()` lista brokers **registrados** (hay bean
  provider), no **conectados/sanos** — no hay probe de conectividad expuesto.
- **Estado del consumer**: no hay señal de consumer online.

**Conclusión del gap:** el estado async es **un solo flag de config**, no una disponibilidad compuesta. La UI puede
mostrar "async disponible" mientras el camino async está roto (relay off → outbox atascado; broker caído; consumer
offline). Es **operabilidad/UX**, no correctitud (no corrompe ni duplica).

## Diseño propuesto

### Paso bounded (recomendado) — agregación de señales baratas
Extender `AsyncStatus` con lo que ya está disponible en el backend sin probes nuevos:
- `executionEnabled` (`tasks.async.execution.enabled`) — ya está.
- `dispatchEnabled` (`tasks.dispatch.enabled`) — el gate del relay.
- `brokersRegistered` (`!brokers.availableTypes().isEmpty()`).
- `state` derivado:
  - **`DISABLED`** si `!executionEnabled` (async off; corre síncrono — el significado actual del flag único).
  - **`DEGRADED`** si `executionEnabled` pero (`!dispatchEnabled` o sin brokers) → async on pero no entregará
    (outbox se atascaría). **Fail-closed**: la UI trata DEGRADED como "async no plenamente operativo".
  - **`READY`** si `executionEnabled && dispatchEnabled && brokersRegistered`.

Cierra el "un flag engaña" con coste mínimo (dos flags de config + el registry). No rompe el contrato (campo `state`
nuevo + los flags; `executionEnabled` se conserva).

### Versión completa (diferida) — health en vivo
Para `BROKER_UNAVAILABLE`/`CONSUMER_OFFLINE` reales hace falta: probe de conectividad del broker (Redis/RabbitMQ/JMS),
heartbeat del consumer, y "last-ran" del relay. Son señales de health **por componente** que hoy no existen → proyecto
mayor. Se recomienda diferirlo; el paso bounded ya evita el falso "READY".

### Frontend (nota)
La UI debe **fallar cerrada** también ante error de fetch del endpoint (tratar desconocido como no-READY). Es un
cambio pequeño de FE, fuera del alcance de este análisis backend.

## Veredicto

Gap **REAL de operabilidad/UX** (no money-path): el estado async refleja un flag, no la disponibilidad compuesta. El
**paso bounded** (agregar `dispatchEnabled` + `brokersRegistered` + `state` DISABLED/DEGRADED/READY) es barato y cierra
el falso "async disponible" cuando el relay/broker no entregarían. El health en vivo (broker/consumer) queda diferido.
