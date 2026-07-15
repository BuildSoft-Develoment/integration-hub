# Evidencia — arreglos tanda-2 (#1, #5, D.2) — 2026-07-14

Rama `experiment/quarkus-lts-native`. Autorizado: #1 (multi-PAY), #5 (H4), D.2 (transporte→INVALIDATED).
Principio: **sin fallback ni caminos legacy** — degradación silenciosa reemplazada por clasificación explícita.

## #1 — Obligatoriedad multi-PAY por emparejamiento *(P1)*

**El hueco:** `Mt101PayResolutionValidator` comprobaba "¿hay *algún* STATUS(resolveNormalPay) posterior?" sin
mirar `resolvesPayTaskRef`. Con dos PAY y un STATUS que resolvía sólo a pay-a, pay-b pasaba en falso.

**El fix:** se extrajo la regla ÚNICA de emparejamiento PAY↔STATUS a un helper compartido
[Mt101PayResolverPairing.java](../../../platform-app/src/main/java/com/integrationhub/platform/service/process/Mt101PayResolverPairing.java),
usado por AMBOS validadores (conexión y obligatoriedad) — antes divergían. Regla: un solo PAY → un resolutor
"pelado" posterior lo satisface; varios PAY → cada PAY debe tener un STATUS que lo nombre por `resolvesPayTaskRef`
(si no, 400).

**Nota de severidad (del doble check):** el runtime ya estaba protegido por G1 (`Mt101PayTaskProvider:218` — un
UNCERTAIN cierra en `NEEDS_RECONCILIATION`, nunca COMPLETED en falso). Esto cierra la inconsistencia de
validación en tiempo de publicación, no un agujero de dinero.

**Tests:** `Mt101PayResolutionValidatorTest` +3 casos multi-PAY (14/14); `Mt101PayStatusConnectionCoverageValidatorTest`
refactorizado al helper (12/12).

## #5 — Cuarentena del run hijo *(H4)*

**El hueco:** `synchronizeLifecycle` actualiza `mt101_failed_record` del set original del run uniendo por
`senders_reference`; en un run hijo el set original es el correctivo del padre (sin filas de cuarentena) y la
referencia cambia entre generaciones → las filas raíz quedaban `REBUILD_REJECTED` aunque el hijo ya pagó.

**El fix:** dos métodos nuevos y su cableado en `synchronizeLifecycle`:
- `Mt101RebuildRepository.resolveRootOriginalSet` — CTE recursivo que sube por `parent_rebuild_run_id` a la raíz.
- `Mt101FailedRecordRepository.propagateChildSentToRootQuarantine` — cruza por la **tupla estable**
  `(staging_id, source_file_hash, source_record_number)`, NO por `senders_reference`; sólo toca filas raíz
  `REBUILD_REJECTED` cuya selección del hijo esté `REBUILD_SENT` (idempotente).
- En `synchronizeLifecycle`, si el run es hijo (raíz ≠ su set original) → propaga.

**Test:** `Mt101ChildQuarantinePropagationIT` (resuelve raíz por la cadena; propaga sólo la fila enviada; idempotente).

**Evidencia viva pendiente:** el run hijo `E2E10K-12-FIX-4-FIX-5` (52 filas raíz `REBUILD_REJECTED` en `E2E10K-12`)
debe pasar a `REBUILD_SENT` tras un sync — se corre al redesplegar en nativo.

## D.2 — Clasificar transporte vs. banco *(H3 + H10)*

**El principio:** un fallo de conexión/auth **antes** del despacho = el banco no recibió nada = re-solicitable;
un rechazo de negocio del banco = terminal; un fallo durante/después del put = incierto.

**El fix:**
- `TransportResult`: nueva clasificación `retriable` (fallo de transporte) + factory `transportFailure()` +
  accesor `bankRejected()`. Cuatro estados excluyentes: accepted / uncertain / retriable / rejected-de-negocio.
- `SftpPaymentTransport`: excepción pre-despacho (connect/auth/stat) → `transportFailure` (era `rejected`); los
  rechazos de política de duplicados (hash/FAIL) siguen `rejected` (van por otra rama). Loop externo propaga
  `retriable`.
- `RestPaymentTransport`: `ConnectException` (pre-envío) → `transportFailure`; los 4xx de negocio siguen `rejected`.
- `Mt101PayTaskProvider`: mapa único `payStatusOf` (retriable → `INVALIDATED`); los guards "no salió al banco"
  (correlación/payload faltante, config pre-dispatch) pasan de `rejected` a `transportFailure`; contador
  `invalidatedCount` (incluido en `totalCount`, summary, outputs); la tarea reporta failure (no éxito).
- `Mt101CorrectiveLifecycleService`: la rama INVALIDATED (`invalidated>0 && rejected==0`) ahora cubre plan-drift
  Y transporte; mensaje generalizado.

**El resultado (H3 resuelto):** un rechazo TOTAL por transporte/credencial deja los fragmentos `ARCHIVED`
(no `REJECTED`) → `deriveLifecycleStatus` da run `status=ARCHIVED` (no `FAILED`) + `pay_status=INVALIDATED` →
**re-solicitable** (`reservePayForPlanPreparation` admite `NOT_REQUESTED/FAILED/INVALIDATED`). Ya no hay
callejón sin salida. Un rechazo real del banco sigue siendo `FAILED` terminal (no se reintenta a ciegas).

**Tests:** `Mt101PayTaskProviderTest` +2 (transportFailure → INVALIDATED, no rejected; config error → INVALIDATED),
`connectionFailure...` de SFTP actualizado a `transportFailure`. `Mt101CorrectiveLifecycleServiceTest` 62/62 (D.2
no rompió el flujo correctivo).

**Evidencia viva pendiente:** correr el pago correctivo con credencial mala → el run debe quedar
`ARCHIVED/INVALIDATED` (re-solicitable), no `FAILED`; corregir la credencial y re-pedir → SENT.

## Verificación

| Prueba | Resultado |
|--------|-----------|
| `mvn test-compile` (main + tests, incl. IT de H4) | **BUILD SUCCESS** |
| `Mt101PayResolutionValidatorTest` (+3 multi-PAY) | **14/14** |
| `Mt101PayStatusConnectionCoverageValidatorTest` (refactor al helper) | **12/12** |
| `Mt101PayTaskProviderTest` (+2 D.2) | **14/14** |
| `Mt101PayNormalDurableTest` / `Mt101PayDirectListDurableTest` / `Mt101PayFragmentReprocessTest` | 6/6, 4/4, 35/35 |
| `Mt101CorrectiveLifecycleServiceTest` (D.2 no rompió el correctivo) | **62/62** |

Total dirigido: **147 tests verdes**. Evidencia e2e en nativo (`192.168.0.15:8443/appih`) y el IT de H4
(`Mt101ChildQuarantinePropagationIT`, necesita Postgres/Testcontainers) quedan pendientes del reinicio de Docker.
