# Evidencia TDD - Vertical SBS SUCAVE

Evidencia auditable del ciclo RED-GREEN por cada tarea `tipo=impl` de [spec-tareas.md](spec-tareas.md).

> **Qué está hecho hoy (2026-08-12).** Las fases **A0, A1 y A2** —el trabajo del MOTOR que RF-011 exige
> antes de que el vertical exista— están cerradas: ocho tareas. Todo lo demás (el vertical en sí, B1-B8)
> está `pending`, y su bloque aquí lo dice sin adornos.

> **Sobre el RED.** Este proyecto no simula evidencia. Donde el fallo se capturó como corrida, se dice y
> se cita el comando; donde el test se escribió junto a la implementación, **se dice también**, y se
> describe el fallo real que existía en su lugar. Un RED inventado a posteriori no prueba nada y
> estropea el único valor que tiene este archivo: que se le pueda creer.

> **Corrida de referencia (2026-08-12).** Backend: `mvn -o clean test` → **BUILD SUCCESS**, 649 tests,
> 0 fallos, 0 errores. Frontend: `npx nx test web` → **785 tests** en verde.

## Contexto
- Feature: `009-sbs-sucave`
- Tabla ejecutable: [spec-tareas.md](spec-tareas.md)
- Protocolo aplicable: `ai/protocols/tdd.md`

## RF-011 / T-001

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/service/task/sink/OutputSinkRegistry.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=OutputSinkRegistryTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: No capturado como corrida. El fallo era real y reproducible en el sistema en marcha: `OutputSinkRegistry` solo sabía `resolve()`, que lanza; no había forma de preguntar "¿hay sink para este tipo?" sin provocar la excepción, que es justo lo que hacía falta para poder responder ANTES de ejecutar.
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=OutputSinkRegistryTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=FileDeliverSinkValidatorTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (7 tests). Suite completa: 649 tests, 0 fallos.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-002

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/service/process/ProcessCatalogService.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=ProcessCatalogServiceTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: No capturado como corrida, pero el fallo estaba VISTO en ejecución: un `FILE_DELIVER` contra una fuente FTP se guardaba y se activaba sin queja, y reventaba en la primera ejecución con `Unsupported output sink: FTP`, con el proceso publicado y alguien esperando el archivo. Ese es el FAIL esperado. (FTP se usa aquí como ejemplo **histórico**: en A2 se le escribió sink, así que hoy los tipos sin salida son `REST` y `OCI_OBJECT_STORAGE`.)
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=ProcessCatalogServiceTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=FileDeliverSinkValidatorTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (7 tests), incluida la comprobación de que el `sinkRef` viaja como número Y como texto según el camino.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-003

- Archivo: `frontend/libs/features/processes/src/lib/components/process-task-form/file/process-file-deliver-task-form/process-file-deliver-task-form.component.ts`
- Comando RED: `npx nx test web`
- Resultado RED: No capturado como corrida. El selector filtraba solo por `direction`, que dice que la fuente QUIERE ser destino, no que el motor PUEDA escribir en ella: ofrecía los 8 tipos de entrada cuando solo 2 eran entregables. FAIL esperado.
- Comando GREEN: `npx nx test web`
- Resultado GREEN: `npx nx test web` → PASS. 785 tests (eran 780; los 5 nuevos son de `OutputSinkCatalogService`).
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-009

- Archivo: `ci/scripts/gen-catalogo-tipos.mjs`
- Comando RED: `npm run gen:catalogo:check`
- Resultado RED: CAPTURADO. `node ci/scripts/gen-catalogo-tipos.mjs --check` → exit 1, "el catalogo esta DESACTUALIZADO respecto al codigo", en cuanto aparecieron los cuatro sinks nuevos. El catálogo no publicaba las salidas, así que una entrada sin salida no la veía nadie.
- Comando GREEN: `npm run gen:catalogo:check`
- Resultado GREEN: `npm run gen:catalogo:check` → PASS (8 fuentes, 8 readers, 22 tipos de tarea, 6 sinks). La tabla de paridad pasó de 2/8 a 6/8 sola.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-004

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/S3Sink.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=S3SinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: No capturado como corrida: el test se escribió junto a la implementación. El FAIL esperado es de compilación —`S3Sink` no existía— y, antes de eso, el de producto: elegir S3 como destino era imposible.
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=S3SinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=S3SinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (5 tests), incluidos el largo exacto declarado y la reapertura del cuerpo en cada reintento.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-005

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/GcsSink.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=GcsSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: CAPTURADO, y por un defecto que introduje yo. La primera versión cerraba el canal en un `try-with-resources`, y cerrar es justo lo que PUBLICA el objeto en GCS: un fallo a mitad de transferencia habría finalizado un archivo regulatorio truncado, visible y con pinta de bueno. Contra esa versión, `mvn -o -pl platform-app -am -Dtest=GcsSinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → **FAILURE**, `siLaTransferenciaFallaElObjetoNoSePublica`. (El resto de la clase no tuvo RED: se escribió junto a la implementación.)
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=GcsSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=GcsSinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (6 tests), con el cierre fuera del try-with-resources: si la transferencia falla, la sesión se abandona y el objeto nunca existe.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-006

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/AzureBlobSink.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=AzureBlobSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: No capturado como corrida: el test se escribió junto a la implementación. FAIL esperado de compilación, `AzureBlobSink` no existía.
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=AzureBlobSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=AzureBlobSinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (6 tests), incluidos el `overwrite=true` que permite reintentar una entrega y el mismo defecto de cierre que salió en GCS (T-005): cerrar es commitear la lista de bloques, así que el cierre va fuera del try-with-resources.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-032

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/OciObjectStorageSink.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=OciObjectStorageSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: No capturado como corrida: el test se escribió junto a la implementación. El FAIL real y verificable era del catálogo: la tabla de paridad marcaba `OCI_OBJECT_STORAGE` con entrada y sin salida, y publicar una entrega contra una conexión OCI se rechazaba nombrando los tipos que sí.
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=OciObjectStorageSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=OciObjectStorageSinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (5 tests): endpoint compat derivado de namespace+region, path-style forzado, `access-key` por defecto, override explícito de endpoint respetado, y la composición de clave y el `Content-Length` heredados de `S3Sink`.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-007

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/FtpSink.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=FtpSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: No capturado como corrida: el test se escribió junto a la implementación. FAIL esperado de compilación, `FtpSink` no existía.
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=FtpSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=FtpSinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (3 tests). El camino feliz (upload + rename) queda para el FTP real del stack de integración, igual que el de la fuente FTP.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-011 / T-019

- Archivo: `platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/SftpSink.java`
- Comando RED: `mvn -o -pl platform-app -am -Dtest=SftpSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: CAPTURADO. Revirtiendo `SftpSink` al orden anterior —borrar el destino y luego renombrar—, `mvn -o -pl platform-app -am -Dtest=SftpSinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → **FAILURE**: 3 de 5 (2 fallos + 1 error). Ese orden borra la entrega anterior antes de saber si el rename funciona; si falla justo después, el directorio del banco se queda sin la anterior y sin la nueva.
- Comando GREEN: `mvn -o -pl platform-app -am -Dtest=SftpSinkTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: `mvn -o -pl platform-app -am -Dtest=SftpSinkTest -Dsurefire.failIfNoSpecifiedTests=false test` → PASS (5 tests). Renombra primero; solo borra si el destino existe **y** el rename ya falló por eso. Si falló por otra cosa —permisos, ruta inexistente— se propaga el error original sin tocar nada, que era la puerta trasera del mismo agujero.
- Verificado: 2026-08-12 — suite completa del backend en verde tras el cambio.

## RF-001 / T-010

- Archivo previsto: vertical-sbs-sucave/pom.xml
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am test`
- Resultado RED: pending — FAIL: el modulo no existe
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-009 / T-011

- Archivo previsto: vertical-sbs-sucave/src/main/resources/db/migration-sucave/V200__sucave_schema.sql
- Comando RED: (planificado) `mvn -o -pl platform-app -am -Dit.test=SucaveSchemaIT verify`
- Resultado RED: pending — FAIL: el schema no existe
- Comando GREEN: (planificado) `mvn -o -pl platform-app -am -Dit.test=SucaveSchemaIT verify`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-001 / T-012

- Archivo previsto: frontend/libs/features/sbs-sucave/src/index.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: la lib no esta registrada
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-002 / T-013

- Archivo previsto: frontend/libs/features/sbs-sucave/src/lib/sbs-sucave-i18n.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL sin el diccionario
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-005 / T-014

- Archivo previsto: platform-app/src/main/java/com/integrationhub/platform/provider/task/filewrite/FileWriteTaskProvider.java
- Comando RED: (planificado) `mvn -o -pl platform-app -am -Dtest=FileWriteLayoutBindingTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: layout con {source,sourceTaskRef} no se resuelve y se toma literal
- Comando GREEN: (planificado) `mvn -o -pl platform-app -am -Dtest=FileWriteLayoutBindingTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS, y el literal sigue funcionando
- Verificado: pending

## RF-003 / T-020

- Archivo previsto: vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/provider/task/SucavePrepareTaskProvider.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePrepareTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL sin la implementacion
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePrepareTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-004 / T-021

- Archivo previsto: vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/provider/task/SucaveValidateTaskProvider.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveValidateTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL sin la implementacion
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveValidateTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-003 / T-015

- Archivo previsto: vertical-sbs-sucave/.../provider/task/SucaveMaterializeTaskProvider.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveMaterializeTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: traduccion de catalogos y reglas de caracter sin implementar
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveMaterializeTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-005 / T-016

- Archivo previsto: vertical-sbs-sucave/.../provider/task/SucavePostValidateTaskProvider.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePostValidateTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: un trailer que declara 12 486 sobre 12 480 lineas no se detecta
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePostValidateTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-001 / T-027

- Archivo previsto: frontend/libs/features/sbs-sucave/src/lib/process-tasks/*.provider.ts (4 providers: prepare, materialize, validate, post-validate)
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: el config_json no sobrevive el round-trip del draft
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-001 / T-028

- Archivo previsto: frontend/libs/features/sbs-sucave/src/lib/process-task-forms/ (4 formularios, layout workspace)
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL sin los formularios: el tipo no se puede configurar
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-009 / T-029

- Archivo previsto: frontend/libs/features/sbs-sucave/.../process-sucave-prepare-task-form.component.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: la version fijada no avisa de que deja de seguir las actualizaciones de la SBS
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-010 / T-022

- Archivo previsto: vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/service/SucaveProcessDefinitionValidator.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveProcessDefinitionValidatorTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: se publica un proceso sin la garantia
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveProcessDefinitionValidatorTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-005, RF-006 / T-023

- Archivo previsto: (plantilla del formato: layout de columnas para FILE_WRITE)
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatLayoutTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: el layout no coincide con el diseño de registro
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatLayoutTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-005 / T-017

- Archivo previsto: platform-app/src/main/java/com/integrationhub/platform/provider/task/writer/TxtWriter.java
- Comando RED: (planificado) `mvn -o -pl platform-app -am -Dtest=TxtWriterStrictEncodingTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: un caracter fuera del charset se escribe como ? sin error (OutputStreamWriter usa REPLACE)
- Comando GREEN: (planificado) `mvn -o -pl platform-app -am -Dtest=TxtWriterStrictEncodingTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS: CharsetEncoder estricto, y el error dice caracter, campo y registro de origen
- Verificado: pending

## RF-005 / T-018

- Archivo previsto: vertical-sbs-sucave/.../provider/task/SucavePrepareTaskProvider.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveCharsetResolutionTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: sin charset confirmado en la definicion regulatoria se genera igual, heredando un default
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveCharsetResolutionTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS: sin charset resuelto NO se genera artefacto — SUCAVE-ENCODING-001
- Verificado: pending

## RF-001 / T-024

- Archivo previsto: frontend/libs/features/sbs-sucave/src/lib/process-tasks/sbs-sucave-process-template.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL sin la plantilla
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-005 / T-026

- Archivo previsto: vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/SucaveReflectionRegistrations.java
- Comando RED: (planificado) `mvn -o -Pnative -DskipTests package`
- Resultado RED: pending — FAIL en nativo: "No serializer found" al construir la config de una tarea SUCAVE
- Comando GREEN: (planificado) `mvn -o -Pnative -DskipTests package`
- Resultado GREEN: pending — PASS: arranque nativo limpio y la tarea configurable
- Verificado: pending

## RF-013 / T-045

- Archivo previsto: frontend/libs/features/sbs-sucave/src/lib/process-tasks/sbs-sucave-process-template.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: no se puede arrastrar un grupo, solo anexos sueltos
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS: arrastrar el grupo inserta las N cadenas ya cableadas a la misma revision de conjunto
- Verificado: pending

## RF-014 / T-046

- Archivo previsto: frontend/libs/core/providers/src/lib/tasks/process-template-registry.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: el registro solo admite constantes compiladas (useValue); un formato dado de alta en el catalogo no aparece en la paleta sin release
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS: plantillas construidas desde el catalogo, y las compiladas siguen funcionando
- Verificado: pending

## RF-002 / T-030

- Archivo previsto: frontend/libs/core/providers/src/lib/tasks/process-template-registry.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: el registro no admite jerarquia
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-002 / T-031

- Archivo previsto: frontend/libs/features/processes/src/lib/components/process-flow-palette/process-flow-palette.component.ts
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: la paleta pinta una lista plana
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-009 / T-040

- Archivo previsto: vertical-sbs-sucave/.../repository/SucaveFormatSnapshotRepository.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatSnapshotRepositoryTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL sin la implementacion
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatSnapshotRepositoryTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-010 / T-050

- Archivo previsto: vertical-sbs-sucave/.../service/SucaveExecutionPreflightGuard.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveExecutionPreflightGuardTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: un proceso valido en marzo ejecuta en junio con snapshot caduco
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveExecutionPreflightGuardTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-003 / T-060

- Archivo previsto: vertical-sbs-sucave/.../service/SucaveDatasetAdapter.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveDatasetAdapterTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: se acepta una salida de SP sin comprobar su forma
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveDatasetAdapterTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-007 / T-049

- Archivo previsto: vertical-sbs-sucave/.../service/SucaveProcessDefinitionValidator.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePackageCompletenessTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: con una cadena en continueOnFailure se entregan los anexos que sobrevivieron
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePackageCompletenessTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS: no sale ningun archivo hasta que todas las cadenas han calificado
- Verificado: pending

## RF-013 / T-042

- Archivo previsto: vertical-sbs-sucave/.../db/migration-sucave/V210__submission_groups.sql
- Comando RED: (planificado) `mvn -o -pl platform-app -am -Dit.test=SucaveSchemaIT verify`
- Resultado RED: pending — FAIL: no existe el grupo de remision ni su composicion por anexo
- Comando GREEN: (planificado) `mvn -o -pl platform-app -am -Dit.test=SucaveSchemaIT verify`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-013 / T-043

- Archivo previsto: vertical-sbs-sucave/.../provider/task/SucavePackageValidateTaskProvider.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePackageValidateTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: falta un anexo obligatorio del grupo y aun asi se entregan los demas
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePackageValidateTaskProviderTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS
- Verificado: pending

## RF-013 / T-044

- Archivo previsto: vertical-sbs-sucave/.../service/SucaveProcessDefinitionValidator.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveGroupWiringTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: se publica un proceso que mezcla anexos de dos grupos, o al que le falta uno obligatorio
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveGroupWiringTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS al ACTIVAR, no al ejecutar
- Verificado: pending

## RF-014 / T-047

- Archivo previsto: vertical-sbs-sucave/.../api/resource/SucaveFormatCatalogResource.java
- Comando RED: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatImportTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado RED: pending — FAIL: no hay forma de dar de alta un formato sin SQL a mano
- Comando GREEN: (planificado) `mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatImportTest -Dsurefire.failIfNoSpecifiedTests=false test`
- Resultado GREEN: pending — PASS: se importa el diseño de registro publicado por la SBS
- Verificado: pending

## RF-014 / T-048

- Archivo previsto: frontend/libs/features/sbs-sucave/src/lib/catalog/ (pantalla de catalogo de formatos)
- Comando RED: (planificado) `npx nx test web`
- Resultado RED: pending — FAIL: no hay pantalla para ver ni dar de alta formatos y versiones
- Comando GREEN: (planificado) `npx nx test web`
- Resultado GREEN: pending — PASS
- Verificado: pending
