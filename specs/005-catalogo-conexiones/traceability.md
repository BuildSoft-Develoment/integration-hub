# Traceability - Catalogo de conexiones

[README principal](../../README.md) | [Specs](../README.md)

> Feature de reingenieria (`origin: reingenieria`): el codigo y las pruebas ya existen y operan.
> La Fase 2 (UX/UI · prototipo · SPDD) NO aplica. Las columnas `UX/SPDD` y `Prototipo` van en
> `-`. La columna `Test` va en `-` donde no existe una clase de prueba dedicada (pendiente QA).

## Proposito
Matriz viva RF -> API -> BD -> Codigo -> Test de la feature, detalle del rollup global en
`TRACEABILITY_MATRIX.md`. La parsea `sync-memory` para poblar `ai_trace_links`/`ai_gate_runs`.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | POST /api/connection-definitions | connection_definition | ConnectionCatalogService | ConnectionCatalogServiceTest | Implementado | tdd-evidence.md | connection-editor + connection-jdbc-form + connection-mongodb-form | connection-catalog.store.spec.ts |
| RF-002 | - | - | - | POST /api/connection-definitions/test | connection_definition | ConnectionDefinitionResource | ConnectionCatalogServiceTest | Implementado | tdd-evidence.md | connection-toolbar, connection-list | connection-catalog-command.service.spec.ts |
| RF-003 | - | - | - | POST /api/connection-definitions | connection_definition | ConnectionApiMapper | ConnectionApiMapperTest | Implementado | tdd-evidence.md | connections/*.provider.ts (toConfigurationObject) | connection-editor-state.service.spec.ts |
| RF-004 | - | - | - | GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/tables | connection_definition | ConnectionMetadataService | - | Implementado | tdd-evidence.md | - (insumo DB_WRITE en Procesos 003) | - |
| RF-005 | - | - | - | GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/procedures | connection_definition | ConnectionMetadataService | - | Implementado | tdd-evidence.md | - (insumo DB_EXECUTE_SP/FN en Procesos 003) | - |

## Trazabilidad UI por motor (RF-001 / RF-003)

`configuration_json` es JSON dinamico por `type`; el contrato lo definen los providers
`frontend/libs/core/providers/.../connections/*-connection.provider.ts`
(`toConfigurationObject`/`hydrateDraft`). La UI por familia vive en `connection-type-form/`:

| Motor | Familia | Form (frontend) | Provider (contrato) |
|---|---|---|---|
| ORACLE / POSTGRESQL / SQLSERVER / MYSQL | jdbc | `connection-jdbc-form` | `Oracle/Postgresql/Sqlserver/MysqlConnectionProvider` |
| MONGODB | mongodb | `connection-mongodb-form` | `MongodbConnectionProvider` |

> Los forms por familia NO tienen `.spec.ts` dedicado (hueco conocido): se ejercitan via el editor
> y los stores. El contrato detallado (jdbc vs mongodb) esta en `spec-tecnica.md`.

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | approved | Natan Angel Davila Lopez (product owner) | 2026-08-04 | spec-tecnica.md |
| gate-build-ready | pending | — | — | traceability.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | ops/runbooks/005-catalogo-conexiones-runbook.md |
| gate-operations-ready | pending | — | — | ops/runbooks/005-catalogo-conexiones-runbook.md |

## Decisiones
- Metadata JDBC introspeccionada en vivo (no persistida) via `ConnectionMetadataService`.
- Secretos de conexion referenciados con `${secret:...}` (ADR-002).

## Preguntas abiertas
- Confirmar mapeo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
- Cobertura de pruebas dedicada de conexiones/metadata (hoy `Test = -`).
