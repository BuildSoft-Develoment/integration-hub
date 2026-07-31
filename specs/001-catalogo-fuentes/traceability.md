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

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | HU-01 | - | - | POST /api/source-definitions | source_definition | SourceCatalogService | SourceCatalogServiceTest | Implementado | tdd-evidence.md | source-editor.component + source-type-form/* | source-editor.readonly.spec.ts |
| RF-002 | HU-01 | - | - | POST /api/source-definitions/{sourceDefinitionId}/activation/{active} | source_definition | SourceDefinitionResource | SourceCatalogServiceTest | Implementado | tdd-evidence.md | source-toolbar.component, source-list.component | source-catalog-command.service.spec.ts |
| RF-003 | HU-01 | - | - | POST /api/source-definitions | source_definition | JsonConfigurationMapper | JsonConfigurationMapperTest | Implementado | tdd-evidence.md | source-type-form/source-{filesystem,ftp,sftp,rest}-form | - (sin spec dedicada por tipo) |
| RF-004 | HU-01 | - | - | POST /api/source-definitions | source_definition | FileVaultSecretValueProvider | FileVaultSecretValueProviderTest | Implementado | tdd-evidence.md | source-type-form (campos `${secret:...}`) | - |
| RF-005 | HU-01 | - | - | POST /api/source-definitions/test | source_definition | FilesystemSourceProvider | FilesystemSourceProviderTest | Implementado | tdd-evidence.md | - (insumo backend de FILE_READ) | - |
| RF-006 | HU-01 | - | - | POST /api/source-definitions | source_definition (`s3`/`gcs`/`azure-blob`) | S3SourceProvider | - | front+back (JVM); native/QA/gate pendiente | spec-tecnica.md (cloud) | source-{s3,gcs,azure-blob}-form (hecho) | - |
| RF-007 | HU-01 | - | - | POST /api/source-definitions | source_definition | FileVaultSecretValueProvider | - | front+back (JVM); native/QA/gate pendiente | spec-tecnica.md (cloud) | source-{s3,gcs,azure-blob}-form (auth) | - |
| RF-008 | HU-01 | - | - | POST /api/source-definitions/test | source_definition | SourcePayload | - | hecho (streaming); native/QA pendiente | spec-tecnica.md (cloud) | - (insumo backend de FILE_READ) | - |

## Trazabilidad UI por tipo de fuente (RF-001 / RF-003)

Cada tipo soportado tiene su componente Angular de configuracion (anotado con `@trace RF-001 RF-003` en el codigo, recogido por `sync-memory`):

| Tipo | Componente Angular | Spec |
|---|---|---|
| `filesystem` | `frontend/libs/features/sources/.../source-type-form/source-filesystem-form` | - (indirecto via `source-editor.readonly.spec.ts`) |
| `ftp` | `.../source-type-form/source-ftp-form` | - |
| `sftp` | `.../source-type-form/source-sftp-form` | - |
| `rest` | `.../source-type-form/source-rest-form` | - |

> Hueco de cobertura conocido: los forms por tipo no tienen `.spec.ts` dedicado (se ejercitan
> indirectamente via `source-editor`/stores). Candidato a anadir specs por tipo (plan de tests frontend).

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-build-ready | pending | — | — | traceability.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | ops/runbooks/001-catalogo-fuentes-runbook.md |
| gate-operations-ready | pending | — | — | ops/runbooks/001-catalogo-fuentes-runbook.md |

## Decisiones
- Secretos referenciados con el contrato `${secret:...}`, nunca persistidos en claro (ADR-002).
- Patron providers + registries para fuentes (ADR-001).
- Fuentes de almacenamiento cloud `s3`/`gcs`/`azure-blob` (object stores) con credenciales nativas
  o `${secret:...}`, descarga por streaming y transporte HTTP lean-native (RF-006..RF-008, WIP); ver
  [ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-fuentes-almacenamiento-cloud.md).

## Preguntas abiertas
- Confirmar mapeo definitivo RF local `RF-001..RF-005` ↔ requerimientos globales del
  documento de analisis de Fase 1.
