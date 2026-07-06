# Implementación — liveness del publisher async (#4b, opción b1, SOLID)

Fecha: 2026-07-05
Alcance: implementa la **opción (b1)** del [análisis (con doble-check)](2026-07-05-analisis-liveness-publisher-async.md):
`READY` ahora exige además que el canal **producer** `audit-out` (por el que el relay publica al broker Kafka) esté
**conectado EN VIVO** (`dispatchLive`). Cierra el lado publisher del health async. Operabilidad; no money-path.

## Verificación previa (disciplina de #4)

El doble-check marcó la premisa de b1 como **sin verificar**: la readiness de un canal OUTGOING de Kafka podría reportar
UP con el broker caído (el producer bufferea). **Verificado empíricamente ANTES de construir** (diagnóstico + IT): con
`audit-out` apuntando a un broker inalcanzable, su readiness es **false**. → `dispatchLive` es una señal **fiable**, no un
flag que miente. Sin esta verificación no se habría implementado.

## Cambios (SOLID)

- **`ConsumerChannelHealth` → `ChannelHealth`** (renombrado) + **`SmallRyeConsumerChannelHealth` → `SmallRyeChannelHealth`**:
  la abstracción es readiness de un canal **por nombre** (entrada o salida), no consumer-específica. **SRP/DIP**: ahora
  sirve para `tasks-in` (consumer, #4a) y `audit-out` (producer, #4b) sin duplicar.
- **`AsyncAvailabilityService`**:
  - Constante `DISPATCH_CHANNEL = "audit-out"`.
  - `dispatchLive = dispatchEnabled && channelHealth.ready("audit-out")` (solo se sondea si el relay está habilitado).
  - `derive(...)` puro extendido con `dispatchLive`; `READY` lo exige. El record `AsyncAvailability` gana `dispatchLive`.
- **Frontend** (`AsyncStatus`): añade `dispatchLive?` para paridad. **Sin cambio de lógica de UI**: la UI consume `state`,
  que server-side ya incorpora `dispatchLive` → si el producer no está conectado, `state=DEGRADED` y el aviso de la UI
  (del ciclo anterior) aparece automáticamente.

### Alcance / diferido
`audit-out` es el canal Kafka (el broker configurado por defecto). Para brokers de **cliente crudo** (JMS/RabbitMQ/Redis)
la liveness requeriría la extensión del SPI `MessageBrokerProvider.health()` (opción b2) — **diferida**, solo aplica si se
configura un broker no-Kafka.

## Pruebas (evidenciadas, ambas direcciones)

- **Unit `AsyncAvailabilityServiceTest`** (7, +1): `derive` con `dispatchLive` — DEGRADED si el producer no vivo; READY
  solo con ambos canales vivos; `availability()` marca `dispatchLive=false` cuando `audit-out` no listo; no sondea con los
  gates off. `MessagingTransportsResourceTest` 2 (fake `ChannelHealth`).
- **E2E NEGATIVO `AsyncDispatchLivenessBadBrokerIT` (NUEVO)**: `audit-out`→broker inalcanzable (`localhost:59999`) →
  `channelHealth.ready("audit-out")==false`, `dispatchLive==false`, `state != READY`. Blinda que la señal no miente.
- **E2E POSITIVO `AsyncTaskKafkaConsumerE2EIT`** (Kafka real): tras conectar, `audit-out` readiness=true (contraparte del
  negativo) — el producer conectado sí reporta vivo.
- **E2E POSITIVO END-TO-END `AsyncAvailabilityReadyIT` (NUEVO, del doble-check)**: con **todos los gates on + Kafka
  real**, `state` llega a **READY** con el `HealthCenter` REAL (no mocks). Cierra el hueco que el doble-check detectó: las
  demás aserciones de READY usaban un `ChannelHealth` mockeado; ninguna probaba que las piezas (`consumerLive` +
  `dispatchLive` + gates + broker) **COMBINAN** a READY contra el sistema real. Es la contraparte positiva del IT de
  broker inalcanzable.
- **Totales backend**: 9 unit + E2E negativo/positivo, **BUILD SUCCESS** (el app bootea con los beans renombrados sin
  `UnsatisfiedResolution`). **Frontend**: `lint:boundaries` verde + `nx build web` OK.

## Conclusión

El health async cubre ahora **ambos lados** del transporte Kafka: consumer (`tasks-in`, #4a) y producer (`audit-out`,
#4b). `READY` exige los dos canales conectados en vivo, y la UI lo refleja vía `state`. La señal `dispatchLive` fue
**verificada empíricamente** en las dos direcciones (broker arriba→true, inalcanzable→false) antes de gatear `READY`
sobre ella — aplicando la lección de #4 (no confiar en una integración asumida). La liveness de brokers no-Kafka
(cliente crudo) queda diferida al SPI `health()`.
