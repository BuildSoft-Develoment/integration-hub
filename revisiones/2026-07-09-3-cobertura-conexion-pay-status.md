# #2-extensión — cobertura de conexión PAY↔STATUS (money-path normal)

**Fecha:** 2026-07-09
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Origen:** app_htoh(64), único ítem de **código nuevo** tras validar el análisis contra el código real (el resto ya
estaba implementado, es config de ambiente, UI opcional, evidencia o homologación externa).

## El gap (validado contra el código)

- **No existía** ningún validador que verificara que el `MT101_STATUS` apunta al mismo universo que el `MT101_PAY`
  (solo estaba la cobertura de rutas de #2, y G1/G2/#1 del resolutor).
- Ambos providers (`Mt101PayTaskProvider`, `Mt101StatusTaskProvider`) usan `configuration.connectionRef` (config
  estática) → un check de definición es **sano y estáticamente verificable**.

**Bug que previene (seguridad de dinero):** si un `MT101_STATUS(resolveNormalPay=true)` (el auto-resolutor in-process
del UNCERTAIN normal) usa un `connectionRef` **distinto** al del `MT101_PAY`, lee `mt101_build_fragment` desde otro
ledger/BD → encuentra **0 fragmentos** → `resolveUncertainNormalPay` devuelve 0 pending/0 conflict/0 error →
`resolvedReconciliation` → el proceso cierra **COMPLETED** mientras el dinero sigue **UNCERTAIN** en la otra conexión.

## Cambio (fail-loud, sin fallback)

- **`Mt101PayStatusConnectionCoverageValidator`** (SRP): para cada `MT101_PAY`, si hay un
  `MT101_STATUS(resolveNormalPay=true)` **posterior**, su `connectionRef` **debe** coincidir con el del `MT101_PAY`;
  si no, `IllegalArgumentException` → **400** al publicar. `null`/blank normaliza a "conexión por defecto" (dos tareas
  sin `connectionRef` = misma conexión).
- Cableado en `ProcessCatalogService.validateMoneyPath` (junto a G2/#1/#2), en `create`/`update`/`setActive`, solo si el
  proceso es RUNNABLE (active).

**Límites honestos (no se promete de más):** solo cubre la **conexión/ledger**. El transporte/banco por ruta y el
`fragmentSetId` (derivado en runtime del output upstream vía `input.sourceTaskRef`) son runtime/derivados y no se
validan en definición sin falsos positivos.

## Pruebas (evidencia)

| Suite | Resultado | Qué prueba |
|---|---|---|
| `Mt101PayStatusConnectionCoverageValidatorTest` (unit) | **8/8** | misma conexión→ok; distinta→lanza; ambos default→ok; PAY con conn + resolutor default→lanza; blank=default; STATUS de confirmación no restringido; resolutor antes del PAY no cuenta; vacío/null→ok |
| `Mt101PayStatusConnectionCoverageValidatorIT` (@QuarkusTest+Postgres) | **2/2** | publicar PAY+STATUS(resolveNormalPay) con conexión distinta→400; misma→200 |
| `ProcessCatalogServiceTest` (unit) | **10/10** | wiring de los 3 validadores intacto |
| Regresión validadores (`PayResolution`/`RouteCoverage`/`RequireResolver` ITs) + `Mt101AllTasksProcessE2EIT` | **13/13** | sin regresión; el pipeline real publica/ejecuta transparente al nuevo validador |
| `mvn compile` (JDK 25) | **rc=0** | — |
