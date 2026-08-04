# Recorrido del catalogo de fuentes

## El camino normal

1. **Catalogo.** Seis tarjetas, un punto de color cada una. Si todos son verdes, la visita acaba
   aqui — que es el caso la mayoria de los dias.
2. **Alta guiada.** Tres pasos: que tipo de origen, como se conecta, que archivos leer. El boton
   de guardar no se enciende hasta que la conexion responda.
3. **Prueba de conexion.** Se conecta de verdad y lista lo que encuentra. Si falla, dice en que
   paso: resolver el nombre, abrir el puerto, negociar la clave.
4. **Detalle.** El historial de lecturas de una fuente, con filas leidas y descartadas.
5. **Busqueda.** Por nombre, servidor o ruta.

## Las bifurcaciones que importan

**La fuente que no responde.** Es lo que trae a la gente aqui. Del catalogo se salta directo a la
prueba, y la prueba explica el fallo por pasos en vez de con un "error de conexion" que no permite
actuar.

**El alta que no se puede guardar.** Guardar una fuente ilegible solo aplaza el fallo hasta la
ejecucion de esta noche, donde costara mas caro y con menos contexto.

**La desactivacion con dependencias.** Antes de desactivar se dice cuantos procesos la usan. Sin
ese dato la decision se toma a ciegas.

## Lo que el recorrido deja fuera

Editar las credenciales desde el detalle. Viven en el almacen de secretos y se cambian alli; la
pantalla solo dice cual usa, nunca su valor.
