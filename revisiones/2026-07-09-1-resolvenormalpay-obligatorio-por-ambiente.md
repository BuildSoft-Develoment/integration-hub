# #1 — `resolveNormalPay` obligatorio por ambiente

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** app_htoh #1. Implementado por decisión explícita del usuario (con los tradeoffs sobre la mesa).

## Contexto y tradeoff (documentado)

La topología **dominante y correcta** resuelve el `UNCERTAIN` del PAY normal en una **ejecución separada** (las
confirmaciones bancarias llegan async). En esa topología, exigir un resolutor in-line sería incorrecto. Por eso el
comportamiento por defecto **no** exige resolutor, y la seguridad de "no cerrar COMPLETED con dinero incierto" ya la da
G1 en runtime.

Este cambio agrega la exigencia **solo para ambientes que usan reconciliación in-line** (confirmación síncrona), como
un **opt-in por ambiente**. **Advertencia operativa documentada en el código:** encenderlo en un ambiente con
confirmación async hará que el proceso quede `NEEDS_RECONCILIATION` casi en cada corrida (el resolutor corre antes de
la respuesta del banco). Solo debe activarse donde la confirmación es in-line.

## Cambio

- **Flag** `mt101.pay.require-normal-pay-resolver` (MicroProfile Config, **default `false`**): por ambiente.
- **`Mt101PayResolutionValidator`** ([:57](../platform-app/src/main/java/com/integrationhub/platform/service/process/Mt101PayResolutionValidator.java)):
  cuando el flag está en `true`, al **publicar** (active) un proceso, cada `MT101_PAY` **debe** tener un
  `MT101_STATUS(resolveNormalPay=true)` POSTERIOR; si falta → `IllegalArgumentException` → **400**. Reusa la misma
  detección `hasDownstreamNormalPayResolver` que G2 (no duplica lógica). Un `MT101_STATUS` de confirmación (sin
  `resolveNormalPay`) **no** satisface la exigencia.
- Se valida en `create`/`update`/`setActive` (mismo punto que G2, vía `validateMoneyPath`), solo si el proceso es
  RUNNABLE (active). Constructor de compat `(ObjectMapper)` → flag `false` (tests/uso previo intactos).

Default OFF: los ambientes con topología de ejecución separada (la dominante) **no** se ven afectados.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayResolutionValidatorTest` (unit) | **11/11** (4 nuevos) | con flag: PAY sin resolutor → lanza; PAY+resolutor+continueOnFailure → ok; STATUS solo-confirmación → lanza; sin PAY → ok |
| `Mt101RequireNormalPayResolverIT` (@QuarkusTest, perfil flag=true) | **2/2** | publicar PAY sin resolutor → 400; con resolutor+continueOnFailure → 200 |
| `Mt101PayResolutionValidatorIT` (default flag=false) | **4/4** | sin regresión: PAY solo sigue siendo 200 |
| `ProcessCatalogServiceTest` (unit) | **10/10** | cableado del validador intacto |
