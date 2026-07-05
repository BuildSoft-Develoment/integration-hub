# Análisis — resolución del `UNCERTAIN` del PAY normal por STATUS/RECONCILE (pendiente #1 post-v51)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar todavía).
Contexto: v51 hizo durable el estado del PAY normal (un resultado ambiguo o una caída post-envío deja el fragmento en
`UNCERTAIN`/`DISPATCHING`, EXCLUIDO de una nueva selección de PAY → nunca reenvío automático). Falta el flujo que
**resuelve** ese estado (STATUS/RECONCILE → `SENT`/`REJECTED`).

## Cómo resuelve HOY el correctivo (el template a seguir)

`Mt101CorrectiveLifecycleService.resolveUncertainPay` + endpoint `/rebuild-runs/resolve-uncertain-pay`:
1. Exige `run.payStatus == UNCERTAIN`.
2. Corre `MT101_STATUS` con `correctivePayStatuses=[UNCERTAIN,DISPATCHING]` + `resolveCorrectivePay=true`, contra el
   **perfil de STATUS congelado** al enviar (sin fallback a la config viva).
3. La fuente de registros del STATUS es **durable**: `rebuildRepository.correctivePayStatusRecords(runId, payStatuses,…)`
   lee el ledger `mt101_corrective_pay_fragment` filtrado por estado.
4. Propaga el resultado (`syncCorrectiveBuildFragmentsFromPay`) y resuelve el run a `SENT`/`PARTIALLY_SENT`/`FAILED`
   según el gateway; un `pay_conflict` (STATUS contradice el ledger) → **conciliación manual**, nunca auto-resuelve.
5. **Nunca reenvía**; para los `SENT` corre `MT101_RECONCILE`.

## El gap en el flujo normal (verificado en código)

| Mecanismo | Correctivo | Normal | Consecuencia |
|---|---|---|---|
| Fuente de registros del STATUS | **BD por estado** (`correctivePayStatusRecords` sobre el ledger) | **In-memory** (`readRecords` → `taskOutputs[sourceTaskRef.sourceOutput]`) | El STATUS normal solo ve lo que PAY le pasó en el pipeline |
| Qué emite PAY a STATUS | ledger completo | `outputs.put("records", accumulator.sent)` → **solo SENT** | Un fragmento `UNCERTAIN` **nunca llega** al STATUS normal |
| Flujo de resolución out-of-band | `resolveUncertainPay(rebuildRunId)` | **no existe** (el resolver exige un `rebuildRunId` correctivo) | Un `UNCERTAIN` normal no tiene endpoint/servicio de resolución |
| Reproceso técnico | — | `Mt101ReprocessService.ALLOWED_TRANSITIONS` = `{REJECTED,VALIDATED,ARCHIVED}` → **excluye** `UNCERTAIN`/`DISPATCHING` | El reproceso **rechaza** mover un `UNCERTAIN`/`DISPATCHING` normal |

**Conclusión del gap:** tras v51, un fragmento normal en `UNCERTAIN`/`DISPATCHING` es **seguro** (nunca se reenvía
solo) pero es un **callejón sin salida**: no hay forma soportada de consultarlo contra el gateway ni de moverlo a
`SENT`/`REJECTED`. Hoy solo se destraba con intervención manual en BD.

## Datos de correlación (para diseñar la consulta)

- `mt101_build_fragment` (V14) NO tiene `gateway_reference`; correlaciona por `senders_reference` (:20:).
- Las confirmaciones normales aterrizan en `mt101_confirmation`/`mt101_archive` (V12, `gateway_reference`,
  `confirmed_status`), keyed por `archive_id`.
- El STATUS normal ya confirma por `senders_reference`/archive en el pipeline (modo `poll`/`query`), así que la
  consulta al gateway por :20: ya está soportada por el provider; lo que falta es **alimentarle los fragmentos
  `UNCERTAIN`/`DISPATCHING` desde una fuente durable**, no del hand-off in-memory.

## Diseño propuesto (bounded, espeja el correctivo, sin reenvío)

1. **Fuente durable** — nuevo `Mt101FragmentRepository` query: fragmentos de un `fragmentSetId` con
   `status IN ('UNCERTAIN','DISPATCHING')` (paginado), devolviendo `senders_reference` + correlación de archive.
2. **Servicio de resolución** `resolveUncertainNormalPay(connectionRef, fragmentSetId, statusConfig, executedBy,
   reason)` que:
   - corre `MT101_STATUS` (modo query/poll) sobre esos fragmentos, contra `statusConfig`;
   - gateway **final-aceptado** → `UNCERTAIN/DISPATCHING → SENT` (+ `MT101_RECONCILE`);
   - gateway **final-rechazado** → `→ REJECTED` (queda reprocesable por la transición existente `REJECTED→BUILT`);
   - gateway **pendiente/desconocido** → se mantiene `UNCERTAIN` (reintentar luego);
   - **conflicto** (gateway contradice) → conciliación manual, sin auto-resolver;
   - **nunca** reenvía.
3. **Endpoint** `/rebuild-runs/resolve-uncertain-normal-pay` (o equivalente en el recurso de operación).
4. (Opcional, defensivo) permitir en `ALLOWED_TRANSITIONS` `DISPATCHING→UNCERTAIN` o dejar la resolución como único
   camino desde `DISPATCHING` (evita que el reproceso técnico toque un fragmento en vuelo).

## Decisión de diseño abierta (requiere autorización)

El correctivo **congela** el perfil de `MT101_STATUS` al enviar; el normal **no** lo hace (usa la config viva del
pipeline). Para una resolución out-of-band del normal hay dos opciones:
- **(A)** Pasar el `statusConfig` explícito en la llamada de resolución (el operador/el proceso lo aporta).
- **(B)** Leer la config de la tarea `MT101_STATUS` de la definición de proceso correspondiente al set (como hace el
  correctivo con `taskConfigUnresolved`), re-resolviendo secretos desde Vault.

(B) es más consistente con el patrón existente pero acopla la resolución a la definición de proceso; (A) es más simple
y explícito. **Recomiendo (B)** por coherencia con el correctivo y por no exigir al operador reconstruir la config.

## Veredicto

- El gap es **REAL** y es la contraparte natural de v51: cerramos el reenvío, falta cerrar la **resolución**.
- No es un P0 de doble envío (v51 ya lo impide); es un pendiente de **operabilidad/ciclo de vida** money-path.
- Es **bounded** (una query durable + un servicio que reusa `MT101_STATUS`/`MT101_RECONCILE` + endpoint + tests),
  espejando `resolveUncertainPay`, con la única decisión abierta del origen del `statusConfig`.
