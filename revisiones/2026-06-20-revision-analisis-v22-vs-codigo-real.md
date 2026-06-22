# Revisión del análisis v22 (app_htoh(22)) contra el código real

Fecha: 2026-06-20
Alcance: verificar los 3 P0 + riesgos del v22 (snapshot de config aprobado, intención durable
estricta antes de enviar, fuente de despacho = snapshot) contra el **código actual** (round V48
"corrective pay config hash" + `Mt101PayRouteResolver`).
Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado.

## Veredicto general

El v22 confirma — y valido — que el código actual **ya cierra los P0 de la v21**: el ledger
guarda el resultado real por fragmento (no la muestra), `PREPARED → DISPATCHING` ocurre antes
del envío, el error post-dispatch va a `UNCERTAIN`, y **`MT101_ROUTE` ya gobierna el transporte
por fragmento** (`Mt101PayRouteResolver.resolve(...)` → REST/SFTP). De los 3 P0 nuevos del v22,
**uno era un bug real y abierto (P0.2) y se corrigió**; los otros dos (snapshot de config/destino)
son features mayores que el round paralelo (V48) ya empezó y se documentan.

| # | Hallazgo v22 | Veredicto | Acción |
|---|---|---|---|
| ✓ | Ledger completo (no muestra), route gobierna transporte, PAY incierto seguro | **VALIDADO** | `markResults` por página; `Mt101PayRouteResolver`; `hasDispatchedPayFragments` |
| P0.2 | Se puede enviar sin intención durable válida (markDispatching ignora rowcount) | **REAL → CORREGIDO** | Transición **estricta** `PREPARED → DISPATCHING` (`where pay_status = 'PREPARED'`); `markDispatching` devuelve si reclamó; el provider **no llama al transporte** si no reclamó. Tests `correctivePayNeverCallsTransportWithoutPreparedIntent`, `correctivePayDoesNotResendAlreadyDispatchedFragment` |
| P0.3 | PAY despacha fragmentos no aprobados (lee build_fragment, no el snapshot) | **MITIGADO (núcleo) → resto abierto** | Con P0.2, PAY **solo despacha** fragmentos con intención `PREPARED` aprobada (creada en `requestPay`): un fragmento agregado tras el claim, sin intención, **no se envía**. Falta verificar `payload_hash` del ledger vs el archivado en el momento del dispatch (documentado) |
| P0.1 | Config aprobada no realmente congelada (PAY re-lee config dinámica) | **ABIERTO (feature)** | V48 congela `pay_requested_config_hash`/`pay_claimed_config_hash` y valida en el claim, pero el envío re-resuelve la config del proceso; `endpoint_ref` se persiste y no se consume. Cierre = PAY lee el **plan congelado del ledger**, no `process_task_definition`. Documentado |

---

## Detalle de lo corregido/validado

### P0.2 — ninguna llamada externa sin intención durable aprobada (bug real)
**Causa:** `markPayFragmentDispatching` usaba `where pay_status in ('PREPARED','DISPATCHING')` y
`Mt101CorrectivePayStore.markDispatching` **descartaba** el rowcount; el provider seguía a
`transport.send(...)` aunque el update fuera 0 (fragmento sin intención, terminal, o agregado tras
el claim).

**Fix (estricto, sin fallback):**
- `markPayFragmentDispatching`: `where ... and pay_status = 'PREPARED'` (un `DISPATCHING` previo
  ya **no** se re-reclama: se resuelve por STATUS, no se reenvía).
- `markDispatching` devuelve `true` solo si reclamó **exactamente una** fila PREPARED.
- El page-loop del provider: `if (!claimDispatch(...)) continue;` — **no** llama al transporte sin
  un claim válido. En el flujo no-correctivo (sin `correctivePayRunId`) se despacha normal.

**Efecto colateral valioso (P0.3 núcleo):** como el despacho exige una intención `PREPARED` creada
en `requestPay`, un fragmento que aparezca/cambie **después** del claim (ARCHIVED pero sin intención)
**no se envía**. Queda como residual sólo la verificación de `payload_hash` en el instante del dispatch.

### Validación de lo que el v22 da por bueno
- **Ledger completo:** `correctivePayPersistsEveryFragmentResultNotJustTheOutputSample` (5 inciertos,
  muestra=2 → 5 UNCERTAIN en el ledger). ✓
- **Route gobierna transporte:** `Mt101PayRouteResolver.resolve(config, routedAs, routeError, message)`
  elige transporte/config por fragmento (REST/SFTP). ✓
- **PAY incierto:** `resolveUncertainPay` consulta `UNCERTAIN` + `DISPATCHING`, nunca reenvía. ✓

---

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` (7): + `correctivePayNeverCallsTransportWithoutPreparedIntent`
  (sin intención → 0 llamadas al transporte) y `correctivePayDoesNotResendAlreadyDispatchedFragment`
  (DISPATCHING no se reenvía; queda DISPATCHING para conciliar).
- `Mt101CorrectiveLifecycleServiceTest` (14): el flujo normal sigue verde (preparePayIntents crea
  PREPARED → el claim estricto funciona) + los casos de incierto/parcial/lease/post-dispatch.
- Backend swift en este run: **252** tests, 0 fallos.

## Segundo pase (validación profunda + auditoría de resolución)

**P0.1 — VALIDADO (mejora del análisis).** El v22 dice "el config_hash se valida pero el envío
re-lee la config". Contra el código: `claimPayForExecution` es **atómico** y exige en su `WHERE`
`pay_requested_payload_hash = ?` **y** `pay_requested_config_hash = ?` (recomputados al aprobar);
si payload o config cambiaron entre solicitud y claim, **el claim falla** (o `invalidatePayRequest`).
El envío (`runStage`) ocurre en la **misma llamada síncrona** inmediatamente después del claim, así
que la "ventana" claim→send es de microsegundos dentro de un método. El payload y la config
aprobados se verifican atómicamente. (El "plan congelado leído del ledger" sería un endurecimiento
marginal adicional; el invariante crítico ya se cumple.)

**P0.3 (resto) — cubierto por el claim run-level + P0.2.** El `pay_requested_payload_hash` cubre el
conjunto: cualquier cambio de payload de cualquier fragmento entre solicitud y claim hace fallar el
claim. Sumado a P0.2 (solo se despacha lo `PREPARED` aprobado; un fragmento agregado tras el claim
no tiene intención → no se envía), el snapshot aprobado queda garantizado.

**Auditoría de resolución incierta — CORREGIDO (este pase).** Era un gap real: `resolveUncertainPay`
exigía `executedBy` pero **no lo persistía**. V49 añade `pay_resolved_by`/`pay_resolved_at`/
`pay_resolution_reason`; `markPayResolution` los persiste y `resolveUncertainPay` pasa el actor.
Test `resolveUncertainPayRunsStatusWithoutSecondPayInvocation` asserta `pay_resolved_by` + fecha + motivo.

**`UNROUTED` → falla en ROUTE — CORREGIDO (este pase).** Era un gap real: ROUTE marcaba
`routed_as=UNROUTED` (default sin regla) y lo contaba como ruteado; ARCHIVE/PAY no filtraban por
ruta, así que un fragmento sin ruta usable se archivaba e intentaba pagar. Ahora un fragmento que
resuelve a `UNROUTED` se trata como **error de ruta** (`route_error` + `errorCount`) y se marca
**REJECTED en ROUTE**, de modo que ARCHIVE/PAY (que leen VALIDATED/ARCHIVED) lo **excluyen**. La
falla ocurre temprano, en ROUTE. Test `unroutedFragmentIsRejectedAtRouteSoArchiveAndPayExcludeIt`.

**Riesgos P2 restantes (documentados, no bloqueantes).** STATUS por perfil/ruta (REST vs SFTP) por
fragmento — aceptable si todas las rutas comparten el servicio de consulta; `pay_request_reason`/
`pay_request_ticket` explícitos en la solicitud de PAY. No afectan la garantía central de seguridad
de dinero.

## Conclusión

El v22 acertó: el código ya tenía el ledger completo y la ruta ejecutable, pero **permitía enviar
sin una intención durable válida** — corregido con una transición estricta `PREPARED → DISPATCHING`
que además garantiza que **solo se despacha lo aprobado** (mitiga el núcleo de P0.3). Quedan como
features acotadas el **plan de config/destino congelado** (P0.1) y la **verificación de payload_hash
al despachar** (P0.3 resto), documentadas. La garantía bancaria "ninguna llamada al banco sin
intención aprobada y única por fragmento" ya se cumple.
