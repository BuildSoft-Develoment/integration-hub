# Revisión del análisis v30 (app_htoh(30)) contra el código real

Fecha: 2026-06-24
Alcance: el v30 valida que el caso extremo del v29 (aceptación tardía tras vencer el lease) quedó cerrado, y
deja **dos pendientes**: (1) ejecutar PAY directamente desde el plan persistido y (2) una **prueba realmente
concurrente** con `transport.send()` bloqueado + scheduler en otro hilo. Directiva: sin código fallback / sin
caminos legacy. Validar lo ya implementado.

## Veredicto general

El v30 no detecta regresiones. De sus dos pendientes, el (2) es un **hueco de prueba real** y se cierra con una
prueba físicamente concurrente; el (1) ya estaba **validado y cerrado con evidencia** en el segundo pase del v29.

| # | Pendiente v30 | Veredicto | Acción |
|---|---|---|---|
| 1 | Plan persistido como **fuente directa** de dispatch | **VALIDADO — cerrado con evidencia (v29 2º pase)** | El plan se resuelve UNA vez, se hashea/verifica contra el ledger aprobado y se envía el MISMO objeto (sin re-resolución, sin TOCTOU). El `dispatch_destination` se persiste **redactado** y el payload no se persiste (por diseño) → despachar "directo del ledger" es **inviable** sin guardar secretos y sería un **segundo camino (fallback prohibido)**. Prueba positiva `dispatchedPlanIsBitForBitTheApprovedLedgerPlan` |
| 2 | Prueba **realmente concurrente** con `send()` bloqueado + scheduler en otro hilo | **VIABLE → IMPLEMENTADO** | Nueva prueba física `physicalLateAcceptanceWithBlockedSendAndConcurrentSchedulerResolvesRunToSent`: provider REAL + Postgres real; el worker reclama el fragmento y se **bloquea dentro de `transport.send()`** mientras, en otra conexión, vence el lease y corre el scheduler (run+fragmento UNCERTAIN); al liberar `send()` (ACCEPTED) el fragmento queda SENT y la resolución tardía deja el run SENT |

---

## Detalle de lo implementado (con prueba)

### #2 — prueba física: `send()` bloqueado + scheduler concurrente
El test de aceptación tardía del v29 (`lateAcceptanceAfterLeaseExpiryResolvesRunToSentWithoutResend`) simula el
escenario **dentro de un provider fake** (síncrono). El v30 pide el **flujo físico real**. Nueva prueba
(`Mt101PayFragmentReprocessTest`, provider REAL + Testcontainers Postgres):

1. El worker (hilo aparte) ejecuta el provider real: reclama el fragmento (PREPARED→DISPATCHING, **commiteado**)
   y entra a `transport.send()`, que **se bloquea** en un latch (`BlockingTransport`).
2. El test verifica que el fragmento ya está `DISPATCHING` y que el worker está dentro de `send()`.
3. En **otra conexión** vence el lease (`pay_lease_until = now - 1min`) y corre el scheduler
   (`markExpiredPayExecutionsUncertain`): run **UNCERTAIN**, fragmento DISPATCHING→**UNCERTAIN**, acción
   `PAY_UNCERTAIN`.
4. Se libera `send()` → responde **ACCEPTED** → el worker persiste el fragmento **SENT** (sobrescribe el
   UNCERTAIN del scheduler con el resultado real del banco).
5. La resolución tardía (`resolveLateAcceptedPayRun`, como la invoca el servicio): run UNCERTAIN + todos SENT
   → **SENT**, acción `PAY_RESOLVED` append-only.

**Asersiones (todas verdes):**
- `transport.callsReceived() == 1` → **un solo envío físico** (sin reenvío ciego).
- fragmento final = **SENT**.
- run final = **SENT** (jamás `INVALIDATED` tras un dispatch aceptado).
- auditoría append-only: **PAY_UNCERTAIN** (scheduler) + **PAY_RESOLVED** (resolución tardía).

Esto demuestra el flujo físico exacto que pedía el v30: claim → dispatch (bloqueado) → vencimiento de lease →
scheduler concurrente → aceptación tardía → resolución, sin duplicidad y con evidencia.

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` — **14**: incluye la prueba **física** concurrente nueva, la carrera real
  scheduler↔dispatcher (25 iteraciones) y la prueba **positiva de determinismo** del plan aprobado.
- `Mt101CorrectiveLifecycleServiceTest` — **35**: aceptación tardía end-to-end (provider) + regla conservadora.
- Dominio swift completo: **219** tests, 0 fallos.
- Integración end-to-end (Flyway real **V57**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos (sin cambios en `src/main` este pase; vigente del pase anterior).

## Mejora del análisis (#1, reiterado)

El v30 vuelve a citar "ejecutar PAY directamente desde el plan persistido" y él mismo lo clasifica como
*hardening final, no bloqueo de trazabilidad*. Se mantiene la conclusión, ahora con evidencia a nivel de línea
(v29 2º pase): resolución única del plan + verificación por hash completo + envío del MISMO objeto; el
`dispatch_destination` del ledger está redactado y el payload no se persiste, por lo que el camino literal es
inviable sin almacenar secretos y constituiría un segundo camino (fallback), prohibido por la directiva.

## Conclusión

El v30 confirma que el PAY protege el caso más delicado —un envío que pudo llegar al banco mientras el lease
vence— sin reenvío ciego, con evidencia append-only y resolución automática de la aceptación tardía. El único
hueco real del v30 (la **prueba físicamente concurrente** con `send()` bloqueado + scheduler) queda cerrado con
una prueba de transporte bloqueado en un hilo y scheduler en otra conexión sobre Postgres real. El "plan
persistido como fuente directa" permanece validado y cerrado con evidencia (ya se ejecuta el plan aprobado
bit-a-bit; el camino literal no es viable sin persistir secretos ni añadir un camino legacy).
