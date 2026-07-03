# Async Etapa 2 — consumer in-process (núcleo puro + idempotencia) — 2026-07-02

Implementa el consumer de tareas asíncronas (ADR-015) espejando el patrón del `audit-consumer`
(**adaptador fino de broker + handler puro**) y el lado outbox (**Repository + puerto/adaptador**).
Sin broker vivo aún: el adaptador `@Incoming` (suscripción por patrón `tasks.*`) y la **continuación**
del proceso llegan en la Etapa 4. Cero impacto en la ejecución actual (nada invoca el handler todavía).

## Contrato del work-item local

Para ejecutar un **provider local** offloaded, `envelope.payload()` es el **JSON de la
`configuration`** que espera `TaskProvider.execute`; el `TaskContext` se reconstruye desde los
identificadores del envelope. (El transporte de plugin **remoto** usa su propio body enriquecido, que
consume el **sidecar**, no este handler — dos consumidores distintos, un solo wire-format de sobre.)

## Piezas (Repository + SOLID)

- **`AsyncTaskConsumer`** (handler puro, SRP): `decode → dedup → resolve → execute → registra outcome`.
  Depende solo del **puerto** `TaskInboxStore` + `TaskProviderRegistry` + `ObjectMapper` (DIP) → 100%
  testeable sin DB/broker.
- **`TaskInboxStore`** (puerto) + **`JpaTaskInboxStore`** (adaptador JPA: mapeo dominio↔fila + TX) +
  **`TaskInboxRepository`** (Panache, solo acceso a datos) → misma separación que el outbox.
- **`TaskInbox`** (entidad) + **`V79__task_inbox.sql`**: ledger de idempotencia con índice único
  **parcial** (`WHERE idempotency_key IS NOT NULL`) — las tramas POISON no participan del dedup.

## Semántica de reentrega (at-least-once) — sin caminos legacy

| Situación | Acción | Reentrega |
|---|---|---|
| Éxito (`TaskResult.success`) | registra `PROCESSED` (+ outputs para la continuación) | ACK |
| Fallo de **negocio** determinista (`failure`) | registra `FAILED` | ACK (reintentar no ayuda) |
| Tipo desconocido / config ilegible | registra `DEAD` | ACK |
| Trama indecodificable (sin sobre) | registra `POISON` (DLQ) | ACK |
| Fallo **transitorio** (excepción de `execute`) | **no** registra nada | **nack → reentrega** |
| Reentrega de una clave ya terminal | descarta | ACK (dedup) |
| Suspensión dentro del consumer | `DEAD` explícito (requiere continuación, Etapa 4) | ACK |

La carrera del índice único (dos consumers, misma clave) se degrada a **duplicado sin excepción**
(flush-in-try en el adaptador): el efecto queda asentado una sola vez.

## Pruebas

- **`AsyncTaskConsumerTest`** (unit, fake inbox + registry mockeado): **8/8** — éxito registra
  outputs + pasa config/contexto correctos; duplicado **no** ejecuta el provider; tipo desconocido →
  DEAD; fallo de negocio → FAILED; fallo transitorio **propaga** y no registra nada; suspensión →
  DEAD; POISON registra el payload crudo; config malformada → DEAD.
- **`JpaTaskInboxStoreTest`** (IT Postgres real): **4/4** — registrar hace dedup; duplicado se traga
  sin excepción; DEAD también es terminal; POISON no dedupea. Migración **V79** aplicada.
- Resto del paquete async sin regresión: codec 4, publisher 1, relay 4, planner 6, idempotency 4,
  retry 3, brokerRemote 4. **Total: 34 unit + 7 IT verdes.**

## Estado

Núcleo del consumer listo y probado, inerte en producción. Pendiente **Etapa 4**: (1) adaptador de
broker (`@Incoming` con patrón `tasks.*`, gated) que delega en `AsyncTaskConsumer`; (2) continuación
*complete-from-external-result* que reanuda el proceso con el `outputs_json` registrado — nuevo camino
de motor (el `resume()` actual re-invoca al provider, no sirve para un resultado ya calculado).
