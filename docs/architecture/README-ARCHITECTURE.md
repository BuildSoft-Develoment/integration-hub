# README Architecture

## Objetivo

Centralizar la navegacion de la documentacion tecnica y funcional de la plataforma `Integration Hub`.

## Indice principal

## 1. Modelo arquitectonico

- [Modelo LikeC4](C:/chatgtp/quarkus/docs/architecture/integration-hub.likec4)
- [Visor generado LikeC4](C:/chatgtp/quarkus/docs/architecture/dist/index.html)
- [Configuracion LikeC4](C:/chatgtp/quarkus/docs/architecture/likec4.config.mjs)

## 2. Decisiones de arquitectura

- [ADR-001 Platform Architecture](C:/chatgtp/quarkus/docs/architecture/ADR-001-platform-architecture.md)

## 3. Despliegue

- [Deployment On-Prem](C:/chatgtp/quarkus/docs/architecture/DEPLOYMENT-ONPREM.md)

Cubre:
- `DEV` sobre Docker
- `PRE` de un solo nodo
- `PRO` en Kubernetes con HA de 2 nodos
- seguridad, observabilidad, backup y operacion

## 4. Casos de uso

- [Use Cases](C:/chatgtp/quarkus/docs/architecture/USE-CASES.md)

Cubre:
- configuracion de fuentes
- configuracion de readers
- diseno de procesos
- ejecucion manual
- ejecucion programada
- administracion de acceso

## 5. Requisitos no funcionales

- [NFRs](C:/chatgtp/quarkus/docs/architecture/NFRs.md)

Cubre:
- disponibilidad
- rendimiento
- escalabilidad
- seguridad
- observabilidad
- operabilidad
- mantenibilidad

## 6. Riesgos

- [RISKS](C:/chatgtp/quarkus/docs/architecture/RISKS.md)

Cubre:
- complejidad del motor configurable
- compatibilidad native
- dependencia de integraciones externas
- volumen de datos
- consistencia de seguridad por ambiente
- drift entre codigo y documentacion

## 7. Trazabilidad

- [TRACEABILITY](C:/chatgtp/quarkus/docs/architecture/TRACEABILITY.md)

Relaciona:
- casos de uso
- frontend
- APIs backend
- servicios principales
- persistencia

## 8. Operacion y capacidad

- [RUNBOOK Operations](C:/chatgtp/quarkus/docs/architecture/RUNBOOK-OPERATIONS.md)
- [CAPACITY Sizing](C:/chatgtp/quarkus/docs/architecture/CAPACITY-SIZING.md)
- [ROADMAP](C:/chatgtp/quarkus/docs/architecture/ROADMAP.md)

Cubre:
- arranque y verificaciones operativas
- recuperacion basica
- health checks
- sizing inicial por ambiente

## 9. Vistas arquitectonicas disponibles

## Nivel 1

- `Context / Usuario y ecosistema externo`

## Nivel 2

- `Containers / Zoom a la plataforma`

## Nivel 3

- `Components / Zoom a Admin Console App (Front)`
- `Components / Zoom a App Service Quarkus Native`

## Nivel 4

- `Code / Zoom a Process Engine`
- `Code / Domain Entities`

## Otras vistas

- `Security / OIDC, roles y control de acceso`
- `Deployment / DEV`
- `Deployment / PRE`
- `Deployment / PROD`
- `Use Cases / UC-01`
- `Use Cases / UC-02`
- `Use Cases / UC-03`
- `Use Cases / UC-04`
- `Use Cases / UC-05`
- `Use Cases / UC-09`

## Recomendacion de lectura

1. Revisar [ADR-001 Platform Architecture](C:/chatgtp/quarkus/docs/architecture/ADR-001-platform-architecture.md)
2. Navegar las vistas en [Visor generado LikeC4](C:/chatgtp/quarkus/docs/architecture/dist/index.html)
3. Validar despliegue en [Deployment On-Prem](C:/chatgtp/quarkus/docs/architecture/DEPLOYMENT-ONPREM.md)
4. Revisar negocio en [Use Cases](C:/chatgtp/quarkus/docs/architecture/USE-CASES.md)
5. Revisar [RUNBOOK Operations](C:/chatgtp/quarkus/docs/architecture/RUNBOOK-OPERATIONS.md) y [CAPACITY Sizing](C:/chatgtp/quarkus/docs/architecture/CAPACITY-SIZING.md)
6. Cerrar con [NFRs](C:/chatgtp/quarkus/docs/architecture/NFRs.md), [RISKS](C:/chatgtp/quarkus/docs/architecture/RISKS.md) y [TRACEABILITY](C:/chatgtp/quarkus/docs/architecture/TRACEABILITY.md)

## Estado actual

La documentacion ya cubre una base consistente para:
- entendimiento de arquitectura
- revision tecnica
- despliegue on-prem
- operacion funcional
- seguridad
- evolucion del producto
