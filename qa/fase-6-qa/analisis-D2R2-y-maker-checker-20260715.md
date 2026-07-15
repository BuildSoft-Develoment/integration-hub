# Análisis D2-R2 + decisión maker-checker (PAY_CONFLICT_RESOLVED) — 2026-07-15

> Entrega **para autorización**. No se ha implementado nada. Regla: sin caminos legacy/fallback en el fuente.

---

## Parte 1 — D2-R2: run mixto `sent=0, rejected>0, invalidated>0`

### Gap confirmado contra el código

La escalera de estados de `approveAndPayCorrective` (`Mt101CorrectiveLifecycleService` L393-437):

```
uncertain>0                         -> UNCERTAIN
total==0                            -> FAILED
sent==total                         -> SENT
sent>0                              -> PARTIALLY_SENT   (mixto recuperable: re-request + request-child)
invalidated>0 && rejected==0        -> INVALIDATED      (todo re-solicitable)
else                                -> FAILED            <-- D2-R2 CAE AQUI
```

El caso **`sent=0, rejected>0, invalidated>0`** cae en el `else` → **FAILED**. Pero **no es "rejected all"**:
los INVALIDATED son fallo de transporte (re-solicitables, el banco no recibió nada), no rechazo de negocio.
Consecuencia con las precondiciones de recuperación:

- **Re-request** (`reservePayForPlanPreparation`, repo L739): admite `pay_status in ('NOT_REQUESTED','FAILED',
  'INVALIDATED','PARTIALLY_SENT')` → **FAILED SÍ es re-solicitable** a nivel repo; re-lee los build_fragments
  ARCHIVED (los invalidados) y los re-paga. *(La nota vieja del doc "exige ARCHIVED" describía el estado
  pre-tanda-3; hoy FAILED entra.)*
- **Request-child** (`Mt101RebuildService` L173-175): **exige `payStatus == PARTIALLY_SENT`**. Un run FAILED
  **NO** puede pedir hijo para los REJECTED → **bloqueado**.

**Resultado:** un run mixto queda marcado FAILED (etiqueta engañosa: sugiere "todo rechazado" cuando hay
fragmentos re-solicitables) y **los REJECTED no tienen ruta de hijo** hasta que —si acaso— un re-request de los
invalidados lo mueva a PARTIALLY_SENT. Si el operador quiere corregir los rechazos primero, no puede. Corner del
mismo origen que D2-R1.

### El matiz de diseño (por qué el doc lo marcó "necesita diseño")

Reclasificar el run mixto a `PARTIALLY_SENT` habilita ambas recuperaciones (re-request admite PARTIALLY_SENT +
guard invalidated>0 OK; request-child admite PARTIALLY_SENT + refs REJECTED OK — **no** exige sent>0). PERO
`PARTIALLY_SENT` con `sent=0` toca la sincronización de cuarentena, que tiene **dos** mapeos:

- `currentQuarantineStatus(runStatus)` (L594): `PARTIALLY_SENT -> REBUILD_SENT` (bulk). Con sent=0 marcaría la
  cuarentena como "enviada" siendo **falso**.
- `quarantineStatus(lifecycleStatus)` (L619): `PARTIALLY_SENT -> null` (no bulk) + `markPartialSelections`
  por-fragmento (SENT→REBUILD_SENT, REJECTED→REBUILD_REJECTED). Los invalidados (build_fragment ARCHIVED) no los
  cubre ninguna de las dos ramas → quedarían en su estado previo.

Hay que asegurar que el sync use la ruta **por-fragmento** (no el bulk REBUILD_SENT) y que los invalidados
(ARCHIVED) queden en un estado de cuarentena coherente (re-solicitable), no REBUILD_SENT.

### Opciones

- **Opción A (recomendada) — reusar PARTIALLY_SENT:** añadir la rama `invalidated>0 && rejected>0 ->
  PARTIALLY_SENT` (con mensaje que aclara sent=0). Mínima, unifica con el mixto sent>0 ya soportado. **Requiere:**
  garantizar el sync de cuarentena por-fragmento (no bulk REBUILD_SENT con sent=0) y que los ARCHIVED-invalidados
  no se marquen REBUILD_SENT. Tests: IT del run mixto (re-request de invalidados → luego request-child de
  rechazados), y cuarentena coherente.
- **Opción B — mantener FAILED honesto + relajar guards:** dejar FAILED (sent=0 es real) y hacer que
  request-child acepte un run con refs REJECTED **y** invalidated>0 (un "FAILED mixto"), distinguiéndolo del
  FAILED "todo rechazado". Mantiene la etiqueta honesta pero complica el guard de request-child y hace FAILED
  parcialmente recuperable (más ramas).

**Mi recomendación: Opción A**, por consistencia con el mixto sent>0. El único cuidado real es el mapeo de
cuarentena, que validaré con IT. Es un cambio acotado (una rama + revisar el sync), no un estado nuevo.

---

## Parte 2 — Decisión: maker-checker para PAY_CONFLICT_RESOLVED

### Estado actual (`Mt101PayConflictAcknowledgeService`)

- **Single-actor**, gobernado por rol. Exige `actor + reason + ticketRef` (ticket obligatorio, trazabilidad).
- **No cambia el estado del dinero:** limpia el flag `pay_conflict` y escribe la trama append-only
  `PAY_CONFLICT_RESOLVED` (actor + motivo + terminal conservado), **sin** tocar `status`/`pay_status`. El operador
  afirma "revisé este conflicto; el terminal real se conserva".
- Atómico (flag + trama en una TX; rollback si el spool falla).

### La tensión

Un `pay_conflict` = un terminal tardío contradijo una resolución previa (p.ej. STATUS dice REJECTED contra un
ledger SENT): una ambigüedad real que exige conciliación. Reconocerlo **apaga una alerta crítica**. Hoy un solo
actor puede apagarla. Argumentos:

- **A favor de single-actor (status quo):** no cambia el dinero (el terminal se conserva); ya hay gobierno por
  rol + ticket obligatorio + trama append-only auditable. Suficiente para muchos ambientes.
- **A favor de maker-checker:** apagar la alerta de una contradicción de pago sin segunda persona permite que un
  error/mala fe oculte una discrepancia real (segregación de funciones = control bancario estándar).

### Diseño propuesto (opt-in, si autorizas)

Espejo del maker-checker de rebuild (request/approve), **config-gated**:

- Flag `mt101.pay.conflict.acknowledge.maker-checker.enabled` (default **false** → hoy no cambia nada).
- Con **false**: `acknowledge(...)` actual (single-actor) — sin fallback legacy, es la misma acción sin el gate.
- Con **true**:
  - `request-acknowledge` (maker): registra la intención (actor, reason, ticket) en estado PENDIENTE; **NO**
    limpia el flag todavía; emite trama `PAY_CONFLICT_ACK_REQUESTED`.
  - `approve-acknowledge` (checker, **actor distinto**): segundo actor aprueba → limpia el flag + trama
    `PAY_CONFLICT_RESOLVED` con ambos actores. Enforce checker ≠ maker (segregación).
- Recomendado por ambiente: **false** en dev/UAT, **true** en prod bancaria.

### Decisión que necesito de ti

1. **¿Implemento el maker-checker opt-in** (config-gated, default off) — coherente con el resto del money-path —
   **o dejamos single-actor** (rol + ticket + auditoría) como suficiente?
2. Si opt-in: ¿algún requisito extra (p.ej. ventana temporal, cantidad mínima de checkers, roles específicos)?

---

## Qué autorizar

- **D2-R2:** Opción A (recomendada) / Opción B / esperar.
- **Maker-checker:** implementar opt-in (recomendado) / mantener single-actor / esperar.

No implemento nada hasta tu OK y tu elección en cada punto.
