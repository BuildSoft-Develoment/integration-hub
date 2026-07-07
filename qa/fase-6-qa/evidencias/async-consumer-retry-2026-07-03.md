# Resiliencia del consumer async: retry in-app antes del nack — 2026-07-03

## Motivación (doble check del análisis DLQ)

`mp.messaging.incoming.tasks-in.failure-strategy=fail` y `AsyncTaskBrokerConsumer` hacía `nack` ante el
primer throw transitorio, **sin retry previo**. Bajo `fail`, un `nack` **detiene el canal `tasks-in`
entero** → un blip transitorio de BD/red **haltea todo el pipeline async** (todas las cadenas + tareas
once/scatter) hasta el restart. Transversal a todo el async, no solo la page-chain.

## Fix

**Retry in-app con backoff** antes del `nack` (`AsyncTaskConsumer.consumeWithRetries`): reintenta el
throw transitorio hasta `max-attempts` con backoff lineal; solo propaga (→ el adaptador nack-ea) si se
agotan. Así un blip corto se **ride-out** sin haltear el pipeline.

- Config: `tasks.async.consumer.max-attempts` (3) y `tasks.async.consumer.backoff-ms` (200, lineal ×intento).
- El adaptador `AsyncTaskBrokerConsumer` llama `consumeWithRetries`; `consume` (un intento) se mantiene
  para tests/E2E.
- Los desenlaces terminales (PROCESSED/DEAD/POISON/FAILED) **no** se reintentan (no lanzan).

## Decisión sobre el poison-guard (ACK-DEAD): NO se hace, por diseño

El inbox es terminal-only (sin contador de entregas). Un poison-guard que tras N intentos hiciera
**ACK-DEAD** sería **riesgoso bajo `fail`**: un transitorio largo (BD caída 1 min) daría **falso-poison**
→ mensaje perdido → cadena/tarea rota. En cambio, agotar los intentos y **nack** preserva la
recuperación por restart+redelivery. Un fallo **permanente** queda como **halt visible** del canal
(señal a ops via health/metrics), no un drop silencioso. Para auto-aislar poison a volumen, el modo
correcto es `dead-letter-queue` (el conector hace su propio retry+DLQ), documentado en la config.

## Pruebas

- **`AsyncTaskConsumerTest` 20/20** (+2): `retriesTransientFailureThenSucceeds` (falla 2 veces y a la
  3ra completa → PROCESSED, 3 llamadas) y `propagatesAfterExhaustingInAppRetries` (transitorio
  persistente → propaga, sin registro terminal → permite redelivery).
- **`AsyncTaskKafkaConsumerE2EIT` 1/1**: el adaptador `@Incoming` real (Kafka Testcontainers) alimenta
  `consumeWithRetries` y completa el proceso — el cambio del camino de transporte funciona E2E.

## Estado

Todo el pipeline async (once, scatter materializado, page-chain) es resiliente a transitorios cortos sin
haltear. Un fallo permanente halta visible (para ops) en vez de dropear. Queda (2): recuperación de la
page-chain rota bajo `dead-letter-queue`.
