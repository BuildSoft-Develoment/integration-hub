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

## Abierto (features, documentado para autorización)

**P0.1 — snapshot de config/destino ejecutado.** Que PAY lea el **plan inmutable por fragmento**
del ledger (`transport`/`endpoint_ref`/`connection_ref`/`idempotency`/`config_hash`/secret_ref
versionado) en vez de re-resolver `process_task_definition`. Hoy el `config_hash` se valida en el
claim pero el envío re-lee la config actual; `endpoint_ref` se persiste y no se consume.

**P0.3 (resto) — verificación de `payload_hash` al despachar.** Antes de `transport.send`, comparar
`payload_hash` del ledger con el del fragmento archivado actual; si difiere → `PAY_INVALIDATED`,
no enviar. (El núcleo "no enviar sin intención aprobada" ya está por P0.2.)

**Riesgos P1/P2.** STATUS por perfil/ruta (REST vs SFTP) por fragmento; auditoría durable de
`resolveUncertainPay` (actor/fecha/motivo/resultado por :20:); `UNROUTED` debe fallar en ROUTE
antes de ARCHIVE/PAY.

## Conclusión

El v22 acertó: el código ya tenía el ledger completo y la ruta ejecutable, pero **permitía enviar
sin una intención durable válida** — corregido con una transición estricta `PREPARED → DISPATCHING`
que además garantiza que **solo se despacha lo aprobado** (mitiga el núcleo de P0.3). Quedan como
features acotadas el **plan de config/destino congelado** (P0.1) y la **verificación de payload_hash
al despachar** (P0.3 resto), documentadas. La garantía bancaria "ninguna llamada al banco sin
intención aprobada y única por fragmento" ya se cumple.
