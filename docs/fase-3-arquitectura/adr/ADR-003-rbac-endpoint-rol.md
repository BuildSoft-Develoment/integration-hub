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
(`viewer/editor/approver/admin`) que NO existen en el producto. Los roles reales son siete y no
todos viven en el mismo sitio: **cinco son de la plataforma**, centralizados en `PlatformRoles`
(modulo `platform-spi`), y **dos son del vertical SWIFT**, en `Mt101Roles` — la frontera de
ADR-021 tambien aplica a la seguridad: el four-eyes de conflictos de pago es dominio del vertical,
no del motor.

<!-- rbac-roles:start -->
### Roles de la plataforma (`PlatformRoles`)

- `platform-admin`: administracion total de la plataforma.
- `integration-admin`: define y opera integraciones (catalogo + procesos).
- `operator`: opera/ejecuta procesos y consulta ejecuciones; no edita catalogo.
- `payments-operator`: ejecuta y supervisa pipelines de pagos; no edita catalogos ni perfiles bancarios.
- `auditor`: solo lectura (catalogo permitido, procesos, ejecuciones, auditoria).

### Roles del vertical SWIFT (`Mt101Roles`)

- `pay-conflict-maker`: puede **solicitar** el acknowledge de un conflicto de pago.
- `pay-conflict-checker`: puede **aprobar** esa solicitud, y el backend rechaza que sea el mismo
  actor que el maker.
<!-- rbac-roles:end -->

> **Los dos del vertical son ADITIVOS, nunca autonomos.** No conceden ni una sola lectura: aparecen
> en exactamente un `@RolesAllowed` cada uno, y en cero endpoints de consulta. Un principal que solo
> tenga `pay-conflict-maker` recibe **403 al listar los conflictos** que se supone debe tramitar, con
> lo que la consola le queda inservible. Se conceden **junto a un rol operativo**, que es lo que
> aporta la lectura. La referencia de aprovisionamiento es el propio realm: los usuarios `pay-maker`
> y `pay-checker` de `keycloak/integration-hub-realm.json` llevan `payments-operator` ademas del rol
> de four-eyes.

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

### Conflictos de pago: four-eyes (vertical SWIFT)

Los tres endpoints que cierran un `PAY_CONFLICT`. Columnas adicionales: `MK` pay-conflict-maker,
`CK` pay-conflict-checker. Las consultas (`GET .../pay-conflicts`, `/open`, `/confirmations`,
`/settings`) quedan cubiertas por la fila `GET /api/query/mt101-fragments/*` de arriba, y **no
incluyen MK ni CK**: es deliberado, ver la nota sobre roles aditivos en el Contexto.

| Endpoint | PA | IA | OP | PO | AU | MK | CK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST /api/query/mt101-fragments/pay-conflicts/acknowledge | S | S | N | S | N | N | N |
| POST /api/query/mt101-fragments/pay-conflicts/request-acknowledge | N | N | N | N | N | S | N |
| POST /api/query/mt101-fragments/pay-conflicts/approve-acknowledge | N | N | N | N | N | N | S |

El acknowledge de un solo actor y el de dos pasos son caminos **excluyentes**, gobernados por
`mt101.pay.conflict.acknowledge.maker-checker.enabled`. Que `platform-admin` no aparezca en los dos
ultimos no es un olvido: si un administrador pudiera solicitar y aprobar, la segregacion de
funciones sobre el dinero no existiria.

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
- Operar correctivos MT101: PA, IA, OP y PO; las aprobaciones de rebuild-run y las acciones del spool quedan en PA/IA.
- Cerrar un conflicto de pago: con el four-eyes desactivado lo hacen PA, IA y PO en un paso; con el
  four-eyes activado (valor deseado en produccion) **solo** MK solicita y **solo** CK aprueba,
  incluidos los administradores.
- Administrar perfiles bancarios/reglas de validacion: solo PA e IA; AU puede leer/exportar.

## Consecuencias

- `03.08-auth-authz.md` referencia este ADR como fuente unica y conserva solo el resumen por capacidad.
- Cualquier cambio de `@RolesAllowed` o de `PlatformRoles` en el backend debe reflejarse aqui (y viceversa).
- El frontend (`auth-access.service.ts` y `app-section-access.policy.ts`) debe mantenerse consistente con esta matriz; el backend sigue siendo la autoridad real.
- Las capacidades UI de `auth-access.service.ts` (`admin`, `operate`, `audit-read`, `audit-operate`,
  `audit-admin`) son nombres **semanticos**, no roles: ninguna existe en el realm ni en un
  `@RolesAllowed`. Se derivan de los roles reales — `audit-admin` es exactamente
  `platform-admin || integration-admin`, que es justo lo que exigen `POST .../audit-spool/{id}/retry`
  y los `DELETE` del spool. Por eso viven **fuera** del bloque `rbac-roles` de arriba: ese bloque es
  la lista canonica que lee `ci/scripts/check-rbac-vs-code.mjs`, y meter ahi una capacidad haria que
  el gate la reclamara como rol ausente del codigo.
- Las acciones de UI que mutan estado deben ocultarse o deshabilitarse para roles de solo lectura, aunque el backend conserve la defensa final.
- Existe `ci/scripts/check-rbac-consistency.mjs` (CI-only) que puede engancharse para verificar coherencia codigo/documentacion.

## Referencias

- [Autenticacion y autorizacion](../03.08-auth-authz.md)
- [Matriz de huecos fase 1](../../fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md)
