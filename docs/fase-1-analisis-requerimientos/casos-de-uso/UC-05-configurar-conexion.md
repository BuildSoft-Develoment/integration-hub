# UC-05 Configurar conexion

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UC-04 Monitorear y reprocesar ejecucion](UC-04-monitorear-y-reprocesar-ejecucion.md)
- Siguiente: [UC-06 Programar proceso](UC-06-programar-proceso.md)
<!-- nav-guided:end -->

## Actor principal

`Integration Admin`

## Trazabilidad

- RF global: `RF-08` · Modulo: catalogo y conectividad · Feature: `specs/005-catalogo-conexiones`

## Precondiciones

- el usuario tiene permisos administrativos
- existe conectividad de red hacia el motor de datos a configurar

## Flujo principal

1. El usuario crea una conexion y selecciona el motor (`ORACLE`, `POSTGRESQL`, `SQLSERVER`, `MYSQL`, `MONGODB`).
2. Ingresa parametros (driver/url/credenciales) referenciando secretos con `${secret:...}`.
3. Ejecuta la prueba de conectividad (`POST /api/connection-definitions/test`).
4. Guarda y activa la conexion.
5. Introspecciona la metadata (esquemas, tablas, columnas y rutinas) al disenar tareas DB.

## Flujos alternos

- la prueba de conectividad falla y el usuario ajusta parametros
- el secreto o credencial no es valido o fue rotado
- el motor es `MONGODB`: no se ofrecen procedimientos ni funciones (sin rutinas)
- el motor no responde dentro del tiempo esperado

## Postcondiciones

- la conexion queda registrada con estado consistente y activable
- su metadata queda disponible para mapear destinos/rutinas de tareas DB
- la accion deja trazabilidad para auditoria y soporte
