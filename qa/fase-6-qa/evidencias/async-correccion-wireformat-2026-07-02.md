# Corrección: wire-format async = envelope entero como payload - 2026-07-02

## Qué destapó el doble check

Mi Etapa 2 (codec lossless + `decode`-desde-headers) estaba construyendo sobre un wire-format
**divergente** del patrón probado:

- **Audit** (producción): publica el `AuditEnvelope` **entero** como payload, headers vacíos;
  consume con `objectMapper.readValue(payload, AuditEnvelope.class)`.
- **Sidecar** (referencia): `handle(AsyncTaskEnvelope envelope, …)` — espera el **envelope entero**.
- **Mi `AsyncTaskMessageCodec`**: payload = solo `envelope.payload()` (work-item), metadata en
  **headers**, `decode` reconstruyendo desde headers → **ningún consumer real lo usa así**.

Además, era una **inconsistencia latente real**: `BrokerRemotePluginTransport` publicaba
(work-item + headers) pero el sidecar espera el envelope entero → **incompatibles** (el sidecar no
podría reconstruir el envelope). Aún no mordía porque no hay consumer cableado.

## Corrección

- **`AsyncTaskMessageCodec.toMessage(envelope, mapper)`**: payload = **envelope entero** (JSON),
  headers **vacíos**, `topic = tasks.<type>`, `key = idempotencyKey`. Alineado con audit/sidecar.
- **`decode(payload, mapper)`** = `readValue(payload, AsyncTaskEnvelope.class)` — trivial, lossless.
  Se descartó el `decode`-desde-headers.
- **`TaskDispatchPublisher`** inyecta `ObjectMapper` (+ ctor no-arg para tests).
- El `ObjectMapper` se pasa como parámetro al codec → sigue siendo lógica pura reutilizable por un
  sidecar sin CDI (con esto el "mover a platform-contract" se vuelve casi moot: el sidecar decodifica
  con `readValue` sobre `AsyncTaskEnvelope`, que ya está en `platform-contract`).

**Efecto colateral bueno**: la corrección **arregla** la incompatibilidad publish↔sidecar del
transporte de plugin remoto (ahora el payload es el envelope entero que el sidecar deserializa).

## Pruebas

- **Unit (`mvn test`)**: **13/13, BUILD SUCCESS** — `AsyncTaskMessageCodecTest` (4, round-trip
  `decode(toMessage) == e` vía Jackson; payload = envelope entero; headers vacíos),
  `TaskDispatchPublisherTest` (1), `TaskOutboxRelayTest` (4), `BrokerRemotePluginTransportTest`
  (4, actualizado al nuevo formato: headers vacíos + envelope entero en payload con `pluginId` en
  `envelope.headers` y el work-item en `envelope.payload`).
- El módulo compila entero (ningún otro sitio usaba el `toMessage` de 1 argumento).
- El outbox (Etapa 1) no se toca: ya almacenaba el envelope entero serializado → coherente.

## Estado

Wire-format corregido y consistente con audit/sidecar. Base correcta para la Etapa 2 (consumer):
el consumer in-process hará `decode(payload)` (o `readValue`) → `provider.execute` → continuación.
