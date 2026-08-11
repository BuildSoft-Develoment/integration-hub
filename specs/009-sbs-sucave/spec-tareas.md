# Spec de tareas — 009 SBS SUCAVE

## Regla

Cada tarea es una fila ejecutable. `estado` arranca en `pending`; pasa a `done` solo con evidencia
RED-GREEN capturada en `tdd-evidence.md`.

## Contexto

- Feature: `009-sbs-sucave`
- Funcional: `spec-funcional.md` · Técnica: `spec-tecnica.md`
- Módulo back: `vertical-sbs-sucave/` · Lib front: `frontend/libs/features/sbs-sucave/`
- Gate: `gate-spdd-approved` (pendiente de validación humana)

---

## Fases

Dos tracks. **B es el camino crítico y no espera a A**: su destino es una carpeta accesible desde la
estación que ejecuta SUCAVE, que el motor ya sabe escribir.

| Fase | Track | Qué entrega | Depende de |
|---|---|---|---|
| **A0** | Motor | Cerrar la trampa del picker de destino | — |
| **A1** | Motor | Sinks de objeto: `S3`, `GCS`, `AZURE_BLOB` | A0 |
| **A2** | Motor | `FtpSink` | A0 |
| **A3** | Motor | Decisión de diseño: `REST` y `OCI` como salida | A1 |
| **B1** | Vertical | Andamiaje: módulo, lib, migraciones, registro, i18n | — |
| **B2** | Vertical | Un formato **de un solo anexo** de punta a punta: hasta el archivo en la carpeta de importación | B1 |
| **B3** | Vertical | Jerarquía de la paleta (SBS → SUCAVE → formato → anexo) | B1 |
| **B4** | Vertical | Snapshot regulatorio versionado (CU-04) | B2 |
| **B5** | Vertical | Pre-vuelo en ejecución | B4 |
| **B6** | Vertical | Orígenes alternativos: tabla y SP, con certificación de forma | B2 |
| **B7** | Vertical | Grupos de remisión: `PACKAGE_VALIDATE` + garantía de conjunto completo | B4 |
| **B8** | Vertical | **Catálogo de formatos operable**: alta de formato/anexo/versión importando el diseño de registro de la SBS | B4 |

**B7 se encogió, y es buena noticia.** Mientras se dio por hecho que el envío era un ZIP conjunto,
esta fase incluía un cambio del **motor**: extender `FILE_COMPRESS` para aceptar varias tareas de
origen. Sabiendo que SUCAVE importa archivos individuales, **ese cambio deja de hacer falta** — cada
cadena entrega el suyo con el `FILE_DELIVER` que ya existe. B7 queda como trabajo **solo del
vertical**: la tarea de revisión del conjunto y la regla que impide entregar nada si falta un anexo.

**B8 decide si el vertical se puede operar sin nosotros.** Sin pantalla de catálogo ni importación, el
diseño de registro es "dato" solo sobre el papel: darlo de alta exigiría SQL a mano. Y **B3 crece**:
las plantillas de la paleta hoy son constantes compiladas (`useValue`), así que un formato nuevo no
aparecería sin una release del frontend. Las dos cosas salen de la misma pregunta —¿los formatos son
dinámicos?— y la respuesta es sí.

**B7 solo si el formato tiene remisión grupal.** Un formato de anexo único no la necesita. Cuando la
hay, obliga a que todos los anexos del grupo se generen en la **misma ejecución** —los artefactos no
cruzan ejecuciones—, para que la revisión del conjunto pueda verlos todos. Depende de la pregunta
abierta nº 4 del funcional.

> **`FILE_COMPRESS` multi-entrada (antes T-009c) se eliminó del plan.** Existía para construir el ZIP
> conjunto; sabiendo que SUCAVE importa archivos individuales, no hace falta.

**A0 antes que A1/A2 a propósito:** hoy se puede configurar un destino que no existe y descubrirlo en
ejecución. Eso se cierra primero, y así cada sink nuevo que llega ya entra en un sistema honesto.

**B2 con un formato de UN SOLO ANEXO, deliberadamente.** Sin grupos de remisión, sin paquete conjunto y
sin subprocesos. Toda esa maquinaria (B7, y `PROCESS_CALL` de
[ADR-028](../../docs/fase-3-arquitectura/adr/ADR-028-llamada-a-otro-proceso-como-tarea.md)) es real y
está razonada, pero ponerla en la ruta del primer archivo que sale sería construir la composición antes
de saber si el archivo simple funciona.

> **`PROCESS_CALL` NO es una fase de este spec.** Se descubrió aquí, pero es una capacidad del motor que
> se justifica sola y se prioriza contra el resto del producto. Vive en ADR-028, no en esta tabla.

### Restricción de secuencia: B8 no puede adelantar a B7

Acotar B2 a un anexo y decir que los formatos son dinámicos **choca en un punto concreto**: el
catálogo. Si B8 entrega el alta de formatos antes de que B7 soporte grupos, alguien registrará una
definición con remisión grupal —porque el catálogo la acepta— y el sistema producirá un envío suelto
por anexo cuando la SBS espera el grupo. **Estructuralmente válido, regulatoriamente equivocado, y sin
que nada falle.**

Dos formas de cerrarlo, y hay que elegir una **antes** de construir B8:

| Opción | Qué implica |
|---|---|
| **B8 después de B7** | El catálogo llega cuando el sistema ya honra lo que acepta |
| **B8 antes, pero fail-loud** | El catálogo **rechaza** al guardar una definición con grupo mientras B7 no exista, diciendo qué falta |

Lo que no vale es aceptar la definición y procesarla a medias. Es el mismo fallo que veníamos
eliminando: configuración admitida que el sistema no sabe honrar.

### Y B2 depende de la pregunta abierta nº 1

"Un formato de un solo anexo" **presupone que elegimos el formato**. Si el primero que la entidad
necesita resulta tener grupos, B2 tal como está escrita no existe. Tres salidas, no dos:

1. **El formato piloto no es el prioritario del negocio.** Se valida la tubería con el formato más
   simple que exista y se ataca el importante después. Desacopla la validación técnica de la prioridad
   de negocio, y es lo que menos compromete.
2. **B7 se adelanta**, si el formato prioritario tiene grupos y no hay margen para un piloto aparte.
3. **Cambia el formato piloto** cuando se sepa cuál pide el negocio.

No es una decisión técnica: sale de la pregunta *qué formato se ataca primero*.

> **Aviso sobre los ejemplos.** El 0228 aparece en el prototipo con dos anexos agrupados. **Es
> composición inventada** para poder mostrar el caso de grupo — no hay comprobación de que el 0228 real
> se remita así. No sirve para decidir si B2 puede usarlo.

**B3 después de B2, no antes:** hasta no haber generado un archivo real no se sabe qué variantes de
flujo hay que agrupar, y el árbol se diseñaría a ciegas.

**B3 incluye la variante «todos los anexos».** Un formato con cinco anexos son cinco cadenas y ~20
tareas del vertical; el contrato lo soporta sin cambios (`snapshotRef` es por tarea), pero cablearlo a
mano es donde se cometen los errores. La plantilla debe poder insertar las N cadenas ya conectadas a
una sola revisión del conjunto.

---

## Tabla ejecutable

| id | rf | fase | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-011 | A0 | impl | platform-app/src/main/java/com/integrationhub/platform/service/task/sink/OutputSinkRegistry.java | platform-app/src/test/java/com/integrationhub/platform/service/task/sink/OutputSinkRegistryTest.java | mvn -o -pl platform-app -am -Dtest=OutputSinkRegistryTest test | FAIL: el registry no expone los tipos disponibles | idem | PASS | - | no | pending |
| T-002 | RF-011 | A0 | impl | platform-app/src/main/java/com/integrationhub/platform/service/process/ProcessCatalogService.java | platform-app/src/test/java/com/integrationhub/platform/service/process/ProcessCatalogServiceTest.java | mvn -o -pl platform-app -am -Dtest=ProcessCatalogServiceTest test | FAIL: guardar FILE_DELIVER con destino sin sink no se rechaza | idem | PASS | T-001 | no | pending |
| T-003 | RF-011 | A0 | impl | frontend/libs/features/processes/src/lib/components/process-task-form/file/process-file-deliver-task-form/process-file-deliver-task-form.component.ts | (spec del mismo componente) | npx nx test processes | FAIL: el picker ofrece destinos sin sink | npx nx test processes | PASS | T-001 | si | pending |
| T-004 | RF-011 | A1 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/S3Sink.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/sink/S3SinkTest.java | mvn -o -pl platform-app -am -Dtest=S3SinkTest test | FAIL sin la implementacion | idem | PASS | T-001 | si | pending |
| T-005 | RF-011 | A1 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/GcsSink.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/sink/GcsSinkTest.java | mvn -o -pl platform-app -am -Dtest=GcsSinkTest test | FAIL sin la implementacion | idem | PASS | T-001 | si | pending |
| T-006 | RF-011 | A1 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/AzureBlobSink.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/sink/AzureBlobSinkTest.java | mvn -o -pl platform-app -am -Dtest=AzureBlobSinkTest test | FAIL sin la implementacion | idem | PASS | T-001 | si | pending |
| T-007 | RF-011 | A2 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/sink/FtpSink.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/sink/FtpSinkTest.java | mvn -o -pl platform-app -am -Dtest=FtpSinkTest test | FAIL sin la implementacion | idem | PASS | T-001 | si | pending |
| T-008 | RF-011 | A3 | doc | docs/fase-3-arquitectura/adr/ADR-027-salida-rest-y-oci.md | - | - | - | - | ADR aprobado | T-004 | no | pending |
| T-009b | RF-005 | B2 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/filewrite/FileWriteTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/filewrite/FileWriteLayoutBindingTest.java | mvn -o -pl platform-app -am -Dtest=FileWriteLayoutBindingTest test | FAIL: layout con {source,sourceTaskRef} no se resuelve y se toma literal | idem | PASS, y el literal sigue funcionando | - | si | pending |
| T-009d | RF-007 | B7 | impl | vertical-sbs-sucave/.../service/SucaveProcessDefinitionValidator.java | .../SucavePackageCompletenessTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePackageCompletenessTest test | FAIL: con una cadena en continueOnFailure se entregan los anexos que sobrevivieron | idem | PASS: no sale ningun archivo hasta que todas las cadenas han calificado | T-043 | no | pending |
| T-042 | RF-013 | B7 | impl | vertical-sbs-sucave/.../db/migration-sucave/V210__submission_groups.sql | (IT de esquema) | mvn -o -pl platform-app -am -Dit.test=SucaveSchemaIT verify | FAIL: no existe el grupo de remision ni su composicion por anexo | idem | PASS | T-040 | no | pending |
| T-043 | RF-013 | B7 | impl | vertical-sbs-sucave/.../provider/task/SucavePackageValidateTaskProvider.java | .../SucavePackageValidateTaskProviderTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePackageValidateTaskProviderTest test | FAIL: falta un anexo obligatorio del grupo y aun asi se entregan los demas | idem | PASS | T-042 | no | pending |
| T-044 | RF-013 | B7 | impl | vertical-sbs-sucave/.../service/SucaveProcessDefinitionValidator.java | .../SucaveGroupWiringTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveGroupWiringTest test | FAIL: se publica un proceso que mezcla anexos de dos grupos, o al que le falta uno obligatorio | idem | PASS al ACTIVAR, no al ejecutar | T-042 | no | pending |
| T-045 | RF-013 | B3 | impl | frontend/libs/features/sbs-sucave/src/lib/process-tasks/sbs-sucave-process-template.ts | .../plantilla-grupo-remision.spec.ts | npx nx test sbs-sucave | FAIL: no se puede arrastrar un grupo, solo anexos sueltos | idem | PASS: arrastrar el grupo inserta las N cadenas ya cableadas a la misma revision de conjunto | T-030 | no | pending |
| T-046 | RF-014 | B3 | impl | frontend/libs/core/providers/src/lib/tasks/process-template-registry.ts | frontend/libs/features/processes/src/lib/editor/process-editor.store.spec.ts | npx nx test processes | FAIL: el registro solo admite constantes compiladas (useValue); un formato dado de alta en el catalogo no aparece en la paleta sin release | idem | PASS: plantillas construidas desde el catalogo, y las compiladas siguen funcionando | T-030 | no | pending |
| T-047 | RF-014 | B8 | impl | vertical-sbs-sucave/.../api/resource/SucaveFormatCatalogResource.java | .../SucaveFormatImportTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatImportTest test | FAIL: no hay forma de dar de alta un formato sin SQL a mano | idem | PASS: se importa el diseño de registro publicado por la SBS | T-040 | no | pending |
| T-048 | RF-014 | B8 | impl | frontend/libs/features/sbs-sucave/src/lib/catalog/ (pantalla de catalogo de formatos) | (spec de la pantalla) | npx nx test sbs-sucave | FAIL: no hay pantalla para ver ni dar de alta formatos y versiones | idem | PASS | T-047 | no | pending |
| T-009 | RF-011 | A0 | impl | ci/scripts/gen-catalogo-tipos.mjs | (el propio `gen:catalogo:check` del CI) | npm run gen:catalogo:check | FAIL: el catalogo no publica las salidas, asi que una entrada sin salida no la ve nadie | npm run gen:catalogo:check | PASS con la seccion de salidas emparejada a la de fuentes | - | si | pending |
| T-010 | RF-001 | B1 | impl | vertical-sbs-sucave/pom.xml | - | mvn -o -pl vertical-sbs-sucave -am test | FAIL: el modulo no existe | idem | PASS | - | no | pending |
| T-011 | RF-009 | B1 | impl | vertical-sbs-sucave/src/main/resources/db/migration-sucave/V200__sucave_schema.sql | (IT de arranque) | mvn -o -pl platform-app -am -Dit.test=SucaveSchemaIT verify | FAIL: el schema no existe | idem | PASS | T-010 | no | pending |
| T-012 | RF-001 | B1 | impl | frontend/libs/features/sbs-sucave/src/index.ts | frontend/apps/web/src/app/architecture/sbs-sucave-wiring.spec.ts | npx nx test web | FAIL: la lib no esta registrada | npx nx test web | PASS | - | si | pending |
| T-013 | RF-002 | B1 | impl | frontend/libs/features/sbs-sucave/src/lib/sbs-sucave-i18n.ts | (spec de vocabulario) | npx nx test sbs-sucave | FAIL sin el diccionario | idem | PASS | T-012 | si | pending |
| T-020 | RF-003 | B2 | impl | vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/provider/task/SucavePrepareTaskProvider.java | .../SucavePrepareTaskProviderTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePrepareTaskProviderTest test | FAIL sin la implementacion | idem | PASS | T-011 | no | pending |
| T-021 | RF-004 | B2 | impl | vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/provider/task/SucaveValidateTaskProvider.java | .../SucaveValidateTaskProviderTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveValidateTaskProviderTest test | FAIL sin la implementacion | idem | PASS | T-020 | no | pending |
| T-021a | RF-003 | B2 | impl | vertical-sbs-sucave/.../provider/task/SucaveMaterializeTaskProvider.java | .../SucaveMaterializeTaskProviderTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveMaterializeTaskProviderTest test | FAIL: traduccion de catalogos y reglas de caracter sin implementar | idem | PASS | T-020 | no | pending |
| T-021b | RF-005 | B2 | impl | vertical-sbs-sucave/.../provider/task/SucavePostValidateTaskProvider.java | .../SucavePostValidateTaskProviderTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucavePostValidateTaskProviderTest test | FAIL: un trailer que declara 12 486 sobre 12 480 lineas no se detecta | idem | PASS | T-023 | no | pending |
| T-027 | RF-001 | B2 | impl | frontend/libs/features/sbs-sucave/src/lib/process-tasks/*.provider.ts (4 providers: prepare, materialize, validate, post-validate) | .../task-config-roundtrip.spec.ts | npx nx test sbs-sucave | FAIL: el config_json no sobrevive el round-trip del draft | idem | PASS | T-013 | si | pending |
| T-028 | RF-001 | B2 | impl | frontend/libs/features/sbs-sucave/src/lib/process-task-forms/ (4 formularios, layout workspace) | (spec por formulario) | npx nx test sbs-sucave | FAIL sin los formularios: el tipo no se puede configurar | idem | PASS | T-027 | si | pending |
| T-029 | RF-009 | B2 | impl | frontend/libs/features/sbs-sucave/.../process-sucave-prepare-task-form.component.ts | .../process-sucave-prepare-task-form.component.spec.ts | npx nx test sbs-sucave | FAIL: la version fijada no avisa de que deja de seguir las actualizaciones de la SBS | idem | PASS | T-028 | no | pending |
| T-022 | RF-010 | B2 | impl | vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/service/SucaveProcessDefinitionValidator.java | .../SucaveProcessDefinitionValidatorTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveProcessDefinitionValidatorTest test | FAIL: se publica un proceso sin la garantia | idem | PASS | T-021 | si | pending |
| T-023 | RF-005 RF-006 | B2 | config | (plantilla del formato: layout de columnas para FILE_WRITE) | .../SucaveFormatLayoutTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatLayoutTest test | FAIL: el layout no coincide con el diseño de registro | idem | PASS | T-021 | no | pending |
| T-023a | RF-005 | B2 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/writer/TxtWriter.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/writer/TxtWriterStrictEncodingTest.java | mvn -o -pl platform-app -am -Dtest=TxtWriterStrictEncodingTest test | FAIL: un caracter fuera del charset se escribe como ? sin error (OutputStreamWriter usa REPLACE) | idem | PASS: CharsetEncoder estricto, y el error dice caracter, campo y registro de origen | T-020 | si | pending |
| T-023b | RF-005 | B2 | impl | vertical-sbs-sucave/.../provider/task/SucavePrepareTaskProvider.java | .../SucaveCharsetResolutionTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveCharsetResolutionTest test | FAIL: sin charset confirmado en la definicion regulatoria se genera igual, heredando un default | idem | PASS: sin charset resuelto NO se genera artefacto — SUCAVE-ENCODING-001 | T-023 | no | pending |
| T-024 | RF-001 | B2 | impl | frontend/libs/features/sbs-sucave/src/lib/process-tasks/sbs-sucave-process-template.ts | .../plantilla-sucave-round-trip.spec.ts | npx nx test sbs-sucave | FAIL sin la plantilla | idem | PASS | T-013 | si | pending |
| T-025 | RF-007 RF-008 | B2 | test | (E2E: del origen al archivo en la carpeta de importacion) | platform-app/src/test/java/com/integrationhub/platform/integration/sucave/SucaveGenerateE2EIT.java | mvn -o -pl platform-app -am -Dit.test=SucaveGenerateE2EIT verify | FAIL: no aparece 01260930.228 en la carpeta de importacion | idem | PASS | T-023 T-024 | no | pending |
| T-026 | RF-005 | B2 | impl | vertical-sbs-sucave/src/main/java/com/integrationhub/vertical/sbs/sucave/SucaveReflectionRegistrations.java | (smoke nativo) | - | En nativo: "No serializer found" | - | Arranque nativo limpio | T-020 | si | pending |
| T-030 | RF-002 | B3 | impl | frontend/libs/core/providers/src/lib/tasks/process-template-registry.ts | frontend/libs/features/processes/src/lib/editor/process-editor.store.spec.ts | npx nx test processes | FAIL: el registro no admite jerarquia | npx nx test processes | PASS | T-024 | no | pending |
| T-031 | RF-002 | B3 | impl | frontend/libs/features/processes/src/lib/components/process-flow-palette/process-flow-palette.component.ts | (spec del componente) | npx nx test processes | FAIL: la paleta pinta una lista plana | idem | PASS | T-030 | no | pending |
| T-040 | RF-009 | B4 | impl | vertical-sbs-sucave/.../repository/SucaveFormatSnapshotRepository.java | .../SucaveFormatSnapshotRepositoryTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveFormatSnapshotRepositoryTest test | FAIL sin la implementacion | idem | PASS | T-025 | no | pending |
| T-041 | RF-009 | B4 | test | (CU-04: regenerar un periodo pasado) | platform-app/src/test/java/com/integrationhub/platform/integration/sucave/SucaveRegenerateFrozenLayoutIT.java | mvn -o -pl platform-app -am -Dit.test=SucaveRegenerateFrozenLayoutIT verify | FAIL: regenera con el layout de hoy, no con el del periodo | idem | PASS | T-040 | no | pending |
| T-050 | RF-010 | B5 | impl | vertical-sbs-sucave/.../service/SucaveExecutionPreflightGuard.java | .../SucaveExecutionPreflightGuardTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveExecutionPreflightGuardTest test | FAIL: un proceso valido en marzo ejecuta en junio con snapshot caduco | idem | PASS | T-040 | no | pending |
| T-060 | RF-003 | B6 | impl | vertical-sbs-sucave/.../service/SucaveDatasetAdapter.java | .../SucaveDatasetAdapterTest.java | mvn -o -pl vertical-sbs-sucave -am -Dtest=SucaveDatasetAdapterTest test | FAIL: se acepta una salida de SP sin comprobar su forma | idem | PASS | T-025 | no | pending |

**T-050 no tiene hook hoy.** El motor solo ofrece validación de PUBLICACIÓN
(`ProcessDefinitionValidator`); no existe un punto de extensión de pre-vuelo en ejecución. B5 incluye
crearlo en el SPI, y por eso va después de B4 y no antes.

---

## Antes de empezar B2

Un formato se implementa **exclusivamente contra su documentación oficial vigente**: oficio o
resolución, diseño de registro, layout e instructivo. La página índice de SUCAVE sirve para descubrir
versiones y formatos; **no es una especificación técnica**. T-023 no puede escribirse sin esos
documentos delante.

### Candidato de referencia: 0228

Los artefactos oficiales del 0228 se han revisado fuera de esta sesión —yo no pude verificarlos por
búsqueda, ver aviso abajo— y describen dos anexos con naturalezas distintas:

| Anexo | Contenido | Naturaleza |
|---|---|---|
| 01 | Información financiera de deudores no minoristas | Trimestral, recurrente, desde la información de septiembre 2026 |
| 11 | Lo mismo para 31/12/2023 y 31/12/2024 | **Extraordinario**, una sola vez, con plazo propio |

**Recomendación: B2 = 0228 / Anexo 01 / desde archivo.** Es el recurrente, y valida la tubería
completa sin arrastrar la maquinaria histórica.

> **Ojo con dar por hecho que el 11 es «después».** Es extraordinario y con plazo propio, así que puede
> ser más urgente para el negocio que el 01. Pero es **más difícil**: periodos históricos y un diseño
> derogado exigen el snapshot por vigencia (B4), que en el 01 no hace falta todavía. Si el negocio pide
> el 11 primero, B4 entra en el camino crítico — no es un cambio de orden neutro.

> **Aviso de verificación.** Los datos del 0228 —anexos, oficio, vigencias, posiciones del registro—
> provienen de una revisión externa de los documentos oficiales. Mis intentos de confirmarlos por
> búsqueda no dieron con el instructivo. Antes de escribir T-023, **tener el fichero en la mano**.

### Dos cosas que hay que mirar en el diseño de registro antes de T-023

Son baratas de comprobar con el documento delante y caras de descubrir a mitad de la implementación:

0. **¿Qué code page es «ANSI» para este formato?** Bloquea homologación, no desarrollo: se construye
   y se prueba con Windows-1252 **y** ISO-8859-1, y no se homologa hasta saberlo. Ver P8 del funcional.
1. **¿La cabecera lleva alguna SUMA?** Leyendo desde tabla, `FILE_WRITE` rechaza un `sum` en la
   cabecera (`FileWriteTaskProvider:368`) porque el total se acumula al escribir. Un **conteo** sí
   funciona. Si el formato exige una suma arriba, hay que pre-calcularla en MATERIALIZE o ampliar el
   motor — y eso cambia la estimación de B2.
2. **¿Cuántas longitudes distintas hay?** Cabecera, detalle y trailer pueden medir cosas distintas
   —en el 0228 serían 37 y 946—, y la comprobación del archivo tiene que ser **por tipo de registro**,
   no global.

## Checklist de cierre

- [ ] Todas las tareas tienen estado.
- [ ] Cada tarea crítica tiene evidencia TDD (red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX crítica con revisión humana.
- [ ] Pruebas registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas del funcional resueltas o escaladas.
- [ ] ADR de `REST`/`OCI` como salida (T-008) resuelto o explícitamente diferido.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
