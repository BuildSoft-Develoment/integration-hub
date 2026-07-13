# G2 (acotado) — validador de cableado del money-path al publicar proceso

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** análisis "resolveNormalPay obligatorio" (app_htoh 62), re-acotado tras un doble-check durante la implementación.

## Por qué NO el validador "hard-block: exigir resolutor in-process" (opción A, descartada)

El doble-check durante la implementación reveló que exigir un `MT101_STATUS(resolveNormalPay=true)` **en el mismo
proceso** es **arquitectónicamente incorrecto**:

- La topología dominante y correcta resuelve el `UNCERTAIN` en una ejecución **SEPARADA** (las confirmaciones
  bancarias llegan después). Un validador de definición **no puede ver** esa ejecución resolutora → exigir el resolutor
  in-process contradice la topología y rompería pipelines legítimos (pay-and-reconcile-later).
- Rompería E2E reales: `Mt101MillionFileProcessE2EIT` (PAY es la última tarea, sin STATUS) y
  `Mt101AllTasksProcessE2EIT` (su STATUS es una **confirmación** `mode:query`, no un `resolveNormalPay`).
- Y sobre todo: **G1 ya hace el runtime seguro** (nunca COMPLETED silencioso con dinero incierto). Un hard-block no
  cerraría correctitud; solo impondría una topología equivocada.

## Regla implementada (opción C, acotada y correcta)

**Si** un `MT101_PAY` tiene, en el MISMO proceso, un `MT101_STATUS` POSTERIOR con `resolveNormalPay=true` (un
auto-resolutor in-process), **entonces** el `MT101_PAY` **debe** tener `continueOnFailure=true`. Si no → **rechazo
fail-loud (400)** al crear/actualizar (con `active=true`) o al activar.

Motivo: sin `continueOnFailure`, un pago `UNCERTAIN` detiene el proceso en `NEEDS_RECONCILIATION` **antes** de que el
resolutor corra → el auto-resolutor queda **muerto**. La regla blinda exactamente esa misconfiguración (el punto #2 del
análisis), **sin**:
- exigir un resolutor donde la topología correcta lo resuelve en otra ejecución (PAY solo → válido);
- forzar `resolveNormalPay` en un `MT101_STATUS` de confirmación legítimo (PAY + STATUS query → válido).

## Cambio (SOLID, sin camino legacy)

- **`Mt101PayResolutionValidator`** (NUEVO, `@ApplicationScoped`): `validate(List<TaskView>)`; parsea el config JSON
  (Jackson) para leer `resolveNormalPay`/`continueOnFailure`; lanza `IllegalArgumentException` si se viola la regla.
- **`ProcessCatalogService`**: valida en `create`/`update` cuando `request.active()` (un borrador inactivo se guarda
  libre) y en `setActive(true)` sobre las tareas ACTIVAS persistidas.
- **`ProcessDefinitionResource`**: `create`/`update`/`setActive` mapean `IllegalArgumentException → BadRequestException`
  (400), patrón ya usado en `Mt101FragmentLookupResource`.

La enforcement es **solo de diseño/publicación**; el runtime ya es seguro (G1). No hay guard de ejecución nuevo (sería
redundante).

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayResolutionValidatorTest` | **7 / 0 / 0** | PAY+resolver sin `continueOnFailure` → rechaza; con él → ok; PAY+STATUS confirmación → ok; PAY solo → ok; resolutor ANTES del PAY → ok; sin PAY / vacío / null → ok |
| `Mt101PayResolutionValidatorIT` | **4 / 0 / 0** | E2E REST: publicar (active) PAY+resolver sin `continueOnFailure` → **400**; con él → **200**; PAY sin resolutor in-process → **200**; **borrador (inactive) con mal cableado → 200, y al activar → 400** (valida `setActive`) |
| `ProcessCatalogServiceTest` | **10 / 0 / 0** | sin regresión (constructor ampliado con el validador) |
| E2E que crean procesos PAY vía servicio | verificado | `Mt101MillionFileProcessE2EIT` (PAY solo) y `Mt101AllTasksProcessE2EIT` (STATUS confirmación) **no** disparan la regla → intactos |

## Alcance

- **No cierra correctitud** (G1 ya hace el runtime seguro); es enforcement de diseño para homologación ("no publiques
  un auto-resolutor mal cableado").
- **Bypasseable** por procesos creados fuera del catálogo (p.ej. sembrados por SQL directo); es una red de publicación,
  no un invariante de ejecución. El invariante de ejecución es G1.
- El correctivo es API/lifecycle-driven (no pasa por el catálogo) → la regla solo ve PAY normal; no misclasifica.
