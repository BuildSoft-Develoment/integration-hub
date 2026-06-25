# Revisión del análisis v33 (app_htoh(33)) contra el código real

Fecha: 2026-06-25
Alcance: el v33 valida el cierre de la aceptación tardía (v29) y plantea **un riesgo residual nuevo**: la
carrera entre la **aceptación tardía** y una **resolución STATUS terminal**, más dos pendientes recurrentes
(plan persistido como fuente directa; prueba concurrente real con `send()` bloqueado). Directiva: sin código
fallback / sin caminos legacy. Validar lo ya implementado.

## Veredicto general

El v33 acierta en **un hallazgo real**: `updatePayFragmentResults` escribía el fragmento **sin condición de
estado**, así que un ACCEPTED tardío podía **sobrescribir en silencio** un terminal ya resuelto por STATUS
(REJECTED) → `fragmento=SENT, run=FAILED` contradictorio. Se corrige. Los otros dos pendientes ya estaban
implementados/validados (uno de ellos, la prueba concurrente real, el v33 lo dio por pendiente al revisar un
zip sin el último commit).

| # | Punto v33 | Veredicto | Acción |
|---|---|---|---|
| Carrera aceptación-tardía ↔ resolución STATUS terminal | **REAL → CORREGIDO** | `updatePayFragmentResults` ahora corre bajo el MISMO advisory lock por run y solo transiciona desde un estado **no terminal** (PREPARED/DISPATCHING/UNCERTAIN). Un SENT tardío sobre un fragmento ya REJECTED/INVALIDATED **no se sobrescribe**: se registra `PAY_CONFLICT` append-only y el run se fuerza a **UNCERTAIN** (conciliación manual), nunca un terminal silencioso |
| Prueba concurrente real con `send()` bloqueado | **YA IMPLEMENTADA (v30)** | `physicalLateAcceptanceWithBlockedSendAndConcurrentSchedulerResolvesRunToSent`: 2 hilos + `CountDownLatch`, provider real, `transport.send()` bloqueado en un hilo + scheduler en otra conexión. El v33 revisó un zip previo a ese commit |
| Plan persistido como fuente directa de dispatch | **VALIDADO — cerrado con evidencia** | El plan se resuelve una vez, se verifica por hash completo contra el ledger y se envía el MISMO objeto (sin TOCTOU). El `dispatch_destination` se persiste redactado y el payload no se persiste → el camino literal exige persistir secretos / un segundo camino (fallback), prohibidos. Prueba positiva `dispatchedPlanIsBitForBitTheApprovedLedgerPlan` (lee el ledger de la BD) |

---

## Detalle de lo corregido (con prueba)

### Aceptación tardía ↔ resolución STATUS terminal (PAY_CONFLICT)
**Escenario (validado en el código):**
1. scheduler → run + fragmento UNCERTAIN (lease vencido tras dispatch).
2. operador vía STATUS → fragmento **REJECTED**, run **FAILED** (resolución terminal).
3. worker tardío → `updatePayFragmentResults` con **SENT** (el banco aceptó).

Antes: el UPDATE no tenía condición de estado → el SENT tardío **sobrescribía** el REJECTED →
`fragmento=SENT, run=FAILED`, contradictorio y sin auditar; `resolveLateAcceptedPayRun` no lo reparaba (solo
actúa si el run sigue UNCERTAIN).

**Fix (sin fallback):** `updatePayFragmentResults` se centraliza bajo el **mismo advisory lock** por run y:
- Solo transiciona el fragmento desde un estado **no terminal** (`pay_status not in
  ('SENT','REJECTED','INVALIDATED')`). El camino normal (DISPATCHING→SENT/REJECTED/UNCERTAIN) y el tardío
  (UNCERTAIN→SENT) siguen funcionando; un terminal ya resuelto **no se toca**.
- Si un resultado **SENT** no se aplicó porque el fragmento ya está **REJECTED/INVALIDATED**, es un
  **conflicto** (el banco aceptó algo dado por no enviado): se registra `PAY_CONFLICT` append-only y el run se
  fuerza a **UNCERTAIN** (estado real ambiguo), para conciliación manual — nunca un terminal silencioso ni un
  re-request ciego de un fragmento que el banco sí aceptó.

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` — **16**:
  - `lateAcceptedSentDoesNotOverwriteStatusRejectedFragmentAndRecordsConflict`: STATUS dejó REJECTED+run
    FAILED; un SENT tardío **no** sobrescribe → fragmento REJECTED, run UNCERTAIN, `PAY_CONFLICT` registrado,
    `updated==0`.
  - `lateResultNeverOverwritesAlreadySentFragmentWithoutFalseConflict`: SENT sobre SENT es no-op idempotente,
    **sin** falso PAY_CONFLICT.
  - más la prueba **física** concurrente (`send()` bloqueado + scheduler), la carrera real (25 iteraciones) y
    el determinismo positivo del plan.
- `Mt101CorrectiveLifecycleServiceTest` — **35**: aceptación tardía end-to-end + regla conservadora.
- Dominio swift completo: **221** tests, 0 fallos.
- Integración end-to-end (Flyway real **V57**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Mejora del análisis (pendientes recurrentes)

- **Prueba concurrente real con `send()` bloqueado**: ya existe desde la v30
  (`physicalLateAcceptanceWithBlockedSendAndConcurrentSchedulerResolvesRunToSent`), con 2 hilos +
  `CountDownLatch` + provider real + `transport.send()` bloqueado + scheduler en otra conexión. El v33 la
  reportó como pendiente por revisar un paquete anterior a ese commit.
- **Plan persistido como fuente directa**: validado y cerrado con evidencia (se ejecuta el plan aprobado
  bit-a-bit, leído del ledger en `dispatchedPlanIsBitForBitTheApprovedLedgerPlan`). El camino literal no es
  viable sin persistir secretos ni añadir un segundo camino (fallback), ambos prohibidos por la directiva.

## Conclusión

El v33 detectó correctamente la única grieta real restante en la recepción de resultados: una aceptación
tardía podía sobrescribir en silencio una resolución terminal contradictoria. Queda cerrada con recepción
centralizada bajo advisory lock, guarda contra sobrescritura de terminales y acción `PAY_CONFLICT` append-only
que fuerza UNCERTAIN para conciliación manual. Con esto, la propiedad bancaria —un fragmento se envía una sola
vez, no se duplica, y ninguna duda o contradicción se resuelve por reescritura silenciosa— queda completa.
