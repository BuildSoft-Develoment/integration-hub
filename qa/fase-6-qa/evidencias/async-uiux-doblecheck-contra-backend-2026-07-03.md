# Doble check UI/UX contra el backend — 2026-07-03

Contraste de las claves/valores que el front escribe/lee vs lo que el motor realmente consume, y de la
cobertura tras la relocalización. Un bug de contrato real corregido; dos hallazgos reportados.

## Contrato de config (front ↔ back) — verificado

| Clave | Back lee | Front escribe (`withRuntime`) | Match |
|---|---|---|---|
| `async` | `asBoolean(config.get("async"))` (TaskDispatchPlanner) | `next['async']=true` (bool) | ✅ |
| `asyncTransport` | `asString(config.get("asyncTransport"))` | `next['asyncTransport']=<string>` | ✅ (tras el fix de colisión) |
| `continueOnFailure` | `boolValue(config.get("continueOnFailure"))` (sync) + `asBoolean` (consumer) | ver F1 | ⚠️→✅ |
| `executionMode` | motor | `next['executionMode']` | ✅ |

Badge del canvas vs motor: scatter = `async` + `executionMode∈{batch,per-record}` (== `requiresRecordInput`
del back); offload = `async` + `once`. ✅ coincide.

## F1 (bug real, corregido) — `continueOnFailure` no se persistía en tareas síncronas

`withRuntime` escribía `continueOnFailure` **dentro** del `if (draft.async)`. Pero es una política de
tarea **general** que el motor **síncrono** ya lee (`ProcessExecutionService:234`) para cualquier tarea.
⇒ una tarea síncrona con `continueOnFailure=true` **no** se serializaba → el backend nunca la veía.
Contradecía la propia corrección de scope (el control de UI ya es general, pero la serialización seguía
anidada bajo async).

**Fix**: sacar `continueOnFailure` del bloque async → se persiste independiente de `async`.
`hydrateRuntime` ya la leía independiente. Test nuevo: `continueOnFailure` en tarea **síncrona** persiste
(`db-task-binding.spec` 10/10; total con mt101-pay **19/19**).

## F2 (regresión de cobertura, reportado) — 3 forms sin el control async

La relocalización del host (universal) al runtime-panel (13 forms) dejó **3 forms sin el control async**:
- **file-read**: es un lector; async no aplica → **aceptable** (correcto no exponerlo).
- **mt101-parse**, **mt101-split**: tareas de proceso que **sí** podrían ser async → **regresión** (antes,
  vía host, lo tenían).

**Recomendación**: si se quiere async en mt101-parse/split, añadirles el `ih-process-task-runtime-panel`
(como los otros 11 forms MT101). Si no, aceptar el gap. No es un bug de contrato, es completitud de UI.

## F3 (matiz semántico, nota) — badge vs feature-flag

El badge refleja el **intent** del config (`async:true`), no el runtime real: si el feature backend
(`tasks.async.execution.enabled`) está **off**, el motor ignora `async` y corre síncrono, pero el badge
igual aparece. Es razonable (el badge muestra la intención configurada) y es exacto cuando el flag está
on; se documenta.

## Estado

Contrato front↔back **alineado** (F1 corregido). F2 (cobertura mt101-parse/split) y F3 (semántica badge)
reportados como decisiones/follow-ups, no bugs de contrato.
