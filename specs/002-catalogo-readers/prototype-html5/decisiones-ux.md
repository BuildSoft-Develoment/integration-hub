# Decisiones UX — Lectores de archivo

Un lector dice como se interpreta un archivo. Quien lo configura no sabe de antemano que trae
dentro: lo averigua mirando.

## Ficha

- **Dominio**: integracion de datos, interpretacion de archivos planos (CSV, TXT de ancho fijo,
  hoja de calculo). Herramienta interna de configuracion.
- **Actor principal**: el analista que recibe un archivo nuevo de un proveedor y tiene que decir
  que significa cada columna antes de que nadie lo procese.
- **Tarea principal navegable**: abrir un lector → ver una muestra real del archivo → mapear cada
  columna a su campo → ensayar la lectura y ver que filas saldrian bien y cuales no.
- **Golden de referencia**: `formulario-complejo`, del que se toma la densidad de campos. La
  disposicion es distinta: aqui manda la vista partida, no el formulario.
- **Patron visual**: vista partida — archivo crudo a la izquierda, mapeo a la derecha — con
  conmutador superior de secciones en forma de pildoras. Sin raíl ni tarjetas.
- **Por que no una shell generica**: porque configurar un lector es comparar dos cosas a la vez.
  Ver el archivo en una pantalla y el mapeo en otra obliga a memorizar, y memorizar es donde se
  cuelan los errores de columna corrida. Con las dos mitades a la vista, el error se ve.
- **Interacciones**: navegar entre las 6 secciones; mapear columnas con selectores; cambiar las
  opciones de formato; lanzar el ensayo de lectura, que recorre sus desenlaces — leyendo, leido
  con una fila descartada, y separador equivocado; marcar posiciones de ancho fijo; encontrarse
  sin archivo de muestra.

## Contrato del prototipo

- Estados: Sin incidencias, Nunca se ejecuto, Fallo el ultimo, Correcta, Moneda invalida, Sin coincidencias
- Roles: Analista, Integrador
- Entidades: Lector, Columna, Campo, Muestra, Fila
- RF / HU: RF-001, RF-002, RF-003, RF-004, RF-005

## Por que esta pantalla se ve asi

**La muestra va primero, siempre.** Un lector configurado sin mirar el archivo es una apuesta. La
linea 6 de la muestra trae `SOL` donde va un codigo de moneda, y eso se descubre aqui en dos
segundos o dentro de 10.000 filas en cuarentena.

**El ensayo no guarda nada.** Se leen unas filas de verdad, con el mapeo puesto, y se ensena el
resultado. Probar tiene que ser barato o nadie prueba.

**El ancho fijo se marca contra la linea real.** Una posicion mal contada desplaza todos los
campos siguientes; sumando de cabeza no se ve, mirando si.

**Las opciones dicen que rompen.** "Confundir el separador decimal multiplica o divide importes
por mil" esta escrito junto al selector, no en un manual.

## Lo que esta pantalla NO hace

No corrige el archivo. Una fila mala va a cuarentena con su motivo y se corrige alli: cambiar el
origen desde el lector dejaria el archivo y lo procesado diciendo cosas distintas.
