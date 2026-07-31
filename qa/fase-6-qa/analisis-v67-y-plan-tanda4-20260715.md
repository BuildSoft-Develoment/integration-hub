# Analisis v67 contra el código real + plan tanda-4 — 2026-07-15

> Entrega **para autorización**. No se ha implementado nada de esta tanda todavía. Regla vigente:
> **sin código fallback / sin caminos legacy en el fuente**; lo ya implementado se **valida**.

## Veredicto

La v67 es un análisis **preciso**. Verifiqué cada punto contra el código real (`Mt101PayTaskProvider.java`,
889 líneas). Sus dos hallazgos nuevos **son bugs reales y los confirmo**:

- **#7 (P1): `transportFailure` en PAY normal persistido deja el fragmento en `DISPATCHING`.** CONFIRMADO.
- **#8: PAY por lista mapea `transportFailure` → `REJECTED`** (en dos lugares). CONFIRMADO.

Y hay **dos correcciones que hacerle a la v67**: los puntos que marca como "pendientes" **#9 (H7)** y **#10
(nativo)** **ya están resueltos** en esta sesión (commits `982903cd` y `ab4d2a3f`). Ver §Validado.

---

## Hallazgo #7 — PAY normal + transportFailure deja el fragmento en DISPATCHING (P1, real)

### Traza confirmada (`Mt101PayTaskProvider.dispatchFragmentPage`, flujo `rebuildRunId==null`)

1. **L276** `claimedNormalRefs = fragmentStore.claimForDispatch(fragmentSource, pageRefs, FRAGMENT_READ_STATUSES)`
   → mueve el fragmento **`ARCHIVED → DISPATCHING`** de forma atómica.
2. **L350-352** solo se despacha lo reclamado → el fragmento **está en DISPATCHING**.
3. **L370-375** rama `result.retriable()`: **intencionalmente no toca** `sentRefs`, `rejectedByRef` ni
   `uncertainRefs`. El comentario dice *"el fragmento build queda ARCHIVED (re-pagable)"* — **es falso en el
   flujo normal**: ya fue reclamado a DISPATCHING en L276 y nadie lo revierte.
4. **L399-404** normal → `finalizeNormalGuarded(...)`, que solo transiciona desde `DISPATCHING/UNCERTAIN` los
   refs de `sentRefs` (L429), `rejectedByRef` (L430) y `uncertainRefs` (L466). **El ref retriable no está en
   ninguna → nunca se toca.**
5. **L508-515** `persistCorrectiveLedger` es **no-op en normal** (`rebuildRunId==null` → retorna `List.of()`):
   el `pageLedger` con `INVALIDATED` se descarta. En normal la **única** fuente de verdad es
   `build_fragment.status`.

**Resultado:** `build_fragment.status = DISPATCHING` permanente. Como `FRAGMENT_READ_STATUSES = ["ARCHIVED"]`
(L51), PAY normal **nunca lo re-lee** → sin camino de re-solicitud. El output dice `invalidatedCount>0` /
`INVALIDATED` (L726) pero el fragmento queda huérfano. **No es doble pago** (retriable ⟺ pre-despacho, nada
salió al banco), **es un callejón sin salida operativo**.

### Doble check (verificado, refuerza el hallazgo)

- **Misma columna:** `claimForDispatch` (`Mt101FragmentRepository` L317) hace `set status='DISPATCHING'`;
  `resolvePayStatusReturning` (L469/L508) hace `set status=?`. **Ambos sobre `status`** (el nombre "PayStatus"
  engaña). → el fix por `resolvePayStatusReturning` es directo.
- **Alcanzable:** el `dispatch` normal usa `durableIntent=false` → `sendClassified` (L598-599), que emite
  `transportFailure` (retriable) en pre-despacho (`PreDispatchTransportException`) **y** `transport.send()`
  devuelve `transportFailure` en fallo de conexión/auth (probado en vivo D.2 con credencial mala).
- **Sin barrido de rescate + bloquea el cierre:** no hay job que revierta DISPATCHING colgado; y peor,
  `DISPATCHING` es estado **no-terminal que bloquea el cierre de conciliación**
  (`Mt101ReconciliationCloseService`: rechaza cerrar si hay ARCHIVED/UNCERTAIN/DISPATCHING). El fragmento
  atascado **bloquea el proceso permanentemente sin ruta de salida**. La Opción A lo vuelve `ARCHIVED`
  (re-pagable; sigue bloqueando el cierre hasta que se re-pague y llegue a terminal — que es lo correcto).

> Nota de alcance: el **correctivo** NO tiene este bug. Ahí el claim es sobre el ledger correctivo
> (`correctivePayStore.markDispatching`, L330), no sobre `build_fragment` vía `claimForDispatch`; el
> `build_fragment` sigue ARCHIVED y el run queda `INVALIDATED` re-solicitable (evidencia D.2 viva). El bug es
> **exclusivo del flujo normal persistido**.

### Fix propuesto (Opción A — recomendada, money-safe y sin estado nuevo)

Revertir el claim para los refs retriable en el flujo normal: **`DISPATCHING → ARCHIVED`**, con el mismo
mecanismo guardado que ya usa `finalizeNormalGuarded`:

- Recolectar los refs `retriable` en una lista nueva (`invalidatedRefs`) en `dispatchFragmentPage` normal.
- En `finalizeNormalGuarded`: `fragmentStore.resolvePayStatusReturning(fragmentSource, invalidatedRefs,
  List.of("DISPATCHING"), "ARCHIVED", null)` (transición guardada solo-desde-DISPATCHING).
- La auditoría **ya es correcta**: `recordEnvelope` (L380) mapea retriable → `RECORD_INVALIDATED` (L551-554),
  con `error_message`. Solo falta la transición del fragmento.
- Corregir el comentario engañoso de L372-375.

**Money-safety:** los transportes ponen `dispatchStarted=true` justo antes del `channel.put`/`send`, así que
`retriable` ⟺ fallo **pre-despacho** (el banco no recibió nada). Volver a `ARCHIVED` lo re-lee la próxima
ejecución de PAY (tras corregir credencial/conexión); no hay doble pago porque nada salió. Espejo semántico
del `INVALIDATED` correctivo, pero encajado en el modelo del normal (re-lee ARCHIVED), sin exigir STATUS.

**Opción B (descartada salvo que la pidas):** nuevo estado `INVALIDATED` en `build_fragment` + exclusión de
lectura + UI + flujo de re-solicitud. Más auditable pero pesado y **duplica** el modelo correctivo en el
normal; para el normal, que se re-selecciona por `ARCHIVED`, la A es más simple y suficiente (la auditoría ya
distingue el fallo técnico).

---

## Hallazgo #8 — PAY por lista + transportFailure → REJECTED (real; y es camino legacy)

El camino por lista in-memory (`else` de L160, cuando `fragmentSource` vacío / sin `fragmentStore`) mapea
`transportFailure` a **REJECTED en dos lugares**:

1. **L684-686** `intentStatus(result)` = `accepted?SENT : uncertain?UNCERTAIN : "REJECTED"` — **no contempla
   `retriable()`** → el intent durable (L633) se registra **REJECTED**.
2. **L177-178** el `else` (que incluye retriable) → `collectArchiveId(..., rejectedArchiveIds)` →
   **L184 `syncArchiveIds(..., "REJECTED")`** → el archive baja a REJECTED.

Ambos **contradicen** el output/accumulator, que sí cuenta `invalidatedCount` (L749) y reporta `INVALIDATED`
(L726).

### Doble check (corrige la severidad — más baja de lo que implicaba la v67)

- **El intent REJECTED NO es dead-end.** `Mt101PayDispatchIntentStore` documenta y implementa (L21 + el
  `on conflict (dispatch_key) do update ... where status='REJECTED'`) que un intent `REJECTED` = *"rechazo
  pre-dispatch, probado que no salió → se re-reclama y se permite reintento"*. Es decir, `intentStatus(retriable)
  = REJECTED` **funcionalmente re-solicita bien** (el re-request re-reclama). El defecto ahí es solo de
  **etiqueta/semántica** (dice REJECTED donde debería decir INVALIDATED), no de comportamiento.
- **Lo que sí es un defecto real es el archive:** `syncArchiveIds(rejectedArchiveIds, "REJECTED")` (L184) deja
  `mt101_archive.status = REJECTED` para un fragmento que **nunca llegó al banco** → la pista de auditoría
  presenta un **fallo técnico pre-despacho como si fuera un rechazo de negocio del banco**. Eso es lo que hay
  que arreglar (consistencia de auditoría), no un bloqueo de re-solicitud.
- **Severidad revisada:** de "inconsistencia que rompe re-solicitud" a **inconsistencia de auditoría en un
  camino legacy**. Sigue valiendo arreglarlo (o eliminar el camino), pero es **P2**, no P1. El #7 es el único
  P1 de esta tanda.

**Decisión que necesito de ti (por la regla "sin caminos legacy"):** este camino por lista es el **no
persistido / no money-path** (el money-path real siempre pasa por `build_fragment`: BUILD→…→PAY, flujo
persistido). Dos salidas:

- **(8a) Alinearlo:** `intentStatus(retriable)="INVALIDATED"` + tratar retriable como el `uncertain` (no tocar
  archive, no REJECTED). Barato.
- **(8b) Eliminarlo:** si ningún ambiente usa PAY-por-lista en producción, borrarlo del fuente (coherente con
  "sin caminos legacy"). Requiere que confirmes que no hay proceso/ambiente que dependa del PAY directo sin
  fragmentos.

Mi recomendación depende de tu respuesta a **"¿algún ambiente ejecuta MT101_PAY sin build_fragment?"**. Si no
→ **8b (eliminar)**. Si sí (aunque sea UAT/demo) → **8a (alinear)**. No propongo dejar ambos.

---

## Validado — lo que la v67 marca "corregido" y confirmo implementado

| Punto v67 | Estado real | Evidencia en código |
|---|---|---|
| #1 Multi-PAY por `resolvesPayTaskRef` | **Implementado** | `Mt101PayResolverPairing` + ambos validadores lo usan |
| #2 PAY/STATUS misma conexión (helper compartido) | **Implementado** | `Mt101PayStatusConnectionCoverageValidator` usa el pairing |
| #3 4ª clasificación `transportFailure/retriable` | **Implementado** | `TransportResult.retriable` + `payStatusOf` (L671-682) |
| #4 INVALIDATED re-solicitable correctivo | **Implementado** | `payStatusOf`→INVALIDATED; run ARCHIVED/INVALIDATED |
| #5 Cuarentena hijo + SUPERSEDED | **Implementado** | `resolveRootOriginalSet`, `propagateChildSentToRootQuarantine`, `deriveLifecycleStatus`+SUPERSEDED |
| #6 Evidencia viva ~175 tests | **Documentada** | `evidencias/validacion-viva-tandas-20260715.md` |

## Correcciones a la v67 (puntos que da por pendientes y ya NO lo están)

- **#9 (H7 / `INSERT_BATCH_MAX_BYTES`):** la v67 recomienda *"hacer configurable
  `mt101.build.insert-batch-max-bytes=200000`, no hardcoded"*. **Ya hecho** (commit `982903cd`): default 200KB
  + property de **runtime** (env-tuneable sin recompilar). Su recomendación era exacta; está cerrada.
- **#10 (nativo):** RedisDataSource / quarkus-rabbitmq-client / quarkus-artemis-jms **ya migrados** (commit
  `ab4d2a3f`), build nativo validado (BUILD SUCCESS), `org.jgroups` manual eliminado.
- **#6 (matiz surefire):** correcto — no hay `target/surefire-reports` empaquetados; la evidencia son las
  corridas documentadas. Si quieres, en la implementación adjunto los reports de las clases tocadas.

## Sigue pendiente (coincido con la v67, fuera de esta tanda)

Evidencia real de 1.000.000 sobre esta versión · prueba de dos nodos · banco real · D2-R2 (mixto
rechazado+invalidado) · decisión maker-checker para `PAY_CONFLICT_RESOLVED` · separar int-lab/prod-template ·
revertir config de test.

---

## Plan tanda-4 (propuesto, **pendiente de tu autorización**)

1. **#7 — Opción A:** revertir `DISPATCHING→ARCHIVED` para retriable en PAY normal + corregir comentario.
   Test: extender `Mt101PayNormalDurableTest` (retriable → fragmento vuelve a ARCHIVED, re-pagable, sin doble
   pago, audit RECORD_INVALIDATED).
2. **#8 — según tu decisión (8a alinear / 8b eliminar).**
3. Documentar en `evidencias/arreglos-tanda4-20260715.md` + correr los ITs afectados.
4. Al final: `start-platform-stack.cmd` (localhost:8080) y entrar a login.

**No implemento hasta tu OK.** Necesito de ti: (i) autorización de #7-A (o pides B); (ii) decisión #8 →
8a o 8b (y si 8b, confirmación de que ningún ambiente usa PAY-por-lista).
