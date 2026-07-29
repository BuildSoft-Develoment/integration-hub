# Análisis profundo — bloques C, D y E

Continuación de [analisis-v74-verificado-20260729.md](analisis-v74-verificado-20260729.md), tras
cerrar A y B. Contrastado contra el código en `experiment/quarkus-lts-native` @ `c055241a`.

**El hallazgo que cambia el orden de los bloques:** C, D y E no son independientes. **D bloquea a C**
—sin el control en la UI, la validación de C nunca se activa en un proceso armado por pantalla— y **E
cubre justo el hueco que C no puede ver**. Tratarlos por separado deja agujeros entre ellos.

---

## Bloque C — Simetría de `sinkRef` entre PAY y STATUS

### Lo que hay hoy

`Mt101PayStatusConnectionCoverageValidator.validateRouteSinks` compara `sinkRef` por ruta entre el
`routeTransports` del PAY y el `routeQuery` del STATUS, y falla si difieren. Correcto.

### Los huecos, del menos al más grave

**C-1. STATUS inline contra PAY con `sinkRef`.**

```java
var statusSink = statusSinks.get(route.getKey());
if (statusSink == null || statusSink.equals(route.getValue())) {
    continue;   // <-- statusSink == null se SALTA
}
```

Si el PAY despacha la ruta `BANCO_A` a la fuente 11 y el STATUS la consulta con conexión inline, no
se compara nada. El javadoc lo justifica por migración, y para migrar es correcto. Para producción es
exactamente el escenario peligroso: el pago sale a la fuente 11 y la confirmación se busca donde diga
el JSON inline.

**C-2. PAY completamente inline.**

```java
var paySinks = pairing.routeSinkRefs(pay, "routeTransports");
if (paySinks.isEmpty()) {
    return;   // <-- ninguna ruta del PAY declara sinkRef: no se valida NADA
}
```

Un proceso donde ninguna ruta del PAY migró a `sinkRef` queda sin validar aunque el STATUS sí las
declare. Además, PAY inline significa credenciales del banco escritas en la definición del proceso,
que es un problema de higiene de secretos aparte del de simetría.

**C-3. El más grave: toda la validación está detrás de `resolveNormalPay`.**

```java
for (var status : tasks) {
    if (!pairing.isNormalPayResolver(status)) {
        continue;   // <-- resolveNormalPay=false => NO se valida nada de este STATUS
    }
    ...
    validateRouteSinks(pay, status);
}
```

Y `isNormalPayResolver` exige `resolveNormalPay == true`.

Un `MT101_STATUS` que consulta al banco por ruta pero **no** concilia el PAY normal nunca ve
comparados sus sinks. Y consultar por ruta es independiente de conciliar: `routeQuery` se usa igual.

**Esto es peor de lo que parece por su interacción con el bloque D.** El provider del frontend crea el
draft con `resolveNormalPay: false` y `withRuntime` solo emite la clave cuando es verdadera. Como el
formulario **no expone el control** (0 ocurrencias en el HTML), todo `MT101_STATUS` armado desde la UI
sale con `resolveNormalPay` ausente. Conclusión: **para cualquier proceso creado por pantalla, la
validación de rutas de C está dormida.** Hoy solo protege a los procesos sembrados por API/seed.

### El tercer validador — y por qué mejora la propuesta

*(Corrección tras el check profundo: una primera versión de este análisis no lo mencionaba.)*

Hay **tres** implementaciones de `ProcessDefinitionValidator`, no dos:

| Validador | Qué verifica | Cuándo dispara |
|---|---|---|
| `Mt101PayResolutionValidator` | PAY sin resolutor / resolutor sin PAY | — |
| `Mt101PayStatusConnectionCoverageValidator` | `connectionRef` y **simetría de `sinkRef`** | solo si `resolveNormalPay=true` |
| `Mt101StatusRouteCoverageValidator` | **cobertura**: `routeQuery` cubre toda ruta de `MT101_ROUTE` | STATUS route-aware + `MT101_ROUTE` upstream — **sin depender de `resolveNormalPay`** |

El tercero no toca `sinkRef` en absoluto, así que **C-3 se sostiene**: nadie compara los sinks de PAY
y STATUS si `resolveNormalPay` es falso.

Pero aporta algo mejor que confirmar el hueco: **la condición de disparo correcta ya existe en el
código.** `Mt101StatusRouteCoverageValidator` se activa con *"STATUS route-aware + rutas declaradas
upstream"*, que es exactamente el criterio bajo el cual la simetría de sinks importa — y es
independiente de si la tarea concilia o no.

### Propuesta

Separar dos cosas que hoy están mezcladas:

1. **Sacar la simetría de sinks de detrás de `resolveNormalPay`, adoptando la condición de disparo que
   ya usa `Mt101StatusRouteCoverageValidator`**: hay PAY, y el STATUS es route-aware. Es corregir un
   alcance mal puesto, no política configurable, y no hay que inventar el criterio: se copia del
   validador hermano. **Va sin flag.**

2. **Política estricta, gobernada por configuración**, en la línea de `maker-checker.enabled` y
   `direct-list.enabled`: `mt101.pay.route-sink.strict` — default `false` (migración), `true` en
   `application-prod.properties`. En estricto:
   - toda ruta del PAY debe declarar `sinkRef` (cierra C-2 y saca credenciales del proceso);
   - toda ruta del PAY con `sinkRef` exige que la ruta homónima del STATUS también lo declare, y sea
     igual (cierra C-1).

**Pruebas:** las cuatro combinaciones (ambos sink iguales · ambos sink distintos · uno inline ·
ninguno) × dos perfiles, más un caso con `resolveNormalPay=false` que hoy pasa y debe fallar.

**Riesgo:** el punto 1 puede rechazar definiciones existentes que hoy se guardan. Es el objetivo —
son las que tienen el problema— pero conviene medir cuántas hay en el stack de integración antes de
mergear.

---

## Bloque D — Gobierno de la conciliación desde la UI

### Lo que hay hoy

El trabajo del modelo **ya está hecho**:

- `Mt101StatusTaskDraft` declara `resolveNormalPay: boolean` y `resolvesPayTaskRef: string`, con el
  comentario *"Gobernado por el formulario"*.
- Ambas están en `GOVERNED_KEYS`, así que se hidratan y se serializan correctamente.
- `hydrateRuntime`/`withRuntime` hacen el round-trip sin perderlas.
- El selector de `executionMode` **ya restringe a `once`** cuando `resolveNormalPay` está activo, y el
  código lo documenta: *"El flag hoy llega por config sembrada (el form todavía no lo expone), pero el
  selector ya lo respeta."*

Lo único que falta son los **controles en el template**. El HTML tiene 0 ocurrencias de esas claves.

**Salvedad encontrada en el check profundo:** eso vale para `resolveNormalPay` y `resolvesPayTaskRef`.
**`resolveCorrectivePay` NO está en el draft** — solo aparece en un javadoc, como una de las claves que
la clase base *preserva* sin gobernar. Exponerlo exige también trabajo de modelo (campo en el draft,
entrada en `GOVERNED_KEYS`, hidratación y serialización), no solo template. Conviene decidir si entra
en este bloque o queda para después: los otros dos son los que desbloquean C.

### Por qué D deja de ser P2

El análisis original lo puso en P2 por ser "UX de gobierno". Pero como muestra C-3, **D es la
precondición de C**: mientras el operador no pueda activar `resolveNormalPay` desde pantalla, ningún
proceso creado por UI activa la validación de simetría de rutas.

Dicho de otro modo: hacer C sin D deja la protección escrita pero apagada para el camino que el
operador realmente usa.

### Propuesta

Una sección nueva en `process-mt101-status-task-form` —el formulario ya tiene cuatro, así que encaja
en el patrón existente— con:

| Control | Comportamiento |
|---|---|
| `resolveNormalPay` (toggle) | Al activarlo, forzar `executionMode='once'` en el mismo patch, como ya hace el cambio de modo |
| `resolvesPayTaskRef` (select) | Visible solo con el toggle activo. Poblado con los `taskRef` de los `MT101_PAY` del proceso; **obligatorio** si hay más de uno |
| `resolveCorrectivePay` (toggle) | Mismo tratamiento, **pero exige agregarlo antes al draft y a `GOVERNED_KEYS`** |

Con aviso explícito de que activarlo hace que esta tarea cierre el ciclo de dinero del PAY normal.

**Pruebas:** extender `task-config-roundtrip.spec.ts` para que activar y desactivar desde la UI no
pierda ni resucite configuración, más un caso de que al activar el toggle el `executionMode` queda en
`once`.

---

## Bloque E — Capacidad a nivel de tarea configurada

### El hueco

`TaskProvider.movesMoney()` se declara **por tipo de provider**. Pero *"¿esto mueve dinero?"* es
propiedad de la **tarea configurada**: `FileDeliverTaskProvider` acepta cualquier `sinkRef` con
`direction` de salida —el mismo mecanismo con el que `MT101_PAY` deja el archivo en el banco—, así que
un operador puede armar una entrega de pagos con `FILE_DELIVER`. Ese tipo declara `movesMoney=false`
**con razón**, y aun así movería dinero.

No es regresión de ADR-021: con el literal `"MT101_PAY"` anterior el hueco era idéntico.

### Un segundo problema que apareció al mirar el consumo

```java
public boolean hasStartedAnyTaskType(Long executionId, Collection<String> taskTypes) {
    ... "select count(t) from ProcessTaskExecution t "
      + "where t.processExecution.id = ?1 and t.taskDefinition.taskType in ?2"
}
```

La consulta lee `t.taskDefinition` — la **definición actual**, no lo que realmente se ejecutó. Si
alguien edita el proceso entre la caída del nodo y el barrido de recuperación, la respuesta puede no
corresponder a lo que corrió. Con tipos de tarea es improbable que cambien; con configuración (que es
lo que E necesita mirar) es directamente frágil.

### Dos diseños, y por qué prefiero el segundo

**E-1 — evaluar en la consulta.** Extender el query para also emparejar tareas cuyo
`configuration_json` referencie una fuente marcada como crítica. Exige extraer JSON en SQL, es
específico del motor y hereda el problema de leer la definición actual. **Descartado.**

**E-2 — decidir al arrancar la tarea y persistirlo.** Una columna `moves_money` en
`process_task_execution`, escrita cuando la tarea arranca, con el `OR` de:

- el provider declara `movesMoney()`, **o**
- la tarea resuelve un `sinkRef` hacia una fuente marcada como crítica de dinero.

El barrido de recuperación pasa a ser un `where moves_money = true` trivial.

Ventajas sobre E-1:
- Sin JSON en SQL ni dependencia del motor.
- **Registra la decisión tal como fue en el momento en que se tomó**, así que editar el proceso
  después no cambia el veredicto de la recuperación. Esto arregla de paso el problema anterior.
- La consulta de recuperación se simplifica en vez de complicarse.

### Lo que hace falta

1. Migración Flyway — **`V102__`**, no `V100__`: la máxima existente es `V101` (una primera versión de
   este análisis dijo `V100` por leer un `ls` ordenado lexicográficamente, donde `V9` queda después de
   `V99`). La columna va con default `false` y un backfill que la ponga en `true` para las ejecuciones
   de tipos que hoy declaran la capacidad.
2. Marca en la definición de fuente: `moneyCritical` en `/sources` con `direction` de salida, con su
   propia migración y su exposición en la UI de fuentes.
3. Escritura del flag en `ProcessExecutionStateService.startTask` — **verificado que el punto existe y
   tiene los dos insumos**: recibe `taskType` (para consultar `moneyMovementTaskTypes()`) y resuelve el
   `taskDefinition` (para leer `sinkRef` de su `configurationJson`). Corre en su propia transacción,
   justo antes del `persist`. Leer `sinkRef` ahí no filtra el vertical al motor: es la misma clave
   genérica que ya usa `FILE_DELIVER`.
4. Sustituir `hasStartedAnyTaskType` por la consulta sobre la columna. El método viejo se **elimina**.

**Pruebas:** una tarea `FILE_DELIVER` apuntando a una fuente marcada se recupera como
`NEEDS_RECONCILIATION`; apuntando a una fuente normal, se re-encola. Más la prueba de que editar la
definición después de arrancar no altera el veredicto.

**Necesita ADR**: cambia el SPI, el modelo de datos de `/sources` y el contrato de recuperación.

---

---

## Hallazgo del doble check de la implementación: `taskRef` no identifica una tarea

Al construir el selector de D salió algo que ninguno de los bloques contemplaba.

`taskRef` es un **slug por tipo, no por tarea**. En el stack de integración, los cuatro `MT101_PAY`
del proceso 2 tienen todos `"taskRef":"pay-mt101"`, y el frontend crea el draft con `taskRef: ''`.

Eso rompe el mecanismo de desambiguación que el propio validador exige. `Mt101PayResolverPairing`
lanza cuando hay varios PAY y el STATUS no declara `resolvesPayTaskRef`, con el mensaje *"it must
declare resolvesPayTaskRef to name which PAY it resolves (**no guessing** across banks/connections)"*.
Pero al resolverlo hace:

```java
return earlier.stream()
        .filter(p -> resolvesRef.equals(normalize(stringConfig(p.configurationJson(), "taskRef"))))
        .findFirst()
```

Con `taskRef` repetidos, `findFirst()` **adivina igual** — toma el primero por orden de tarea. La
garantía de "no guessing" no se cumple: solo se traslada de "no declaraste" a "declaraste algo que no
distingue".

En D se hizo lo que corresponde al bloque: **deduplicar el selector**, para no ofrecer la misma opción
cuatro veces. Es cosmético y está anotado como tal en el código.

**El arreglo de fondo queda fuera de C y D**, y hay dos caminos:

1. **Que `taskRef` sea único dentro del proceso**, validado al guardar. Es lo más limpio
   conceptualmente —un `taskRef` es un nombre— pero rompe procesos existentes y obliga a renombrar.
2. **Que `resolvesPayTaskRef` apunte al `taskOrder`** en vez del `taskRef`, que sí es único por
   definición. Menos elegante, sin migración de datos, y el selector ya tiene el `taskOrder` a mano.

Conviene decidirlo antes de C-2: la política estricta apoya sobre este emparejamiento.

## Cuántas definiciones rechazaría C-1 — medido

La pregunta abierta antes de mergear era cuántos procesos existentes empezarían a fallar. Medido sobre
el stack de integración:

| Proceso | PAY | STATUS | STATUS route-aware | PAY con `sinkRef` |
|---|---|---|---|---|
| 1 proc-mt101-qa | 1 | 0 | 0 | 1 |
| 2 proc-mt101-10k-qa | 4 | 0 | 0 | 0 |
| 3 proc-mt101-payconflict-qa | 1 | 1 | **0** | 0 |
| 4, 6, 7 | 1 | 0 | 0 | 0 |
| 8 proc-mt101-ftp-qa | 1 | 0 | 0 | 1 |
| 9 proc-mt101-s3-qa | 1 | 0 | 0 | 1 |

**Rechazaría cero.** De los 8 procesos con `MT101_PAY`, solo uno tiene `MT101_STATUS`, y **ninguno es
route-aware**: sin `routeQuery` la regla nueva no tiene rutas que comparar. El único STATUS del stack
usa `mode: query` con una URL única.

La muestra es el stack de QA, no producción — pero dice que el cambio entra sin romper nada de lo que
hay hoy, y que la regla protege un camino que todavía no se está usando. Mejor momento para ponerla.

---

## `taskRef` único: el análisis, y dos correcciones a lo que dije antes

### Corrección 1 — no hay ningún proceso con más de un PAY

Dije que *"solo un proceso tiene >1 PAY (el 2, con cuatro)"*. **Estaba mal: conté filas inactivas.**

El proceso 2 tiene **cuatro tareas en cada `task_order`**, y al mirarlas de cerca, tres de cada cuatro
están en `active = false`. No son cuatro pagos: es **un pago vigente y tres versiones dadas de baja
lógicamente** — el mismo patrón "sin borrado físico" que verifican CCON-05, CRDR-07 y CPRO-06.

Medido correctamente: **los 8 procesos con `MT101_PAY` tienen exactamente 1 activo.** El escenario
multi-PAY que motivaba toda la desambiguación **no existe en ningún proceso del stack**.

Como control, verifiqué que el motor no cuente las inactivas al validar. No lo hace:
`ProcessCatalogService.toTaskViewsFromEntities` filtra por `t.active` con javadoc explícito. Si no lo
hiciera, cualquier proceso editado varias veces habría empezado a fallar exigiendo
`resolvesPayTaskRef`.

### Corrección 2 — `taskRef` no es un nombre, es el cableado

Lo traté como una etiqueta. **Es el identificador con el que se arma el pipeline**: `input.sourceTaskRef`
apunta a él para consumir la salida de otra tarea, y hay **63 tareas** en el stack que lo usan.

Eso cambia el riesgo de renombrar: cambiar un `taskRef` obliga a propagar el cambio a cada
`sourceTaskRef` que lo referencie, o el pipeline queda roto. En un money-path, una cascada de renombres
es un mal negocio para resolver una ambigüedad que —según la corrección 1— no ocurre.

### Lo que sí se hizo, y por qué es seguro

**Validar sin renombrar nada.** `TaskRefUniquenessValidator` en el motor (no en el vertical: `taskRef`
es un concepto del motor) rechaza dos tareas del mismo proceso con el mismo `taskRef` no vacío.

- **Vacío se permite**: una tarea terminal que nadie referencia no necesita nombre, y exigirlo
  rechazaría definiciones válidas que existen hoy (el `FILE_WRITE` final del proceso 2).
- **Cero rotura, medido**: en los 11 procesos del stack, `refs_distintos == con_ref == tareas_activas`.
  Todos pasan.
- El beneficio es hacia adelante: `sourceTaskRef` y `resolvesPayTaskRef` quedan inequívocos **por
  construcción**, que era el objetivo original.

**Autogenerar solo para tareas nuevas.** Y ahí apareció un bug que no estaba en el plan: el editor ya
autogeneraba, con `task-${tasks.length + 1}`. Deriva del **conteo**, no de los nombres en uso, así que
basta agregar tres tareas, borrar la del medio y agregar otra para **volver a generar `task-3`** y
chocar con la que sigue viva. Ahora se deriva del conjunto ocupado (`nextFreeTaskRef`).

Es exactamente la misma familia que un bug ya documentado en `process.models.spec.ts`: el `clientId`
por contador colisionaba con el `task-<id de BD>` de una tarea cargada. El mismo error, en el
identificador de al lado.

### Lo que queda abierto

`resolvesPayTaskRef` sigue resolviéndose con `findFirst()` sobre los que coinciden. Con la unicidad
garantizada ya no puede haber empate, así que en la práctica deja de adivinar — pero el código sigue
diciendo "el primero que coincida" en vez de "el único". Vale endurecerlo a "exactamente uno o error"
cuando se toque esa clase, para que la garantía esté en el código y no solo en el validador de al lado.

## Orden propuesto

| # | Bloque | Por qué en ese lugar |
|---|---|---|
| 1 | **C-punto-1** (sacar la validación de rutas de detrás de `resolveNormalPay`) | Corrige un alcance mal puesto, no es política. Sin migración ni ADR. Es el arreglo con mejor relación valor/riesgo |
| 2 | **D** | Precondición de que C sirva para procesos armados por UI. El modelo ya está hecho: es trabajo de template |
| 3 | **C-punto-2** (política estricta por perfil) | Una vez que el operador puede gobernar la conciliación, se puede exigir simetría sin bloquear la migración |
| 4 | **E** | El más caro (ADR + 2 migraciones + cambio de SPI) y el único que no tiene un camino incremental |

Los tres primeros no tocan la base de datos. E sí, y por eso conviene que vaya solo y con su ADR.
