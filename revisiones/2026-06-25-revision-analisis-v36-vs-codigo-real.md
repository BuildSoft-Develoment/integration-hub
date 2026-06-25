# Revisión del análisis v36 (app_htoh(36)) contra el código real

Fecha: 2026-06-25
Alcance: el v36 valida los cierres del v35 (conflicto simétrico ledger/build/archive, `pay_conflict` durable,
SENT/REJECTED exigen claim, divergencia ledger↔archive en STATUS) y plantea **un riesgo nuevo crítico**: el
**autocierre de un PAY_CONFLICT**. Directiva: sin código fallback / sin caminos legacy. Validar lo implementado.

## Veredicto general

El v36 es preciso: el autocierre de PAY_CONFLICT es un **bug real** (introducido al añadir `resolveLateAccepted
PayRun` sin consultar `pay_conflict`). Se corrige en las dos vías de resolución. El "plan persistido como fuente
directa" sigue validado como no viable bajo la directiva.

| # | Hallazgo v36 | Veredicto | Acción |
|---|---|---|---|
| Autocierre de PAY_CONFLICT | **REAL → CORREGIDO** | `resolveLateAcceptedPayRun` (scheduler/tardío) ya no resuelve a SENT si algún fragmento tiene `pay_conflict=true`, aunque todos estén SENT. `payFragmentSummary` incluye `conflicts`; `resolveUncertainPay` (operador) tampoco auto-resuelve a SENT/PARTIALLY_SENT/FAILED si hay conflicto: mantiene UNCERTAIN para conciliación manual |
| Coherencia simétrica ledger/build/archive (gateway y STATUS) | **VALIDADO (v35)** | Confirmado: el provider excluye refs en conflicto de build/archive en ambos sentidos; STATUS resuelve el ledger antes y excluye archiveId en conflicto, conservando la confirmación como evidencia |
| SENT/REJECTED sin claim | **VALIDADO (v35)** | Ambos terminales exigen `DISPATCHING`/`UNCERTAIN` |
| Aclaración STATUS normal (SENT vs archive CONFIRMED/REJECTED) | **CORRECTO** | El PAY_CONFLICT solo aplica cuando STATUS resuelve el ledger (`resolveCorrectivePay=true` / UNCERTAIN). El STATUS posterior normal persiste confirmación + archive sin re-resolver el ledger; coherente con el contrato |
| Plan persistido como fuente directa | **VALIDADO — no viable bajo la directiva** | Sin cambios: se ejecuta el plan aprobado verificado por hash; el camino literal exige persistir secretos / un segundo camino (fallback) |

---

## Detalle de lo corregido (con prueba)

### Autocierre de PAY_CONFLICT — bloqueado en ambas vías
**Causa (validada en el código):** `resolveLateAcceptedPayRun` contaba `total` y `sent` y resolvía
`UNCERTAIN→SENT` si `sent==total`, **sin** consultar `pay_conflict`. Así, un run conflictivo (PAY aceptado →
ledger SENT; STATUS REJECTED → PAY_CONFLICT, run UNCERTAIN, fragmento SENT + `pay_conflict=true`) podía
**auto-cerrarse a SENT**, contradiciendo la regla de conciliación manual.

**Fix (sin fallback):**
- `resolveLateAcceptedPayRun`: añade `count(*) filter (where pay_conflict)`; si hay **algún** conflicto →
  **no** resuelve (devuelve 0). Un PAY_CONFLICT exige conciliación manual.
- `payFragmentSummary`: incluye `conflicts`.
- `resolveUncertainPay`: primera rama — si `summary.conflicts() > 0`, el run se mantiene **UNCERTAIN** (no
  SENT/PARTIALLY_SENT/FAILED), con razón explícita de conciliación manual.

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` — **22**:
  `resolveLateAcceptedPayRunDoesNotAutoCloseWhenAnyFragmentInConflict` (run UNCERTAIN + fragmento SENT con
  `pay_conflict=true` → resolveLateAcceptedPayRun devuelve 0, run sigue UNCERTAIN, sin PAY_RESOLVED).
- `Mt101CorrectiveLifecycleServiceTest` — **36**:
  `payConflictBlocksAutoResolutionRequiringManualReconciliation` (lifecycle real: PAY SENT → conflicto →
  resolveLateAcceptedPayRun NO cierra; resolveUncertainPay del operador tampoco resuelve a terminal, mantiene
  UNCERTAIN con razón de conflicto).
- `Mt101StatusTaskProviderTest` — **20** (incluye la prueba de archive en conflicto del v35).
- Dominio swift completo: **229** tests, 0 fallos.
- Integración end-to-end (Flyway real **V58**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Pendiente documentado

- **Plan persistido como fuente directa de dispatch**: el v36 lo reitera como el pendiente funcional más
  importante. Se mantiene la conclusión validada: el `dispatch_destination` del ledger está **redactado** (sin
  credenciales) y el payload **no se persiste** (solo su hash), por diseño. Ejecutar "directo del ledger"
  exigiría persistir secretos y/o un segundo camino de ejecución (fallback/legacy), ambos prohibidos por la
  directiva. El modelo actual resuelve el plan UNA vez, lo verifica bit-a-bit por hash contra el ledger
  aprobado y envía ese mismo objeto (sin TOCTOU) — "plan usado = plan aprobado" demostrable.

## Conclusión

El v36 detectó correctamente la única grieta nueva: una auto-resolución podía cerrar en silencio un
PAY_CONFLICT que exige conciliación manual. Queda bloqueada en las dos vías (resolución tardía del scheduler y
resolución del operador), con `pay_conflict` integrado en el resumen de fragmentos. Ninguna contradicción
terminal se resuelve ya por reescritura silenciosa, por ignorar un resultado, por divergencia entre tablas, ni
por **auto-cierre** de un conflicto pendiente.
