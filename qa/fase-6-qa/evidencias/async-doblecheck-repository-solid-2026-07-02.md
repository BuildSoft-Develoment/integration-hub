# Doble check async (Repository + SOLID) — 2026-07-02

Revisión del código async recién tocado (corrección de wire-format) contra Repository pattern +
SOLID. Objetivo: encontrar violaciones **reales**, no re-confirmar.

## Hallazgo real (corregido): serialización `AsyncTaskEnvelope ↔ JSON` DUPLICADA

Tras alinear el wire-format a *envelope-entero-JSON*, el mismo mapeo `envelope ↔ JSON` quedó en
**dos** clases:

- `JpaTaskOutboxStore` → `writeJson`/`readJson` (columna `envelope_json` del outbox).
- `AsyncTaskMessageCodec` → `writeJson`(privado)/`decode` (payload del wire).

Ambos hacían exactamente `mapper.writeValueAsString(envelope)` / `readValue(json, AsyncTaskEnvelope.class)`.
Como tras la corrección **el JSON almacenado == el JSON del wire**, tener dos copias del mapeo viola
**DRY** y ensucia el **SRP** del store: un adaptador de persistencia no debería "saber" el formato
de serialización del envelope.

### Corrección

- `AsyncTaskMessageCodec`: se expone `encode(envelope, mapper)` (antes `writeJson` privado) como
  **única fuente de verdad** de `envelope → JSON`; `toMessage` la reusa para el payload; `decode`
  sigue siendo el inverso.
- `JpaTaskOutboxStore`: **delega** en `AsyncTaskMessageCodec.encode/decode`; se eliminan sus
  `writeJson`/`readJson` privados y el import `JsonProcessingException`. El store queda con su SRP
  limpio: mapear entidad↔dominio, delimitar la transacción y derivar el lease. La (de)serialización
  vive en un solo sitio, compartido con el wire-format (el sidecar sin CDI también la reusa vía el
  mismo `AsyncTaskEnvelope` de `platform-contract`).

## Capa outbox re-verificada (sin cambios — mapea limpio a SOLID)

- `TaskDispatchOutboxRepository` (`PanacheRepository`) → **solo acceso a datos** (SQL `skip locked`,
  `claimDue`, `markSent/markRetry/markDead`, `existsByIdempotencyKey`). Repository pattern correcto.
- `JpaTaskOutboxStore` implementa el **puerto** `TaskOutboxStore` → adaptador (mapeo + TX + lease).
- `TaskDispatchRelayScheduler` / `TaskOutboxRelay` dependen del **puerto**, no del JPA → **DIP**.
- `AsyncTaskMessageCodec` = utilidad pura y estática (sin estado/CDI) → no aplica Repository; su
  responsabilidad (topic/key/payload del wire + `encode/decode`) es cohesiva.

## Hallazgo menor (no corregido — decisión consciente, no over-engineering)

`TaskDispatchPublisher` mantiene un ctor no-arg `this(new ObjectMapper())` para ergonomía de tests
(4 call-sites). Es una concesión leve al DIP, pero solo aplica en tests (en producción se inyecta el
`ObjectMapper` de CDI) y la serialización es trivial → no justifica tocar 4 tests. Se documenta y se
deja.

## Pruebas

- `AsyncTaskMessageCodecTest` 4/4, `TaskDispatchPublisherTest` 1/1, `TaskOutboxRelayTest` 4/4,
  `BrokerRemotePluginTransportTest` 4/4, `JpaTaskOutboxStoreTest` (IT Postgres) 3/3.
- **`BrokerRemotePluginTransportKafkaIT` 1/1** — el envelope-entero viaja y se decodifica sobre
  **Kafka real** (Testcontainers), confirmando que la consolidación no alteró el wire-format.
- Total: **16 unit + 1 Kafka IT verdes**. Sin cambios de comportamiento (solo se elimina duplicación).

## Estado

Duplicación de serialización eliminada; el mapeo `envelope ↔ JSON` es único y compartido. Sigue
pendiente la Etapa 2 (consumer in-process) sobre esta base ya consolidada.
