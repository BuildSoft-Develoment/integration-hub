# Requisitos no funcionales y riesgos

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Fase 3 - Arquitectura](../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Objetivo

Consolidar los requisitos no funcionales y riesgos arquitectonicos que condicionan la evolucion y la operacion de la plataforma.

## Requisitos no funcionales

### Disponibilidad

- `DEV` orientado a desarrollo y pruebas
- `PRE` con estabilidad suficiente para validacion previa a produccion
- `PRO` con objetivo de alta disponibilidad y componentes criticos redundantes
- el scheduler no debe generar ejecuciones duplicadas por reinicios o failover sin control

### Rendimiento

- la consola debe responder de forma adecuada para operacion administrativa normal
- `DB_WRITE` debe soportar procesamiento por lotes
- `REST_CALL` debe manejar timeout y exponer latencia por ejecucion
- la lectura de archivos debe escalar por tamano y numero de registros sin degradar la estabilidad global

### Escalabilidad

- la capa stateless debe poder escalar horizontalmente
- el modelo de providers debe permitir agregar nuevas fuentes, readers y tareas sin redisenar el motor
- la persistencia debe contemplar staging y escritura masiva por lotes

### Seguridad

- autenticacion y autorizacion delegadas a `Keycloak`
- acceso por roles `platform-admin`, `integration-admin`, `operator`, `payments-operator`, `auditor`
- secretos fuera del codigo y de archivos locales de despliegue
- TLS segun politica corporativa
- trazabilidad de accesos y ejecuciones

### Observabilidad

- correlacion por `processExecutionId`
- spans por proceso y por tarea
- logs y auditoria con suficiente detalle para soporte
- metricas de scheduler, latencia REST, fallos y volumen procesado

### Operabilidad

- runbooks basicos de arranque, rollback y validacion
- respaldo y restauracion probada de `PostgreSQL`
- export o respaldo del realm/configuracion de `Keycloak`

### Mantenibilidad

- las vistas `LikeC4` deben mantenerse alineadas con el codigo
- nuevas capacidades deben documentarse en `ADR` o documento tecnico equivalente
- las extensiones frontend deben registrarse mediante contratos explicitos de contribucion y no por acoplamiento directo al shell
- la documentacion no debe derivar hacia una arquitectura paralela desconectada del repo real

## Riesgos principales

### R-01 Complejidad del motor configurable

- impacto: alto
- descripcion: la flexibilidad de sources, readers y tasks aumenta el riesgo de configuraciones invalidas o ambiguas
- mitigacion: validaciones de catalogo, UX guiada y trazabilidad por ejecucion y tarea

### R-02 Compatibilidad native de librerias

- impacto: alto
- descripcion: librerias como Apache POI o clientes de integracion pueden requerir ajustes especificos en GraalVM
- mitigacion: pruebas nativas tempranas, cobertura por provider y aislamiento de dependencias conflictivas

### R-03 Dependencia de integraciones externas

- impacto: alto
- descripcion: APIs REST, FTP o SFTP pueden presentar latencia, indisponibilidad o cambios de contrato
- mitigacion: timeouts claros, reintentos controlados y observabilidad por integracion

### R-04 Volumen de datos y persistencia

- impacto: medio-alto
- descripcion: cargas de archivos grandes pueden afectar tiempos de proceso, locks o consumo de recursos
- mitigacion: batch insert, tablas staging y monitoreo de tiempos, tamano y errores

### R-05 Configuracion de seguridad inconsistente por ambiente

- impacto: alto
- descripcion: diferencias entre `DEV`, `PRE` y `PRO` pueden ocultar fallos de autenticacion, audiencia o roles
- mitigacion: realms y clientes versionados, validacion en `PRE` cercana a `PRO` y documentacion de permisos

### R-06 Drift entre documentacion y codigo

- impacto: medio
- descripcion: la arquitectura puede desalinearse del producto real si no se actualizan vistas y documentos
- mitigacion: revision documental por release, `LikeC4` como fuente viva y `ADR` para cambios importantes

### R-07 Plugins frontend externos sin gobierno

- impacto: alto
- descripcion: permitir extensiones instalables desde fuera puede introducir colisiones de rutas, permisos inconsistentes, incompatibilidad de version o dependencias no controladas
- mitigacion: manifiesto versionado, SPI por contribuciones, JSON Schema publico del catalogo, validacion temprana de identificadores/rutas/workspaces/actions/campos desconocidos, compatibilidad por `platformVersion`, filtrado por capabilities, acciones externas restringidas a rutas instaladas o enlaces `https://`, comandos resueltos solo por handlers DI estaticos, `routes` vetado en el catalogo runtime (`maxItems: 0`), y para el canal `remote` de ADR-013 una mitigacion mas fuerte que la metadata-only que decia esta linea: firma ECDSA P-256 sobre `id@version:integrity`, recomputo del SRI del remoteEntry descargado, allowlist de origenes y cuarentena por plugin (`degraded`) si cualquiera de las tres falla; gate `npm run validate:plugins` antes de publicar catalogos externos, `npm run check:shell-routes-sync` para que las rutas que el contrato bendice sean las que el shell monta de verdad, y ADR para nuevas superficies de extension
