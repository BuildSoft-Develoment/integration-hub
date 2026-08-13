# Traceability - Vertical SBS SUCAVE

[README principal](../../README.md) | [Specs](../README.md)

> **Estado real: el vertical todavia no existe.** Lo unico construido es el trabajo del MOTOR que
> RF-011 exige antes de poder empezarlo —la paridad entrada/salida—, y esta terminado. Los otros
> trece requerimientos estan **planificados**, con su fila aqui y sus tareas en
> [spec-tareas.md](spec-tareas.md), y sus columnas `API`/`BD`/`Codigo`/`Test` van en `-` porque
> todavia no hay artefacto que enlazar. Poner ahi el nombre de una clase que no existe seria
> convertir esta matriz en una lista de deseos con formato de evidencia.

> **Este fichero faltaba, y lo detecto un gate, no una persona.** Se commiteo la spec 009 entera
> —funcional, tecnica, tareas, prototipo, contrato de API— sin `traceability.md`, que es el fichero
> que `check:global-matrix` cruza contra `TRACEABILITY_MATRIX.md` y que `sync-memory` parsea. Sin el,
> los catorce RF de este vertical eran invisibles para cualquier lectura de "que hay pendiente en el
> proyecto". Es el mismo patron que este mismo spec viene a cerrar en el motor: algo que se acepta
> sin queja y solo da la cara mas tarde.

## Proposito
Matriz viva RF → API → BD → Codigo → Test, detalle por feature del rollup global en
`TRACEABILITY_MATRIX.md`. La parsea `node scripts/ai-framework-agent.mjs sync-memory` para poblar
`ai_trace_links` / `ai_gate_runs`.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-002 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-003 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-004 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-005 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-006 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-007 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-008 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-009 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-010 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-011 | - | - | - | GET /api/output-sinks | - | OutputSinkRegistry | FileDeliverSinkValidatorTest | Implementado | specs/009-sbs-sucave/tdd-evidence.md | output-sink-catalog.service.ts | output-sink-catalog.service.spec.ts |
| RF-012 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-013 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |
| RF-014 | - | product-design.md | prototype-html5/index.html | - | - | - | - | Planificado | specs/009-sbs-sucave/spec-tareas.md | - | - |

> **RF-011 esta en `Implementado` con una salvedad honesta.** Las fases A0, A1 y A2 estan cerradas y
> la paridad es de **6 tipos de 8**: `FILESYSTEM`, `SFTP`, `S3`, `GCS`, `AZURE_BLOB` y `FTP` se pueden
> usar de entrada y de salida. Faltan `REST` y `OCI_OBJECT_STORAGE`, y su ausencia no es un olvido:
> la decide la fase A3 en un ADR propio (`REST` como destino no es el espejo de `REST` como fuente).
> Mientras tanto, elegir uno de esos dos como destino se **rechaza al publicar el proceso**, no al
> ejecutarlo. El estado del cruce completo, generado desde el codigo, esta en
> [el catalogo de tipos](../../docs/transversal/90.17-catalogo-de-tipos.md).

> **La fila de RF-011 declara un artefacto por columna, no la lista entera.** El requerimiento lo
> sostienen seis sinks, un validador de publicacion, un endpoint y un servicio de frontend; la
> columna `Codigo` nombra el registro que los resuelve a todos, que es el enlace atomico que
> `check:trace-drift` puede verificar. El detalle por tarea esta en
> [tdd-evidence.md](tdd-evidence.md).

## Gates

> **Ninguno aprobado todavia, y eso es lo correcto.** Los artefactos de fase 2 y 3 existen
> —prototipo navegable, documentos de producto, spec tecnica—, pero nadie los ha revisado ni
> aprobado. Declararlos `approved` porque estan escritos convertiria la aprobacion en un tramite.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-prototype-ready | pending | — | — | prototype-html5/index.html |
| gate-html5-product-quality | pending | — | — | prototype-validation.md |
| gate-prototype-human-visual-review | pending | — | — | prototype-html5/decisiones-ux.md |
| gate-spdd-approved | pending | — | — | product-design.md |
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-build-ready | pending | — | — | traceability.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | spec-tecnica.md |
| gate-operations-ready | pending | — | — | spec-tecnica.md |
