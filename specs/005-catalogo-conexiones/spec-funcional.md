---
origin: reingenieria
---

# Spec funcional - Catalogo de conexiones

## Objetivo

Permitir que perfiles administrativos configuren y mantengan conexiones a motores de datos
(`ORACLE`, `POSTGRESQL`, `SQLSERVER`, `MYSQL`, `MONGODB`) que las tareas de proceso usan como
destino u origen, e introspeccionar su metadata para mapear tablas y rutinas.

## Actores

- `integration-admin`
- `platform-admin`
- `auditor` (solo lectura de catalogo y metadata)

## Flujo principal

1. Crear conexion y seleccionar el motor (`connection_type`).
2. Cargar parametros de conexion (driver/url/credenciales) con secretos referenciados.
3. Probar la conectividad.
4. Activar la conexion.
5. Introspeccionar su metadata (esquemas/tablas/columnas/rutinas) al disenar tareas DB.

## Requerimientos

- RF-001 crear y editar conexiones por cada motor soportado (`ORACLE`, `POSTGRESQL`, `SQLSERVER`, `MYSQL`, `MONGODB`).
- RF-002 probar conectividad (`POST /api/connection-definitions/test`) y activar/desactivar.
- RF-003 persistir la configuracion en `configuration_json` con secretos `${secret:...}`, nunca en claro.
- RF-004 introspeccionar metadata relacional: esquemas, tablas y columnas, para mapear destinos de `DB_WRITE`.
- RF-005 introspeccionar rutinas: procedimientos y funciones con sus parametros, para `DB_EXECUTE_SP` y `DB_EXECUTE_FN` (no aplica a `MONGODB`).

## Reglas de negocio

- solo perfiles administrativos (`integration-admin`, `platform-admin`) crean o editan conexiones
- el `name` de la conexion es unico
- una conexion invalida (que no pasa `/test`) no deberia activarse
- los secretos se referencian con `${secret:...}` y nunca se persisten en claro
- `MONGODB` no expone rutinas (procedimientos/funciones): la introspeccion de rutinas solo aplica a motores relacionales
- las tareas DB del proceso referencian una conexion **activa** por su id (guardado en la configuracion de la tarea)

## Criterios de aceptacion

- se puede crear una conexion por cada motor soportado
- `/test` reporta el resultado de conectividad
- la metadata (esquemas/tablas/columnas y rutinas) queda disponible para el disenador de procesos
- la conexion activa queda disponible como destino/origen de tareas DB
- (UI) hay un formulario por familia: `connection-jdbc-form` (ORACLE/POSTGRESQL/SQLSERVER/MYSQL)
  y `connection-mongodb-form`, cada uno captura solo los campos validos de su familia
- (UI) los campos de credencial (`password` jdbc / `connectionString` mongodb) admiten secretos
  `${secret:...}` y nunca muestran/persisten el valor en claro

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; Fase 2 (prototipo/SPDD) no
aplica (`origin: reingenieria`). Los gates restantes se registran como `pending` hasta su
validacion humana formal.

- `gate-sdd-approved`: pending
- `gate-qa-passed`: pending
