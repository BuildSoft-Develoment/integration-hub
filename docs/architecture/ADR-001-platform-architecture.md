# ADR-001 Platform Architecture

## Estado

Aceptado

## Contexto

La plataforma debe permitir:

- configurar fuentes de entrada `filesystem`, `ftp`, `sftp` y `rest`
- leer formatos `txt`, `csv`, `xls`, `xlsx`, `json` y `xml`
- orquestar tareas configurables como `FILE_READ`, `DB_WRITE`, `REST_CALL` y `NOTIFICATION`
- asegurar acceso con `Keycloak` externo
- persistir configuracion, ejecuciones y auditoria en `PostgreSQL`
- compilar la aplicacion principal con `Quarkus Native`
- operar una consola administrativa web con `React + PatternFly`

## Decision

Se adopta una arquitectura basada en:

- `Quarkus` como backend principal
- `React + PatternFly` como consola administrativa
- `Quinoa` para integrar el frontend al ecosistema Quarkus
- `Keycloak` externo para autenticacion y autorizacion OIDC
- `PostgreSQL` para catalogo, ejecuciones, auditoria y staging
- `OpenTelemetry` para trazabilidad distribuida
- un motor interno extensible basado en registries y providers

La ejecucion del flujo se modela alrededor de tres ejes:

1. `Source Providers`
   Resuelven como obtener el contenido.
2. `Reader Providers`
   Resuelven como interpretar el contenido.
3. `Task Providers`
   Resuelven que hacer con los datos leidos.

## Razonamiento

Este enfoque permite:

- separar adquisicion, parsing y procesamiento
- soportar multiples combinaciones fuente/formato/tarea sin acoplar flujos
- mantener compatibilidad con compilacion nativa
- evitar carga dinamica de jars en runtime, lo cual complica GraalVM
- acercar el patron de extensibilidad al modelo de providers usado por Keycloak

## Consecuencias

### Positivas

- arquitectura modular y extensible
- modelo consistente para nuevas fuentes, readers y tareas
- mayor trazabilidad operativa con auditoria y spans
- alineacion con el ecosistema Quarkus
- UI enterprise consistente con PatternFly

### Negativas

- agregar un nuevo tipo de provider requiere recompilar la distribucion
- algunas librerias como Apache POI requieren cuidado adicional en native
- la orquestacion configurable incrementa complejidad de validacion y UX

## Implementacion actual

- `Admin Console` en React + PatternFly servida por Quinoa
- `Admin API`, `Execution API`, `Query API` y `Scheduler` en Quarkus
- `Process Engine` con `SourceProviderRegistry`, `ReaderProviderRegistry` y `TaskProviderRegistry`
- providers concretos para `filesystem`, `ftp`, `sftp`, `rest`
- readers para `txt`, `csv`, `xls`, `xlsx`, `json`, `xml`
- tareas para `DB_WRITE`, `REST_CALL` y `NOTIFICATION`
- auditoria persistida y consultas operativas
- integracion OIDC con `Keycloak`

## Diagramas relacionados

- [integration-hub.likec4](C:/chatgtp/quarkus/docs/architecture/integration-hub.likec4)
- [LikeC4 dist](C:/chatgtp/quarkus/docs/architecture/dist/index.html)
## Decision adicional sobre conectividad de destino

Para la tarea `DB_WRITE` se adopta el siguiente criterio:

- `Hibernate ORM` se mantiene solo para la base interna de plataforma
- `JDBC` plano se usa para escritura hacia bases externas dinamicas
- `Agroal` se usa de forma programatica para pool de conexiones relacionales externas
- `Oracle`, `PostgreSQL`, `SQL Server` y `MySQL` se tratan como destinos JDBC
- `MongoDB` se trata como un destino no relacional separado y no usa `Agroal`

### Razonamiento

Este enfoque permite:

- evitar la sobrecarga de ORM sobre conexiones externas
- soportar conexiones creadas dinamicamente por usuario
- reutilizar pools por `connectionRef`
- mantener operaciones de `insert`, `update`, `batch-update` y `upsert` con control fino por motor
- separar claramente persistencia interna de plataforma y conectividad de integracion