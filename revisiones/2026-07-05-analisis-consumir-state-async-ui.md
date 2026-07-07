# Análisis — consumir el estado compuesto async (`state`) en la UI (completa #4)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Naturaleza: operabilidad/UX frontend; **no** money-path. Cierra el valor de
[#4 (health async en vivo)](2026-07-05-implementacion-health-async-en-vivo.md): el backend ya computa el estado
compuesto (DISABLED/DEGRADED/READY con `consumerLive`), pero la UI **aún no lo consume**.

## Estado real (verificado)

- **Un único consumidor** de `asyncStatus()`: `process-task-runtime-panel.component`
  ([:86-93](../frontend/libs/features/processes/src/lib/components/process-task-form/process-task-runtime-panel/process-task-runtime-panel.component.ts)):
  `next: (status) => this.asyncFeatureEnabled.set(status.executionEnabled)`. **Solo lee `executionEnabled`** (ignora
  `state`, `consumerLive`, etc.).
- Ese `asyncFeatureEnabled` (default `true`; en error asume `true` "para no alarmar de más") se pasa como
  `[featureEnabled]` a `async-dispatch-section`, que muestra `@if (!featureEnabled())` un aviso i18n
  `ui.asyncFeatureDisabled` ("El despacho asíncrono está deshabilitado… correrá síncrona hasta que se active").
- El endpoint ya devuelve el estado compuesto; el type frontend `AsyncStatus` (actualizado en #4) ya tiene
  `state?: 'DISABLED'|'DEGRADED'|'READY'` + los flags — **pero nadie lee `state`**.

## El gap (por qué importa)

La UI confía **solo** en `executionEnabled`. Con #4, `state` puede ser **DEGRADED** (execution on pero relay off, o
`consumerLive=false`, o sin broker) → `async:true` **quedaría encolado pero no se procesaría end-to-end**, y la UI
**no muestra aviso** (porque `executionEnabled=true`). Es el mismo "READY miente" de #4, ahora en la UI: el operador
cree que el async está operativo cuando no lo está. El trabajo de #4 (distinguir "off" de "on-pero-roto") es hoy
**invisible**.

## Diseño propuesto (bounded, SOLID)

Consumir `state` y **fallar cerrado**: avisar cuando `state !== 'READY'`.

- **(A) Mínimo**: `asyncFeatureEnabled = (status.state === 'READY')` en vez de `status.executionEnabled`. El aviso
  existente aparece ante cualquier estado no-READY. Cierra el gap con **un cambio de una línea**, pero el mensaje dice
  "deshabilitado" también cuando está DEGRADED (impreciso: está *habilitado pero no operativo*).
- **(B) Rico (recomendado)**: pasar `state` a `async-dispatch-section` y mostrar **mensajes distintos**:
  - DISABLED → el mensaje actual ("deshabilitado; correrá síncrona").
  - DEGRADED → un mensaje NUEVO `ui.asyncFeatureDegraded` ("El despacho asíncrono está habilitado pero no operativo en
    este entorno (relay/consumer/broker no listos): la tarea quedaría encolada sin procesarse"). Requiere 1 clave i18n
    (en + es).
  Hace **visible** la distinción que #4 introdujo; es más accionable para el operador.
  - **SOLID**: la sección recibe `asyncState` (un input) y **mapea** estado→mensaje (SRP: el panel obtiene el dato, la
    sección decide la presentación; OCP: añadir un estado futuro = otra rama del mapa, sin tocar el panel).

### Comportamiento ante error (decisión de UX, a documentar)
El panel hoy asume `enabled=true` ante error del endpoint ("no alarmar de más"), consistente con el fallback de
transports (`['KAFKA']`) y capabilities (`SUPPORTED`). #4 en el backend **falla cerrado**, pero en la UI un fallo de
lectura transitorio no debería alarmar (el guard del backend es la barrera real). **Recomendación**: mantener permisivo
ante error (tratar como READY/sin aviso), sin cambiarlo — es advisory, no gating.

### Lo que NO cambia
- Backend: nada (ya expone `state`). El toggle async y el guard backend siguen igual: esto es **solo el aviso** de la UI.
- `async-dispatch-section` conserva su API salvo el input nuevo; el resto de su lógica (toggle, transporte) intacto.

## Validación / pruebas (plan)

- **Unit (vitest)**: `process-task-runtime-panel.component.spec` ya flushea `{ executionEnabled }` y asevera
  `asyncFeatureEnabled()`; actualizar para flushear `{ state, executionEnabled }` y cubrir: READY→sin aviso,
  DEGRADED→aviso degraded, DISABLED→aviso disabled. Test de la sección para el mapeo estado→mensaje.
- **i18n parity**: hay un `dictionary-parity.spec` (visto en la suite) que exige en/es alineados → añadir la clave en
  ambos.
- **`nx build web`** + **`nx test web`** (cubre libs) + **`lint:boundaries`** (sin nuevas aristas; el panel ya está en
  processes y usa `MessagingTransportsService` local).
- Frontend puro, sin runtime backend → validación por lint/build/suite.

## Doble-check — verificación contra código (self-review)

Reté los supuestos. **Sin bug de correctitud**; dos hallazgos:

### Confirmado / reforzado
- **`featureEnabled` es advisory-only (refuerza la opción B, la de-riesga)**: en `async-dispatch-section`, el toggle usa
  `[disabled]="toggleDisabled()"` y `toggleDisabled = readonly() || (!available() && !async())`, con
  `available()` dependiendo **solo** de `offloadSupport()`. `featureEnabled()` se usa **únicamente** en el
  `@if (!featureEnabled())` del aviso. → cambiar la fuente del aviso a `state === 'READY'` **NO bloquea** el toggle
  async cuando el entorno está DEGRADED (correcto: el aviso es advisory; el usuario aún puede marcar `async:true`).
- **Consumidor único confirmado**: el otro match de `.state()` es `ui-kit-gallery.component` — una señal **local**
  (`'loading'|'error'|'data'`), sin relación con async-status. `process-task-runtime-panel` es el único consumidor real.

### Corrección al plan de validación (aplicando la lección de #4)
- **La serialización del enum `State` NO está verificada empíricamente en ningún lado.** Estáticamente es segura (el
  `enum State` no tiene `@JsonValue`/`@JsonFormat`; no hay `ObjectMapperCustomizer` ni config de enums → Jackson default
  = `name()` → `"DISABLED"/"DEGRADED"/"READY"`, que coincide con el type frontend). **Pero** no hay ningún test
  REST-level que assevere el JSON de `/api/messaging/async-status` (los tests actuales verifican el **objeto** record, no
  el JSON). Si la serialización fuera distinta (ordinal, lowercase), `state === 'READY'` sería **siempre falso** → la UI
  avisaría siempre. #4 enseñó a no confiar en la integración asumida: **la implementación DEBE añadir un test REST
  (RestAssured `@QuarkusTest`) que GETee el endpoint y asevere `state` ∈ {DISABLED,DEGRADED,READY}** — belt-and-suspenders
  barato que blinda el contrato UI↔backend. (El 401 sin token se resuelve con `@TestSecurity`.)

## Veredicto (confirmado)

**Bounded, de alto valor/esfuerzo**, sin correctitud/money-path: cierra el valor de #4 haciendo **visible** el estado
DEGRADED. Un consumidor único + `async-dispatch-section` + 1 clave i18n. El doble-check **de-riesga** la opción (B)
(`featureEnabled` es advisory-only → no bloquea el toggle) y **añade** un test REST que asevere la serialización del enum
(sin él, un cambio de serialización rompería la UI en silencio). **Recomiendo proceder con (B)** + ese test de contrato.
