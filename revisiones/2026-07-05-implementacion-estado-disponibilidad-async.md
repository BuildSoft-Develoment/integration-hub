# Implementación — estado compuesto de disponibilidad async (v59-fix, con diseño SOLID)

Fecha: 2026-07-05
Alcance: implementa el paso bounded del
[análisis](2026-07-05-analisis-estado-disponibilidad-async.md) (con la corrección del doble-check: **3 gates**).
`GET /api/messaging/async-status` pasa de un flag único a un estado **compuesto** (DISABLED/DEGRADED/READY) que
refleja los tres gates de config + el registro de brokers. Operabilidad/UX; no money-path.

## Cambios (diseño SOLID)

- **`AsyncAvailabilityService`** (NUEVO, `@ApplicationScoped`): deriva el estado compuesto. **SRP**: separa la lógica
  de disponibilidad del borde HTTP. Inyecta los tres gates + el `MessageBrokerRegistry`:
  - `tasks.async.execution.enabled` (offload al outbox),
  - `tasks.dispatch.enabled` (relay outbox→broker),
  - `mp.messaging.incoming.tasks-in.enabled` (consumer `@Incoming`).
  - `derive(...)` es una función **pura** estática (testeable sin CDI/HTTP): `DISABLED` si execution off; `DEGRADED`
    si execution on pero (relay off **o** consumer off **o** sin brokers); `READY` si los tres + broker registrado.
  - `AsyncAvailability(state, executionEnabled, dispatchEnabled, consumerEnabled, brokersRegistered)`.
- **`MessagingTransportsResource`**: el endpoint **delega** en el service (borde HTTP fino). Backward-compatible:
  conserva `executionEnabled` en el JSON (la UI que solo lo leía sigue funcionando; gana `state` + flags).

### SOLID
- **SRP**: derivación en el service; el resource solo expone HTTP.
- **OCP**: `derive(...)` puro → añadir un gate futuro es extender la función; el estado ya es un enum.
- **LSP**: N/A (sin jerarquías nuevas).
- **ISP**: sin interfaces gordas; el service expone un único método `availability()`.
- **DIP**: los gates entran por constructor (config) + el registry (abstracción), no lookups estáticos → testeable
  con cualquier combinación.

### Limitación documentada (honestidad del READY)
`state` es **nivel-config**, no health en vivo: `brokersRegistered` = hay algún broker registrado (el relay resuelve
el broker **por tipo** por work-item), y `consumerEnabled=true` no garantiza consumo en vivo. El health en vivo
(broker conectado, consumer consumiendo) queda **diferido** (proyecto mayor).

## Pruebas (evidenciadas)

- `AsyncAvailabilityServiceTest` (NUEVO, 4): la derivación pura — DISABLED (execution off), DEGRADED (cada gate off:
  relay/consumer/sin brokers), READY (los tres + broker), y `availability()` computa `brokersRegistered` del registry.
- `MessagingTransportsResourceTest` (2): el endpoint delega el estado compuesto (DISABLED/READY) y conserva
  `executionEnabled` (backward-compat).
- E2E con arranque CDI real (`Mt101AllTasksProcessE2EIT`, `AsyncTaskExecutionE2EIT`): validan el nuevo bean + el
  constructor del resource.
- **Total: 11 tests, 0 fallos** (BUILD SUCCESS): service 4 + resource 2 + E2E con arranque CDI
  (`Mt101AllTasksProcessE2EIT` 2, `AsyncTaskExecutionE2EIT` 3 — este último ejercita el path async real).

## Conclusión

El estado async ya no es un flag que engaña: refleja los **tres gates** de config + el broker registrado, con estados
DISABLED/DEGRADED/READY para que la UI **falle cerrada** (tratar != READY como no operativo). Diseño SOLID (lógica pura
en un service testeable; el resource solo delega). El health en vivo queda diferido.
