# Decisiones UX — Conexiones y credenciales

A donde se conecta el Hub. Quien entra aqui suele venir de un fallo: algo dejo de responder y hay
que averiguar si es la red, el usuario o la clave.

## Ficha

- **Dominio**: catalogo de conexiones a bases de datos y colas, con gestion de credenciales por
  referencia. Herramienta interna de administracion.
- **Actor principal**: el administrador que da de alta un destino y rota claves, y el operador que
  a las tres de la manana quiere saber por que "Contabilidad heredada" rechaza al usuario.
- **Tarea principal navegable**: elegir una conexion del listado → ver su detalle → probar la
  salud y leer el error del motor → si la clave caduco, ir a la rotacion y seguir el orden.
- **Golden de referencia**: `saas-operativo-bandeja`, del que se toma el maestro-detalle. El
  contenido y el vocabulario son propios: aqui son motores y bovedas, no expedientes.
- **Patron visual**: maestro-detalle — listado con latido de salud a la izquierda, ficha a la
  derecha — con persianas superiores por seccion.
- **Por que no una shell generica**: porque la tarea es comparar y saltar entre conexiones
  parecidas. Con maestro-detalle se cambia de una a otra sin perder el sitio; con una tabla que
  navega a otra pagina, cada comparacion cuesta dos saltos y se pierde el contexto.
- **Interacciones**: navegar entre las 6 secciones; elegir una conexion del listado y ver cambiar
  la ficha; lanzar la prueba de salud, que recorre sus desenlaces — conectando, con la clave
  caducada, y correcta; consultar quien usa la conexion antes de tocarla; recorrer el orden de
  rotacion de una credencial.

## Contrato del prototipo

- Estados: Responde, Correcta, Vigente, Por caducar, Caducada, Sin usar, Sin coincidencias
- Roles: Administrador, Operador
- Entidades: Conexion, Credencial, Referencia, Dependencia
- RF / HU: RF-001, RF-002, RF-003, RF-004, RF-005

## Por que esta pantalla se ve asi

**El campo de la clave muestra una referencia, no una clave.** `${secreto: base-principal/clave}`
se lee y se entiende: lo que se guarda es el nombre. Asi la definicion se puede exportar,
versionar y revisar sin llevarse el secreto consigo.

**El error del motor se copia tal cual.** `ORA-28001: la contrasena ha caducado` vale mas que un
"no se pudo conectar": es lo que se busca en un manual y lo que se le dice al proveedor.

**Antes de tocar, se ve quien depende.** Ocho dependencias con su horario y su consecuencia. Un
"¿seguro?" generico no informa; "5 procesos se detienen esta noche" si.

**La rotacion se presenta como un orden, no como un formulario.** El paso que mas se salta —
esperar a que no haya procesos en curso — esta senalado como tal.

## Lo que esta pantalla NO hace

No ensena ninguna clave, ni siquiera al administrador. Si hace falta verla, se pide en la boveda,
que deja registro de quien la miro. Aqui solo se apunta a ella.
