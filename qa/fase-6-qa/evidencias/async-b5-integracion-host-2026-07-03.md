# B5: integración de las opciones comunes en el editor de tareas (host) — 2026-07-03

Cierra la UI del feature async: los controles reusables (async + continueOnFailure) se renderizan y
persisten en el editor de tareas, para **todos los tipos registrados**, desde un único punto.

## Punto de integración

`process-task-form-host` es el wrapper que hospeda los forms por-tipo (via `ngComponentOutlet`) y ya
tiene `task()` (config) + `patchTask` (persistir). Ahí se renderizan las opciones **comunes** una sola
vez, en vez de duplicarlas en cada form por-tipo:

- `<ih-async-dispatch-section>` (async + transporte) y `<ih-task-continue-on-failure>` se muestran
  cuando hay un form registrado (junto al form del tipo).
- El host lee `async`/`asyncTransport`/`continueOnFailure`/`executionMode` de `task().configurationJson`
  y, al cambiar, **mergea** la clave en la config y emite `patchTask` (preservando el resto).
- Los transportes se cargan de `GET /api/messaging/transports` al iniciar (fallback `['KAFKA']` ante
  error/403).

## Cooperación con los forms por-tipo (sin carrera)

El host edita las claves comunes por merge; el form por-tipo edita la config completa. **Cooperan**
porque la serialización de `async`/`asyncTransport`/`continueOnFailure` vive en la **base compartida**
`ProcessTaskProvider` (`hydrateRuntime`/`withRuntime`): el patch del form las preserva (round-trip por
la base), y el merge del host preserva el resto. Ediciones secuenciales (como en una UI) no chocan.

## Pruebas (`nx test web --include=<spec>`)

- **`process-task-form-host.component.spec` 4/4**: comportamiento existente (camino schema-driven)
  intacto tras añadir el fetch de transportes (flusheado en el setup), + **nuevo**: los cambios de
  `onAsyncChange`/`onTransportChange`/`onContinueOnFailureChange` **mergean** cada clave en la config
  preservando el resto; desactivar async limpia `async` + `asyncTransport`.
- Componentes ya verificados: `async-dispatch-section` 8/8, `task-continue-on-failure` (refleja/emite),
  serialización base `db-task-binding` 9/9, `mt101-pay` 9/9 (dominio intacto).

## Estado — B5 (front) completo

| Pieza | Estado |
|---|---|
| Componentes reusables (async + continueOnFailure) | ✅ verificados |
| Colisión `transport`→`asyncTransport` (back+front) | ✅ corregida |
| Serialización async compartida (todas las tareas runtime) | ✅ verificada |
| Scope de `continueOnFailure` (tarea general, no async) | ✅ corregido |
| **Integración en el editor de tareas (host)** | ✅ **verificada** |

El feature async está **completo end-to-end**: backend (per-task Etapas 1-5 + operabilidad + Opción B
scatter B1-B4 + E2E) y frontend (controles en el editor, verificados). Todo gated OFF por defecto.
