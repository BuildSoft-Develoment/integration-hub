# Decisiones UX — Auditoria y observabilidad

Donde se responde "que paso con esto". No se entra a explorar: se entra con una pregunta concreta
y hay que salir con la respuesta.

## Ficha

- **Dominio**: auditoria y observabilidad de una plataforma de integracion. Herramienta interna
  con lectores exigentes: auditores y operaciones.
- **Actor principal**: el auditor que pide el recorrido completo de un pago, y el operador que a
  media manana quiere saber si hoy hay algo raro antes de que llame nadie.
- **Tarea principal navegable**: mirar el pulso del dia → detectar lo que se sale de lo normal →
  buscar el registro concreto → leer su recorrido con horas → bajar al suceso crudo si el resumen
  no basta.
- **Golden de referencia**: `dashboard-analytics-kpi`, del que se toma la fila de medidores con
  tendencia. El resto es propio: la linea de tiempo del registro no existe en ese golden.
- **Patron visual**: medidores con tendencia arriba, luego linea de tiempo vertical del registro,
  sobre fondo de papel claro. Indice superior de secciones, sin raíl.
- **Por que no una shell generica**: porque las dos preguntas de esta pantalla tienen forma
  distinta. "¿Va bien el dia?" es una cifra con tendencia; "¿que paso con QB0417?" es una
  secuencia con horas. Meter las dos en tablas obligaria a reconstruir mentalmente la cronologia,
  que es justo lo que el auditor viene a que le den hecho.
- **Interacciones**: navegar entre las 6 secciones; buscar un registro por referencia o documento;
  bajar del rastro al suceso crudo; consultar la cola de auditoria, que recorre sus desenlaces —
  consultando, con datos, y con el servicio caido; encontrarse con una busqueda sin resultados.

## Contrato del prototipo

- Estados: En curso, Terminada, Detenida, Al dia, Con retraso, Sin confirmar, Sin coincidencias
- Roles: Auditor, Operador
- Entidades: Registro, Suceso, Ejecucion, Cola, Motivo
- RF / HU: RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010

## Por que esta pantalla se ve asi

**El recorrido es una linea de tiempo, no una tabla.** La pregunta "¿que paso?" tiene respuesta
cronologica. Una tabla ordenable obliga a cada persona a reconstruir el orden, y dos personas
reconstruyen distinto.

**El paso pendiente se dibuja en gris, no se omite.** Que la conciliacion este por hacer es
informacion; no ensenarla haria pensar que el recorrido termino.

**Los medidores llevan tendencia.** "41 minutos" no dice nada; "41 cuando lo normal son 37", si.
Una cifra sin su contexto no permite decidir.

**Los datos sensibles van enmascarados tambien aqui.** Un registro de auditoria que filtra cuentas
completas acaba con el acceso restringido, y un registro que nadie puede consultar no audita nada.

**El reparto por causa se ordena por peso.** Dos motivos son el 62% del total: eso dirige una
conversacion con el proveedor del archivo, que es donde se arregla de verdad.

## Lo que esta pantalla NO hace

No permite corregir nada. Es de lectura entera. Un registro de auditoria editable no sirve como
prueba, y aqui la unica funcion es servir como prueba.
