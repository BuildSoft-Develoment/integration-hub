# ADR-028 — Llamar a otro proceso como una tarea más

- **Estado:** propuesto
- **Fecha:** 2026-08-10
- **Contexto previo:** ADR-004 (motor de tareas con inputs/outputs), ADR-015 (ejecución async por broker), ADR-021 (límite motor ↔ verticales)
- **Independiente de cualquier vertical.** Se descubrió analizando SBS–SUCAVE, pero **no cuelga de él**: si SUCAVE se cancelara, esta capacidad seguiría valiendo.

## Contexto

Hoy un proceso es una lista plana de tareas. Se puede tener `proceso 1`, `proceso 2`… `proceso n`, y
cada uno **recibe variables** al lanzarse (`ProcessExecutionRequest.executionVariables`, un
`Map<String,String>` que viaja por `startAsync` y llega a todas las tareas). Lo que **no** existe es que
un proceso invoque a otro: `grep PROCESS_CALL|SUBPROCESS|callProcess` no devuelve nada.

La consecuencia se nota cuando un trabajo se repite. Un envío regulatorio con cinco anexos son cinco
cadenas casi idénticas en un solo lienzo: ~25 nodos que hay que cablear a mano, que no se pueden probar
por separado y que no se reutilizan si el mismo anexo participa en dos envíos.

**Y ya existe media pieza.** `ProcessExecution.sourceExecutionId` enlaza una ejecución con la que la
originó, hay endpoint `/{id}/children`, y la consola de ejecuciones **ya navega los hijos**
(`execution-api.service.ts:55`). Hoy lo usa el reproceso. Una tarea de llamada no inventaría el árbol
padre-hijo: lo reutilizaría, con la pantalla que ya sabe pintarlo.

## Decisión

Añadir al motor un tipo de tarea **`PROCESS_CALL`**: lanza otro proceso con las variables que se le
pasen, **espera a que termine** y publica las salidas del hijo como salidas propias, de modo que las
tareas siguientes las consuman por `sourceTaskRef` como las de cualquier otra tarea.

### Se implementa como tarea suspendible, no bloqueando

`SuspendableTaskProvider` existe exactamente para *esperar un evento externo*, y que una ejecución hija
termine **es** ese evento. Así que `PROCESS_CALL` arranca el hijo, **suspende** —liberando el worker— y
reanuda cuando el hijo cierra.

No hace falta motor nuevo ni hilos bloqueados. Y hay un detalle que refuerza la elección: el arreglo de
`fix(motor): una ejecucion suspendida reanudaba con el proceso de hoy` protege justo este caso — el
padre puede quedar suspendido mucho rato, y ahora reanuda con **su** plan congelado aunque alguien haya
editado el proceso mientras tanto.

> ⚠️ **El javadoc de `SuspendableTaskProvider` miente, y engañaría a quien implemente esto.** Dice
> *"introduce el contrato pero NO implementa el mecanismo del engine"* y lista como pendiente la
> *"Migracion V13 con columna suspended_state"*. **V13 existe**
> (`db/migration/V13__process_task_suspension.sql`), el resume está implementado
> (`ProcessExecutionResumeService`) y sus tests de integración pasan.
>
> Quien lea ese javadoc antes de implementar `PROCESS_CALL` concluirá que tiene que construir la
> suspensión desde cero. **Corregir ese comentario es prerrequisito de esta fase**, y cuesta un minuto.

### Lo que hay que decidir al implementarlo

**Cruce de salidas.** El binding `task-output` resuelve dentro de la ejecución en curso. `PROCESS_CALL`
tiene que **traer las salidas del hijo al mapa del padre**. Es la decisión que hace o rompe la función,
y conviene acotar qué se trae: outputs declarados, no el contexto entero.

**Semántica de fallo.** Si el hijo falla, ¿falla el padre? ¿Y si el hijo dejó dinero en
`NEEDS_RECONCILIATION`? Un padre que cierra `COMPLETED` sobre un hijo irreconciliado sería el mismo tipo
de mentira que ADR-021 evita con `movesMoney()`. Debe propagarse, no absorberse.

**Ciclos y profundidad.** A llama a B llama a A. Guarda en publicación (el grafo es estático por
proceso) **y** tope de profundidad en ejecución, porque la cadena real se conoce al correr.

**Permisos.** Quién puede lanzar qué proceso desde otro, y si el hijo hereda el actor del padre.

## La interfaz que esto implica, y por qué aquí no hay prototipo

En este repo los prototipos viven en `specs/NNN-*/prototype-html5/` y el validador de calidad solo
itera sobre `specs/`. **Ningún ADR lleva prototipo** — ADR-026 tampoco: su interfaz se valida en el
prototipo del spec 009. Un ADR registra una decisión; el prototipo valida una experiencia, y para eso
hace falta una feature con usuarios.

`PROCESS_CALL` no tiene spec todavía porque está deliberadamente despriorizado. **Cuando lo tenga, el
prototipo es obligatorio antes de construir**, y hay tres pantallas que no existen en ninguna parte:

**El formulario de la tarea.** Qué proceso se llama, qué variables se le pasan, y qué pasa si el hijo
falla. Ese último campo es el que más se va a equivocar: *"continuar"* significa cosas muy distintas
según si el hijo movió dinero o solo leyó un archivo.

**El nodo en el lienzo.** Una tarea que *es otro proceso entero* no puede dibujarse como las demás. Si
se ve igual que un `DB_WRITE`, nadie entiende que detrás hay veinte pasos.

**El árbol de ejecuciones.** Ya existe a medias —hay endpoint de hijos y la consola los navega— pero
hoy solo sirve para el reproceso. Con llamadas anidadas, la pregunta *"¿por qué falló esto?"* se
responde bajando tres niveles, y la interfaz tiene que hacer la profundidad legible.

Ese tercer punto es el que sostiene el riesgo que este ADR ya declara: **si la UI no hace evidente la
anidación, la capacidad se vuelve un martillo** y acabamos con procesos imposibles de seguir. El
prototipo es donde eso se descubre barato.

## Lo que NO resuelve

**No evita el multi-entrada.** Aunque cada anexo sea un proceso hijo, el padre sigue teniendo N llamadas
y un empaquetado que debe tomar N artefactos. `FILE_COMPRESS` con varias entradas hace falta en los dos
caminos (ver ADR-026).

## Alternativas

**N cadenas dentro de un proceso.** Funciona hoy y no cuesta nada en el motor. Pierde la reutilización,
la prueba aislada y la posibilidad de regenerar una parte sin re-ejecutar el todo. **Es la opción
correcta mientras no haya un segundo caso que lo justifique.**

**Orquestar desde fuera** (un scheduler que lance procesos en orden). Rompe la trazabilidad: el árbol de
ejecuciones deja de contar la historia, y el motor pierde la relación causa-efecto que ya sabe registrar.

## Consecuencias

**A favor:** procesos pequeños, reutilizables y probables por separado; el lienzo deja de crecer con el
trabajo; y el árbol de ejecuciones —que la consola ya navega— pasa a contar la composición real.

**En contra:** es un tipo de tarea con semántica propia de fallo, ciclos y cruce de salidas. No es un
añadido menor, y por eso va en fase propia.

**Riesgo principal:** que se adopte como martillo. Un proceso que llama a otro que llama a otro es más
difícil de seguir que uno plano. La guía debería ser reutilización real, no descomposición por gusto.

## Decisión de secuencia

**No entra en el camino crítico de SBS–SUCAVE.** El primer formato se ataca con **un anexo, sin grupos
ni subprocesos**, para que la maquinaria de composición no esté en la ruta del primer archivo que sale.
Esta capacidad se justifica sola y se prioriza contra el resto del producto, no contra ese vertical.
