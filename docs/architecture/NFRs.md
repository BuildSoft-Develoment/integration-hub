# NFRs

## Objetivo

Documentar los requisitos no funcionales minimos para operacion y evolucion de la plataforma.

## Disponibilidad

- `DEV`: disponibilidad orientada a desarrollo y pruebas
- `PRE`: disponibilidad suficiente para validacion previa a produccion
- `PRO`: objetivo de alta disponibilidad con 2 nodos de aplicacion y componentes criticos redundantes
- el scheduler no debe generar ejecuciones duplicadas por reinicios o failover sin control

## Rendimiento

- el tiempo de respuesta de la consola debe ser adecuado para operacion administrativa normal
- las tareas `DB_WRITE` deben soportar procesamiento por lotes
- las tareas `REST_CALL` deben manejar timeout y evidenciar latencia por ejecucion
- el procesamiento de archivos debe escalar por tamano y numero de registros sin degradar la estabilidad global

## Escalabilidad

- la capa stateless debe poder escalar horizontalmente
- el modelo de providers debe permitir agregar nuevas fuentes, readers y tareas sin redisenar el motor
- la persistencia debe contemplar staging y escritura masiva por lotes

## Seguridad

- autenticacion y autorizacion delegadas a `Keycloak`
- acceso por roles: `platform-admin`, `integration-admin`, `operator`, `auditor`
- secretos fuera del codigo y de archivos locales de despliegue
- uso de TLS segun politica corporativa
- trazabilidad de accesos y ejecuciones

## Observabilidad

- correlacion por `processExecutionId`
- spans por proceso y por tarea
- logs y auditoria con suficiente detalle para soporte
- metricas de scheduler, latencia REST, fallos y volumen procesado

## Operabilidad

- la plataforma debe contar con runbooks basicos de arranque, rollback y validacion
- debe existir respaldo y restauracion probada de `PostgreSQL`
- debe existir export o respaldo del realm/configuracion de `Keycloak`

## Mantenibilidad

- las vistas C4 deben mantenerse alineadas con el codigo
- el nivel `Code` debe reflejar el `Process Engine` real
- nuevas capacidades deben documentarse en ADR o documento tecnico equivalente