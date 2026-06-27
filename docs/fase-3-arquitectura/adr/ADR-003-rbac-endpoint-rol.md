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
centralizados en `PlatformRoles`, declarados con `@RolesAllowed` en los `*Resource`
de `platform-app` y consumidos por `auth-access.service.ts` en el frontend, son cinco:

- `platform-admin`: administracion total de la plataforma.
- `integration-admin`: define y opera integraciones (catalogo + procesos).
- `operator`: opera/ejecuta procesos y consulta ejecuciones; no edita catalogo.
- `payments-operator`: ejecuta y supervisa pipelines de pagos; no edita catalogos ni perfiles bancarios.
- `auditor`: solo lectura (catalogo permitido, procesos, ejecuciones, auditoria).

Se necesita una fuente unica endpoint x rol, derivada del codigo, para evitar drift
entre backend, frontend y documentacion.

## Decision

Se adopta la siguiente matriz canonica endpoint x rol. Leyenda:
`PA` platform-admin, `IA` integration-admin, `OP` operator, `PO` payments-operator,
`AU` auditor, `S` permitido, `N` denegado.

### Catalogo de fuentes / readers / conexiones

| Endpoint | PA | IA | OP | PO | AU |
| --- | --- | --- | --- | --- | --- |
| GET /api/source-definitions, /api/reader-definitions, /api/connection-definitions | S | S | N | N | S |
| POST, PUT, POST .../activation/{active}, POST .../test | S | S | N | N | N |
| GET /api/connection-definitions/{id}/jdbc-metadata/* | S | S | N | N | S |

### Procesos

| Endpoint | PA | IA | OP | PO | AU |
| --- | --- | --- | --- | --- | --- |
| GET /api/process-definitions | S | S | S | S | S |
| POST, PUT /{id}, POST /{id}/activation/{active} | S | S | N | N | N |
| POST /api/process-executions/{processDefinitionId} | S | S | S | S | N |
| POST /api/process-executions/resume/{token} | S | S | S | S | N |

### Programacion

| Endpoint | PA | IA | OP | PO | AU |
| --- | --- | --- | --- | --- | --- |
| GET /api/process-schedules | S | S | S | S | S |

### Consultas y observabilidad

| Endpoint | PA | IA | OP | PO | AU |
| --- | --- | --- | --- | --- | --- |
| GET /api/query/source-definitions, /reader-definitions, /connection-definitions | S | S | N | N | S |
| GET /api/query/process-definitions, /process-schedules | S | S | S | S | S |
| GET /api/query/overview-summary, /process-executions[/{id}|/children|/tasks], /audit-events | S | S | S | S | S |
| GET /api/query/record-lineage | S | S | S | S | S |
| GET /api/query/audit-spool/summary, /dead | S | S | S | S | S |
| POST /api/query/audit-spool/{id}/retry, DELETE /api/query/audit-spool/* | S | S | N | N | N |

### Operacion MT101 y cuarentena

| Endpoint | PA | IA | OP | PO | AU |
| --- | --- | --- | --- | --- | --- |
| GET /api/query/mt101-fragments/* | S | S | S | S | S |
| POST /api/query/mt101-fragments/reprocess/* | S | S | S | S | N |
| GET /api/query/mt101-quarantine, /lote, /staging-row, /rebuild-runs, /rebuild-runs/detail | S | S | S | S | S |
| PATCH /api/query/mt101-quarantine/staging-row | S | S | S | S | N |
| POST /api/query/mt101-quarantine/build, /rebuild-runs/request, /rebuild-runs/execute, /rebuild-runs/advance-corrective, /rebuild-runs/request-pay, /rebuild-runs/resolve-uncertain-pay | S | S | S | S | N |
| POST /api/query/mt101-quarantine/rebuild-runs/approve, /rebuild-runs/approve-pay | S | S | N | N | N |
| GET /api/query/mt101-quarantine/rebuild-runs/pay-actions | S | S | S | S | N |

### Reglas de validacion de pagos

| Endpoint | PA | IA | OP | PO | AU |
| --- | --- | --- | --- | --- | --- |
| GET /api/payment-validation-rules, /export | S | S | N | N | S |
| POST /api/payment-validation-rules, /import, /{id}/activation/{active}; PUT /{id} | S | S | N | N | N |

Reglas derivadas:

- Lectura de catalogo tecnico: PA, IA, AU. OP y PO no leen fuentes/readers/conexiones.
- Escritura de catalogo tecnico: solo PA e IA.
- Definir procesos: solo PA e IA.
- Ejecutar procesos: PA, IA, OP y PO. AU no ejecuta.
- Supervisar ejecuciones/auditoria/overview: PA, IA, OP, PO y AU.
- Operar correctivos MT101: PA, IA, OP y PO; aprobaciones maker-checker y acciones del spool quedan en PA/IA.
- Administrar perfiles bancarios/reglas de validacion: solo PA e IA; AU puede leer/exportar.

## Consecuencias

- `03.08-auth-authz.md` referencia este ADR como fuente unica y conserva solo el resumen por capacidad.
- Cualquier cambio de `@RolesAllowed` o de `PlatformRoles` en el backend debe reflejarse aqui (y viceversa).
- El frontend (`auth-access.service.ts` y `app-section-access.policy.ts`) debe mantenerse consistente con esta matriz; el backend sigue siendo la autoridad real.
- Las capacidades UI son semanticas, no roles nuevos: `admin`, `operate`, `audit-read`, `audit-operate` y `audit-admin` mapean a los cinco roles reales definidos arriba.
- Las acciones de UI que mutan estado deben ocultarse o deshabilitarse para roles de solo lectura, aunque el backend conserve la defensa final.
- Existe `ci/scripts/check-rbac-consistency.mjs` (CI-only) que puede engancharse para verificar coherencia codigo/documentacion.

## Referencias

- [Autenticacion y autorizacion](../03.08-auth-authz.md)
- [Matriz de huecos fase 1](../../fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md)
