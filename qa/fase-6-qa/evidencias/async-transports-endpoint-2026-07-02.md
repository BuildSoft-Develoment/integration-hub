# Evidencia: endpoint de transportes + validación del async por-tarea - 2026-07-02

## Validación contra el backend (doble check)

La propuesta de "toggle de async por tarea" asume que el backend actúa sobre `"async": true` en el
config de una tarea. **Validado: NO está cableado.**

- `TaskDispatchPlanner` (lee `configuration.get("async")` + `transport`) **solo se referencia en su
  archivo y su test** — nadie lo invoca.
- `ProcessTaskRuntimeService.runTask()` resuelve el provider y **ejecuta síncrono**; no hay rama de
  dispatch.
- No existe **consumidor** async de tareas de proceso (solo el consumer del propio broker Kafka).
- **ADR-015**: *"Propuesto; base implementada… hoy scopeado a AUDITORÍA"*.

**Conclusión:** hoy `async:true` en una tarea es un **no-op**. Una UI de async sería un control que no
ejecuta nada. El gap real es **backend**, no UI.

## Entregado (seguro y additivo)

- **`MessageBrokerRegistry.availableTypes()`** + **`GET /api/messaging/transports`**
  (`MessagingTransportsResource`, gated admin/operator): lista los brokers registrados
  (Kafka/JMS/RabbitMQ/Redis) para poblar el selector de transporte sin hardcodear.
- Test: `MessageBrokerRegistryTest` (1/1, BUILD SUCCESS). Módulo compila entero.

## Fase 0 (el gap real) — diseño, NO entregado (feature distribuida grande)

Cablear el async por-tarea con broker requiere, y **medio-hacerlo colgaría procesos**:

1. **Dispatch** en `runTask()`: si `TaskDispatchPlanner.plan(config).isAsync()`, en vez de
   `provider.execute(...)`, publicar el envelope al broker (`TaskDispatchPublisher`/outbox ya
   existen) y **suspender** la tarea (reusar `SuspendableTaskProvider` + `process_task_suspension`).
2. **Consumidor** (nuevo): recibe el mensaje, ejecuta el provider, publica el resultado.
3. **Correlación + resume**: al llegar el resultado, `ProcessExecutionResumeService` reanuda el
   proceso con el output de la tarea. Idempotencia (`TaskIdempotency`) + retry/outbox
   (`TaskOutboxRelay`) ya existen.

Es un feature distribuido (dispatch + consume + correlate + resume + fallos/poison), sensible sobre
el motor de ejecución. **Se hará por etapas verificables, no de un golpe**, o no se hace (evitar
procesos colgados es la regla).

## UI (Fase 1, tras Fase 0)

- Runtime panel: toggle **[Ejecución asíncrona]** + `mat-select` **[Transporte]** (divulgación
  progresiva `visibleWhen`), serializando a las claves planas `async`/`transport`.
- Canvas: badge ⚡ en el nodo si `config.async === true`.
