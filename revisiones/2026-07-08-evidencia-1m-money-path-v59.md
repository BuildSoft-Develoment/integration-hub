# Evidencia 1M — money-path FILE→SWIFT a escala (v59)

**Fecha:** 2026-07-08 · **Entorno:** JDK 25.0.2 LTS (Temurin), Postgres 16 (Testcontainers), Quarkus ·
**Rama:** `feat/pay-normal-symmetric-terminal-resolution` (v59: items 1-4 + D1 + D2 + P0-1-B)

## Objetivo

Evidenciar que el camino de pagos FILE→SWIFT procesa **1.000.000 de filas** de punta a punta, en **memoria acotada**
(`-Xmx768m`, prueba de streaming sin OOM), con integridad total — tras todos los cambios money-path de v59.

## Cómo se corrió

```
mvn -Dtest='Mt101MillionFileProcessE2EIT#runsFileToSwiftProcessForMillionRows' test \
    -De2e.rows=1000000 -DargLine=-Xmx768m
```

`@Tag("perf")` · `@QuarkusTest` · `@TestProfile(IntegrationTestProfile)` · Postgres real (Testcontainers) ·
WireMock como gateway SWIFT · `@TestSecurity(roles=platform-admin)`. Opt-in (default CI = 10k).

## Resultado

| Métrica | Valor |
|---|---|
| Resultado | **1 / 0 / 0 — BUILD SUCCESS** |
| Filas procesadas | **1.000.000** |
| Tiempo del test | **879,2 s (~14,6 min)** |
| Heap máximo | **768 MB** (`-Xmx768m`) — **sin OutOfMemory ni GC-overhead** |
| Sanity previo (10k) | 1/0/0 en 40,7 s (mismo test, escala CI) |

### Aserciones verificadas por el IT (todas verdes a 1M)

- `staging_record` = **1.000.000** (todas las filas cargadas).
- `mt101_transaction` = **1.000.000** (una transacción SWIFT por fila).
- `mt101_build_fragment` > 0 y **todos** `status = 'SENT'` (BUILD_FROM_TABLE fragmenta y PAY despacha el 100%).
- `mt101_archive` = nº de fragmentos (archivo inmutable por fragmento).
- `mt101_validation_issue` = **0** (lote limpio, sin rechazos).
- `gateway.requests()` = nº de fragmentos (cada fragmento se envió exactamente una vez al gateway).
- Las **6 tareas** del proceso completaron.
- **Sin fragmentos sobredimensionados** (respeta el límite de tamaño de mensaje MT101).

## Lectura

- **Escala + memoria**: 1M filas en 768 MB de heap confirma el diseño **streaming/paginado** del pipeline
  (PARSE/BUILD/PAY por páginas + scatter async) — no materializa el lote en memoria.
- **Integridad money-path**: el 100% de los pagos terminó `SENT` con archive y confirmación de gateway 1:1, sin
  duplicados (gateway.requests = fragmentos) ni pérdidas (staging/transaction = 1M). Los cambios de v59
  (atomicidad de la resolución, trama PAY_CONFLICT, visibilidad, reconciliaciones D1/D2, blindaje P0-1) **no
  degradan** el camino feliz a escala.
- **Sin regresión de throughput**: ~14,6 min para 1M filas E2E (incluye generación del CSV, carga a staging,
  fragmentación, validación, archivado, dispatch a gateway y confirmación STATUS) en un entorno dev con Testcontainers.

## Nota

El IT tiene un segundo test (`locatesAndReprocessesExactFailedRowInLargeBatch`) que, a escala, inyecta **una** fila
mala y verifica que la cuarentena localiza exactamente esa fila y el rebuild correctivo la reprocesa (needle-in-
haystack). Cubierto en CI a 10k; opt-in a 1M vía `-De2e.negativeRows=1000000 -De2e.badRow=<n>`.
