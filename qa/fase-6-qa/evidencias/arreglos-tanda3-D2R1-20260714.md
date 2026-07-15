# Evidencia — tanda-3: D2-R1 (re-solicitar fragmentos INVALIDATED en runs parciales) — 2026-07-14

Rama `experiment/quarkus-lts-native`. Cierra el corner D2-R1 detectado en el doble check de la tanda-2.
Principio: **sin fallback**; y sobre todo **money-safe** (el riesgo aquí es doble pago).

## El problema (D2-R1)

Un run correctivo PARTIALLY_SENT con fragmentos INVALIDATED (fallo de transporte en un subconjunto: el SFTP
conecta por fragmento, una negativa intermitente envía unos y falla otros). El run hijo (`request-child`) sólo
reprocesa `pay_status='REJECTED'` (rechazos del banco), no los INVALIDATED — que quedaban sin re-enviar.

## La clave: INVALIDATED ≠ REJECTED

- **REJECTED** (rechazo del banco): contenido malo → CORRECCIÓN + rebuild (supersede). Es el run hijo.
- **INVALIDATED** (fallo de transporte): contenido OK, no salió al banco → **RE-ENVÍO** del mismo fragmento.
  Su `build_fragment` queda **ARCHIVED** (re-pagable), no REJECTED.

## El fix (mínimo y money-safe)

El mecanismo de re-envío YA existe (el re-request correctivo reclama fragmentos ARCHIVED). El único blocker era
la elegibilidad. Dos cambios:

1. **`reservePayForPlanPreparation`** ([Mt101RebuildRepository.java](../../../platform-app/src/main/java/com/integrationhub/platform/repository/payments/swift/Mt101RebuildRepository.java)):
   admite `pay_status='PARTIALLY_SENT'` (además de NOT_REQUESTED/FAILED/INVALIDATED).
2. **Guard en `requestCorrectivePay`** ([Mt101CorrectiveLifecycleService.java](../../../platform-app/src/main/java/com/integrationhub/platform/service/payments/swift/Mt101CorrectiveLifecycleService.java)):
   re-solicitar un PARTIALLY_SENT sólo si `countInvalidatedPayFragments > 0` (si no, error claro que apunta a
   request-child para los REJECTED). Método nuevo `countInvalidatedPayFragments`.

## Por qué NO hay doble pago (verificado en el código, TRES niveles)

| Nivel | Garantía |
|---|---|
| Dispatch | `FRAGMENT_READ_STATUSES = ["ARCHIVED"]` — el PAY sólo lee build_fragment ARCHIVED. Los SENT (build=SENT) **nunca** se re-leen. |
| Preparación | `persistPayIntents` transiciona a PREPARED con `where pay_status not in ('DISPATCHING','SENT','REJECTED','UNCERTAIN')` — los SENT del ledger no se re-preparan; los INVALIDATED sí (re-enviables). |
| Sync build↔ledger | `syncCorrectiveBuildFragmentsFromPay` propaga al build sólo `pay_status in ('SENT','REJECTED')` — un INVALIDATED **deja** su build_fragment ARCHIVED (re-pagable), nunca lo marca enviado. |

Consecuencia: al re-solicitar un PARTIALLY_SENT, se re-prepara y re-envía **exclusivamente** el subconjunto
ARCHIVED (los INVALIDATED); los SENT quedan intactos. **Un fragmento ya enviado no puede re-enviarse.**

## Estado de la tanda

| Sub-caso | Estado |
|---|---|
| **D2-R1** (PARTIALLY_SENT: sent + invalidated, sin rejected; status=ARCHIVED) | **HECHO** (cierra el caso dominante de fallo de transporte) |
| **D2-R2** (mixto: sent=0/rejected>0/invalidated>0 → status=PARTIALLY_FAILED) | **Diferido**: el guard de status exige ARCHIVED; coexistir child (rejected) + re-send (invalidated) en un run necesita más diseño. Corner raro (requiere rechazo de banco Y fallo de transporte en el mismo lote). |

## Verificación

- `mvn test-compile` (main + tests) → **BUILD SUCCESS**.
- Seguridad money-safe: verificada por análisis del código en los tres niveles de arriba.

## ⚠️ Validación PENDIENTE (bloqueada por Docker)

Este cambio toca la elegibilidad del re-request correctivo — código double-pay-sensible. **No se debe confiar
sin correr los ITs contra Postgres**, que necesitan Docker:
1. Los **62 tests de `Mt101CorrectiveLifecycleServiceTest`** deben seguir en verde (sin regresión por el cambio
   de reserve/guard).
2. Un **IT nuevo** del caso positivo D2-R1 (partial pay con transporte fallido → re-request re-envía sólo el
   invalidado, el SENT queda intacto) — no se escribió porque el harness fake deriva el ledger vía
   `refreshPayFragmentsFromCorrectiveSet` y modelarlo sin poder ejecutarlo daría falsa confianza.
3. **Evidencia viva en nativo**: reproducir un partial pay con fallo de transporte y re-solicitar.

Se completa al reiniciar Docker.
