# Journey de diseno, ejecucion y seguimiento

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Journey de administracion de catalogos](journey-administracion-catalogos.md)
- Siguiente: [Mapa de pantallas y rutas](../pantallas/mapa-pantallas-y-rutas.md)
<!-- nav-guided:end -->

## Objetivo

Describir el recorrido principal desde el diseno del proceso hasta su ejecucion, monitoreo, auditoria y analisis posterior.

## Alcance

- `processes`
- `executions`
- `schedules`
- `audit`
- `overview`

## Flujo principal

1. El usuario entra a `processes` para crear o ajustar una definicion.
2. La pantalla de catalogo permite filtrar procesos existentes o crear uno nuevo.
3. El editor lateral carga referencias de `sources`, `readers` y `connections` solo cuando se necesitan.
4. El usuario arma el flujo, agrega tareas y define parametros de ejecucion.
5. Guarda el proceso y puede activarlo o ejecutarlo manualmente.
6. La corrida se consulta en `executions`, donde se revisan tareas, hijos, archivos y acciones asociadas.
7. Si la ejecucion es programada o recurrente, el usuario revisa `schedules`.
8. Para trazabilidad fina, consulta `audit`.
9. `overview` funciona como entrada rapida para estado general, ultimas ejecuciones y fallos recientes.

## Estados UX esperados

- `draft` cuando un proceso se esta creando o editando.
- `readonly` para procesos ya seleccionados sin modo edicion.
- `executing` cuando se dispara una corrida manual.
- `busy` en acciones de archivos o navegacion entre ejecuciones hijas.
- `failed` con acceso visible a detalle y trazabilidad.
- `scheduled` para procesos activos que dependen de agenda.

## Decisiones de experiencia

- El editor de procesos debe priorizar claridad del flujo sobre densidad de campos.
- La carga lazy de referencias evita penalizar la entrada inicial a la ruta.
- `executions` y `audit` mantienen el patron lista + drawer para que operacion y auditoria trabajen sobre una interfaz coherente.
- `overview` resume el estado para entrar mas rapido al recorrido correcto cuando hay incidentes.

## Puntos criticos de usabilidad

- entender la relacion entre proceso, schedule y ejecucion
- distinguir claramente editar de ejecutar
- navegar entre ejecucion padre e hijas sin perder contexto
- exponer errores de archivo, tarea o integracion sin saturar la pantalla
- mantener visible el linaje para reproceso y auditoria

## Trazabilidad

- `UC-03 Definir y ejecutar proceso`
- `UC-04 Monitorear y reprocesar ejecucion`
- `HU-03 Disenar y ejecutar procesos`
- `HU-04 Auditar y reprocesar`
- `docs/architecture/FRONTEND-NX-ANGULAR.md`
