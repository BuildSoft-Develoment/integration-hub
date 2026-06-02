# ADR-003 RBAC endpoint x rol

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR](README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Aceptado

## Contexto

La matriz de permisos de `03.08-auth-authz.md` describia roles genericos
(`viewer/editor/approver/admin`) que NO existen en el producto. Los roles reales,
declarados con `@RolesAllowed` en los `*Resource` de `platform-app` y consumidos por
`auth-access.service.ts` en el frontend, son cuatro:

- `platform-admin` — administracion total de la plataforma.
- `integration-admin` — define y opera integraciones (catalogo + procesos).
- `operator` — opera/ejecuta procesos y consulta ejecuciones; no edita el catalogo.
- `auditor` — solo lectura (catalogo, procesos, ejecuciones, auditoria).

Se necesita una **fuente unica endpoint x rol**, derivada del codigo, para evitar drift
entre backend, frontend y documentacion.

## Decision

Se adopta la siguiente matriz canonica endpoint x rol (estado real del backend). Leyenda:
`PA` platform-admin · `IA` integration-admin · `OP` operator · `AU` auditor · ✓ permitido · – denegado.

### Catalogo de fuentes / readers / conexiones
| Endpoint | PA | IA | OP | AU |
| --- | --- | --- | --- | --- |
| GET /api/source-definitions · /api/reader-definitions · /api/connection-definitions | ✓ | ✓ | – | ✓ |
| POST · PUT · POST .../activation/{active} · POST .../test (fuentes/readers/conexiones) | ✓ | ✓ | – | – |
| GET /api/connection-definitions/{id}/jdbc-metadata/* (schemas, tables, columns, procedures, procedure-parameters, functions, function-parameters) | ✓ | ✓ | – | ✓ |

### Procesos
| Endpoint | PA | IA | OP | AU |
| --- | --- | --- | --- | --- |
| GET /api/process-definitions | ✓ | ✓ | ✓ | ✓ |
| POST · PUT /{id} · POST /{id}/activation/{active} | ✓ | ✓ | – | – |
| POST /api/process-executions/{processDefinitionId} (ejecutar) | ✓ | ✓ | ✓ | – |

### Programacion
| Endpoint | PA | IA | OP | AU |
| --- | --- | --- | --- | --- |
| GET /api/process-schedules | ✓ | ✓ | ✓ | ✓ |

### Consultas (query) y observabilidad
| Endpoint | PA | IA | OP | AU |
| --- | --- | --- | --- | --- |
| GET /api/query/source-definitions · /reader-definitions · /connection-definitions | ✓ | ✓ | – | ✓ |
| GET /api/query/process-definitions · /process-schedules | ✓ | ✓ | ✓ | ✓ |
| GET /api/query/overview-summary · /process-executions[/{id}|/children|/tasks] · /audit-events | ✓ | ✓ | ✓ | ✓ |

Reglas derivadas:
- **Lectura del catalogo**: PA, IA, AU (no OP).
- **Escritura del catalogo** (crear/editar/activar/test): solo PA, IA.
- **Definir procesos** (crear/editar/activar): solo PA, IA.
- **Ejecutar procesos**: PA, IA, OP (no AU).
- **Ejecuciones / auditoria / overview**: PA, IA, OP, AU (lectura).

## Consecuencias

- `03.08-auth-authz.md` referencia este ADR como fuente unica y conserva solo el resumen
  por capacidad.
- Cualquier cambio de `@RolesAllowed` en el backend debe reflejarse aqui (y viceversa).
- El frontend (`auth-access.service.ts`) debe mantenerse consistente con esta matriz; el
  backend es la autoridad real (defensa en profundidad).
- Existe `ci/scripts/check-rbac-consistency.mjs` (CI-only) que puede engancharse para
  verificar la coherencia codigo <-> esta matriz.

## Referencias
- [Autenticacion y autorizacion](../03.08-auth-authz.md)
- [Matriz de huecos fase 1](../../fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md)
