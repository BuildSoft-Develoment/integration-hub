# Traceability - Catalogo de readers

[README principal](../../README.md) | [Specs](../README.md)

> Feature de reingenieria (`origin: reingenieria`): el codigo y las pruebas ya existen y
> operan en produccion. La Fase 2 (UX/UI · prototipo · SPDD) NO aplica (ver
> `CONSTITUTION.md`, Principio 4 — excepcion). Las columnas `UX/SPDD` y `Prototipo` van en
> `-` por esa razon. El resto de la trazabilidad RF→API→BD→Codigo→Test es real.

## Proposito
Matriz viva que conecta cada requerimiento con su API, datos, codigo, prueba, estado y
evidencia. Es la fuente que `node scripts/ai-framework-agent.mjs sync-memory` parsea para
poblar `ai_trace_links`, `ai_gate_runs` y `ai_evidence_items`. Es el detalle por feature
del rollup global en `TRACEABILITY_MATRIX.md`.

## Flujo (reingenieria)
```text
Codigo existente -> SDD (spec-tecnica) -> Trazabilidad -> QA (evidencia GREEN real)
```

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | POST /api/reader-definitions | reader_definition | ReaderDefinitionResource | CsvReaderProviderTest | Implementado | tdd-evidence.md | reader-editor + reader-type-form/* | reader-catalog.store.spec.ts |
| RF-002 | - | - | - | POST /api/reader-definitions | reader_definition | ReaderCatalogService | ReaderFieldSupportTest | Implementado | tdd-evidence.md | reader-field-definitions-editor + reader-{csv,txt,excel,json,xml}-form | reader-editor-state.service.spec.ts |
| RF-003 | - | - | - | POST /api/reader-definitions | reader_definition | TxtReaderProvider | TxtReaderProviderTest | Implementado | tdd-evidence.md | reader.providers.ts (toConfigurationObject) | reader-catalog-command.service.spec.ts |
| RF-004 | - | - | - | POST /api/reader-definitions/{readerDefinitionId}/activation/{active} | reader_definition | XlsxReaderProvider | ExcelReaderProviderTest | Implementado | tdd-evidence.md | reader-toolbar, reader-list | reader-catalog-query.store.spec.ts |
| RF-005 | - | - | - | GET /api/reader-definitions | reader_definition | ReaderDefinitionResource | CsvReaderProviderTest | Implementado | tdd-evidence.md | - (insumo Process Designer) | - |

## Trazabilidad UI por formato (RF-001 / RF-002 / RF-003)

`configuration_json` es JSON dinamico por `type` (`TXT`,`CSV`,`XLS`,`XLSX`,`JSON`,`XML`); el
contrato lo definen los providers `reader.providers.ts` (`toConfigurationObject`/`hydrateDraft`).
La UI por formato vive en `reader-type-form/`:

| Formato | Form (frontend) | Provider (contrato) |
|---|---|---|
| TXT | `reader-txt-form` | `TxtReaderProvider` |
| CSV | `reader-csv-form` | `CsvReaderProvider` |
| XLS / XLSX | `reader-excel-form` | `Xls/XlsxReaderProvider` |
| JSON | `reader-json-form` | `JsonReaderProvider` |
| XML | `reader-xml-form` | `XmlReaderProvider` |

> Los forms por formato NO tienen `.spec.ts` dedicado (hueco conocido): se ejercitan indirecto
> via `reader-editor`/stores. El detalle del contrato esta en `spec-tecnica.md`.

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | approved | Natan Angel Davila Lopez (product owner) | 2026-08-04 | spec-tecnica.md |
| gate-build-ready | pending | — | — | traceability.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | ops/runbooks/002-catalogo-readers-runbook.md |
| gate-operations-ready | pending | — | — | ops/runbooks/002-catalogo-readers-runbook.md |

## Decisiones
- Cada formato de reader (CSV/TXT/XLSX) se implementa como provider en el registry (ADR-001).

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
