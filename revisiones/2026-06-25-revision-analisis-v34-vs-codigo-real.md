# Revisión del análisis v34 (app_htoh(34)) contra el código real

Fecha: 2026-06-25
Alcance: el v34 valida la prueba concurrente real y el PAY_CONFLICT del v33, y plantea **tres hallazgos de
código nuevos** + una regresión de empaquetado. Directiva: sin código fallback / sin caminos legacy. Validar
lo ya implementado.

## Veredicto general

El v34 es preciso: detecta **tres mejoras reales** en la simetría/coherencia de la recepción de resultados.
Las tres se corrigen con prueba. La "regresión de specs/" es del **paquete entregado** (zip), no del repo.

| # | Hallazgo v34 | Veredicto | Acción |
|---|---|---|---|
| 1 | Conflicto **asimétrico**: STATUS REJECTED **después** de un SENT se ignora en silencio (`resolvePayFragmentResults` solo actualiza desde no-terminal y no trata el 0 como conflicto) | **REAL → CORREGIDO** | `resolvePayFragmentResults` ahora corre bajo el mismo advisory lock y, si STATUS reporta un terminal que **contradice** el terminal del ledger, registra `PAY_CONFLICT` + run UNCERTAIN. Protección **simétrica** (gateway↔STATUS, en ambos órdenes) |
| 2 | La protección solo cubría el ledger: tras un conflicto, el provider igual marcaba `mt101_build_fragment`/archive **SENT** → inconsistencia entre fuentes de verdad | **REAL → CORREGIDO** | `markResults` devuelve las referencias en conflicto; el provider **excluye** esas refs de `markStatusBatch`/`syncArchive`, así build/archive no quedan SENT si el ledger no aceptó la transición |
| 3 | El SQL permitía actualizar desde `PREPARED` (`not in (terminal)`) aunque el resultado de transporte solo debe venir de DISPATCHING/UNCERTAIN | **REAL → CORREGIDO** | Guarda **por tipo de resultado**: `SENT` exige `pay_status in ('DISPATCHING','UNCERTAIN')` (no hay SENT sin claim); los no terminales conservan `not in ('SENT','REJECTED','INVALIDATED')` (admiten PREPARED/ARCHIVED, nunca un terminal) |
| Plan persistido como fuente directa | **VALIDADO — cerrado con evidencia** | Sin cambios: se ejecuta el plan aprobado bit-a-bit (verificado contra el ledger); el camino literal exige persistir secretos / un segundo camino (fallback), prohibidos |
| Regresión specs/ | **NO aplica al repo** | `specs/` está **íntegro en el repositorio** (001–008 + README + _shared). La ausencia es del **zip** `app_htoh(34)`: el script de empaquetado excluyó `specs/`. Acción: corregir el empaquetado para incluir `specs/`; no hay nada que restaurar en git |

---

## Detalle de lo corregido (con prueba)

### Hallazgo 1 — conflicto simétrico STATUS↔ledger
Antes: si un ACCEPTED tardío dejaba el fragmento **SENT** y luego MT101_STATUS respondía **REJECTED**,
`resolvePayFragmentResults` (guarda `in ('UNCERTAIN','DISPATCHING','PREPARED')`) devolvía 0 filas y el caller
**sumaba** ese 0 sin tratarlo como conflicto → el rechazo de STATUS quedaba como evidencia pero **sin
PAY_CONFLICT** y sin forzar conciliación.

Fix (sin fallback): bajo el mismo advisory lock, si un resultado terminal entrante (SENT/REJECTED) **no se
aplica** porque el fragmento ya está en un terminal **distinto**, se registra `PAY_CONFLICT` append-only y el
run se fuerza a **UNCERTAIN**. Es la misma regla que la del gateway (v33), ahora **simétrica** en ambos
sentidos: el orden REJECTED→luego→SENT y el orden SENT→luego→REJECTED producen el mismo PAY_CONFLICT.

### Hallazgo 2 — coherencia ledger / build_fragment / archive
El provider, tras recibir ACCEPTED, ejecutaba `markStatusBatch(build, SENT)` + `syncArchive(SENT)` **sin
condición** equivalente a la del ledger. En un conflicto quedaba: ledger=REJECTED, run=UNCERTAIN,
build=SENT, archive=SENT.

Fix: `markResults` devuelve las referencias en conflicto; el provider **las quita** de `sentRefs`/`sentTargets`
antes de propagar a build/archive. Así las tres fuentes de verdad quedan coherentes (el ledger manda) y el
fragmento queda para conciliación (PAY_CONFLICT), no SENT en otra tabla.

### Hallazgo 3 — guarda de SENT exige claim previo
`SENT` solo se registra si el fragmento está en `DISPATCHING`/`UNCERTAIN` (hubo claim/dispatch). Un bug
interno no puede registrar SENT desde `PREPARED`. Los resultados no terminales (UNCERTAIN) siguen admitidos
desde estados no terminales (PREPARED/ARCHIVED), preservando el flujo de incertidumbre.

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` — **19**:
  - `statusRejectedAfterFragmentAlreadySentRaisesConflictNotSilentIgnore` (hallazgo 1, simetría).
  - `physicalStatusRejectionDuringBlockedSendMakesLateAcceptedRaiseConflictNotOverwrite` + assert de
    coherencia: `build_fragment` **no** queda SENT en conflicto (hallazgo 2).
  - `sentResultIsDroppedWhenFragmentWasNeverClaimedNoSentWithoutDispatch` (hallazgo 3).
  - más la carrera real (25 iteraciones), la aceptación tardía física y el determinismo del plan.
- `Mt101CorrectiveLifecycleServiceTest` — **35**: aceptación tardía e2e, conflicto, regla conservadora.
- Dominio swift completo: **224** tests, 0 fallos.
- Integración end-to-end (Flyway real **V57**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Nota sobre specs/ (empaquetado)

`specs/` existe completo en el repositorio (verificado: 001-catalogo-fuentes … 008-mensajeria-pagos, README,
_shared). La "regresión" del v34 es del **zip entregado**, no del código ni del repo: el empaquetado de
`app_htoh(34)` excluyó `specs/`. Recomendación: corregir el script de empaquetado para incluir `specs/` y
mantener vivos los enlaces de ADRs/@trace; no procede ninguna restauración en git.

## Conclusión

El v34 detectó correctamente que la protección de la recepción tardía era **asimétrica** (solo gateway→ledger)
y **parcial** (solo ledger). Ahora es **simétrica** (gateway↔STATUS, ambos órdenes) y **coherente entre las
tres fuentes de verdad** (ledger/build/archive), con `SENT` exigiendo claim previo. Ninguna contradicción se
resuelve por reescritura silenciosa ni por ignorar un resultado: siempre PAY_CONFLICT + UNCERTAIN para
conciliación manual.
