# RISKS

## Objetivo

Registrar riesgos tecnicos y operativos principales del producto.

## Riesgos principales

## R-01 Complejidad del motor configurable

Impacto:

- alto

Descripcion:

- la flexibilidad de sources, readers y tasks aumenta el riesgo de configuraciones invalidas o ambiguas

Mitigacion:

- validaciones de catalogo en backend
- UX guiada en consola
- trazabilidad por ejecucion y tarea

## R-02 Compatibilidad native de librerias

Impacto:

- alto

Descripcion:

- librerias como Apache POI o clientes de integracion pueden requerir ajustes especificos en GraalVM

Mitigacion:

- pruebas nativas tempranas
- cobertura por tipo de reader/provider
- aislamiento de dependencias conflictivas

## R-03 Dependencia de integraciones externas

Impacto:

- alto

Descripcion:

- APIs REST, FTP o SFTP pueden presentar latencia, indisponibilidad o cambios de contrato

Mitigacion:

- timeouts claros
- reintentos controlados donde aplique
- auditoria y observabilidad por integracion

## R-04 Volumen de datos y persistencia

Impacto:

- medio-alto

Descripcion:

- cargas de archivos grandes pueden afectar tiempos de proceso, locks o consumo de recursos

Mitigacion:

- batch insert / batch update
- tablas staging
- monitoreo de tamano, tiempos y errores

## R-05 Configuracion de seguridad inconsistente por ambiente

Impacto:

- alto

Descripcion:

- diferencias entre `dev`, `pre` y `pro` pueden ocultar fallos de autenticacion, audiencia o roles

Mitigacion:

- realms y clientes versionados
- validacion en `PRE` lo mas cercana posible a `PRO`
- documentacion de clientes, roles y permisos

## R-06 Drift entre documentacion y codigo

Impacto:

- medio

Descripcion:

- la arquitectura puede desalinearse del producto real si no se actualizan vistas y documentos

Mitigacion:

- revision documental por release
- uso de LikeC4 como fuente viva
- ADRs para cambios importantes