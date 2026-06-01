# Mapa de features SDD

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Spec-Driven Development](../04.00-spec-driven-development.md)
- Siguiente: [Trazabilidad de specs a QA y Ops](../trazabilidad/trazabilidad-specs-qa-ops.md)
<!-- nav-guided:end -->

## Objetivo

Dar una vista consolidada de las features que hoy estructuran `SDD` dentro del proyecto.

## Mapa actual

| Codigo | Feature | Alcance principal | Artefactos |
| --- | --- | --- | --- |
| `001` | catalogo de fuentes | fuentes `filesystem`, `ftp`, `sftp`, `rest` | funcional, tecnica, tareas |
| `002` | catalogo de readers | formatos `txt`, `csv`, `xls`, `xlsx`, `json`, `xml` | funcional, tecnica, tareas |
| `003` | diseno y ejecucion de procesos | modelado, tareas (`FILE_READ`/`DB_WRITE`/`DB_EXECUTE_SP`/`DB_EXECUTE_FN`/`REST_CALL`/`NOTIFICATION`), scheduler y corrida manual | funcional, tecnica, tareas |
| `004` | observabilidad y auditoria | ejecuciones, trazabilidad, overview y auditoria | funcional, tecnica, tareas |
| `005` | catalogo de conexiones | conexiones `ORACLE`/`POSTGRESQL`/`SQLSERVER`/`MYSQL`/`MONGODB` + metadata JDBC | funcional, tecnica, tareas |
| `006` | programacion de procesos | scheduling (`scheduled`/`schedule_every`) y consulta de programaciones | funcional, tecnica, tareas |

> Todas las features estan en modo `origin: reingenieria` (codigo ya construido): la Fase 2
> (prototipo/SPDD) no aplica; el resto del set canonico (incl. `api-contract`, `traceability`,
> `ui-test-cases`) si.

## Regla de crecimiento

- la siguiente feature debe seguir numeracion correlativa
- el nombre de carpeta debe ser estable y descriptivo
- si una feature se divide, la decision debe quedar registrada antes de construir

## Fuente oficial

- [../../../specs/README.md](../../../specs/README.md)
