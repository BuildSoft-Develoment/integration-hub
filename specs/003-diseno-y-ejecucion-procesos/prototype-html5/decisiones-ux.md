# Decisiones UX — Diseno y ejecucion de procesos

El editor donde se arma un flujo de tareas y se vigila cuando corre. Es la pantalla mas compleja
del producto: encadena lo que hacen todas las demas.

## Ficha

- **Dominio**: orquestacion de procesos de integracion. Herramienta tecnica interna, no de consumo.
- **Actor principal**: el integrador que arma el flujo, y el operador que a la manana siguiente
  averigua por que la corrida de las tres paro en la tercera tarea.
- **Tarea principal navegable**: abrir el diseno → seleccionar una tarea y ajustar su detalle →
  ver la ejecucion en curso → cuando una tarea se detiene, entender por que y reanudar sin repetir
  lo ya hecho.
- **Golden de referencia**: `iot-industrial-sensores`, del que se toma el fondo oscuro de sala de
  control y la densidad. El contenido es propio: aqui son tareas encadenadas, no sensores.
- **Patron visual**: taller de tres columnas sobre fondo oscuro — paleta de tareas, lienzo de
  nodos encadenados, inspector del nodo seleccionado. Sin tablas como forma principal.
- **Por que no una shell generica**: porque un proceso ES un grafo, y una lista no muestra el
  orden ni la dependencia. Ver los seis nodos encadenados dice de un vistazo que la tarea de pago
  va al final y que nada corre si la anterior falla; una tabla numerada obligaria a reconstruir
  esa forma mentalmente.
- **Interacciones**: navegar entre las 5 secciones; seleccionar un nodo del lienzo y ver su
  detalle cambiar en el inspector; ajustar parametros de la tarea; consultar el historial, que
  recorre sus desenlaces — cargando, con datos, y con el servicio de consulta caido; decidir
  sobre una tarea detenida.

## Contrato del prototipo

- Estados: En curso, Terminada, Detenida, Esperando, Sin coincidencias
- Roles: Integrador, Operador
- Entidades: Proceso, Tarea, Ejecucion, Nodo
- RF / HU: RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-012, RF-013

## Por que esta pantalla se ve asi

**El fondo es oscuro porque se mira largo rato.** Un editor donde se pasa media manana no puede
tener el brillo de un formulario que se rellena en dos minutos.

**Cada tipo de tarea tiene su color, y el color se repite en el nodo.** Arrastrar una pieza naranja
y verla aparecer naranja en el lienzo cierra el circulo sin leer una etiqueta.

**La tarea de pago no ofrece "por lotes".** No es una preferencia escondida: repetir un pago por
lotes podria enviarlo dos veces, asi que el selector directamente no lo lista. Un desplegable con
una opcion peligrosa acaba elegida algun dia.

**Reanudar dice desde donde.** "Reanudar desde la tarea 3 con lo que ya hay" es la diferencia entre
perder cinco minutos y volver a leer diez mil filas.

**La pieza no disponible se ve, apagada, con su motivo.** Esconderla haria pensar que no existe;
mostrarla apagada dice que existe y por que hoy no se puede usar.

## Lo que esta pantalla NO hace

No permite editar una ejecucion pasada. El historial es de lectura: cambiar lo que consta que
ocurrio destruiria el unico registro fiable de que paso esa noche.
