# Traceability - Catalogo de fuentes

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

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | POST /api/source-definitions | source_definition | SourceCatalogService | SourceCatalogServiceTest | Implementado | tdd-evidence.md |
| RF-002 | - | - | - | POST /api/source-definitions/{sourceDefinitionId}/activation/{active} | source_definition | SourceDefinitionResource | SourceCatalogServiceTest | Implementado | tdd-evidence.md |
| RF-003 | - | - | - | POST /api/source-definitions | source_definition | JsonConfigurationMapper | JsonConfigurationMapperTest | Implementado | tdd-evidence.md |
| RF-004 | - | - | - | POST /api/source-definitions | source_definition | FileVaultSecretValueProvider | FileVaultSecretValueProviderTest | Implementado | tdd-evidence.md |
| RF-005 | - | - | - | POST /api/source-definitions/test | source_definition | FilesystemSourceProvider | FilesystemSourceProviderTest | Implementado | tdd-evidence.md |

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |

## Decisiones
- Secretos referenciados con el contrato `${secret:...}`, nunca persistidos en claro (ADR-002).
- Patron providers + registries para fuentes (ADR-001).

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales del
  documento de analisis de Fase 1.
