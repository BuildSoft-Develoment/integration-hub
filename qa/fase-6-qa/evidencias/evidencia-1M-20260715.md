# Evidencia de escala — 1.000.000 de registros (B.1) — 2026-07-15

Ejecutada sobre la versión actual (`experiment/quarkus-lts-native`, HEAD `66f6cbca`), con el H7 desbloqueado
(`mt101.build.insert-batch-max-bytes` runtime-tuneable) y heap acotado.

## Comando

```
mvn -pl platform-app test -Dtest=Mt101MillionFileProcessE2EIT \
  -DargLine="-Xmx768m -De2e.rows=1000000 -De2e.timeout.seconds=3600 -Dmt101.build.insert-batch-max-bytes=200000"
```

Pipeline validado end-to-end: `FILE_READ(CSV 1M) → DB_WRITE(staging_record) → MT101_BUILD_FROM_TABLE →
MT101_VALIDATE → MT101_ARCHIVE → MT101_PAY(REST local)` + los paths de corrección de cuarentena y de
modificación concurrente (optimistic lock).

## Resultado

| Métrica | Valor |
|---|---|
| Resultado | **BUILD SUCCESS** — `Tests run: 3, Failures: 0, Errors: 0` |
| Filas | **1.000.000** (`-De2e.rows=1000000`) |
| Wall time total | ~14 min (`19:09:06 → 19:23:11`); test class 782.5 s (~13 min) |
| Heap | **`-Xmx768m` acotado** — sin `OutOfMemoryError` ni GC-overhead |
| H7 (deadlock pgJDBC) | **estable** — cero `wait_event=Client/ClientWrite`; el umbral de batch a 200KB lo evitó a escala |
| Money-path | todas las aserciones verdes: 1M filas staged → built → validated → archived → **SENT** |

## Reportes crudos (reproducibilidad)

Los reportes de Surefire **sin editar** de esta corrida quedan archivados en
[`reportes-crudos-1M-20260715/`](reportes-crudos-1M-20260715/) (XML completo con los 3 `testcase` y sus tiempos —
money-path 1M 757.1 s + las dos correcciones—, `system-out` y las propiedades de entorno JVM/OS). Ver el
[README](reportes-crudos-1M-20260715/README.md) del paquete.

## Validación previa (harness) — 100k

Antes del 1M se validó el harness a 100k (mismo perfil): BUILD SUCCESS, ~2.5 min, cero deadlock/OOM. Confirmó
config + memoria bounded antes de la corrida completa.

## Notas

- Las 3 pruebas de la clase: (1) money-path de 1M (todas las filas a SENT); (2) corrección de cuarentena de una
  fila negativa (exige `If-Match` → 400 esperado si falta); (3) modificación concurrente de una fila staging
  (optimistic lock → 409 esperado). Las WARN 400/409 en el log son esos dos casos ejercitando su path a
  propósito, no fallos.
- Memoria bounded a 1M (`-Xmx768m`) confirma el diseño de streaming (páginas por `forEachPage`, flush por bytes
  en el build): el pico de heap no crece con el número de filas.

## Pendiente de escala/distribución (sigue abierto)

- Prueba de **dos nodos** (claim por token, heartbeat, recovery, cero reenvío físico bajo timeout ambiguo).
- **UAT banco-a-banco real** (ACK/NACK reales, SFTP/mTLS).
