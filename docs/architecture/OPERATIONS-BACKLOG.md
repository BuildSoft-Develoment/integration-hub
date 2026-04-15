# OPERATIONS BACKLOG

## Objetivo

Registrar mejoras sugeridas para la operacion diaria de Integration Hub despues de cerrar la fase de:

- seleccion multiarchivo
- reproceso de fallidos y pendientes
- trazabilidad por archivo
- linaje madre/hija entre ejecuciones
- metricas operativas en `overview`

La idea de este documento es dejar registradas sugerencias futuras con suficiente detalle para que luego puedan retomarse sin perder el contexto.

## Implementado en esta fase

Ya quedaron construidos estos bloques funcionales:

- seleccion multiarchivo en fuentes `FILESYSTEM`, `FTP` y `SFTP`
- politicas de error por archivo: `failFast` y `continue`
- estado `COMPLETADO CON ERRORES`
- trazabilidad por archivo en tabla tecnica `processed_source_file`
- reintento de archivos fallidos
- procesamiento de archivos pendientes
- reproceso manual de archivos seleccionados
- linaje madre/hija entre ejecuciones
- navegacion entre ejecuciones desde `executions` y `audit`
- breadcrumb de linaje con navegacion
- metricas operativas nuevas en `overview`

## Sugerencias priorizadas

### 1. Notificaciones operativas

Objetivo:
Detectar y avisar rapidamente situaciones que requieran accion del equipo operativo.

Que se sugiere:

- notificar cuando una ejecucion termine en `COMPLETADO CON ERRORES`
- notificar cuando existan archivos `FAILED` o `PENDING`
- resumir automaticamente reprocesos lanzados en un periodo
- preparar salidas futuras para correo, webhook o integracion externa

Ejemplos:

- una fuente procesa 10 archivos, 8 completan y 2 fallan: generar un aviso visible en UI con texto tipo `2 archivos fallidos en proceso Carga clientes`
- una ejecucion queda con politica `continue` y termina en `COMPLETADO CON ERRORES`: generar una alerta operativa en `overview`
- al final del dia, resumir: `5 reprocesos, 12 archivos fallidos, 3 pendientes`

Valor esperado:

- menos tiempo para detectar incidentes
- mejor reaccion del operador
- menor dependencia de revisar manualmente cada ejecucion

Detalle sugerido de implementacion:

- primer corte: avisos visuales en UI
- segundo corte: endpoint de notificaciones recientes
- tercer corte: salida opcional a correo o webhook

### 2. Reportes operativos avanzados

Objetivo:
Explotar mejor la trazabilidad ya disponible y convertirla en informacion de gestion.

Que se sugiere:

- tendencia diaria de fallos, omitidos y reprocesos
- metricas por proceso, fuente o reader
- ranking de fuentes con mas archivos fallidos
- historico de ejecuciones `COMPLETADO CON ERRORES`

Ejemplos:

- grafico diario con `fallidos`, `pendientes` y `reprocesos`
- tabla tipo `Top 10 fuentes con mas fallos en los ultimos 7 dias`
- reporte de un proceso especifico: `Procesadas 120 ejecuciones, 15 con errores, 4 con reprocesos`

Valor esperado:

- detectar tendencias antes de que se vuelvan incidentes mayores
- identificar procesos o fuentes fragiles
- dar insumos para priorizar mejoras tecnicas

Detalle sugerido de implementacion:

- agregar endpoint resumido por rango de fechas
- exponer filtros por proceso/fuente/reader
- considerar tarjetas nuevas en `overview` o una vista dedicada de reportes

### 3. Operacion avanzada en UI

Objetivo:
Reducir tiempo de diagnostico y accion desde la consola operativa.

Que se sugiere:

- filtros persistentes en `executions` y `audit`
- exportaciones adicionales por subconjunto o periodo
- filtros y exportacion tambien para `Ejecuciones hijas`
- refinamiento visual en mobile para breadcrumb y paneles largos

Ejemplos:

- que `Estado = FALLIDO` quede recordado si el operador cambia entre pantallas
- exportar solo archivos fallidos de los ultimos 3 dias
- exportar hijas de una ejecucion madre para revision externa
- en mobile, mostrar breadcrumb recortado sin romper el layout

Valor esperado:

- menos pasos manuales repetitivos
- mejor experiencia para soporte
- mas velocidad en analisis de corridas grandes

Detalle sugerido de implementacion:

- guardar filtros en `localStorage`
- agregar exportacion desde mas tablas, no solo desde detalle
- revisar responsive de breadcrumbs, mini tablas y formularios largos

### 4. Acciones masivas y reproceso avanzado

Objetivo:
Ampliar la capacidad operativa sobre lotes grandes o incidentes repetitivos.

Que se sugiere:

- reprocesar grupos completos por estado o fecha
- reintento programado de fallidos
- reproceso parcial por subconjunto guardado
- politicas de reintento automatico configurables

Ejemplos:

- `Reprocesar todos los fallidos de la fuente X del dia de hoy`
- `Reintentar pendientes cada 30 minutos hasta 3 veces`
- guardar un subconjunto como `lote critico` y relanzarlo manualmente

Valor esperado:

- menos trabajo manual sobre incidentes repetidos
- mayor recuperacion automatica
- mejor control sobre lotes problematicos

Detalle sugerido de implementacion:

- primer corte: accion masiva por filtro aplicado
- segundo corte: historial de lotes reprocesados
- tercer corte: automatizaciones/politicas configurables

### 5. Seguridad y auditoria fina

Objetivo:
Reforzar trazabilidad de quien hizo que, cuando y desde donde.

Que se sugiere:

- registrar usuario que lanzo el reproceso
- registrar desde que pantalla se disparo la accion
- dejar rastro de criterios usados al reprocesar
- mejorar correlacion entre evento de auditoria y accion manual

Ejemplos:

- `Usuario jlopez lanzo reproceso manual desde /audit`
- `Reprocesados archivos con filtro Estado = FAILED y Ruta contiene proveedores`
- `Accion iniciada desde ejecucion 4184`

Valor esperado:

- mejor auditoria funcional y de seguridad
- mayor claridad para soporte y cumplimiento
- menos ambiguedad sobre acciones manuales sensibles

Detalle sugerido de implementacion:

- agregar campos de auditoria tecnica en la accion de reproceso
- reflejar esos datos en `audit` y `executions`
- considerar permisos por accion en una fase posterior

## Recomendacion actual

Siguiente frente recomendado:

1. notificaciones operativas
2. luego reportes operativos avanzados
3. despues acciones masivas
4. finalmente endurecer seguridad y auditoria fina

## Criterio de priorizacion

Se recomienda priorizar segun este orden:

- valor operativo inmediato
- bajo riesgo de regresion
- aprovechamiento de la trazabilidad ya construida
- capacidad de mostrar resultados visibles al operador

## Referencias

- [README.md](/README.md)
- [TRACEABILITY.md](/docs/architecture/TRACEABILITY.md)
- [ROADMAP.md](/docs/architecture/ROADMAP.md)
- [RUNBOOK-OPERATIONS.md](/docs/architecture/RUNBOOK-OPERATIONS.md)