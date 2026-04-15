# ROADMAP

## Objetivo

Definir una evolucion por fases para llevar `Integration Hub` desde la base actual de arquitectura y prototipo hacia una plataforma operable en ambientes on-prem.

## Principios

- entregar valor temprano
- estabilizar primero el nucleo del motor
- asegurar operacion antes de escalar alcance
- mantener alineacion entre codigo y arquitectura

## Fase 0 - Fundacion tecnica

## Objetivo

Cerrar la base tecnica de la plataforma y asegurar consistencia entre backend, frontend y arquitectura.

## Alcance

- consolidar estructura Quarkus + PostgreSQL + Keycloak
- estabilizar sources, readers y tasks base
- cerrar UI administrativa inicial
- validar compilacion native
- cerrar documentacion tecnica base

## Entregables

- backend funcional
- UI Angular 21 integrada con Angular Material, Angular CDK, Angular Aria, TailwindCSS v4 y Signals
- seguridad con Keycloak externo
- vistas LikeC4 y documentos base

## Fase 1 - MVP operativo

## Objetivo

Tener una version utilizable para flujos reales de ingestion y ejecucion manual.

## Alcance

- fuentes `filesystem`, `ftp`, `sftp`, `rest`
- readers `txt`, `csv`, `json`, `xml`, `xls`, `xlsx`
- tarea `DB_WRITE`
- tarea `REST_CALL`
- tarea `NOTIFICATION`
- auditoria y trazabilidad
- ejecucion manual desde consola

## Entregables

- configuracion de catalogos desde UI
- ejecucion de procesos manuales
- consulta de ejecuciones y auditoria
- staging y persistencia batch

## Fase 2 - Operacion controlada

## Objetivo

Preparar la plataforma para ambientes `PRE` y primera salida controlada a `PROD`.

## Alcance

- scheduler estable
- runbook operativo
- sizing inicial por ambiente
- validaciones de despliegue on-prem
- pruebas end-to-end con infraestructura real
- observabilidad y health checks consolidados

## Entregables

- procesos programados
- monitoreo y trazas operativas
- checklist de despliegue
- validacion de smoke tests por ambiente

## Fase 3 - Hardening productivo

## Objetivo

Asegurar robustez, seguridad y recuperacion para operacion continua.

## Alcance

- hardening de secretos y configuracion externa
- afinamiento de HA en `PROD`
- estrategia de backup y restore
- tuning de batch y performance
- controles de acceso por rol mas finos
- pruebas de failover y recuperacion

## Entregables

- despliegue productivo estable
- runbook de recuperacion
- tuning de performance
- lineamientos de soporte L1/L2/L3

## Fase 4 - Escalamiento funcional

## Objetivo

Expandir capacidades del producto sin comprometer estabilidad.

## Alcance

- nuevos readers y nuevas fuentes
- nuevas tareas enchufables
- decisiones y branching de procesos
- plantillas de integracion reutilizables
- mejoras UX para administracion de procesos

## Entregables

- catalogo ampliado de integraciones
- procesos mas configurables
- mejor experiencia operativa

## Fase 5 - Plataforma empresarial

## Objetivo

Convertir la solucion en una plataforma reusable a nivel organizacional.

## Alcance

- gobierno de configuraciones
- versionado de procesos
- trazabilidad ampliada
- reportes operativos y ejecutivos
- estandares de onboarding para nuevas integraciones

## Entregables

- modelo de gobierno
- onboarding repetible
- reporting y dashboards ampliados

## Hitos recomendados

- `H1`: MVP manual funcionando
- `H2`: scheduler y operacion en `PRE`
- `H3`: salida a `PROD` con HA
- `H4`: ampliacion de catalogo y reuso
- `H5`: estandarizacion empresarial

## Riesgos de roadmap

- crecimiento prematuro del alcance
- subestimacion de performance batch
- dependencia fuerte de APIs externas
- complejidad de operacion on-prem
- drift entre implementacion y documentacion

## Recomendacion

Ejecutar las fases `0`, `1` y `2` como prioridad.  
Tomar `3` como condicion de salida productiva estable.  
Mover `4` y `5` segun adopcion real del producto.
