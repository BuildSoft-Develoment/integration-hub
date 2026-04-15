# Deployment On-Prem

## Objetivo

Definir el despliegue de la plataforma en ambientes `dev`, `pre` y `pro`, todos dentro de infraestructura on-premise.

## Principios

- mismo stack logico en todos los ambientes
- separacion fisica o virtual por ambiente
- promocion controlada de configuracion y binarios
- Keycloak externo compartido o dedicado segun politica corporativa
- observabilidad centralizada

## Topologia base

Cada ambiente debe incluir como minimo:

- `Load Balancer` o reverse proxy interno
- `Integration Hub UI`
- `Integration Hub Quarkus App`
- `PostgreSQL`
- `Keycloak`
- `OpenTelemetry Collector`
- `Jaeger` o backend corporativo de trazas
- acceso controlado a `FTP`, `SFTP`, `filesystem` y `REST APIs`

## Ambientes

## DEV

Proposito:

- desarrollo funcional
- pruebas de integracion
- validacion tecnica de nuevos providers

Caracteristicas:

- 1 host Docker para la aplicacion
- 1 base de datos no clusterizada
- Keycloak de laboratorio o compartido con realm aislado
- trazas y logs con retencion corta
- datos sinteticos o anonimizados

Sizing inicial sugerido:

- `UI + App`: 4 vCPU, 8-12 GB RAM
- `PostgreSQL`: 4 vCPU, 8 GB RAM
- `Keycloak`: 2-4 vCPU, 4-8 GB RAM

## PRE

Proposito:

- validacion previa a produccion
- pruebas de regresion
- pruebas de volumen controlado
- smoke test de despliegue

Caracteristicas:

- 1 nodo de aplicacion
- base de datos similar a produccion en configuracion
- Keycloak cercano al setup productivo
- certificados, DNS y reverse proxy reales
- integraciones contra endpoints de homologacion
- `Kubernetes Secrets / External Config` para configuracion sensible y no sensible

Sizing inicial sugerido:

- `UI + App`: 1 nodo de 4-8 vCPU, 12-16 GB RAM
- `PostgreSQL`: 8 vCPU, 16-32 GB RAM
- `Keycloak`: 1-2 nodos de 4 vCPU, 8 GB RAM

## PRO

Proposito:

- operacion de negocio
- ejecucion programada y bajo demanda
- integracion con sistemas corporativos

Caracteristicas:

- 2 nodos o mas de aplicacion detras de balanceador
- `Ingress Controller` dentro del cluster Kubernetes productivo
- PostgreSQL con estrategia HA y backup corporativo
- Keycloak HA o servicio corporativo existente
- observabilidad integrada a plataforma central
- hardening de SO, red y certificados
- secretos fuera del codigo y fuera de archivos locales
- `Kubernetes Secrets / External Config` como fuente de configuracion operativa

Sizing inicial sugerido:

- `UI + App`: 2-4 nodos de 8 vCPU, 16-32 GB RAM
- `PostgreSQL`: 16 vCPU, 32-64 GB RAM
- `Keycloak`: 2-3 nodos de 4-8 vCPU, 8-16 GB RAM

## Segmentacion de red

Se recomienda separar al menos:

- zona de acceso usuario
- zona de aplicaciones
- zona de datos
- zona de integracion saliente

Flujos principales:

1. Usuario interno -> Load Balancer -> UI/App
2. Load Balancer -> Ingress Controller -> UI/App
3. UI/App -> Keycloak
4. App -> PostgreSQL
5. App -> FTP/SFTP/filesystem/API externas
6. App -> OTel Collector
7. OTel Collector -> Jaeger

## Produccion detallada

Topologia recomendada:

- zona `edge`
  - `Load Balancer`
- zona `app`
  - `Kubernetes Cluster`
  - `Ingress Controller`
  - `Integration Hub Service`
  - `appPod1`
  - `appPod2`
- zona `data`
  - `PostgreSQL HA`
  - `Keycloak HA`
  - `Observability node`
- zona `services`
  - `Kubernetes Secrets / External Config`
  - `Shared Storage`

Separacion logica:

- `stateless`
  - `Admin Console`
  - `Quarkus Native App`
  - `Ingress Controller`
- `stateful`
  - `PostgreSQL`
  - `Keycloak`
  - almacenamiento compartido y secretos

Alta disponibilidad:

- `Admin Console` y `Quarkus App` corren en al menos 2 nodos Kubernetes
- `PostgreSQL` debe operar con primario y replica
- `Keycloak` debe operar con 2 nodos o integrarse al servicio IAM corporativo HA
- el `Load Balancer` distribuye trafico hacia el `Ingress Controller`

## Estrategia de despliegue

## Binarios

- `Quarkus App` compilada como `native` para cada release
- `UI` empaquetada via Quinoa dentro del artefacto de Quarkus

## Promocion

1. build en CI
2. pruebas unitarias e integracion
3. despliegue en `dev`
4. validacion funcional
5. promocion a `pre`
6. smoke/regresion
7. promocion a `pro`

## Configuracion externa

La configuracion debe externalizarse por ambiente:

- datasource
- OIDC / Keycloak
- endpoints REST
- credenciales de fuentes
- parametros de scheduler
- exportador de trazas

## Persistencia y backup

Debe cubrirse:

- backup full e incremental de PostgreSQL
- retencion de auditoria
- estrategia de restore probada
- export o respaldo de realm/configuracion de Keycloak

## Seguridad

- TLS interno cuando la politica lo requiera
- secretos en `Kubernetes Secrets / External Config` o mecanismo corporativo equivalente
- cuentas tecnicas separadas por ambiente
- roles de administracion, operacion y auditoria
- acceso minimo necesario a shares, FTP, SFTP y APIs

## Observabilidad

Metricas minimas:

- estado de nodos
- ejecuciones por estado
- latencia de tareas REST
- volumen de registros procesados
- fallos por proceso y por provider
- scheduler y ultima ejecucion por proceso

Logs y trazas:

- correlacion por `processExecutionId`
- spans por proceso y por tarea
- eventos de auditoria persistidos

## Operacion

Runbook minimo:

- reinicio controlado de la app
- validacion de conectividad a fuentes
- validacion de Keycloak y PostgreSQL
- revision de scheduler, trazas y auditoria
- procedimiento de rollback