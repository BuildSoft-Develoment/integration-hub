# Decisiones UX — Tema del sistema

Donde se ajusta el aspecto de toda la consola. La pantalla se comprueba a si misma: el tema que se
edita es el que se esta viendo.

## Ficha

- **Dominio**: sistema de diseno y personalizacion por cliente de una consola bancaria interna.
- **Actor principal**: quien prepara la instalacion de un banco nuevo y tiene que meter su color
  corporativo sin romper el significado de los estados.
- **Tarea principal navegable**: ver los colores con su funcion → cambiar a modo oscuro y
  comprobar que nada se pierde → revisar las parejas de contraste → decidir que puede cambiar una
  marca y que no.
- **Golden de referencia**: `dashboard-analytics-kpi`, del que se toma la rejilla de tarjetas. El
  muestrario de color y el conmutador claro/oscuro sobre variables son propios.
- **Patron visual**: muestrario de fichas de color, escalas tipograficas en vivo y piezas reales
  de la consola, con un conmutador de modo en la cabecera.
- **Por que no una shell generica**: porque un tema no se juzga leyendo hexadecimales. Esta
  pantalla APLICA lo que muestra: al pulsar "Oscuro" cambian las variables de la raiz y todo —
  tablas, botones, estados, el propio muestrario — responde. Una lista de colores en una tabla
  no permitiria ver que el boton apagado casi desaparece en oscuro.
- **Interacciones**: navegar entre las 6 secciones; conmutar claro/oscuro y ver la consola entera
  cambiar; recorrer la escala tipografica y de espaciado; comprobar contraste medido por parejas;
  revisar que puede personalizar una marca.

## Contrato del prototipo

- Estados: Enviado, Sin confirmar, Rechazado, Solicitado, Sin coincidencias
- Roles: Disenador, Administrador
- Entidades: Color, Escala, Pieza, Pareja, Marca
- RF / HU: RF-001, RF-002, RF-003

## Por que esta pantalla se ve asi

**El tema editado es el tema visible.** Cambiar el modo repinta la pantalla entera, incluido el
muestrario. Es la unica forma honesta de comprobar un tema: mirandolo.

**Cada color lleva su trabajo escrito.** "Sin certeza — no sabemos como acabo, bloquea reintentos"
es mas util que `#c2410c`. Quien cambia un color necesita saber que significado esta tocando.

**Hay una pareja que no llega al minimo, y se dice.** El texto secundario sobre fondo hundido se
queda en 4,1:1 en oscuro. Ocultarlo haria la pantalla mas bonita y menos util.

**Lo que NO se puede personalizar esta en la misma tabla que lo que si.** Un cliente pidio su rojo
corporativo como color de accion; se rechazo porque un boton rojo junto a una fila roja de
"fallido" convierte cada pantalla en una adivinanza. Esa negativa esta escrita aqui, con su razon.

**El brillo de carga se apaga con "reducir movimiento".** Una animacion continua marea a quien la
tiene desactivada, y ahi no aporta informacion.

## Lo que esta pantalla NO hace

No permite cambiar los tres colores de estado. Son semantica compartida con el sector, no
identidad: un verde que significara otra cosa costaria mas que cualquier ventaja de marca.
