# Decisiones UX — Mensajeria de pagos (SWIFT MT101)

Consola de operacion del camino del dinero: construir, validar, archivar, despachar y
conciliar mensajes MT101. Quien la usa no navega: **vigila**. Entra porque algo quedo a
medias y tiene que decidir si se reintenta, se concilia o se para.

## Ficha

- **Dominio**: operacion bancaria de pagos transfronterizos (SWIFT MT101). No es consumo:
  nadie entra a explorar, se entra a resolver algo que quedo abierto.
- **Actor principal**: el aprobador de la mesa de pagos. Turno de manana, revisa el lote del
  dia y decide sobre lo que no cerro solo.
- **Tarea principal navegable**: ver que hay sin resolver → abrir un pago atascado → mirar su
  recorrido completo → conciliarlo o pasarlo a otra persona.
- **Golden de referencia**: `saas-operativo-bandeja` — consola de trabajo densa. Se tomo su
  disposicion (raíl + tablas), no su contenido: los datos, los estados y el vocabulario son de
  pagos SWIFT, no de expedientes.
- **Patron visual**: barra superior fija + raíl de secciones con contadores + tarjetas de cifras
  sobre tablas densas. Las tablas son el sitio correcto aqui: el trabajo ES comparar filas de
  dinero, y las cifras van tabulares para que las columnas se lean de un vistazo.
- **Por que no una shell generica**: porque el raíl lleva **contadores** y las tarjetas abren con
  el dinero sin resolver. Un menu sin cifras obligaria a entrar seccion por seccion para saber
  si hoy hay incidente; aqui se sabe en la primera pantalla, sin un clic.
- **Interacciones**: navegar entre las 6 secciones; conciliar un pago atascado (pide motivo);
  aprobar un reconocimiento de conflicto (con el boton apagado cuando lo pediste tu, y el motivo
  visible debajo); consultar el archivo, que recorre sus tres desenlaces — mientras carga, sin
  coincidencias, y con el servicio caido.

## Contrato del prototipo

- Estados: Sin confirmar, En envio, Aceptado, Rechazado, Retenida, En conflicto
- Roles: Aprobador, Operador, Auditor
- Entidades: Fragmento, Intencion de despacho, Confirmacion, Lote correctivo
- RF / HU: RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-012, RF-013, RF-014, RF-015, RF-016, RF-017, RF-018, RF-019, RF-020, RF-021, RF-022, RF-023, RF-024

Los estados se declaran con las palabras que **se leen en pantalla**, no con los identificadores
internos: un contrato de experiencia describe lo que ve quien usa la consola.

### Estados

- **UNCERTAIN** — se envio o no, no lo sabemos. Es el unico estado que bloquea el reenvio.
- **DISPATCHING** — el envio arranco y nadie lo cerro (proceso caido a mitad).
- **SENT** — el banco acepto.
- **REJECTED** — el banco rechazo.
- **QUARANTINED** — la fila no pudo construirse y espera correccion.
- **PAY_CONFLICT** — el ledger dice SENT y el banco dice REJECTED. Contradiccion terminal.

### Roles

- **Operador** — ve, filtra, corrige filas en cuarentena y solicita reenvios.
- **Aprobador** — aprueba envios correctivos y reconoce conflictos. No puede aprobar lo que
  el mismo solicito.
- **Auditor** — solo lectura, incluido el linaje completo de un pago.

### Alcance frente al spec

- **RF / HU**: RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010,
  RF-011, RF-012, RF-013, RF-014, RF-015, RF-016, RF-017, RF-018, RF-019, RF-020, RF-021,
  RF-022, RF-023, RF-024.

Esa linea enumera los 24 requisitos del spec para dejar constancia de que ninguno se paso por
alto. **No todos se ven en pantalla, y conviene decir cuales no:**

- **Se ven**: construccion, validacion, archivado, despacho, confirmacion y conciliacion
  (RF-001 a RF-010) a traves de los estados de cada pago; el rol de operador de pagos (RF-019);
  la construccion desde tabla paginada (RF-022) en el lote de 10.000; el reproceso correctivo
  con identidad estricta (RF-024) en cuarentena.
- **No se ven, y no es un olvido**: RF-011 y RF-012 (catalogos cargables), RF-013 (modelo de
  datos), RF-014 (cifrado por columna), RF-016 a RF-018 (transportes) y RF-020 y RF-021
  (enmascarado en logs y retencion). No tienen superficie visual: son comportamiento del motor.
  Dibujarlos habria sido inventar pantallas que el producto no tiene.
- **RF-015 (linaje por UETR)** aparece como el paso pendiente de la linea de tiempo, que es
  exactamente su estado real: aun no implementado.
- **RF-018** el propio spec lo declara extension futura fuera del contrato.

### Entidades

- **Fragmento** — un mensaje MT101 construido, con su referencia `:20:`.
- **Intencion de despacho** — el asiento del ledger que dice que se intento pagar.
- **Confirmacion** — la respuesta del banco sobre una referencia.
- **Lote correctivo** — reconstruccion de las filas que fallaron.

## Por que esta pantalla se ve asi

**El panel abre con el dinero en el aire, no con un menu.** La primera cifra que el operador
necesita es cuanto hay sin resolver, porque de eso depende si hoy hay incidente o no. Un
sidenav con "Bienvenido" obligaria a buscar esa cifra; aqui es lo primero que se lee.

**El ambar no es decorativo: separa "malo" de "no sabemos".** UNCERTAIN se pinto durante meses
igual que REJECTED, en rojo, y eso empujaba a tratarlos igual. No son lo mismo: un rechazo se
reintenta, un incierto NO se puede reintentar hasta conciliar, porque el dinero pudo haber
salido. Es la distincion mas cara de la pantalla y por eso tiene color propio.

**El motivo de un bloqueo se lee sin pasar el raton.** Cuando el aprobador es quien solicito el
envio, el boton se apaga y el motivo aparece **debajo, visible**. Un tooltip no vale: un boton
deshabilitado no recibe eventos de raton, asi que el texto no llegaria nunca — y tampoco llega
a quien navega con teclado.

**Las cifras se alinean.** Importes y referencias van en cifras tabulares: comparar columnas de
dinero desalineadas es como se cuelan los errores de un cero de mas.

**El linaje es una linea de tiempo, no una tabla.** Cuando alguien pregunta "que paso con este
pago", la respuesta es una secuencia con horas, no un listado que haya que ordenar mentalmente.

## Lo que esta pantalla NO hace

No permite editar un importe ya archivado. La correccion pasa siempre por un lote nuevo con su
aprobacion: un archivo con checksum que cambia despues de enviarse no seria auditable.
