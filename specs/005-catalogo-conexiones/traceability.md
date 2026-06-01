# Traceability - Catalogo de conexiones

[README principal](../../README.md) | [Specs](../README.md)

> Feature de reingenieria (`origin: reingenieria`): el codigo y las pruebas ya existen y operan.
> La Fase 2 (UX/UI · prototipo · SPDD) NO aplica. Las columnas `UX/SPDD` y `Prototipo` van en
> `-`. La columna `Test` va en `-` donde no existe una clase de prueba dedicada (pendiente QA).

## Proposito
Matriz viva RF -> API -> BD -> Codigo -> Test de la feature, detalle del rollup global en
`TRACEABILITY_MATRIX.md`. La parsea `sync-memory` para poblar `ai_trace_links`/`ai_gate_runs`.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | POST /api/connection-definitions | connection_definition | ConnectionCatalogService | ConnectionCatalogServiceTest | Implementado | tdd-evidence.md |
| RF-002 | - | - | - | POST /api/connection-definitions/test | connection_definition | ConnectionDefinitionResource | ConnectionCatalogServiceTest | Implementado | tdd-evidence.md |
| RF-003 | - | - | - | POST /api/connection-definitions | connection_definition | ConnectionApiMapper | ConnectionApiMapperTest | Implementado | tdd-evidence.md |
| RF-004 | - | - | - | GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/tables | connection_definition | ConnectionMetadataService | - | Implementado | tdd-evidence.md |
| RF-005 | - | - | - | GET /api/connection-definitions/{connectionDefinitionId}/jdbc-metadata/procedures | connection_definition | ConnectionMetadataService | - | Implementado | tdd-evidence.md |

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |

## Decisiones
- Metadata JDBC introspeccionada en vivo (no persistida) via `ConnectionMetadataService`.
- Secretos de conexion referenciados con `${secret:...}` (ADR-002).

## Preguntas abiertas
- Confirmar mapeo RF local `RF-001..RF-005` ↔ requerimientos globales de Fase 1.
- Cobertura de pruebas dedicada de conexiones/metadata (hoy `Test = -`).
