# HANDOFF CONTEXT

## Objetivo de este documento

Dejar contexto suficiente para retomar el trabajo de Integration Hub desde otra PC o en una sesion nueva sin perder:

- decisiones funcionales ya tomadas
- implementaciones ya realizadas
- estado actual del sistema
- backlog sugerido
- forma recomendada de continuar

## Resumen ejecutivo

En esta etapa se cerro una fase grande enfocada en procesamiento multiarchivo, trazabilidad operativa y reproceso.

Quedo implementado:

- seleccion multiarchivo para fuentes `FILESYSTEM`, `FTP` y `SFTP`
- politicas de error por archivo:
  - `failFast`
  - `continue`
- estado de ejecucion:
  - `COMPLETADO CON ERRORES`
- procesamiento por lotes para alto volumen
- soporte fuerte para:
  - `TXT`
  - `CSV`
  - `XLS`
  - `XLSX`
- trazabilidad por archivo con tabla tecnica `processed_source_file`
- reintento de archivos fallidos
- procesamiento de archivos pendientes
- reproceso manual de archivos seleccionados
- linaje entre ejecuciones madre/hija
- navegacion entre `executions` y `audit`
- breadcrumb de linaje clickeable
- metricas operativas nuevas en `overview`
- tarea dinamica DB_EXECUTE_SP para ejecutar stored procedures con parametros de runtime
- tarea dinamica DB_EXECUTE_FN para ejecutar funciones de base de datos con parametros de runtime y outputs encadenables

## Decisiones importantes tomadas

### 1. Multiarchivo con alto volumen

No se adopto una estrategia de acumular todos los registros en memoria.

Se decidio:

- procesar archivo por archivo
- leer por lotes
- escribir por lotes
- auditar por archivo y por ejecucion

Esto evita problemas de memoria y hace viable trabajar con archivos grandes.

### 2. Politicas de error por archivo

Se habilitaron dos politicas configurables:

- `Detener en el primer error`
- `Continuar con los demas archivos`

Comportamiento:

- con `failFast`, los siguientes archivos pueden quedar como pendientes
- con `continue`, la ejecucion puede terminar en `COMPLETADO CON ERRORES`

### 3. Trazabilidad por archivo

Se concluyo que no era buena idea duplicar metadata tecnica completa en cada fila escrita en `DB_WRITE`.

Por eso se definio:

- metadata por fila disponible como opcion
- trazabilidad principal por archivo en tabla tecnica `processed_source_file`

### 4. Excel de alto volumen

Se mejoro el consumo de memoria de Excel:

- `XLSX`: streaming SAX
- `XLS`: Apache POI EventUserModel

Esto reemplaza el modelo anterior que cargaba workbooks completos en memoria.

## Estado funcional actual

### Sources

- seleccion por coincidencia unica
- seleccion por `latestModified`
- seleccion por `all`
- politica ante error por archivo configurable

### Readers

- `TXT` por lotes
- `CSV` por lotes
- `XLS` por eventos
- `XLSX` por streaming
- soporte de lectura orientado a volumen

### Processes / FILE_READ / DB_WRITE / DB_EXECUTE_SP / DB_EXECUTE_FN

- `FILE_READ -> DB_WRITE` soporta multiarchivo
- DB_EXECUTE_SP y DB_EXECUTE_FN ya se pueden usar como tareas dinamicas dentro del proceso
- DB_EXECUTE_SP soporta IN, OUT e INOUT y deja outputs disponibles para tareas siguientes
- DB_EXECUTE_FN resuelve parametros IN y publica la primera fila devuelta por la funcion como outputs disponibles para tareas siguientes
- los outputs siguen siendo dinamicos segun el nombre configurado; si un motor usa prefijos tecnicos como `@` en SQL Server, el runtime los limpia al publicarlos (`@resultado` -> `resultado`)
- DB_EXECUTE_SP quedo validado con pruebas reales sobre PostgreSQL, MySQL, SQL Server y Oracle
- DB_EXECUTE_FN quedo validado con pruebas reales sobre PostgreSQL, MySQL, SQL Server y Oracle
- auditoria por archivo
- resumen consolidado por ejecucion
- metadata tecnica de archivo disponible para mapping si se necesita
- DB_EXECUTE_SP puede usar executionVariables, variables tecnicas (_processExecutionId, _recordCount, metadata de archivo) y constantes const: como parametros de entrada
- DB_EXECUTE_FN puede usar executionVariables, outputs previos, variables tecnicas y `resultAlias` cuando el motor devuelve una funcion escalar


Ejemplos de metadata disponible por record:

- `_sourceFileName`
- `_sourceFilePath`
- `_sourceMediaType`
- `_sourceFileSize`
- `_sourceLastModified`

### Executions

Quedo enriquecido con:

- detalle por tarea
- vista `Archivos del origen`
- filtros por:
  - archivo
  - ruta
  - estado
  - fecha de ultima modificacion
  - tamano minimo/maximo
- exportacion CSV:
  - resumen completo
  - completados
  - fallidos
  - pendientes
- chips rapidos por estado
- acciones:
  - `Reintentar fallidos`
  - `Procesar pendientes`
  - `Reprocesar seleccionados`
- mini tabla de `Ejecuciones hijas`
- boton `Abrir ejecucion origen`
- boton `Volver a ejecucion anterior`
- breadcrumb de linaje clickeable y sin duplicaciones

### Audit

Quedo enriquecido con:

- detalle de tarea con contexto multiarchivo
- archivos seleccionados, fallidos, pendientes y completados
- filtros equivalentes a `executions`
- exportaciones CSV equivalentes
- acciones:
  - `Reintentar fallidos`
  - `Procesar pendientes`
  - `Reprocesar seleccionados`
- acceso a ejecucion origen
- lista/tabla de ejecuciones hijas
- breadcrumb de navegacion

### Overview

Quedaron nuevas metricas operativas:

- reprocesos
- ejecuciones con errores
- archivos problematicos
- pendientes

## Estado tecnico actual

### Backend

Piezas importantes ya trabajadas:

- proceso multiarchivo y reproceso
- endpoints de consulta para ejecucion origen e hijas
- tabla tecnica `processed_source_file`
- estado `COMPLETED_WITH_ERRORS`
- linaje de ejecucion con `sourceExecutionId` y `triggerSource`
- resumen operativo para `overview`

### Frontend

Pantallas con bastante trabajo acumulado:

- `/sources`
- `/readers`
- `/connections`
- `/processes`
- `/executions`
- `/audit`
- `/overview`

Se hicieron muchos ajustes finos de:

- acordeones
- labels
- traducciones
- layout de tablas
- filtros
- exportaciones
- navegacion entre ejecuciones relacionadas

## Documentacion relevante para continuar

Revisar primero estos documentos:

- [README.md](/README.md)
- [TRACEABILITY.md](/docs/architecture/TRACEABILITY.md)
- [OPERATIONS-BACKLOG.md](/docs/architecture/OPERATIONS-BACKLOG.md)
- [ROADMAP.md](/docs/architecture/ROADMAP.md)
- [RUNBOOK-OPERATIONS.md](/docs/architecture/RUNBOOK-OPERATIONS.md)

## Recomendacion de siguiente frente

El siguiente frente sugerido no es tanto de core pipeline, sino de operacion:

1. notificaciones operativas
2. reportes operativos avanzados
3. acciones masivas mas ricas
4. seguridad y auditoria fina

Ver detalle en:

- [OPERATIONS-BACKLOG.md](/docs/architecture/OPERATIONS-BACKLOG.md)

## Prompt sugerido para retomar

Usar algo parecido a esto al retomar en otra sesion:

```
Estoy retomando el proyecto Integration Hub en /.

Antes ya se implemento una fase grande de multiarchivo y operacion:
- seleccion multiarchivo para FILESYSTEM/FTP/SFTP
- politicas failFast y continue
- estado COMPLETADO CON ERRORES
- trazabilidad por archivo en processed_source_file
- reproceso de fallidos, pendientes y seleccion manual
- linaje madre/hija entre ejecuciones
- breadcrumb y navegacion entre executions y audit
- metricas operativas nuevas en overview
- soporte de volumen para TXT/CSV/XLS/XLSX

Primero revisa estos documentos:
- README.md
- docs/architecture/TRACEABILITY.md
- docs/architecture/OPERATIONS-BACKLOG.md
- docs/architecture/HANDOFF-CONTEXT.md

Luego ayudame a continuar desde el backlog operativo, manteniendo consistencia con lo ya implementado y evitando romper la UX de executions, audit y overview.
```

## Nota operativa

Si se retoma en otra maquina y aun no esta el codigo en GitHub o no se sincronizo el workspace, este documento sirve como memoria funcional de alto valor, pero naturalmente sera mejor si viaja junto con el codigo fuente actualizado.

### Secretos y File Vault

- JsonConfigurationMapper ya no resuelve ${secret:...} como simple config local por defecto.
- ahora delega en una SPI de secretos:
  - EnvironmentSecretValueProvider
  - ConfigSecretValueProvider
  - FileVaultSecretValueProvider
- FileVaultSecretValueProvider usa FileVaultSecretClient, con implementacion actual QuarkusFileVaultSecretClient basada en lectura local de `PKCS12`.
- el placeholder recomendado es `${secret:area/recurso/campo}`.
- ${vault:...} existe como alias explicito.
- `${secret:...}` y `${vault:...}` usan una referencia logica estable (`area/recurso/campo`); File Vault la traduce internamente usando el provider por defecto configurado.
- esto deja el backend listo para cambiar la implementacion de secretos a Vault/OpenBao sin tocar tareas ni pantallas.






- ejemplo operativo de connectionRef local: [CONNECTIONREF-FILE-VAULT.md](/docs/architecture/CONNECTIONREF-FILE-VAULT.md)



- ejemplos adicionales ya sembrados en keystore local:
  - `${secret:connections/rest/erp/password}`
  - `${secret:connections/sftp/proveedor1/password}`




- helper adicional para tareas: [set-task-secret.cmd](/set-task-secret.cmd)
- ejemplo de key logica para tasks: `${secret:tasks/rest/notificacion1/password}`



## Frontend Angular Nx base

Quedo creada la nueva base Angular 21 + Nx en /frontend, reemplazando el frontend anterior. El backup del React legado quedo en /frontend-react-legacy-20260404. Mas detalle en /docs/architecture/FRONTEND-NX-ANGULAR.md.

### Convenciones activas de arquitectura frontend

Mantener estas reglas al seguir migrando pantallas:

- pages principales sin sufijo `.component`:
  - `*-page.ts`
  - `*-page.html`
  - `*-page.css`
- tokens de providers con nombre explicito:
  - `source-provider.token.ts`
  - `reader-provider.token.ts`
  - `connection-provider.token.ts`
  - `process-task-provider.token.ts`
- providers concretos organizados por dominio dentro de `core/providers/src/lib/implementations`:
  - `sources`
  - `readers`
  - `connections`
  - `tasks`
- usar `catalog` solo para features CRUD con:
  - toolbar
  - lista/tabla
  - paginacion
  - drawer o panel lateral
- usar `page` simple para features de:
  - resumen
  - consulta
  - operacion directa

Decision tomada:

- la infraestructura reusable vive en `core`
- las `features` quedan enfocadas en:
  - page
  - store
  - api service
  - componentes de UI

## Frontend Angular segundo corte

Ya quedaron integrados withHashLocation, luxon, Keycloak y la primera feature real de sources con API.

/sources ya sirve como referencia del patr?n nuevo:

- resumen superior tipo dashboard
- lista navegable
- panel lateral de detalle/edici?n
- formularios espec?ficos por tipo separados por estrategia

Ver [FRONTEND-NX-ANGULAR.md](/docs/architecture/FRONTEND-NX-ANGULAR.md).

## Frontend feedback estandar

Quedo implementada una base transversal para mensajes de UI y errores HTTP:

- `UiMessageService`
- `AppFeedbackService`
- `httpErrorInterceptor`
- `SKIP_GLOBAL_ERROR_FEEDBACK`

Uso recomendado:

- `create`, `update`, `activate`, `deactivate`, `delete`
  - exito por `snack-bar` estandar
- errores HTTP generales
  - manejados por interceptor global
- requests contextuales con mensaje local propio
  - marcar `SKIP_GLOBAL_ERROR_FEEDBACK`

Caso ya aplicado:

- `test connection`
  - exito:
    - mensaje local en el panel
    - y `snack-bar` global
  - error:
    - solo mensaje local en el panel
    - sin `snack-bar` duplicado

Caso alineado:

- /sources`r
  - ya usa feedback estandar para create/update/activate/deactivate
  - ya expone 	est source end-to-end
  - regla aplicada:
    - exito: panel + snack-bar`r
    - error: solo panel

Tests agregados:

- [app-feedback.service.spec.ts](/frontend/apps/web/src/app/app-feedback.service.spec.ts)
- [http-error.interceptor.spec.ts](/frontend/apps/web/src/app/http-error.interceptor.spec.ts)
- [connection-catalog.store.spec.ts](/frontend/apps/web/src/app/connection-catalog.store.spec.ts)


## Source test y feedback
- Backend expone POST /api/source-definitions/test y valida configuracion resolviendo el provider real mediante SourceProviderRegistry + JsonConfigurationMapper.
- Frontend /sources muestra el resultado del test dentro del panel; en exito tambien dispara snack-bar global, en error no duplica toast.
- El sistema de Snackbar quedo desacoplado en cuatro piezas:
  - AppFeedbackService: semantica del mensaje
  - UiMessageService: apertura del snackbar
  - ui-message.presentation.ts: mapeo de severidad a iconografia/presentacion
  - UiMessageSnackbarComponent: render visual
- Las severidades success, error, warning e info se distinguen con:
  - fondo propio
  - borde lateral
  - titulo de severidad
  - icono SVG inline, sin depender de fuentes externas