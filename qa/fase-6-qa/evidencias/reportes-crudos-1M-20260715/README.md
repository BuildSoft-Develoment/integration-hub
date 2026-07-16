# Reportes crudos — corrida de 1.000.000 de registros (B.1 / v70 #5) — 2026-07-15

Reportes de Surefire **sin editar** de la corrida de escala de 1M, archivados como evidencia reproducible
(complementa el resumen en [`../evidencia-1M-20260715.md`](../evidencia-1M-20260715.md)). Copiados tal cual de
`platform-app/target/surefire-reports/` (timestamp `19:22`, coincide con la ventana `19:09→19:23` del doc).

## Archivos

| Archivo | Qué es |
|---|---|
| `TEST-…Mt101MillionFileProcessE2EIT.xml` | Reporte Surefire completo: suite, 3 `testcase` con tiempos, `system-out`, propiedades de entorno (JVM/OS). |
| `…Mt101MillionFileProcessE2EIT.txt` | Resumen de una línea de la suite. |

## Resultado (del XML crudo)

```
testsuite  time=782.48s  tests=3  errors=0  skipped=0  failures=0
  runsFileToSwiftProcessForMillionRows                    757.126 s   (money-path 1M: FILE_READ→…→PAY, todo a SENT)
  locatesAndReprocessesExactFailedRowInLargeBatch           1.870 s   (corrección de cuarentena, If-Match)
  reprocessesNonContiguousFailuresViaRestWithOptimisticLock 1.925 s   (lock optimista, 409 esperado)
```

Entorno registrado en el XML: `java.version=25.0.2`, `java.vm.name=OpenJDK 64-Bit Server VM`, `os.name=Windows 10`.

## Reproducir

```
mvn -pl platform-app test -Dtest=Mt101MillionFileProcessE2EIT \
  -DargLine="-Xmx768m -De2e.rows=1000000 -De2e.timeout.seconds=3600 -Dmt101.build.insert-batch-max-bytes=200000"
```

> Nota: el heap `-Xmx768m` acotado (sin OOM a 1M) evidencia el diseño de streaming; el batch a 200 KB evita el
> deadlock H7 de pgJDBC a escala. Detalle e interpretación en el doc resumen.
