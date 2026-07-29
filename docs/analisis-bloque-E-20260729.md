# Bloque E — La capacidad money-path a nivel de tarea configurada

Análisis previo a implementar. Contrastado contra `experiment/quarkus-lts-native` @ `8e46a489`.

## El hueco

`TaskProvider.movesMoney()` se declara **por tipo de provider**. Pero *"¿esto mueve dinero?"* es
propiedad de la **tarea configurada**.

`FileDeliverTaskProvider` acepta cualquier `sinkRef` con `direction` de salida — el mismo mecanismo
con el que `MT101_PAY` deja el archivo en el banco. En el stack de integración, el sink 11 es
`Sink SFTP banco E2E`. Un operador puede armar una entrega de pagos con `FILE_DELIVER`: ese tipo
declara `movesMoney=false` **con razón** (es genérico) y aun así movería dinero, así que tras una
caída de nodo la recuperación lo re-encolaría a ciegas.

No es regresión de ADR-021: con el literal `"MT101_PAY"` anterior el hueco era idéntico. El trinquete
del bloque A tampoco lo cubre, y lo dice en su javadoc.

## Un segundo problema, en el consumo

```java
public boolean hasStartedAnyTaskType(Long executionId, Collection<String> taskTypes) {
    ... "where t.processExecution.id = ?1 and t.taskDefinition.taskType in ?2"
}
```

La consulta lee `t.taskDefinition` — la **definición actual**, no lo que realmente se ejecutó. Editar
el proceso entre la caída y el barrido cambia la respuesta. Con tipos de tarea es improbable; con
configuración —que es lo que E necesita mirar— es directamente frágil.

## Corrección a mi propio análisis: E no cambia el SPI

En [analisis-bloques-CDE](analisis-bloques-CDE-20260729.md) escribí que E *"cambia el SPI, el modelo de
datos de `/sources` y el contrato de recuperación"*, y lo usé para ponerlo último y pedirle un ADR.

**Lo del SPI es falso.** `movesMoney()` no se toca: se le suma un OR que el motor evalúa por su cuenta.
Y leer `sinkRef` no filtra ningún vertical al motor, porque `sinkRef` **ya es un concepto del motor**:
`SinkDefinitionService` vive en `platform-app`, y `FILE_DELIVER` —tarea del motor— lo usa desde ADR-016.

E queda entonces en: **dos migraciones + una columna escrita al arrancar la tarea**. Más barato de lo
que dije, y sin tocar el contrato que implementan los verticales.

## Diseño

### Por qué persistir y no evaluar en el barrido

| | Evaluar en la consulta | Persistir al arrancar |
|---|---|---|
| Extracción de JSON en SQL | sí, específica del motor | no |
| Sobrevive a un edit del proceso | **no** | sí |
| Complejidad de la consulta de recuperación | crece | **se simplifica** |

Persistir gana en las tres. Y la de en medio es la que importa: **registra la decisión tal como fue en
el momento en que se tomó**, que es exactamente lo que una recuperación necesita saber.

### Dónde se escribe

`ProcessExecutionStateService.startTask(processExecutionId, executionToken, taskDefinitionId, taskType, taskOrder)`
tiene los dos insumos y corre en su propia transacción, justo antes del `persist`:

- el `taskType`, para preguntar a `TaskProviderRegistry.moneyMovementTaskTypes()`;
- el `taskDefinition`, para leer `sinkRef` de su `configurationJson`.

### La marca en la fuente

`moneyCritical` en `source_definition`, columna y no clave dentro de `configuration_json`: el motor la
consulta en el camino de arranque de cada tarea, y parsear JSON para eso sería caro y opaco.

**Por qué una declaración explícita y no derivarla del uso.** Se podría marcar como crítica toda fuente
a la que algún `MT101_PAY` despacha. Pero eso la vuelve dependiente de qué tareas existen hoy: quitar
el PAY desmarcaría el banco. La marca describe **qué es esa conexión** —un banco— y eso no cambia
porque cambie el proceso que la usa.

## Alcance del cambio

| Pieza | Qué |
|---|---|
| `V102__task_execution_moves_money.sql` | columna `moves_money boolean not null default false` + backfill a `true` para ejecuciones de tipos que hoy declaran la capacidad |
| `V103__source_definition_money_critical.sql` | columna `money_critical boolean not null default false` |
| `ProcessTaskExecution` | campo nuevo |
| `SourceDefinition` | campo nuevo + exposición en la API y el formulario de fuentes |
| `ProcessExecutionStateService.startTask` | calcula y escribe el flag |
| `ProcessExecutionRepository` | `hasStartedAnyTaskType` **se elimina**; entra `hasStartedMoneyMovement(executionId)` |
| `ProcessExecutionStateService.recoverExpiredExecutions` | consulta la columna |

`hasStartedAnyTaskType` se borra, no se deja de respaldo: dos caminos para la misma decisión de
money-safety es exactamente lo que la política no-fallback prohíbe.

## Riesgos

1. **El backfill mira `taskDefinition.taskType`**, o sea la definición actual — el mismo problema que E
   viene a resolver. Es aceptable *solo* para filas históricas: no hay otra fuente de verdad para lo
   que ya pasó, y el criterio actual es el que rige hoy. Va anotado en la migración.
2. **Una fuente marcada tarde** no re-marca las ejecuciones viejas. Correcto: la marca describe el
   presente, y reescribir el pasado sería inventar historia.
3. **`FILE_DELIVER` sin `sinkRef`** no llega a ejecutarse (`IllegalArgumentException` en el provider),
   así que el cálculo no necesita un caso especial.

## Lo que NO cierra

Un vertical que mueva dinero **sin pasar por un sink** —una API REST de pagos, por ejemplo— sigue
dependiendo de declarar `movesMoney()`. E cubre el camino por archivo, que es el que hoy tiene el
mecanismo compartido; el trinquete del bloque A cubre el declarativo. Entre los dos queda cubierto lo
que existe, no lo que pueda inventarse.
