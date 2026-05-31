# Despliegue on-prem detallado

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Fase 3 - Arquitectura](../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Objetivo

Detallar la estrategia on-prem para `DEV`, `PRE` y `PRO`, incluyendo topologia, segmentacion, sizing y controles operativos.

## Principios

- mismo stack logico en todos los ambientes
- separacion fisica o virtual por ambiente
- promocion controlada de configuracion y binarios
- `Keycloak` externo compartido o dedicado segun politica corporativa
- observabilidad centralizada

## Topologia base

Cada ambiente debe incluir como minimo:

- `Load Balancer` o reverse proxy interno
- `Integration Hub UI`
- `Integration Hub Quarkus App`
- `PostgreSQL`
- `Keycloak`
- `OpenTelemetry Collector`
- backend de trazas corporativo o equivalente
- acceso controlado a `FTP`, `SFTP`, `filesystem` y `REST APIs`

## DEV

- desarrollo funcional, pruebas de integracion y validacion tecnica de nuevos providers
- 1 host Docker para la aplicacion
- 1 base de datos no clusterizada
- `Keycloak` de laboratorio o compartido con realm aislado
- trazas y logs con retencion corta
- sizing sugerido:
  - `UI + App`: 4 vCPU, 8-12 GB RAM
  - `PostgreSQL`: 4 vCPU, 8 GB RAM
  - `Keycloak`: 2-4 vCPU, 4-8 GB RAM

## PRE

- validacion previa a produccion, regresion y smoke test de despliegue
- 1 nodo de aplicacion
- base de datos similar a produccion en configuracion
- certificados, DNS y reverse proxy reales
- integraciones contra endpoints de homologacion
- configuracion sensible externalizada
- sizing sugerido:
  - `UI + App`: 4-8 vCPU, 12-16 GB RAM
  - `PostgreSQL`: 8 vCPU, 16-32 GB RAM
  - `Keycloak`: 4 vCPU, 8 GB RAM

## PRO

- operacion de negocio, ejecucion programada y bajo demanda
- 2 nodos o mas de aplicacion detras de balanceador
- `Kubernetes` con `Ingress Controller`
- `PostgreSQL` con estrategia `HA` y backup corporativo
- `Keycloak` `HA` o servicio corporativo existente
- observabilidad integrada a plataforma central
- secretos fuera del codigo y fuera de archivos locales
- sizing sugerido:
  - `UI + App`: 2-4 nodos de 8 vCPU, 16-32 GB RAM
  - `PostgreSQL`: 16 vCPU, 32-64 GB RAM
  - `Keycloak`: 2-3 nodos de 4-8 vCPU, 8-16 GB RAM

## Segmentacion de red

- zona de acceso usuario
- zona de aplicaciones
- zona de datos
- zona de integracion saliente

Flujos principales:

1. Usuario interno -> `Load Balancer` -> UI/App
2. `Load Balancer` -> `Ingress Controller` -> UI/App
3. UI/App -> `Keycloak`
4. App -> `PostgreSQL`
5. App -> `FTP`, `SFTP`, `filesystem` y `REST APIs`
6. App -> `OTel Collector`

## Configuracion externa

Debe externalizarse por ambiente:

- datasource
- `OIDC` y `Keycloak`
- endpoints `REST`
- credenciales de fuentes
- parametros de scheduler
- exportadores de trazas

## Persistencia y backup

- backup full e incremental de `PostgreSQL`
- retencion de auditoria
- estrategia de restore probada
- export o respaldo de realm/configuracion de `Keycloak`

## Seguridad y observabilidad

- TLS interno segun politica
- secretos en mecanismo corporativo equivalente
- cuentas tecnicas separadas por ambiente
- metricas de nodos, ejecuciones, latencia, volumen y fallos
- correlacion por `processExecutionId`
