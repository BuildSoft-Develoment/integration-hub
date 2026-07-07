# Implementación — la UI consume el `state` async compuesto (opción B, SOLID)

Fecha: 2026-07-05
Alcance: implementa la **opción (B)** del
[análisis (con doble-check)](2026-07-05-analisis-consumir-state-async-ui.md). La UI deja de leer solo
`executionEnabled` y consume el **estado compuesto** (`DISABLED`/`DEGRADED`/`READY`) de #4, distinguiendo "apagado"
de "habilitado-pero-roto". Operabilidad/UX frontend + un test de contrato backend; no money-path.

## Problema (cierra el valor de #4)

El backend ya computa el estado compuesto (con `consumerLive`), pero la UI (`process-task-runtime-panel`, único
consumidor real) leía **solo `executionEnabled`**. Con `state=DEGRADED` (execution on pero consumer no vivo / relay off /
sin broker), `async:true` quedaría encolado sin procesarse y la UI **no avisaba**. El estado DEGRADED de #4 era invisible.

## Cambios (SOLID)

- **`async-dispatch-section.component`**: reemplaza el input booleano `featureEnabled` por `asyncState: AsyncState`
  (`'READY'` default). Nuevo computed **`asyncWarningKey`** que mapea estado→clave i18n (o `null` si READY). Template:
  `@if (asyncWarningKey(); as key)` muestra el aviso.
  - **SRP**: la sección es dueña del mapeo estado→mensaje. **OCP**: un estado futuro = otra rama, sin tocar el panel.
- **`process-task-runtime-panel.component`**: `asyncFeatureEnabled` (boolean) → `asyncState: signal<AsyncState>`. En la
  suscripción a `asyncStatus()`: `set(status.state ?? (status.executionEnabled ? 'READY' : 'DISABLED'))` (fallback al flag
  legacy). Pasa `[asyncState]` a la sección. **Ante error asume READY** (permisivo: no alarma por un fallo transitorio;
  el guard del backend es la barrera real).
- **i18n**: nueva clave `ui.asyncFeatureDegraded` (en + es): "habilitado pero no operativo (relay/consumer/broker no
  listos): la tarea quedaría encolada sin procesarse". El mensaje DISABLED existente se conserva.

### `featureEnabled` era advisory-only (verificado en el doble-check)
El toggle async usa `toggleDisabled()`/`available()` (que dependen de `offloadSupport`, no del flag). Cambiar la fuente
del aviso a `state` **no bloquea** el toggle en DEGRADED — el usuario aún puede marcar `async:true`; solo se le avisa.

## Pruebas (evidenciadas)

- **`async-dispatch-section.component.spec`**: DISABLED→aviso con `asyncFeatureDisabled`; DEGRADED→aviso con
  `asyncFeatureDegraded`; READY→sin aviso (`asyncWarningKey()===null`).
- **`process-task-runtime-panel.component.spec`**: flushea `{ state, executionEnabled }` y cubre READY/DISABLED/DEGRADED.
- **`dictionary-parity.spec`**: verde → la clave nueva está en en **y** es.
- **e2e de cadena completa (UI, lección de #4)** — `process-task-runtime-panel.component.spec`: respuesta HTTP
  `{state:'DEGRADED'}` → signal del panel → binding `[asyncState]` → sección hija → **el aviso DEGRADED se renderiza en
  el DOM** con el texto correcto (`i18n.t('ui.asyncFeatureDegraded')`); y `state:'READY'` → **sin** aviso en el DOM.
  Cubre el seam que faltaba (los demás tests miran el signal o el input, no HTTP→DOM).
- **Test de contrato backend (lección de #4)** — `AsyncTaskExecutionE2EIT.asyncStatusEndpointSerializesStateAsEnumName`
  (`@QuarkusTest` + RestAssured + `@TestSecurity`): GET `/api/messaging/async-status` sobre el **JSON real** y asevera
  `state ∈ {DISABLED,DEGRADED,READY}` (+ `consumerLive`/`executionEnabled` boolean). En ese perfil
  (`tasks.async.execution.enabled=true`, dispatch/consumer off) el endpoint devuelve **DEGRADED**, así que el test
  ejercita y confirma que **DEGRADED serializa como `"DEGRADED"`** — el caso exacto que la UI distingue. **Blinda la
  serialización del enum** (`name()`): si Jackson la cambiara (ordinal/lowercase), `state === 'READY'` sería siempre
  falso y la UI avisaría en silencio. Antes NO existía ninguna aserción del JSON serializado.
- **Totales**: frontend `nx test web` **101 archivos / 496 tests, 0 fallos**; `lint:boundaries` verde; `nx build web` OK.
  Backend `MessagingTransportsResourceTest` 2 + `AsyncAvailabilityServiceTest` 6 + `AsyncTaskExecutionE2EIT` **4** (con
  el contrato), BUILD SUCCESS.

### Nota de arranque
El cambio de comportamiento es de UI (aviso); el backend solo suma un test. Verlo en vivo requiere login + navegar al
form de tarea (el endpoint devuelve DISABLED por defecto → se vería el aviso "deshabilitado"). Los specs de componente ya
aseveran el render del aviso por estado y el test REST el contrato, así que la validación no depende del stack.

## Doble-check que atrapó un casi-error

La suite reveló un componente `overview-async-health-card` que **parecía** un segundo consumidor. Verificado: recibe un
`AsyncHealth {dead, stalled}` por `@Input` (salud del DLQ/inbox de tareas), **no** consume `/api/messaging/async-status`
— otro dominio. Confirma que `process-task-runtime-panel` es el único consumidor del estado de mensajería.

## Conclusión

El estado compuesto de #4 es ahora **visible**: la UI distingue DISABLED (apagado, corre síncrono) de DEGRADED
(habilitado-pero-roto, quedaría encolado) y no avisa en READY. Diseño SOLID (la sección mapea estado→mensaje; el panel
solo obtiene el dato). El contrato UI↔backend queda **blindado** con un test REST que asevera la serialización real del
enum — no un supuesto.
