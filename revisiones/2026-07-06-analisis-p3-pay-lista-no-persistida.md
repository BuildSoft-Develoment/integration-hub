# Análisis — P3: PAY directo por lista en memoria no es durable

Fecha: 2026-07-06
Tipo: **análisis** (validación contra código real; sin implementar). Tercer pendiente del
[análisis de homologación mejorado](2026-07-06-analisis-revision-homologacion-v56-mejorado.md), tras P2 (hecho) y P5
(degradado a guardrail en su doble-check). **Sí toca un flujo de PAY real** (low-volume).

## Problema (confirmado en código)

`MT101_PAY` tiene **dos ramas** con protección de durabilidad **asimétrica**:

- **Rama PERSISTIDA** (`dispatchFragmentPage`, cuando el input es `{fragmentSetId, ...}` de `MT101_BUILD_FROM_TABLE`):
  durable. Dos sub-modos:
  - **correctivo** (`rebuildRunId != null`): claim por-fragmento contra la **revisión inmutable** + spec persistido (v37);
  - **normal durable** (`rebuildRunId == null && fragmentStore != null`, **v51-fix**): reclama la página
    `ARCHIVED → DISPATCHING` **atómicamente antes de enviar** (`fragmentStore.claimForDispatch(...)`); solo despacha lo
    reclamado; un resultado ambiguo deja el fragmento `UNCERTAIN` durable para conciliar
    ([Mt101PayTaskProvider.java:238-254](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProvider.java)).
- **Rama LISTA DIRECTA** (`else`, líneas 146-171): input `List<Mt101Message>` en memoria (de `MT101_BUILD`/`MT101_SPLIT`).
  Hace `dispatch(effectiveTransport, plan.configuration(), input, accumulator)` → `transport.send()` **por mensaje**, con:
  - **sin ledger de fragmentos**, **sin claim** (`ARCHIVED→DISPATCHING`), **sin fila que quede `UNCERTAIN` durable**.
  - El `result.uncertain()` (línea 159) solo **registra un audit envelope** y `continue`; la tarea devuelve `failure`,
    pero **no hay fragmento persistido que bloquee un reenvío**.

### Por qué importa (y por qué es real, no teórico como P5)
- **`MT101_BUILD` emite una lista en memoria** de un mensaje (`outputs.put("records", List.of(formatted))`, `messageCount=1`)
  — no persiste fragmentos. → un proceso `FILE_READ → MT101_BUILD → MT101_PAY` es el flujo **low-volume real** (un lote
  chico → un MT101 → envío al banco), y cae en la rama `else` **no durable**.
- **La rama directa alcanza un transporte de banco real** (`effectiveTransport` = REST/SFTP configurado), no un stub.
- **No existe guard** que exija fuente persistida ni que restrinja la lista directa a test/demo (grep vacío).
- **Consecuencia**: si el `send()` de la lista directa da resultado **ambiguo** (timeout, 5xx tras posible recepción), no
  queda un fragmento `UNCERTAIN`. Un **re-request** reconstruye la lista desde `MT101_BUILD` (en memoria) y **re-despacha
  sin claim que lo impida** → riesgo de **doble envío** de un pago que el banco pudo haber aceptado.

### Alcance honesto (matiz de severidad)
El **money-path principal** (alto volumen 20k mensajes + PAY correctivo) usa la rama **persistida durable** (P1 + v51-fix)
— **no** afectado. El gap es el flujo **low-volume `MT101_BUILD → MT101_PAY`**: real y alcanzable, pero no el camino
masivo/correctivo. Severidad **🟠 real** (por encima de P5, que era teórico), no 🔴 del money-path correctivo (ya blindado).

## Solución propuesta (sin fallback)

Objetivo: **ningún PAY con envío real puede salir por un camino sin durabilidad**. Dos opciones:

- **(A) Exigir fuente persistida para despachar (recomendada por simplicidad y "no fallback").** `MT101_PAY` **rechaza** un
  input de lista directa hacia un transporte con efecto: exige `{fragmentSetId}` (via `MT101_BUILD_FROM_TABLE`) para
  dispatch. La lista directa deja de poder llamar al banco. Mensaje accionable ("persiste los fragmentos con
  MT101_BUILD_FROM_TABLE antes de PAY"). Elimina el camino no durable de raíz. **Contra**: rompe el flujo low-volume
  `MT101_BUILD → MT101_PAY` existente (habría que migrarlo a `BUILD_FROM_TABLE`).
- **(B) Materializar la lista como fragmentos persistidos (`ARCHIVED`) antes del dispatch**, y encaminarla por la rama
  durable (claim `ARCHIVED→DISPATCHING` + `UNCERTAIN`). Preserva el flujo low-volume con durabilidad. **Contra**: más
  trabajo; la lista en memoria debe generar `mt101_build_fragment` con la metadata mínima (referencia estable, plan) que la
  rama durable espera.

**Recomendación preliminar**: **(A)** como primer incremento (guard que exige persistencia para dispatch real; sin
fallback, más simple, bloquea el riesgo ya), y **(B)** como evolución si se quiere conservar el flujo low-volume con
durabilidad. La decisión de topología (¿se conserva `MT101_BUILD → MT101_PAY` o se fuerza `BUILD_FROM_TABLE`?) es tuya.

## Doble-check — verificación contra código (self-review)

Reté los supuestos empíricamente. **El análisis se sostiene; el mecanismo se refinó y la severidad se confirma** (sin
degradarse a teórico como P5 — aquí el riesgo **sí es alcanzable**).

- **La rama directa `dispatch()` no reclama NADA** ([línea 462-504](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProvider.java)):
  `transport.send()` directo + clasificación segura (v26/v27: error inesperado → `UNCERTAIN`, nunca `REJECTED` reusable).
  El `idempotencyKey`/`correlationKey` (línea 496) es **solo metadata de auditoría**; el claim atómico
  `ARCHIVED→DISPATCHING` (`claimForDispatch`, líneas 253/325) es **exclusivo de la rama persistida**. → **cero idempotencia
  platform-side en re-request**; la directa depende de que el **banco** honre el idempotencyKey (contractual, P11).
- **No hay guard aguas arriba** (plan compiler / validación) que exija fuente persistida para dispatch (grep vacío).
- **Reachable / soportado, no vestigial**: hay tests que ejercen `BUILD → PAY` (`Mt101AllTasksProcessE2EIT`,
  `Mt101OutboundEndToEndIT`, `Mt101PayFragmentReprocessTest`). Las process definitions se crean en runtime (por API/UI),
  así que la topología `BUILD → PAY` con banco real es **configurable sin nada que la impida**.
- **Refinamiento (nuevo) — la durabilidad es opt-in y atada a `BUILD_FROM_TABLE`**: `MT101_ARCHIVE` **pasa** el
  `fragmentSource` solo si ya lo recibió (`if (!fragmentSource.isEmpty())`,
  [Mt101ArchiveTaskProvider.java:203](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ArchiveTaskProvider.java)) —
  **no lo crea** desde una lista. → el ledger durable `mt101_build_fragment` (con claim) lo crea **`MT101_BUILD_FROM_TABLE`**;
  `MT101_BUILD` (lista de un mensaje en memoria) → PAY **nunca** lo crea, **con o sin ARCHIVE** en medio. Y el default de
  `input.sourceOutput` es `"records"` (la lista), no `"fragments"` → **por defecto se usa la rama NO durable**.

**Neto**: severidad **🟠 real** confirmada. La durabilidad no es automática: solo la tienen los flujos que originan el
`fragmentSetId` en `BUILD_FROM_TABLE` (alto volumen + correctivo, el money-path — blindado). El flujo low-volume `BUILD →
PAY` (y `SPLIT → PAY`) sale por la rama no durable **por defecto**.

### Implicación para el fix (afina la opción A)
Como el ledger durable ya existe (`mt101_build_fragment` via `BUILD_FROM_TABLE`), **opción (A) = exigir que PAY con envío
real lea una fuente persistida** (`fragmentSetId`), rechazando la lista directa hacia transportes con efecto. El costo real
es que el flujo low-volume debe migrar a `BUILD_FROM_TABLE` (stagear → fragmentos), no un ledger nuevo. **Opción (C) más
ligera a considerar**: un claim de intención por-mensaje keyed por `correlationKey`/`idempotencyKey` (no fragmentos
completos), reclamado antes del `send()`, que dé re-request-safety a la rama directa sin cambiar la topología. Comparar A
vs B vs C en la fase de implementación.

### Pendiente para la implementación (evidencia)
- **Re-request → doble envío**: reproducir un `send()` ambiguo en la rama directa y aseverar que un re-run **re-despacha**
  (el gap), vs. la persistida que lo bloquea por el claim.
- **Transportes sin efecto** (NOOP/echo de tests): el guard de (A) debe permitirlos por **tipo de transporte**, sin abrir
  un fallback para banco real.
- **`MT101_SPLIT`**: mismo camino de lista → el fix debe cubrir `SPLIT → PAY`, no solo `BUILD → PAY`.
