# Use Cases

## Objetivo

Documentar los casos de uso funcionales principales de la plataforma.

## Actores

- `Platform Admin`
- `Integration Admin`
- `Operator`
- `Auditor`
- `Sistema externo`

## UC-01 Configurar fuente

Actor:

- `Integration Admin`

Flujo:

1. Define una fuente `filesystem`, `ftp`, `sftp` o `rest`
2. Registra parametros de conexion y ruta
3. Guarda la configuracion
4. La plataforma deja la fuente disponible para procesos

Resultado:

- nueva `source definition` activa

## UC-02 Configurar reader

Actor:

- `Integration Admin`

Flujo:

1. Define el formato `txt`, `csv`, `xls`, `xlsx`, `json` o `xml`
2. Para `txt`, configura modo:
   - delimitado
   - tabulado
   - posiciones fijas
3. Guarda layout y opciones

Resultado:

- nueva `reader definition` disponible

## UC-03 Disenar proceso

Actor:

- `Integration Admin`

Flujo:

1. Crea una definicion de proceso
2. Agrega tareas ordenadas
3. Configura `FILE_READ`
4. Configura `DB_WRITE`, `REST_CALL` y/o `NOTIFICATION`
5. Activa el proceso

Resultado:

- `process definition` lista para ejecutar

## UC-04 Ejecutar proceso manualmente

Actor:

- `Operator`

Flujo:

1. Selecciona un proceso activo
2. Ejecuta bajo demanda
3. El motor obtiene la fuente
4. Lee y transforma registros
5. Persiste en BD
6. Invoca APIs si aplica
7. Notifica si aplica

Resultado:

- nueva `process execution`
- estados y auditoria disponibles

## UC-05 Ejecutar proceso programado

Actor:

- `Scheduler`

Flujo:

1. Detecta procesos programados y activos
2. Dispara la ejecucion
3. Registra inicio, tareas y resultado

Resultado:

- ejecucion automatica sin intervencion humana

## UC-06 Consultar ejecuciones

Actor:

- `Operator`
- `Auditor`

Flujo:

1. Filtra por proceso o estado
2. Revisa detalle de tareas
3. Revisa errores y tiempos

Resultado:

- visibilidad operativa del flujo

## UC-07 Consultar auditoria

Actor:

- `Auditor`
- `Platform Admin`

Flujo:

1. Busca por evento, proceso o fecha
2. Revisa payload y detalle
3. Exporta o documenta hallazgos

Resultado:

- trazabilidad funcional y tecnica

## UC-08 Reprocesar luego de error

Actor:

- `Operator`

Flujo:

1. Identifica proceso fallido
2. Corrige fuente, configuracion o endpoint
3. Reejecuta proceso

Resultado:

- nueva ejecucion con evidencia de recuperacion

## UC-09 Administrar acceso

Actor:

- `Platform Admin`

Flujo:

1. Administra roles y clientes en Keycloak
2. Define acceso a consola y APIs
3. Verifica permisos por perfil

Resultado:

- control de acceso por rol

## UC-10 Operacion on-prem

Actor:

- `Platform Admin`
- `Equipo de infraestructura`

Flujo:

1. Despliega en `dev`, `pre` o `pro`
2. Configura conectividad interna
3. Configura secretos, certificados y monitoreo
4. Valida readiness operacional

Resultado:

- ambiente operativo y gobernado

## Escenarios criticos

- archivo no encontrado en fuente remota
- timeout al invocar API externa
- layout TXT mal configurado
- token OIDC invalido o expirado
- falla de persistencia por constraint o volumen
- scheduler ejecuta proceso inactivo

## Reglas funcionales clave

- `FILE_READ` requiere `sourceDefinition` y `readerDefinition`
- solo roles administrativos crean o editan catalogos
- `operator` ejecuta procesos
- `auditor` consulta ejecuciones y eventos
- auditoria y trazas deben quedar correlacionadas

## Relacion con arquitectura

- [integration-hub.likec4](C:/chatgtp/quarkus/docs/architecture/integration-hub.likec4)
- [DEPLOYMENT-ONPREM.md](C:/chatgtp/quarkus/docs/architecture/DEPLOYMENT-ONPREM.md)