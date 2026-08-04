# Decisiones UX — Catalogo de fuentes de datos

De donde salen los datos que entran al Hub. Quien usa esta pantalla da de alta un origen y,
sobre todo, averigua por que uno que funcionaba dejo de responder.

## Ficha

- **Dominio**: integracion de datos, catalogo de origenes (SFTP, FTP, almacen de objetos,
  sistema de archivos, servicio web). Es una herramienta interna, no un producto de consumo.
- **Actor principal**: el integrador que conecta un sistema nuevo, y el operador que a las tres
  de la manana quiere saber por que un proceso no encontro su archivo.
- **Tarea principal navegable**: ver el catalogo → detectar la fuente que no responde → probar la
  conexion y leer el error → corregir los datos y volver a probar.
- **Golden de referencia**: `saas-operativo-bandeja`, del que se toma la densidad de informacion.
  La disposicion es distinta a proposito: aqui son tarjetas, no una bandeja.
- **Patron visual**: rejilla de tarjetas de conector con pulso de salud, mas pestanas superiores.
  Sin raíl lateral.
- **Por que no una shell generica**: porque la pregunta que trae aqui a la gente es "¿cual esta
  caida?", y eso se responde de un vistazo con seis tarjetas y un punto de color. Una tabla
  obligaria a leer una columna de estado fila por fila para lo mismo. Cuando las fuentes se
  cuentan por decenas la tabla ganaria; con las que hay, no.
- **Interacciones**: navegar entre las 5 secciones; recorrer el alta guiada en 3 pasos con el
  boton de guardar apagado hasta que la conexion responda; lanzar la prueba de conexion, que
  recorre sus tres desenlaces — mientras conecta, con error de huella, y correcta; buscar en el
  catalogo y encontrarse sin coincidencias.

## Contrato del prototipo

- Estados: Responde, Lenta, No responde, Sin coincidencias
- Roles: Integrador, Operador
- Entidades: Fuente, Conexion, Archivo, Lectura
- RF / HU: RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008

Los estados se declaran con las palabras que aparecen en pantalla. "No responde" es
deliberadamente mas claro que un codigo de error: quien mira a las tres de la manana necesita
saber si el problema es suyo o del otro extremo.

## Por que esta pantalla se ve asi

**El pulso de salud va en la tarjeta, no en una columna.** Un punto de color junto al nombre se
lee sin enfocar la vista. Es la unica informacion que alguien busca cuando entra con prisa.

**Guardar esta apagado hasta que la prueba responda.** Una fuente que no se puede leer no sirve,
y guardarla solo crea un proceso que fallara mas tarde, mas lejos y con menos contexto. Es mas
barato impedirlo aqui.

**El error de conexion se cuenta paso a paso.** "No se pudo conectar" no ayuda a nadie. Decir que
el DNS resolvio, que el puerto abrio y que la huella del servidor no coincide convierte una
llamada al proveedor en una accion concreta.

**La credencial no se guarda en la definicion.** El formulario lo dice donde se escribe, no en la
documentacion: es donde se lee.

## Lo que esta pantalla NO hace

No borra una fuente en uso sin avisar. Desactivar dice cuantos procesos dependen de ella, porque
el coste de una fuente eliminada por error no se paga aqui sino en la ejecucion de esta noche.
