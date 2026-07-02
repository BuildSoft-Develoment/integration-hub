# Revisión del análisis v35 (app_htoh(35)) contra el código real

Fecha: 2026-06-25
Alcance: el v35 valida los cierres del v34 (conflicto simétrico en el ledger, coherencia build ante SENT
conflictivo, SENT sin claim restringido, specs/ restauradas) y plantea **dos endurecimientos nuevos**: (1)
coherencia build/archive **totalmente simétrica** + **marca de conflicto explícita y durable**; (2) **REJECTED
solo después de claim**. Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado.

## Veredicto general

El v35 es preciso: las dos asimetrías que señala son **reales**. Ambas se cierran con prueba.

| # | Hallazgo v35 | Veredicto | Acción |
|---|---|---|---|
| 1a | El filtro de propagación a build/archive solo cubría conflictos cuyo resultado entrante es **SENT**; no `rejectedByRef`/`rejectedTargets` (un REJECTED tardío contra un ledger SENT podía propagar REJECTED a build/archive) | **REAL → CORREGIDO** | El provider ahora filtra **simétricamente**: excluye los refs en conflicto de `sentRefs`/`sentTargets` **y** de `rejectedByRef`/`rejectedTargets`. El ledger manda; build/archive nunca reciben un terminal que el ledger rechazó por conflicto |
| 1b | Falta una representación **única, explícita y durable** del conflicto (un lector podría interpretar `archive=REJECTED` como "nunca enviado" mientras el ledger dice SENT) | **REAL → CORREGIDO** | Migración **V58**: `pay_conflict boolean` + `pay_conflict_reason text` por fragmento. `recordTerminalPayConflict` marca `pay_conflict=true` (el fragmento conserva su `pay_status` real) junto al `PAY_CONFLICT` append-only del run → conflicto visible y no ambiguo para API/UI |
| 2 | `REJECTED` (terminal de transporte) todavía podía llegar desde `PREPARED` (`not in (SENT,REJECTED,INVALIDATED)`) sin claim | **REAL → CORREGIDO** | La guarda de `updatePayFragmentResults` trata **SENT y REJECTED** como terminales: ambos exigen `pay_status in ('DISPATCHING','UNCERTAIN')` (hubo claim/dispatch). `UNCERTAIN` conserva la guarda no-terminal (admite PREPARED/ARCHIVED). `INVALIDATED` sigue siendo exclusivo del drift de plan |
| Plan persistido como fuente directa | **VALIDADO — cerrado con evidencia** | Sin cambios: se ejecuta el plan aprobado bit-a-bit (verificado contra el ledger); el camino literal exige persistir secretos / un segundo camino (fallback), prohibidos |

---

## Detalle de lo corregido (con prueba)

### 1a — coherencia build/archive simétrica
Antes, el provider solo quitaba los refs en conflicto de `sentRefs`/`sentTargets`. Si el ledger ya estaba SENT
y llegaba un REJECTED tardío (conflicto), el provider podía marcar `build_fragment`/archive **REJECTED**
mientras el ledger conservaba SENT. Ahora el filtro es **simétrico** (también `rejectedByRef`/`rejectedTargets`):
un ref en conflicto **no se propaga en ningún sentido**; el ledger (fuente de verdad) + la marca `pay_conflict`
son la representación autoritativa.

### 1b — marca de conflicto durable y explícita
`mt101_corrective_pay_fragment` gana `pay_conflict`/`pay_conflict_reason` (V58). Ante un conflicto terminal, el
fragmento **conserva su `pay_status` real** (no se sobrescribe) y queda `pay_conflict=true` con el motivo. Así
un lector operativo (API/UI) ve, de forma explícita, que ese fragmento SENT/REJECTED tiene una contradicción
pendiente de conciliación — no se interpreta el archive contradictorio como verdad. La marca acompaña al
`PAY_CONFLICT` append-only del run (mismo advisory lock).

### 2 — REJECTED exige claim previo
Un resultado terminal de transporte (SENT **o** REJECTED) solo se persiste si el fragmento estaba
`DISPATCHING`/`UNCERTAIN` (hubo claim). Un `PREPARED → REJECTED` por bug interno queda como no-op. Los
resultados `UNCERTAIN` siguen admitidos desde estados no terminales (flujo de incertidumbre intacto).

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` — **21**:
  - `rejectedResultIsDroppedWhenFragmentWasNeverClaimedNoTerminalWithoutDispatch` (hallazgo 2: REJECTED sin
    claim → no-op, no conflicto).
  - `lateRejectedAgainstSentFragmentIsReportedAsConflictForBuildArchiveExclusion` (1a/1b: REJECTED tardío vs
    ledger SENT → no sobrescribe, `conflictReferences` lo reporta para excluir build/archive, `pay_conflict=true`,
    run UNCERTAIN).
  - `statusRejectedAfterFragmentAlreadySentRaisesConflictNotSilentIgnore` + assert `pay_conflict=true`.
  - más la carrera real (25 iteraciones), el tardío físico, el conflicto físico STATUS y el determinismo.
- `Mt101CorrectiveLifecycleServiceTest` — **35**; `Mt101StatusTaskProviderTest` — **19**.
- Dominio swift completo: **226** tests, 0 fallos.
- Integración end-to-end (Flyway real **V58**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Segundo pase (doble check) — divergencia ledger↔archive en la ruta STATUS cerrada

El v35 señalaba que `Mt101StatusTaskProvider` actualizaba `mt101_archive` (CONFIRMED/REJECTED) **antes** de
llamar a `resolvePayFragmentResults`, por lo que en un conflicto podía quedar `ledger=SENT, archive=REJECTED`
(orden de persistencia). **Cerrado:**
- `resolvePayFragmentResults` ahora **devuelve los conflictos** (`PayFragmentWriteResult`).
- El provider STATUS **resuelve el ledger PRIMERO** (conoce los conflictos) y **excluye del sync de archive**
  los `archiveId` en conflicto: el archive **no se vuelca a un terminal contradictorio** con el ledger. La
  confirmación del banco se **conserva como evidencia** en `mt101_confirmation` (no se pierde señal), y el
  conflicto queda explícito en el ledger (`pay_conflict` + `PAY_CONFLICT` + run UNCERTAIN). No se falsifica
  ninguna señal: ni se sobrescribe el ledger, ni se ignora el rechazo del banco, ni se vuelca el archive a un
  estado que un lector malinterpretaría.
- Test `correctiveStatusRejectedAgainstSentLedgerDoesNotFlipArchiveAndMarksConflict` (provider real + WireMock):
  STATUS REJECTED contra un ledger SENT → fragmento sigue SENT + `pay_conflict=true`, run UNCERTAIN, **archive
  sigue SENT** (no REJECTED), confirmación registrada, `PAY_CONFLICT` append-only.

## Pendientes documentados (no implementados este pase)

- **Prueba física de tres actores** (worker bloqueado + scheduler + STATUS REJECTED concurrente, verificando
  ledger/build/archive/confirmación a la vez): el comportamiento ya está cubierto por la prueba física de
  conflicto (2 actores) + las de repositorio del filtro simétrico/`pay_conflict` + la nueva prueba del provider
  STATUS que verifica ledger+archive+confirmación+acción; la variante de 3 hilos se deja documentada como
  refuerzo de cobertura, no como brecha funcional.
- **`resolvePayFragmentResults` desde PREPARED**: la resolución STATUS hoy apunta a `UNCERTAIN`/`DISPATCHING`
  (override del servicio `correctivePayStatuses`), por lo que el PREPARED del guard es inalcanzable en el flujo
  actual; se deja como está (no es una vía viva) y se anota para endurecer si surge un caso formal.
- **Plan persistido como fuente directa**: validado como no viable bajo la directiva (persistir el destino con
  credenciales / un segundo camino de ejecución). El destino del ledger está redactado y el payload no se
  persiste; el envío usa el plan aprobado verificado por hash.

## Conclusión

El v35 detectó correctamente que la coherencia entre fuentes de verdad y la restricción de terminales seguían
siendo **parciales**. Ahora: la propagación a build/archive es **simétrica** (ni SENT ni REJECTED en conflicto
se propagan), el conflicto tiene una **representación durable y explícita** por fragmento (`pay_conflict`), y
**todo terminal de transporte (SENT/REJECTED) exige claim previo**. Ninguna contradicción se resuelve por
reescritura silenciosa, por ignorar un resultado, ni por una divergencia ambigua entre tablas.
