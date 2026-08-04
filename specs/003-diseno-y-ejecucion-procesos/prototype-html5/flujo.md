# Recorrido del editor de procesos

## El camino normal

1. **Diseno.** Paleta a la izquierda, cadena de nodos en el centro, detalle a la derecha. Se
   selecciona un nodo y el inspector cambia.
2. **Ejecucion en curso.** Las mismas tareas con lo que va pasando en cada una: cuantos registros,
   cuanto tarda, cual espera a cual.
3. **Historial.** Las ultimas corridas. La duracion importa mas que el resultado: una corrida que
   tarda el triple ya es un aviso aunque termine bien.
4. **Tarea detenida.** Que filas la pararon, con nombre y valor, y tres salidas posibles.
5. **Proceso nuevo.** El lienzo en blanco, con la sugerencia de partir de uno que ya funcione.

## Las bifurcaciones que importan

**La tarea que se detiene.** No se pierde el trabajo: se ensena que filas la pararon y se ofrece
mandarlas a cuarentena y seguir, o reanudar desde ahi. Reanudar no repite lo hecho.

**El pago que solo corre una vez.** El selector no ofrece otra opcion. Es la unica tarea con esa
restriccion y esta escrita en pantalla, junto al lienzo.

**El historial que no carga.** Es solo lectura, asi que su caida no toca las ejecuciones — y la
pantalla lo dice, para que nadie pare un proceso sano por una consulta lenta.

## Lo que el recorrido deja fuera

Ejecutar el proceso desde el editor. Lanzar una corrida que mueve dinero es una accion gobernada y
vive en su propia pantalla, con confirmacion.
