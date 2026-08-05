# Integration Hub

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: Inicio del repositorio
- Siguiente: [Indice de documentacion](docs/README.md)
<!-- nav-guided:end -->

Plataforma de integracion configurable sobre `Quarkus`, `Angular/Nx`, `Keycloak`, `PostgreSQL` y `OpenTelemetry`, documentada por fases y alineada a la estructura ejecutable real del proyecto.

Baseline documental activo: `v0.4.0`.

## Contenido

- [Primera lectura en 10 minutos](#primera-lectura-en-10-minutos)
- [Que resuelve](#que-resuelve)
- [Para quien sirve](#para-quien-sirve)
- [Como empezar rapido](#como-empezar-rapido)
- [Ruta recomendada de lectura](#ruta-recomendada-de-lectura)
- [Navegacion documental](#navegacion-documental)
- [Estructura principal](#estructura-principal)
- [Resultado esperado del estandar](#resultado-esperado-del-estandar)

## Primera lectura en 10 minutos

1. Lee el bloque de alcance y estado actual de este README.
2. Abre [docs/README.md](docs/README.md) y recorre el indice por fases.
3. Lee [docs/fase-0-iniciacion/00.00-guia-de-uso.md](docs/fase-0-iniciacion/00.00-guia-de-uso.md).
4. Lee [docs/fase-0-iniciacion/00.06-ruta-guiada-integration-hub.md](docs/fase-0-iniciacion/00.06-ruta-guiada-integration-hub.md).
5. Revisa [docs/transversal/90.12-mapa-ia-por-fase.md](docs/transversal/90.12-mapa-ia-por-fase.md).

## Que resuelve

Ordena el trabajo del proyecto con un estandar unico para:

- definir vision, alcance y requerimientos
- conectar arquitectura, despliegue y operacion con artefactos minimos
- convertir necesidades en `Spec-Driven Development (SDD)`
- usar IA sin perder gobernanza documental
- preservar la estructura ejecutable real del sistema

## Para quien sirve

- equipos que mantienen y evolucionan `Integration Hub`
- arquitectos y tech leads que necesitan trazabilidad real
- desarrolladores que entran al proyecto y necesitan una ruta clara
- equipos que quieren usar IA sobre una base documental mas gobernable

## Como empezar rapido

1. Revisar [docs/README.md](docs/README.md) y [docs/fase-0-iniciacion/00.00-guia-de-uso.md](docs/fase-0-iniciacion/00.00-guia-de-uso.md).
2. Entender el alcance con [docs/fase-0-iniciacion/00.01-vision-proyecto.md](docs/fase-0-iniciacion/00.01-vision-proyecto.md) y [docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md](docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md).
3. Revisar arquitectura y despliegue en [docs/fase-3-arquitectura/README.md](docs/fase-3-arquitectura/README.md), [likec4/README.md](likec4/README.md) y [ops/README.md](ops/README.md).
4. Para construir, usar [docs/fase-4-sdd/README.md](docs/fase-4-sdd/README.md), [specs/README.md](specs/README.md), [src/README.md](src/README.md) y [tests/README.md](tests/README.md).

## Ruta recomendada de lectura

- Usar [docs/README.md](docs/README.md) como indice general de la documentacion.
- Usar [docs/fase-0-iniciacion/00.06-ruta-guiada-integration-hub.md](docs/fase-0-iniciacion/00.06-ruta-guiada-integration-hub.md) para entender el flujo end-to-end.
- Usar [docs/transversal/90.10-entregables-minimos-por-fase.md](docs/transversal/90.10-entregables-minimos-por-fase.md) y [docs/transversal/90.11-checklist-entregables.md](docs/transversal/90.11-checklist-entregables.md) como contrato minimo.
- Usar [docs/transversal/90.14-criterios-consolidacion-documental.md](docs/transversal/90.14-criterios-consolidacion-documental.md) para mantener los entregables oficiales enfocados en el proyecto real.

## Navegacion documental

La documentacion principal del proyecto vive en:

- [docs/README.md](docs/README.md)
- [ai/README.md](ai/README.md)
- [specs/README.md](specs/README.md)
- [src/README.md](src/README.md)
- [tests/README.md](tests/README.md)
- [qa/README.md](qa/README.md)
- [ops/README.md](ops/README.md)
- [ci/README.md](ci/README.md)
- [likec4/README.md](likec4/README.md)
- [diagramas/README.md](diagramas/README.md)

Base inicial para una plataforma de integracion configurable sobre Quarkus con:

- fuentes, readers y tareas configurables por provider, y extensibles con plugins sin tocar el nucleo.
  La lista de tipos concretos NO se escribe aqui: se genera desde el codigo en
  [el catalogo de tipos](docs/transversal/90.17-catalogo-de-tipos.md). Enumerarla a mano caduco tres
  veces en este mismo fichero -decia 4 fuentes de 8, y 6 readers de 7-.
- seguridad con Keycloak externo
- persistencia de metadatos con Hibernate ORM y PostgreSQL
- observabilidad con OpenTelemetry
- preparacion para compilacion nativa

## Modulos

- `platform-app`: aplicacion principal Quarkus con el motor base
- `frontend`: workspace Nx/Angular para la consola administrativa

## Estructura principal

- `docs/`: documentacion por fases y transversal
- `specs/`: features bajo `Spec-Driven Development (SDD)`
- `ai/`: criterios, controles y usos reales de IA en el proyecto
- `platform-app/`: backend ejecutable
- `frontend/`: frontend ejecutable
- `qa/`, `ops/`, `ci/`, `releases/`: calidad, operacion, pipeline y snapshots

## Estado actual

Ya estan implementados de forma inicial:

- catalogo de `source definitions`
- catalogo de `reader definitions`
- catalogo de `process definitions`
- ejecucion de procesos con spans OpenTelemetry
- auditoria persistida en `audit_event`
- trazabilidad por archivo persistida en `processed_source_file`
- resumen operativo en `overview` con reprocesos, ejecuciones con errores y archivos problematicos
- lectura real de `filesystem`, `ftp`, `sftp`, `rest`
- lectura real de `csv`, `txt`, `json`, `xls`, `xlsx`, `xml`
- persistencia por lote a `staging_record`
- `DB_WRITE` configurable con `insert`, `batch-update` y `upsert`
- tarea `DB_EXECUTE_SP` real para ejecutar stored procedures con parametros de runtime
- tarea `DB_EXECUTE_FN` real para ejecutar funciones de base de datos con parametros de runtime y publicar sus salidas
- tarea `REST_CALL` real con modo por registro o llamada unica
- tarea `NOTIFICATION` real con `log`, `webhook` y base `email`


## Keycloak

Se dejo una base importable del realm en [keycloak/integration-hub-realm.json](/keycloak/integration-hub-realm.json).

Incluye:

- realm `integration-hub`
- cliente confidencial `integration-hub-api`
- cliente publico `integration-hub-ui`
- roles `platform-admin`, `integration-admin`, `operator`, `auditor`
- usuarios iniciales `admin`, `operator`, `auditor`

### Clientes

`integration-hub-api`

- pensado para el backend Quarkus
- secreto inicial: `change-me`
- debe coincidir con `quarkus.oidc.client-id` y `quarkus.oidc.credentials.secret`

`integration-hub-ui`

- cliente publico para la SPA Angular 21
- stack UI: Angular Material, Angular CDK, Angular Aria, TailwindCSS v4 y Signals
- `standard flow` habilitado
- `PKCE S256` habilitado
- redirect URIs:
  - `http://localhost:8080/*`
  - `http://127.0.0.1:8080/*`

### Usuarios de prueba

- `admin / admin123`
- `operator / operator123`
- `auditor / auditor123`

### Importacion rapida

1. Levanta Keycloak en `http://localhost:8180`.
2. Importa el archivo `keycloak/integration-hub-realm.json`.
3. Verifica que exista el realm `integration-hub`.
4. Verifica que el cliente `integration-hub-ui` sea publico.
5. Verifica que el cliente `integration-hub-api` conserve el secreto `change-me` o actualiza `application.properties`.
6. Arranca Quarkus y abre `http://localhost:8080`.

### Configuracion UI

La SPA lee la configuracion OIDC desde [index.html](/platform-app/src/main/resources/META-INF/resources/index.html):

```html
window.__ihConfig = {
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'integration-hub',
    clientId: 'integration-hub-ui'
  }
};
```

Si cambias realm, host o client id, ajusta ese bloque.

## Resultado esperado del estandar

El repositorio debe permitir:

- entender direccion, arquitectura y operacion sin depender de contexto oral,
- llevar nuevas capacidades a `specs/` antes de construir,
- trabajar con IA sin perder gobernanza documental,
- evolucionar el sistema sin mover la estructura real que ya funciona.
## OpenTelemetry

Configuracion base en `application.properties`:

- `quarkus.otel.enabled=true`
- `quarkus.otel.exporter.otlp.traces.endpoint=http://localhost:4317`
- `quarkus.otel.exporter.otlp.protocol=grpc`

El motor crea spans para:

- ejecucion del proceso
- ejecucion de cada tarea
- errores de tarea y proceso

## Ejemplos de configuracion

### Task DB_WRITE insert dinamico

```json
{
  "mode": "insert",
  "targetTable": "clientes_destino",
  "batchSize": 500,
  "columnMappings": {
    "codigo": "codigo",
    "nombre": "nombre",
    "estado": "estado"
  }
}
```

### Task DB_WRITE batch-update

```json
{
  "mode": "batch-update",
  "targetTable": "clientes_destino",
  "batchSize": 500,
  "keyColumns": ["codigo"],
  "columnMappings": {
    "codigo": "codigo",
    "nombre": "nombre",
    "estado": "estado"
  }
}
```

### Task DB_WRITE upsert

```json
{
  "mode": "upsert",
  "targetTable": "clientes_destino",
  "batchSize": 500,
  "keyColumns": ["codigo"],
  "columnMappings": {
    "codigo": "codigo",
    "nombre": "nombre",
    "estado": "estado"
  }
}
```
### Task DB_EXECUTE_SP

```json
{
  "connectionRef": "erp-postgres",
  "procedureName": "public.sp_procesar_clientes",
  "timeoutSeconds": 30,
  "parameters": [
    { "name": "p_fecha", "value": "fechaProceso", "jdbcType": "DATE" },
    { "name": "p_empresa", "value": "empresa", "jdbcType": "VARCHAR" },
    { "name": "p_ejecucion", "value": "_processExecutionId", "jdbcType": "BIGINT" },
    { "name": "p_origen", "value": "const:REPROCESO", "jdbcType": "VARCHAR" }
  ]
}
```

El task toma parametros desde `executionVariables`, variables tecnicas del runtime (`_processExecutionId`, `_recordCount`, metadata de archivo, etc.), salidas de tareas anteriores o constantes usando prefijo `const:`. Tambien soporta parametros `OUT` e `INOUT`, dejando sus salidas disponibles para tareas posteriores. Los nombres de salida siguen siendo dinamicos segun la configuracion de la tarea; cuando un motor requiere prefijos tecnicos como `@` (por ejemplo SQL Server), el runtime los limpia antes de publicar el output para que las tareas siguientes usen nombres consistentes como `resultado`, `filas_actualizadas`, `resultado1` o `otroParametroSalida`.
### Task DB_EXECUTE_FN

```json
{
  "connectionRef": "erp-postgres",
  "functionName": "public.fn_resumen_proceso",
  "timeoutSeconds": 30,
  "parameters": [
    { "name": "p_empresa", "value": "empresa", "jdbcType": "VARCHAR" },
    { "name": "p_ejecucion", "value": "_processExecutionId", "jdbcType": "BIGINT" }
  ]
}
``` 

El task `DB_EXECUTE_FN` se implementa como provider separado de `DB_EXECUTE_SP`. Resuelve `IN` desde `executionVariables`, outputs previos, variables tecnicas y constantes `const:`. Ejecuta la funcion y publica la primera fila devuelta como `outputs` dinamicos para las tareas siguientes. En motores con funcion escalar se puede definir `resultAlias` para nombrar la salida, por ejemplo `resultado_fn`.


### Ejemplo end-to-end DB_EXECUTE_FN -> REST_CALL

1. `DB_EXECUTE_FN` ejecuta una funcion como `public.fn_resumen_proceso` y devuelve columnas como `resultado`, `filas_actualizadas` y `estado_carga`.
2. El runtime publica esa primera fila como `outputs` del task.
3. La tarea siguiente puede usar esas salidas directamente.

```json
{
  "mode": "single",
  "method": "POST",
  "url": "https://api.example.com/procesos/resumen",
  "headers": {
    "Content-Type": "application/json"
  },
  "bodyTemplate": "{\"proceso\":${processExecutionId},\"resultado\":\"${resultado}\",\"filas\":${filas_actualizadas},\"estado\":\"${estado_carga}\"}"
}
```

### Ejemplo end-to-end DB_EXECUTE_FN -> NOTIFICATION

```json
{
  "channel": "log",
  "message": "Funcion ejecutada con resultado ${resultado}, filas ${filas_actualizadas} y estado ${estado_carga}"
}
```
### Task REST_CALL por registro

```json
{
  "mode": "per-record",
  "method": "POST",
  "url": "https://api.example.com/clientes/${codigo}",
  "headers": {
    "Content-Type": "application/json"
  },
  "bodyTemplate": "{\"codigo\":\"${codigo}\",\"nombre\":\"${nombre}\",\"recordNumber\":${recordNumber}}"
}
```

### Task REST_CALL llamada unica

```json
{
  "mode": "single",
  "method": "POST",
  "url": "https://api.example.com/clientes/bulk",
  "headers": {
    "Content-Type": "application/json"
  },
  "bodyTemplate": "{\"processExecutionId\":${processExecutionId},\"recordCount\":${recordCount},\"items\":${recordsJson}}"
}
```

### Task NOTIFICATION log

```json
{
  "channel": "log",
  "message": "Proceso ${processExecutionId} finalizado con ${recordCount} registros"
}
```

### Task NOTIFICATION webhook

```json
{
  "channel": "webhook",
  "url": "https://hooks.example.com/process",
  "headers": {
    "Content-Type": "application/json"
  },
  "message": "Proceso ${processExecutionId} finalizado",
  "bodyTemplate": "{\"message\":\"${message}\",\"recordCount\":${recordCount}}"
}
```

### Task NOTIFICATION email

```json
{
  "channel": "email",
  "to": "ops@example.com",
  "subject": "Proceso ${processExecutionId} completado",
  "body": "Se procesaron ${recordCount} registros"
}
```


## Native build

Se dejo una base de preparacion para compilacion nativa en:

- [pom.xml](/pom.xml) con perfil `native`
- [application.properties](/platform-app/src/main/resources/application.properties)
- [native-image.properties](/platform-app/src/main/resources/META-INF/native-image/com.integrationhub/platform-app/native-image.properties)

### Ajustes incluidos

- inclusion de recursos estaticos, migraciones y `META-INF/services`
- `charsets` completos habilitados
- handlers `http` y `https` habilitados
- inicializacion en runtime para clases sensibles de `JSch` y `Apache POI`

### Comando base

```bash
mvn -Pnative -DskipTests package
```


### Alternativa con Docker

Si la maquina no tiene `native-image` instalado, puedes compilar con contenedor:

```bash
mvn -Pnative -DskipTests -Dquarkus.native.container-build=true package
```

La primera ejecucion puede tardar mas porque Quarkus necesitara descargar la imagen de build nativa.
### Alcance actual

La primera compilacion nativa ya esta saliendo correctamente con este alcance habilitado:

- `FILESYSTEM`
- `FTP`
- `REST`
- `SFTP`
- `REST_CALL`
- `TXT`
- `CSV`
- `JSON`
- `XML`
- `XLS`
- `XLSX`

### Exclusiones temporales en native

No hay exclusiones temporales activas en este momento. El perfil `native` ya compila con el conjunto actual de `sources`, `readers` y tareas implementadas.

### Riesgos a validar en la primera compilacion nativa

- tiempos de build y tamano del binario
- llamadas HTTPS reales hacia APIs externas

La siguiente iteracion recomendada es ejecutar una compilacion nativa real y ajustar cualquier reflection/resource hint adicional que aparezca en el build log.
## Siguientes pasos recomendados

1. Preparar ajustes especificos para compilacion native de librerias externas y reflection.
2. Agregar pruebas de integracion por tipo de source, reader y task.
3. Incorporar almacenamiento seguro de credenciales para fuentes y tareas.
4. Anadir scheduler y ejecucion programada de procesos.
5. Exponer API para consultar auditoria y ejecuciones con filtros.
## Secretos y configuracion segura

Las configuraciones JSON de `sources`, `readers` y tareas soportan resolucion de secretos en tiempo de ejecucion con estos patrones:

- `${env:SFTP_PASSWORD}`
- `${config:integrationhub.rest.token}`
- `${secret:integrationhub.rest.token}`

Ejemplo para SFTP:

```json
{
  "host": "sftp.example.com",
  "username": "batch-user",
  "password": "${env:SFTP_PASSWORD}",
  "remotePath": "/in/clientes.txt"
}
```

Ejemplo para REST:

```json
{
  "authType": "bearer",
  "bearerToken": "${secret:integrationhub.rest.token}"
}
```

Los placeholders funcionales del motor como `${codigo}`, `${recordCount}` o `${processExecutionId}` siguen intactos y se resuelven mas adelante durante la ejecucion de tareas.

## Seleccion multiarchivo y trazabilidad

Las fuentes `FILESYSTEM`, `FTP` y `SFTP` soportan:

- rutas con placeholders de fecha, por ejemplo `/carpeta1/{dd/MM/yyyy}/archivos`
- plantilla de nombre de archivo, por ejemplo `EDBV_{yyyyMMdd}_{empresa}_V.txt`
- variables de plantilla desde fuente, proceso, schedule o ejecucion manual
- seleccion multiarchivo con `Todos los archivos coincidentes`
- politica ante error de archivo:
  - `Detener en el primer error`
  - `Continuar con los demas archivos`

Cuando el pipeline es `FILE_READ -> DB_WRITE`, el motor procesa por lotes y registra trazabilidad por archivo en `processed_source_file`. Para volumen alto: `TXT` y `CSV` leen en streaming por linea, `XLSX` usa streaming SAX y `XLS` usa Apache POI EventUserModel.

Ademas, los procesos ya pueden incluir DB_EXECUTE_SP y DB_EXECUTE_FN como tareas dinamicas posteriores a FILE_READ o DB_WRITE, reutilizando executionVariables, outputs de tareas previas y variables tecnicas del runtime como entrada de stored procedures o funciones.

Compatibilidad validada con pruebas de integracion reales para DB_EXECUTE_SP:

- PostgreSQL
- MySQL
- SQL Server
- Oracle

La bateria multi-motor vive en [StoredProcedureTaskProviderCompatibilityTest](/platform-app/src/test/java/com/integrationhub/platform/provider/task/StoredProcedureTaskProviderCompatibilityTest.java).

Campos persistidos por archivo:

- `file_name`
- `file_path`
- `media_type`
- `file_size`
- `last_modified`
- `status` (`COMPLETED`, `FAILED`, `PENDING`)
- `record_count`
- `skipped_count`
- `written_count`
- `error_message`

La metadata por fila (`_sourceFileName`, `_sourceFilePath`, etc.) sigue disponible para `DB_WRITE` como opcion avanzada, pero la trazabilidad principal ya no depende de duplicar esos valores por cada registro.

## Reproceso y linaje de ejecuciones

El sistema ya soporta reproceso desde `executions` y `audit` para:

- reintentar archivos fallidos
- procesar archivos pendientes
- reprocesar una seleccion manual de archivos

Cada reproceso crea una **nueva ejecucion**. No modifica la corrida historica original.

La tabla `process_execution` ahora registra:

- `trigger_source`: origen de disparo, por ejemplo `MANUAL` o `MANUAL_RETRY_FAILED`
- `source_execution_id`: ejecucion origen de la que nace el reproceso

Esto permite ver en UI y auditoria si una corrida fue manual normal o si nacio como reintento/reproceso de otra.

Ademas, la UI ya permite navegar desde una corrida hija hacia su corrida madre con el atajo `Abrir ejecucion origen` en:

- `executions`
- `audit`

Soporte de consulta asociado:

- `GET /api/query/process-executions/{id}` para abrir una ejecucion puntual
- `GET /api/query/process-executions/{id}/children` para consultar reintentos/reprocesos nacidos desde esa ejecucion
- `GET /api/query/process-executions/{id}/tasks` para cargar sus tareas relacionadas

La UI tambien muestra `Ejecuciones hijas` cuando una corrida original ya genero reintentos o reprocesos.

## Scheduler

Los procesos ahora pueden quedar programados desde su definicion con estos campos:

- `scheduled`: activa la ejecucion programada
- `scheduleEvery`: intervalo simple como `30S`, `5M`, `1H`

Ejemplo de `process definition`:

```json
{
  "name": "carga-clientes-programada",
  "description": "Lee clientes cada 5 minutos",
  "active": true,
  "scheduled": true,
  "scheduleEvery": "5M",
  "tasks": []
}
```

El poller se controla con:

- `integrationhub.scheduler.poll-every=30s`

Y puedes consultar procesos programados en:

- `GET /api/process-schedules`


## Entorno local end-to-end

Se dejo una base operativa en [docker-compose.yml](/docker-compose.yml) para levantar:

- PostgreSQL en `localhost:5432`
- Keycloak en `http://localhost:8180`
- OpenTelemetry Collector en `localhost:4317`
- Jaeger UI en `http://localhost:16686`

La configuracion del collector esta en [otel/otel-collector-config.yaml](/otel/otel-collector-config.yaml).

### Arranque rapido

1. Levanta la infraestructura:

```bash
docker compose up -d
```

2. Verifica servicios:

- PostgreSQL: `localhost:5432`
- Keycloak: [http://localhost:8180](http://localhost:8180)
- Jaeger: [http://localhost:16686](http://localhost:16686)

3. Arranca la aplicacion Quarkus:

```bash
mvn quarkus:dev
```

4. Abre la consola:

- UI: [http://localhost:8080](http://localhost:8080)
- API base: [http://localhost:8080/q/health](http://localhost:8080/q/health)

### Flujo de validacion sugerido

1. Entra a la UI y autentica con `admin / admin123`.
2. Crea o revisa un `source` y un `reader`.
3. Crea un `process` con `FILE_READ` y `DB_WRITE`.
4. Ejecuta el proceso desde `Processes` o `Executions`.
5. Revisa `Audit` y luego valida trazas en Jaeger.

### Apagado

```bash
docker compose down
```

Si quieres borrar tambien la data local de PostgreSQL:

```bash
docker compose down -v
```

## Pruebas de integracion

Se dejo una base de pruebas de integracion en:

- [CatalogAndExecutionResourceIT.java](/platform-app/src/test/java/com/integrationhub/platform/integration/CatalogAndExecutionResourceIT.java)
- [PostgresTestResource.java](/platform-app/src/test/java/com/integrationhub/platform/integration/PostgresTestResource.java)
- [IntegrationTestProfile.java](/platform-app/src/test/java/com/integrationhub/platform/integration/IntegrationTestProfile.java)

Cobertura inicial:

- creacion de `source`, `reader` y `process` por API
- ejecucion real de `FILE_READ -> DB_WRITE`
- verificacion de `process_execution`, `process_task_execution`, `staging_record` y `audit_event`
- validacion basica de permisos: `operator` no puede crear `sources`

### Ejecucion

```bash
mvn -Dtest=CatalogAndExecutionResourceIT test
```

Requisitos:

- Docker Desktop o daemon Docker disponible
- acceso a descargar imagenes de Testcontainers la primera vez


## Overview operativo

La vista `/overview` ya expone metricas operativas derivadas del backend:

- fuentes, readers y procesos activos
- ejecuciones en curso
- ejecuciones fallidas o `COMPLETADO CON ERRORES`
- reprocesos manuales lanzados
- archivos fallidos y pendientes
- calidad de la ultima lectura

Estas metricas se sirven desde `GET /api/query/overview-summary` y usan como base:

- `process_execution`
- `processed_source_file`
- `audit_event`

## Resolucion de secretos

La resolucion de secretos ocurre solo en backend. El frontend nunca recibe el valor real del secreto; solo persiste placeholders en la configuracion JSON.

Placeholders soportados:

- `${env:SFTP_PASSWORD}`: busca primero el nombre tal cual y luego la version normalizada (`SFTP_PASSWORD` o `INTEGRATIONHUB_REST_TOKEN`).
- `${config:integrationhub.rest.token}`: resuelve desde MicroProfile Config.
- `${secret:connections/db/conexion1/password}`: resuelve desde Quarkus File Vault via la SPI de secretos.
- `${vault:connections/db/conexion1/password}`: alias explicito del mismo provider local para mantener el contrato uniforme.

Reglas del provider `secret`:

- si la referencia tiene forma logica `area/recurso/campo`, el runtime usa `integrationhub.secrets.file-vault.default-provider` para traducirla a un alias del keystore local y luego lo resuelve desde `PKCS12`.
- si no se indica `#campo`, el runtime intenta `value`; si el secreto solo tiene un campo, usa ese valor unico.

Ejemplos:

```json
{
  "password": "${secret:connections/db/conexion1/password}",
  "token": "Bearer ${vault:connections/db/conexion1/password}"
}
```

Diseno aplicado:

- `JsonConfigurationMapper` solo conoce `SecretResolver`.
- cada origen (`env`, `config`, `secret/vault`) vive en su propio provider.
- El keystore local queda detras de `FileVaultSecretClient`, por lo que mas adelante puede cambiarse la implementacion a Vault/OpenBao sin tocar `DB_WRITE`, `DB_EXECUTE_SP`, `DB_EXECUTE_FN`, `REST_CALL` ni `NOTIFICATION`.





Guia local ampliada: [seguridad-secretos.md](ops/seguridad-secretos.md)


Guia de connectionRef con File Vault: [seguridad-secretos.md](ops/seguridad-secretos.md)




### Ejemplos de claves logicas para conexiones

El mismo contrato `${secret:...}` ya puede usarse en distintos tipos de conexion sin exponer detalles del provider local:

- JDBC:
  - `${secret:connections/db/conexion1/password}`
- REST:
  - `${secret:connections/rest/erp/password}`
- SFTP:
  - `${secret:connections/sftp/proveedor1/password}`

Archivos tecnicos listos:

- [connection-jdbc-file-vault.json](/ejemplos/connection-jdbc-file-vault.json)
- [connection-rest-file-vault.json](/ejemplos/connection-rest-file-vault.json)
- [connection-sftp-file-vault.json](/ejemplos/connection-sftp-file-vault.json)

### Ejemplos de claves logicas para tasks

El mismo contrato tambien puede usarse en tareas dinamicas:

- REST task:
  - `${secret:tasks/rest/notificacion1/password}`
- Webhook task:
  - `${secret:tasks/webhook/alerta1/password}`
- Email task:
  - `${secret:tasks/email/notificacion-diaria/password}`

## Frontend Angular Nx

La base nueva del frontend ya corre sobre Angular 21 + Nx en `frontend`, con Quinoa apuntando a `dist/browser`. Ver detalle en [frontend-nx-angular.md](docs/fase-5-construccion/modulos/frontend-nx-angular.md).

Frontend actual: Angular 21 + Angular Material + Angular CDK + Angular Aria + TailwindCSS v4 + Signals, integrado con Nx, Quinoa, hash routing y Keycloak. Ver [frontend-nx-angular.md](docs/fase-5-construccion/modulos/frontend-nx-angular.md).

## Convenciones frontend

Convenciones activas del monorepo Angular:

- pages principales con nombre:
  - `*-page.ts`
  - `*-page.html`
  - `*-page.css`
- usar `catalog` solo en features CRUD con lista/tabla, filtros, paginacion y drawer/panel lateral
- usar `page` simple en features de resumen, consulta u operacion directa
- tokens de providers con nombre explicito por dominio:
  - `source-provider.token.ts`
  - `reader-provider.token.ts`
  - `connection-provider.token.ts`
  - `process-task-provider.token.ts`
- implementaciones de providers agrupadas por dominio en:
  - `frontend/libs/core/providers/src/lib/implementations/sources`
  - `frontend/libs/core/providers/src/lib/implementations/readers`
  - `frontend/libs/core/providers/src/lib/implementations/connections`
  - `frontend/libs/core/providers/src/lib/implementations/tasks`

## Frontend feedback y snackbar

El frontend Angular ya usa una capa estandar de feedback para operaciones CRUD y pruebas contextuales.

Piezas principales:

- [app-feedback.service.ts](/frontend/libs/core/services/src/lib/app-feedback.service.ts)
- [ui-message.service.ts](/frontend/libs/core/services/src/lib/ui-message.service.ts)
- [ui-message.presentation.ts](/frontend/libs/core/services/src/lib/ui-message.presentation.ts)
- [ui-message-snackbar.component.ts](/frontend/libs/core/services/src/lib/ui-message-snackbar.component.ts)
- [http-error.interceptor.ts](/frontend/libs/core/services/src/lib/http-error.interceptor.ts)

Regla aplicada:

- operaciones CRUD normales:
  - exito con snack-bar
  - errores HTTP via interceptor global
- operaciones contextuales como 	est connection y 	est source:
  - exito: panel local + snack-bar
  - error: solo panel local

Severidades soportadas:

- success
- error
- warning
- info

Diferenciacion visual actual:

- fondo por severidad
- borde lateral por severidad
- titulo de severidad
- icono SVG inline propio, sin depender de fonts
