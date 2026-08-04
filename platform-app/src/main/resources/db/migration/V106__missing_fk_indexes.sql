-- @trace spec 004-observabilidad-y-auditoria RNF-002
--
-- Indices sobre claves foraneas del motor que no los tenian.
--
-- POR QUE APARECEN AHORA
-- PostgreSQL indexa la clave PRIMARIA automaticamente, la FORANEA no. La ausencia no falla ni avisa:
-- solo hace que cada borrado en la tabla padre recorra la hija entera, y que los joins por esa
-- columna se resuelvan a la fuerza bruta. Salieron de un barrido de TODAS las foraneas sin indice,
-- despues de que un borrado de fragmentos MT101 en desarrollo se quedara mas de diez minutos sin
-- terminar por esta misma causa; con el indice tardo nueve segundos.
--
-- No se indexa TODO lo que salio en ese barrido. Las tablas de catalogo -definiciones de proceso,
-- de tarea, de reader- tienen decenas de filas: ahi un indice cuesta mas en escritura de lo que
-- ahorra en lectura, y anadirlo seria ceder al reflejo de "indexar por si acaso".

-- `audit_event` es la mas importante de la lista, y hoy es la que menos lo parece: tiene 245 filas
-- en desarrollo. Pero es la unica tabla del motor que crece sin techo -una fila por evento de cada
-- ejecucion- y la consulta de #/audit/events filtra EXACTAMENTE por estas dos columnas
-- (`ExecutionQueryService.listAuditEvents`). Sin indice, la pantalla de auditoria degrada de forma
-- continua a medida que el sistema se usa, que es la peor forma de degradar: nunca hay un dia en
-- que se rompa.
create index if not exists ix_audit_event_process_execution
    on audit_event (process_execution_id);

create index if not exists ix_audit_event_task_definition
    on audit_event (task_definition_id);

-- 329 MB en desarrollo y la tabla mas grande del motor. Cinco escaneos secuenciales medidos, pero
-- de 382.620 filas cada uno.
create index if not exists ix_staging_record_task_definition
    on staging_record (task_definition_id);

-- Crece con cada tarea de cada ejecucion, y se recorre al pintar el detalle de una ejecucion.
create index if not exists ix_process_task_execution_task_definition
    on process_task_execution (task_definition_id);

-- `process_execution` parece pequena en desarrollo (17 filas) y por eso estuvo a punto de quedarse
-- fuera de esta migracion, junto a las tablas de catalogo. No es catalogo: crece con CADA ejecucion,
-- y sus indices actuales cubren el reclamo distribuido (status, lease) y el reproceso
-- (source_execution_id), no la pregunta que hace la pantalla de procesos -- "dame las ejecuciones de
-- esta definicion".
create index if not exists ix_process_execution_definition
    on process_execution (process_definition_id);

-- `processed_source_file.task_definition_id` se deja SIN indice a proposito: el compuesto
-- `(process_execution_id, task_definition_id)` ya sirve la consulta real -- los ficheros de una
-- ejecucion -- y un indice suelto solo ayudaria a borrar una definicion de tarea, que es un cambio
-- de configuracion excepcional. Indexar por si acaso tambien se paga.
