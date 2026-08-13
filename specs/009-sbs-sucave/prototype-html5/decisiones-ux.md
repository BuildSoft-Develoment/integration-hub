# Decisiones UX — SBS SUCAVE (cierre regulatorio)

Mesa de cierre de un analista regulatorio: producir los archivos que la entidad debe presentar a la
SBS por un periodo, revisarlos y dejarlos listos. Quien la usa no diseña procesos: **cierra un mes**.

## Contrato del prototipo

- Estados: sin generar, generado, en el destino, con reparo, falló la entrega
- Roles: Analista regulatorio, Responsable de cumplimiento
- Entidades: Obligaciones, formato, anexo, grupo de envío, periodo
- RF / HU: RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-012, RF-013, RF-014

Los estados se declaran con las palabras que **se leen en pantalla**, no con identificadores internos:
lo que este prototipo contrata es la experiencia, y quien cierra un mes no ve enums.

### Estados

- **sin generar** — la obligación del periodo no ha producido archivo todavía. Es el estado de
  entrada: lo que la mesa de cierre responde nada más abrir.
- **generado** — el archivo existe y quedó con su version de layout congelada (RF-009). Generado no
  es entregado, y por eso son dos estados y no uno.
- **en el destino** — depositado en la carpeta desde la que la estación de SUCAVE lo importa
  (RF-008). Aquí acaba el alcance del producto: **presentar lo hace SUCAVE**, no nosotros.
- **con reparo** — hay registros que las reglas del formato rechazaron (RF-004). El motivo se lee
  por registro, en la fila; un contador no sirve para decidir si queda una corrección o cien.
- **falló la entrega** — se generó pero no llegó al destino. Se separa de «con reparo» a propósito:
  uno es un problema de los datos y el otro del camino, y se arreglan en sitios distintos.

### Roles

- **Analista regulatorio** — prepara el envío, corrige los reparos y genera. No autoriza.
- **Responsable de cumplimiento** — revisa y autoriza lo ya generado; ve los ajustes en solo lectura.
  Quien prepara no puede autorizar, y el control aparece apagado con el motivo debajo (RF-012).

### Alcance frente al spec

- **RF / HU**: los catorce del funcional. Trece se ven en pantalla; **RF-011 no tiene pantalla propia
  a propósito**: es la paridad entrada/salida del motor, y lo que el prototipo representa de él es su
  consecuencia visible — que el selector de destino de la entrega solo ofrezca sitios donde de verdad
  se puede escribir. Declararlo aquí sin decir esto haría creer que hay una vista que no existe.

## Decision de patron de producto

- **Dominio del spec**: cumplimiento regulatorio periodico. No es operacion continua como el
  money-path: tiene calendario, vencimiento y un "ya esta" al final del mes.
- **Actor principal**: la analista regulatoria. Conoce el formato 0228 y su fecha limite; **no**
  conoce tipos de tarea, ni destinos, ni el motor. Que no tenga que aprenderlos es la medida de
  exito de este prototipo.
- **Segundo actor**: el responsable de cumplimiento. No prepara nada: **revisa y autoriza** el envio
  ya generado, y ve los ajustes en solo lectura.
- **Tarea principal recorrible**: ver que falta del periodo → preparar un formato → entender por que
  seis registros no pasan → dejar el archivo donde SUCAVE lo tome.
- **Golden de referencia**: `saas-operativo-bandeja` — consola de trabajo densa, la misma familia que
  la bandeja del money-path. Se toma su **disposicion** (barra superior fija, columna de contexto,
  tablas densas con cifras tabulares), no su contenido ni su ritmo: alli el trabajo es continuo y
  aqui tiene calendario, asi que la primera pantalla no abre con "que hay sin resolver ahora mismo"
  sino con "que debo presentar este periodo y cuanto queda". El golden aporta el andamio visual; el
  vencimiento y el estado del periodo son de este dominio y no salen de el.
- **Patron elegido**: **mesa de cierre por periodo**. Abre con las obligaciones del mes y su
  vencimiento, no con un menu ni un dashboard. La metafora del dominio es el cierre contable: que
  debo presentar, que llevo, que me falta y cuanto tiempo queda.
- **Por que no se usa shell generica**: un catalogo con lista + drawer contaria *que existe*, no *que
  falta*. Aqui el valor esta en el vencimiento y en el hueco: por eso la portada es una tabla de
  obligaciones con estado y fecha, y el rail lleva contadores. Un CRUD haria que la analista tuviera
  que entrar formato por formato para saber si llega a tiempo.
- **Interacciones**: navegar las siete secciones; cambiar el destino y ver como se refleja en el
  resumen de preparacion; seleccionar un registro con reparo y leer su motivo con la posicion exacta
  del archivo; filtrar por motivo hasta dejar la lista vacia; regenerar un periodo cerrado, que
  **confirma con que version del diseño de registro** se hara; copiar la ruta del archivo.
- **Limitaciones**: sin backend. Los datos son verosimiles pero inventados. El **arbol de plantillas**
  (SBS → SUCAVE → formato → anexo) no se prototipa aqui porque vive dentro del editor de procesos, que
  ya existe en el producto.

> **Correccion (2ª pasada).** La primera version dejaba fuera tambien los **ajustes de cada paso**, con
> el mismo argumento del arbol. Era un error: el arbol es navegacion que el editor ya sabe hacer, pero
> los ajustes de las tareas de la SBS **no existen en ninguna parte** y son justo lo que el operador
> tiene que entender. Se añadio la seccion *Ajustes del formato* con los cuatro formularios.

## Los ajustes: por que se ven como pasos y no como tareas

La seccion no se llama "tareas" ni muestra `SBS_SUCAVE_PREPARE`. Muestra **pasos del envio** en orden,
con su nombre en lenguaje de la analista: *Contexto del periodo*, *Llevar al formato*, *Revisar los
datos*, *Revisar el archivo*.

**Los diez pasos tienen su formulario, tambien los del motor.** La primera version dejaba a los del
motor con un cartel generico que decia "se configura como en cualquier proceso". Era una respuesta de
arquitecto, no de producto: la analista no sabe que hay "otros procesos", y ese cartel le negaba
precisamente lo que venia a ver. Ahora leer, guardar, escribir, entregar y avisar traen
su formulario con valores de ejemplo, marcados como *de la plataforma* para que se note de quien es
cada cosa.

Esa distincion visible es deliberada: la analista debe poder ver **que es propio de la SBS y que es de
la plataforma**, porque lo primero cambia cuando la SBS publica una version y lo segundo no.

### El grupo de envío, no el anexo suelto

La seccion abre con el **grupo de envio**, y dentro sus anexos. No es un detalle de organizacion: es lo
que decide si el envio sale o no. Los dos anexos del grupo 01 pueden estar perfectos por separado y aun
asi no formar un envio valido —distinto periodo, uno obligatorio ausente, un cuadre que no coincide—.

Por eso hay un paso mas, *Revisar el paquete*, marcado como **comun al grupo** igual que la entrega.
Su aviso dice lo que esta en juego: **una presentacion incompleta parece completa**, y la SBS lo
recibe como presentacion valida y lo observa despues.

Y el panel del grupo aclara **quien decide qué va junto**: la SBS, en la definicion vigente del formato
para ese periodo. No se configura ahi. Es la misma disciplina del diseño de registro — el operador
elige el qué, no el debe.

### El formulario de «Escribir el archivo» es el que cierra el diseño

Es un paso del motor, pero su campo principal dice **«Diseño de registro: viene de Contexto del
periodo»**, y debajo aparecen los campos resueltos —posicion, longitud, relleno— en solo lectura.
Nadie teclea 24 columnas.

**Una version intermedia ofrecia ahi un desplegable con «Escribirlo a mano» como segunda opcion**, con
un aviso explicando lo que se perdia. Se quito, y la razon vale para mas sitios: no eran dos opciones
equivalentes. Una es correcta y la otra envenena el archivo historico en silencio —un layout tecleado
no corresponde a ninguna version registrada, asi que ese periodo no se puede regenerar igual—. Poner
las dos juntas hace parecer que es cuestion de preferencia.

Ahora el campo es de solo lectura y el aviso responde a la pregunta que si tiene sentido: *¿y si mi
formato no esta en el catalogo?* Se registra una version nueva **en el catalogo**, fechada y
disponible para todos los procesos. Es la misma disciplina que el producto ya aplica a las
credenciales: se referencian, no se escriben donde se usan.

Los avisos que explican una consecuencia, no una regla:

- **Contexto del periodo** explica por que la version del diseño se elige ahi y no en cada paso: si
  cada uno pudiera elegir la suya, dos pasos de la misma corrida trabajarian con diseños distintos.
- **Revisar los datos** avisa de que vaciar la tabla de reparos apaga el detalle. Con doce mil
  registros, eso deja a la analista con un contador y sin saber que corregir.
- **Revisar el archivo** explica por que existe: un trailer que dice 12 486 sobre un archivo de 12 480
  lineas pasa todas las revisiones anteriores y lo rechaza la SBS.

## Por que estas siete secciones

| Seccion | Por que esta |
|---|---|
| Obligaciones | Es la pregunta con la que la analista entra: ¿que me falta y cuando vence? |
| Preparar envio | Donde elige lo poco que es suyo. El resto viene resuelto, y se ve resuelto |
| Revision previa | El corazon. Un contador de rechazos no sirve: hay que poder leer **por que** falla una fila |
| Archivo generado | Cierra el ciclo: que se produjo, donde quedo y con que version |
| Periodos anteriores | Es lo que justifica congelar la version del layout, y hay que poder verlo |
| Ajustes del formato | Los diez pasos del envio, con lo que decide cada uno |
| Formatos vigentes | Responde a "¿por donde entra un formato nuevo?" sin tocar el sistema |

## Tres decisiones que conviene no deshacer

**El vocabulario no promete conformidad.** La seccion se llama *Revision previa* y no *Validacion*;
el aviso dice explicitamente que la revision es nuestra y que pasarla no significa que la SBS acepte.
Un analista que crea que el sistema ya lo dio por bueno presentara sin revisar — y el rechazo llega
semanas despues, del regulador.

**El motivo de un reparo se cuenta con la posicion del archivo.** No basta "tipo de documento
invalido": el panel muestra la posicion (12-13), lo esperado y lo recibido. La analista corrige en su
tabla de origen, y para eso necesita saber exactamente que celda mirar.

**Regenerar un periodo cerrado pide confirmacion, y la confirmacion dice la version.** Es la unica
accion del prototipo con dialogo. No por ser destructiva, sino porque su resultado depende de algo
invisible —que diseño de registro regia entonces— y equivocarse ahi produce un archivo que parece
bien y no lo esta.

## Segregacion de funciones: quien prepara no autoriza

> **Correccion (3ª pasada).** Las dos primeras versiones tenian **un solo actor**. Segun la tabla de
> decision de la rubrica, "¿hay diferencias por rol/perfil visibles?" con respuesta NO **limita el
> prototipo a nivel 2**. El validador automatico no comprueba ese criterio, asi que reportaba nivel 3
> sin que se hubiera ganado.

El arreglo no fue cosmetico. Una presentacion regulatoria pide un segundo par de ojos, igual que ya
hace este producto con los conflictos de pago (maker-checker):

| | Analista regulatorio | Responsable de cumplimiento |
|---|---|---|
| Ajustes del formato | Los edita | **Solo lectura**, con aviso |
| Generar el envio | Si | No es su trabajo |
| Autorizar la presentacion | **Boton apagado**, con el motivo en el tooltip | Autoriza o devuelve con observaciones |

El boton apagado del analista dice por que lo esta —*"Lo autoriza el responsable de cumplimiento, no
quien preparo el envio"*—, siguiendo la regla de la casa de que un control deshabilitado explica su
motivo. Un boton apagado y mudo obliga a preguntar por chat.

## Deuda visible a proposito

El aviso "Puedes cambiar estos pasos" anuncia que el flujo recomendado es editable, pero el prototipo
no deja editarlo: esa edicion ocurre en el editor de procesos del producto real. Se enuncia para
validar con el stakeholder que **entiende que puede tocarlo**, que es la duda que este prototipo
tiene que despejar.
