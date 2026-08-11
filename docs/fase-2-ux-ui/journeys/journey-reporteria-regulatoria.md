# Journey de reporteria regulatoria (SBS SUCAVE)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Journey de diseno, ejecucion y seguimiento](journey-diseno-ejecucion-y-seguimiento.md)
- Siguiente: [Mapa de pantallas y rutas](../pantallas/mapa-pantallas-y-rutas.md)
<!-- nav-guided:end -->

> **Estado: planificado.** Describe el recorrido objetivo de la feature
> [`009-sbs-sucave`](../../../specs/009-sbs-sucave/README.md), que aun no esta construida. Es la
> primera feature `origin: nueva` del proyecto, asi que este journey **precede** al codigo en vez de
> documentarlo a posteriori — y por eso debe validarse con prototipo antes de construir
> ([02.14](../02.14-html5-first-prototyping.md), [02.15](../02.15-estandar-prototipo-html5-producto-real.md)).

## Objetivo

Describir como un analista regulatorio produce el archivo de un formato de la SBS, lo empaqueta y lo
deja listo para presentarlo — sin salir del motor de procesos que ya usa para todo lo demas.

## Actor

**Analista regulatorio.** Conoce el formato y el periodo que debe presentar; **no** conoce el motor
de tareas. La medida de exito de este journey es que no tenga que aprenderlo.

## Alcance

- `processes` — donde vive el arbol de plantillas y se configura y ejecuta
- `executions` — donde se sigue la corrida y se leen los rechazos
- `sources` — donde ya estan configurados los destinos

No hay seccion propia en el menu. **Es deliberado:** un formato regulatorio es un proceso, y darle una
pantalla aparte lo sacaria del sitio donde el operador ya sabe mirar.

## Disparador

Llega el cierre de un periodo y hay que presentar un formato.

## Flujo principal

1. El analista entra a `processes` y abre la paleta.
2. Navega el arbol: **SBS → SUCAVE → formato → anexo → variante de flujo**. Reconoce lo que busca por
   el codigo y el nombre del formato, no por tipos de tarea.
3. Arrastra la variante al lienzo. El editor inserta el **flujo completo recomendado**, ya encadenado.
4. Configura lo poco que es suyo: el origen de datos, el periodo y el destino del ZIP.
5. Guarda. Si falta algo imprescindible, el sistema **no le deja activar** y le dice que falta y que
   consecuencia tendria.
6. Ejecuta.
7. Sigue la corrida en `executions`. Si hay registros rechazados, los ve con su motivo, uno a uno.
8. Con la corrida en verde, el ZIP esta en el destino, listo para que una persona lo presente.

## Flujo alternativo — solo validar

Entre los pasos 3 y 4 elige la variante *solo validacion*: el proceso termina tras validar y entrega el
informe de rechazos sin producir archivo. Sirve para iterar sobre los datos sin generar basura.

## Flujo alternativo — regenerar un periodo pasado

Vuelve a ejecutar un proceso ya corrido indicando el periodo anterior. El archivo sale con el layout
que regia **entonces**, aunque la SBS haya publicado versiones nuevas.

Es el caso que justifica todo el snapshot regulatorio, y el que el prototipo tiene que dejar
comprensible: el analista debe **ver** con que version se genero, o no podra confiar en el resultado.

## Puntos de dolor que este journey debe resolver

| Dolor | Como se resuelve |
|---|---|
| "No se que tareas necesita un formato" | La plantilla trae el flujo completo; el analista edita, no ensambla |
| "No encuentro mi formato entre treinta" | Arbol por formato y anexo, no lista plana |
| "No se por que rechazo esta fila" | Motivo por registro, no un contador agregado |
| "No se si esto que genere sigue siendo valido" | Version de layout visible en la ejecucion |
| "Guarde el proceso y explota al ejecutar" | Lo que impide funcionar se dice **al guardar** |

El ultimo es una leccion cara ya aprendida en este producto: un destino mal resuelto solo se
manifestaba al ejecutar, y el motivo real no llegaba a ninguna pantalla.

## Riesgo de UX a vigilar

**No prometer conformidad.** Quien valida de verdad es la SBS. La interfaz no debe decir "aprobado",
"conforme" ni "validado por la SBS" para algo que solo ha pasado **nuestra** comprobacion previa. El
vocabulario correcto es *comprobacion previa* / *sin observaciones locales*.

Un analista que crea que el sistema ya lo dio por bueno presentara sin revisar.

## Criterios de aceptacion del prototipo

- El arbol de la paleta se recorre y se entiende sin explicacion previa.
- Tras arrastrar, se ve claro **que falta por configurar** y que ya viene resuelto.
- El intento de activar un proceso incompleto explica la consecuencia, no solo la regla.
- El detalle de ejecucion muestra la version de layout usada.
- Los rechazos se leen fila a fila, con su motivo.
- Ningun texto sugiere conformidad ante la SBS.
