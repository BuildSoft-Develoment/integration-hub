# Validación y evidencia viva de las tres tandas — 2026-07-15

Ambiente nativo `https://192.168.0.15:8443/appih` (16 contenedores, todo nativo tras nginx). Redesplegado con
las tandas 1-3 + el fix de `deriveLifecycleStatus` descubierto durante esta evidencia.

## Parte A — Validación IT (Testcontainers Postgres + SFTP)

| Clase | Resultado | Qué valida |
|---|---|---|
| `Mt101CorrectiveLifecycleServiceTest` | **62/62** | Tandas 2-3 (D.2, D2-R1) + fix deriveLifecycleStatus NO rompen el money-path |
| `Mt101RebuildServiceTest` | **9/9** | H4 sync (tras añadir `parent_rebuild_run_id` al esquema del test) |
| `Mt101ChildQuarantinePropagationIT` | **3/3** | H4: propagación por tupla estable |
| `Mt101PayTaskProviderTest` | **14/14** | D.2: transportFailure → INVALIDATED |
| `SftpPaymentTransportTest` | **13/13** | D.2: clasificación por fase contra SFTP real |
| `Mt101PayResolutionValidatorTest` | **14/14** | #1: multi-PAY por resolvesPayTaskRef |
| `Mt101PayStatusConnectionCoverageValidatorTest` | **12/12** | #1: helper compartido |
| `Mt101PayConflictAcknowledgeAtomicityIT`, `SecretResolverCdiWiringIT`, `Mt101PayNormalDurableTest`, `Mt101PayFragmentReprocessTest` | 4/4, 3/3, 6/6, 35/35 | tanda-1 |

Total: **≈175 tests verdes.**

## Parte B — Hallazgo durante la evidencia viva: hueco de `deriveLifecycleStatus`

La evidencia viva de H4 destapó un bug **pre-existente** que los ITs no cazaban (probaban el método aislado, no
la interacción con el sync del padre): `deriveLifecycleStatus` **no manejaba `SUPERSEDED`**. Cuando un run hijo
supersede los fragmentos rechazados del padre, el padre queda con `SENT + SUPERSEDED`; ningún `allIn` lo cubría
→ derivaba a `BUILT` → el scheduler reseteaba su cuarentena a `REBUILD_PENDING_VALIDATION`, clobbereando la
propagación H4.

**Fix:** tratar `SUPERSEDED` como resuelto (equivalente a `SENT`) en los `allIn` de `deriveLifecycleStatus`.
Validado: 62/62 corrective + 9/9 rebuild + 3/3 H4 siguen verdes, y confirmado en vivo (abajo).

## Parte C — Evidencia viva

### H4 — cuarentena del run hijo (con el fix de deriveLifecycleStatus)

`E2E10K-18`: money-path (40 SENT + 40 REJECTED) → cuarentena (100) → corrección (100/100) → correctivo
`E2E10K-18-FIX-9` → pago PARCIAL con 20 colisiones plantadas → `PARTIALLY_SENT` (20 SENT + 20 REJECTED) → run
hijo `E2E10K-18-FIX-9-FIX-A` paga los 20 rechazados → `SENT`.

**Resultado:** cuarentena raíz `E2E10K-18` = **100 REBUILD_SENT**, y **estable tras un ciclo completo del
scheduler** (75s) — sin regresión a `PENDING_VALIDATION`. El padre no deriva a `BUILT`. Banco: +40 FIN (20
padre + 20 hijo). H4 evidenciado end-to-end.

### D.2 — clasificar transporte vs. banco (resolución de H3)

`E2E10K-19-FIX-B` (correctivo ARCHIVED). Se corrompió la credencial del vault (`bank` → `WRONGPASS`) y se pagó:

- `approve-pay` → **500**: *"MT101_PAY invalidated 40 fragment(s) for run E2E10K-19-FIX-B (not sent to the bank;
  plan drift or transport/auth failure); fix the cause and request/approve again"*.
- Los 40 fragmentos → `pay_status=INVALIDATED` con `SFTP JSchException: Auth fail`.
- Run: **`status=ARCHIVED / pay_status=INVALIDATED`** → **re-solicitable**, NO `FAILED` terminal.

Antes de D.2 esto era un callejón sin salida (`FAILED`). Luego se **restauró la credencial** (`bank`) y se
**re-solicitó**: `approve-pay` → **SENT**. Banco 1160 → **1200** (+40 FIN exactos). **Sin doble pago**: los 40
nunca salieron la primera vez (Auth fail pre-despacho), y el re-envío entregó exactamente 40.

### D2-R1 — re-envío de invalidados en run parcial

El mecanismo core (re-request re-envía SÓLO lo no-enviado) quedó probado en vivo por la evidencia D.2
(INVALIDATED → re-request → SENT, +40 exactos). El caso específico PARTIALLY_SENT (algunos SENT + algunos
INVALIDATED) es difícil de orquestar en vivo (la credencial del vault es global; no se puede hacer fallar el
transporte de un subconjunto de forma fiable). Queda cubierto por:
- IT: `Mt101CorrectiveLifecycleServiceTest` 62/62.
- Análisis money-safe (tres niveles: `FRAGMENT_READ_STATUSES=ARCHIVED`, `persistPayIntents` excluye
  SENT/UNCERTAIN/DISPATCHING/REJECTED, `markPayFragmentDispatching` reclama sólo PREPARED).
- La evidencia D.2 viva del mismo mecanismo de re-solicitud.

## Parte D — Hallazgo operativo: deadlock intermitente de pgJDBC (H7)

Durante la evidencia, un money-path se colgó 12 min en `wait_event=Client/ClientWrite` en el insert de
fragmentos (el deadlock H7). El fix de tanda-1 (flush por bytes, umbral **1MB**) es **demasiado alto** para este
tamaño: 80 fragmentos ≈ 640KB = un solo batch < 1MB. Es intermitente (otros runs completaron), pero para la
**evidencia de 1.000.000** hay que **bajar `INSERT_BATCH_MAX_BYTES`** (p.ej. a 200KB) para forzar batches
menores. Pendiente (requiere rebuild nativo).

## Resumen

- Tandas 1-3: **IT-validadas** (≈175 tests) y **evidenciadas en vivo** (H4 + D.2 end-to-end).
- Se encontró y arregló un bug pre-existente (`deriveLifecycleStatus` + SUPERSEDED), IT-validado y confirmado en vivo.
- Propiedad crítica (cero doble pago) confirmada en vivo: el re-envío de invalidados entregó exactamente 40, ni uno más.
- Pendiente: bajar el umbral de H7 para la evidencia de 1M; D2-R1 en su variante PARTIALLY_SENT exacta (cubierto por IT+análisis+D.2 vivo).
