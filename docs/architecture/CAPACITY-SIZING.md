# CAPACITY Sizing

## Objetivo

Proveer una referencia inicial de capacidad para ambientes `DEV`, `PRE` y `PROD` de la plataforma `Integration Hub`.

## Supuestos base

- procesos orientados a ingestion batch
- archivos `txt`, `csv`, `xls`, `xlsx`, `json`, `xml`
- llamadas REST posteriores al procesamiento
- persistencia en PostgreSQL
- seguridad con Keycloak externo

## Variables que impactan capacidad

- volumen de archivos por hora
- tamano promedio por archivo
- numero de filas por archivo
- concurrencia de procesos
- numero de llamadas REST por registro
- tiempo promedio de respuesta de APIs externas

## DEV

## Perfil recomendado

- 1 host Docker
- 4 vCPU
- 8 GB RAM
- 50 GB disco

## Uso esperado

- desarrollo funcional
- pruebas locales
- validacion UI y API

## PRE

## Perfil recomendado

- 1 nodo aplicacion
- 4 a 8 vCPU
- 16 GB RAM
- 100 GB disco

## Uso esperado

- validacion integrada
- pruebas de aceptacion
- pruebas de scheduler
- validacion con fuentes reales controladas

## PROD

## Perfil recomendado

- 2 nodos de aplicacion Kubernetes
- 4 a 8 vCPU por nodo
- 16 a 32 GB RAM por nodo
- autoscaling opcional segun carga

## Base de datos

- PostgreSQL primary + replica
- almacenamiento SSD
- backups completos y diferenciales

## IAM

- 2 nodos Keycloak
- cache y sesiones dimensionadas para usuarios concurrentes

## Observabilidad

- OpenTelemetry Collector
- Jaeger con almacenamiento dimensionado segun retention definida

## Escenarios de referencia

## Carga baja

- hasta 10 procesos por hora
- hasta 50 MB por archivo
- llamadas REST por lote o por registro de baja frecuencia

## Carga media

- 10 a 50 procesos por hora
- 50 a 250 MB por archivo
- batch insert y upsert frecuentes

## Carga alta

- mas de 50 procesos por hora
- archivos grandes o multiples fuentes concurrentes
- alto volumen de llamadas REST y auditoria

## Recomendaciones

- usar tablas staging para alto volumen
- parametrizar `batchSize`
- medir scheduler y colas de ejecucion
- controlar timeouts y retries de APIs externas
- observar CPU, memoria, latencia DB y latencia REST

## Metricas minimas para tuning

- tiempo total de proceso
- tiempo por tarea
- filas procesadas por minuto
- errores por tarea
- uso de CPU y memoria
- latencia de PostgreSQL
- latencia de APIs externas
