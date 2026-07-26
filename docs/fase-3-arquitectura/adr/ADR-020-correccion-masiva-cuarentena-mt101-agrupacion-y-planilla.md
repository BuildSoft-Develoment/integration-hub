# ADR-020 Correccion masiva de cuarentena MT101: agrupacion por causa + planilla de correccion (export/import)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-019 Auditoria por dominio: standard packs (limite plataforma <-> estandar)](ADR-019-auditoria-standard-packs-agrupacion-por-dominio.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

**Propuesto (2026-07-26).** Decision de operativa/UX para la correccion de cuarentena a escala. Depende de ADR-009 (vertical de pagos) y del flujo correctivo MT101 existente (`Mt101QuarantineService`, `Mt101StagingCorrectionService`, `Mt101RebuildService`, `Mt101ReprocessService`). El diagnostico se verifico contra codigo (ver *Contexto*); no hay implementacion todavia. Money-path critico: cualquier implementacion exige dry-run + maker-checker + auditoria por fila.

## Contexto

Escenario real de banca: se procesan **10.000** registros SWIFT MT101 y **~7.000 fallan** validacion y hay que **editar datos** (BIC mal formateado, moneda invalida, caracteres fuera de SWIFT-X, cuenta sin padding, etc.). La pregunta operativa: **¿la correccion es una-a-una o hay forma masiva?**

Hallazgos verificados en el codigo:

- **La edicion de datos es estrictamente 1-a-1.** Unico camino: `Mt101StagingCorrectionService.correctRow` (endpoint `PATCH /api/query/mt101-quarantine/staging-row`), una fila por `stagingId`, con JSON Merge Patch + locking optimista (If-Match) + freeze bajo maker-checker. **No existe** metodo/endpoint bulk (`correctRows`/`batch`), ni **multi-select** en la UI de cuarentena.
- **Los unicos "bulk" RE-EJECUTAN, no EDITAN**: `resetByStatus` (todo el set `REJECTED->BUILT`), `reprocessSourceRows` (por rango de filas), `rebuild-runs` (reconstruye lo corregido, gobernado). Sirven si el fix esta en la **regla/config**, no en el dato por-registro.
- **No hay agregado por causa**: el operador puede *filtrar* por `ruleCode`, pero no ve el conteo agrupado (solo existe `countByStatus`). A 7k, sin agrupar, el problema es intratable.
- **Hazard de doble pago del "re-correr el archivo".** `FILE_READ` **no** tiene gate de dedup por archivo: `ProcessedSourceFileService.recordPipelineFiles` **registra** lo procesado (lineage), no **bloquea** un re-read. Si parte de los 10k **ya se PAGO (SENT)** y se re-corre el archivo completo, se **re-intenta pagar** esa parte; la unica barrera es el guard de idempotencia del *archive*, **dependiente de config** (con `:20:` por-ejecucion como `P${_processExecutionId}-...` genera refs nuevas -> re-paga). Por eso el flujo correctivo opera **solo dentro del set** y **salta** los estados `NON_REPROCESSABLE` (`SENT`/`CONFIRMED`/`RECONCILED`/`SUPERSEDED`): es el unico camino bulk **inequivocamente money-safe** con pagos parciales.

**Insight operativo:** 7k fallos casi nunca son 7k problemas unicos; a esa escala son **1-3 causas sistemicas** + un long-tail chico. La operativa correcta es **clasificar la causa primero** y aplicar una palanca por causa, no editar 7k a mano.

## Decision

Cerrar el gap de correccion masiva con **dos capacidades que operan SOLO sobre la cuarentena** (nunca sobre lo enviado), priorizadas por ROI:

**A. Agrupacion por causa (rule code).** Un resumen de cuarentena que agrega los fallos por `ruleCode` (`3.200 BIC_FORMAT · 2.100 CURRENCY · 1.700 CHARSET`), con conteo + muestra + accion por grupo. Convierte 7k en 3 decisiones. Es la base de todo lo demas.

**C. Planilla de correccion (export -> editar en Excel -> import gobernado).** El operador exporta las filas en cuarentena (opcionalmente filtradas por grupo de causa) a un XLSX, las corrige **con sus herramientas** (formulas, buscar/reemplazar, fill-down), y re-sube la planilla; la plataforma aplica las correcciones por `stagingId` con audit por fila. Reusa los lectores/escritores XLSX que ya existen y encaja con como opera la banca.

Se **descarta** como camino primario "corregir en origen + re-correr el archivo" (degradado a *solo si nada pago aun*, por el hazard de doble pago). La **opcion B (correccion por predicado/find-replace gobernado)** queda **diferida** como Fase 2 para power-users.

## Diseno

### A. Resumen de cuarentena por causa

- **Backend**: un agregado `GROUP BY rule_code` sobre las filas fallidas del set -> `[{ruleCode, label, count, sampleRecordNumbers}]`. Endpoint nuevo `GET /api/query/mt101-quarantine/summary-by-rule`.
- **UI**: panel arriba de la consola de cuarentena con las causas como chips (conteo + severidad). Click -> filtra la lista a esa causa y habilita "Exportar planilla de esta causa".

### C. Planilla de correccion — flujo end-to-end

1. **Export** (`GET .../quarantine/correction-sheet.xlsx?set=&ruleCode=`): una fila por registro en cuarentena. Columnas:
   - **Identidad (bloqueadas/ocultas)**: `stagingId`, `version` (para If-Match), `sourceFileHash`, `recordNumber`, `sendersReference` (:20:).
   - **Diagnostico (solo lectura)**: `ruleCode`, `errorMessage`.
   - **Datos editables**: los campos del payload (dni, nombre, cuenta, moneda, monto, bic, concepto, cargos...).
2. **Editar offline**: el operador corrige en Excel (aca es donde el bulk real ocurre: fill-down, buscar/reemplazar de un BIC, normalizar una columna).
3. **Import + DRY-RUN** (`POST .../quarantine/correction-sheet:preview`): la plataforma parsea el XLSX, matchea por `stagingId`, calcula el **merge-patch por fila** (solo campos cambiados) y devuelve un **preview**: N a corregir, M sin cambios (patch vacio -> skip), K conflictos (`version` desfasada / fila `LOCKED` por rebuild activo / fragmento ya `SENT`), + una **muestra antes/despues**. **No aplica nada.**
4. **Confirmar -> maker-checker**: la correccion masiva es una **operacion gobernada** (como el rebuild): un maker solicita, un checker distinto aprueba (si el flag esta activo).
5. **Apply** (`POST .../quarantine/correction-sheet:apply`): itera `correctRow` por fila **reusando toda su semantica** (merge-patch + If-Match + skip de filas `NON_REPROCESSABLE`/locked + audit por fila con hash antes/despues, campos cambiados, actor, motivo, ticket). Devuelve un resumen (corregidas / omitidas / fallidas con motivo). **Sin apply parcial silencioso**: cada fila se audita o se reporta como omitida.
6. **Rebuild**: al terminar, el operador dispara el **rebuild run existente** (request->approve->execute) sobre lo corregido. El PAY correctivo sigue el camino gobernado de ADR-017 (`sinkRef`), y **nunca** toca los fragmentos ya `SENT`.

### Guardarraíles money-safety (obligatorios)

- **Solo cuarentena**: el import ignora/rechaza filas cuyo fragmento este `SENT`/`CONFIRMED`/`RECONCILED`/`SUPERSEDED` (reusa `NON_REPROCESSABLE`).
- **Locking optimista por fila** (`version`/If-Match): si la fila cambio desde el export, se reporta conflicto, no se pisa.
- **Freeze maker-checker**: filas bloqueadas por un rebuild `APPROVED/BUILDING` se omiten (reusa `RowLockedForRebuildException`).
- **Dry-run obligatorio** antes del apply; **maker-checker** sobre el apply.
- **Identidad bloqueada**: si se altero `stagingId`/`sourceFileHash` en la planilla, se rechaza la fila.
- **Idempotente**: re-importar la misma planilla es no-op (patch vacio -> skip). Limite de tamaño por lote + reporte de fallidas.
- **Audit por fila** (reusa la auditoria de `correctRow`): trazabilidad completa de quien cambio que.

## Consecuencias

Positivas:
- 7k pasa de "editar a mano" a **3 causas -> 3 planillas** (A) editadas con las herramientas del operador (C). ROI operativo alto.
- Reusa lo que ya existe: `correctRow` (semantica + audit), lectores/escritores XLSX, rebuild-runs, maker-checker. Poco codigo nuevo, mucha palanca.
- **Cero riesgo de doble pago**: todo opera dentro del set y salta lo `SENT`; nunca re-corre el archivo completo.

Costos:
- Endpoints nuevos (summary-by-rule, export sheet, preview, apply) + UI (panel de causas + wizard de import con preview). Es una tanda, no un one-liner.
- La planilla es un vector de error humano (columnas mal editadas) -> mitigado por dry-run + identidad bloqueada + audit + maker-checker.
- El apply itera `correctRow` -> a 7k filas hay que cuidar la performance (batch transaccional por paginas, no 7k transacciones sueltas).

## Alcance / lo que NO entra

- **No** "corregir en origen + re-correr el archivo completo" como camino de correccion masiva (hazard de doble pago con pagos parciales; solo valido si nada pago aun).
- **No** bulk sin dry-run + maker-checker + audit por fila.
- **No** tocar fragmentos `SENT`/cerrados (eso es cancelacion/reverso o un nuevo correctivo, fuera de este ADR).
- **Opcion B (predicado/find-replace gobernado)** diferida a Fase 2 (power-users): *"a las filas de la cuarentena que cumplen P, aplicar el patch M"*, con los mismos guardarraíles.
- Correccion de errores de **regla** (no de dato): se resuelve ajustando la regla + `resetByStatus REJECTED->BUILT` (ya soportado), fuera de este ADR.

## Referencias

- [ADR-009 Vertical de mensajeria de pagos](ADR-009-vertical-mensajeria-pagos.md)
- [ADR-017 Conexion de salida unificada: FILE_DELIVER y MT101_PAY/STATUS (SFTP)](ADR-017-conexion-salida-unificada-file-deliver-mt101-pay.md)
- Codigo verificado: `Mt101StagingCorrectionService.correctRow` (1-a-1, merge-patch, If-Match, freeze), `Mt101ReprocessService` (`resetByStatus`/`reprocessSourceRows`, `NON_REPROCESSABLE`), `Mt101RebuildService` (rebuild-runs gobernados), `Mt101QuarantineResource` (endpoints; unico de edicion = `PATCH /staging-row`), `Mt101FailedRecordRepository` (`countByStatus`, sin group-by-rule), `ProcessedSourceFileService.recordPipelineFiles` + `FileReadTaskFastPath` (registra, no dedup-gatea).
