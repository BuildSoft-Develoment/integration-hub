# Product Design Brief - Mensajeria de pagos (SWIFT MT101)

> **Aviso de honestidad.** Este documento se escribio el 2026-08-04, DESPUES de que la consola
> existiera y estuviera en uso. Registra las decisiones que se tomaron durante la construccion y
> por que; **no es un brief previo**, y presentarlo como tal seria falso. Ver
> [prototype-validation.md](prototype-validation.md).

## Contexto

El Hub ya movia datos. Esta feature le anade mover **dinero**, y la diferencia no es tecnica: un
proceso de datos que falla se reintenta sin coste; un pago que falla puede haber salido
igualmente. Toda la experiencia se construye sobre esa asimetria.

## Entradas

- Ficheros de pagos de clientes corporativos (nomina, proveedores), de miles a cientos de miles
  de filas por lote.
- Reglas SWIFT de estructura del mensaje MT101.
- Respuestas del banco: llegan tarde, a veces nunca, y a veces contradicen lo que consta enviado.

## Alternativas

### Alternativa A - Tratar el pago como una tarea mas del motor

Reutilizar el modelo de tareas existente: si falla, se reintenta como cualquier otra. Barato de
construir y coherente con el resto del producto.

**Descartada.** Un reintento automatico sobre un envio que no confirmo es exactamente como se
paga dos veces. El precio de esa coherencia lo pagaria el cliente en dinero real.

### Alternativa B - Un estado propio para "no sabemos"

Anadir un estado que no es exito ni fallo, que **bloquea el reenvio** hasta que alguien concilie
con el banco, con color propio y pantalla propia. Mas caro de construir y rompe la simetria con
el resto del motor.

**Elegida.**

## Recomendacion

Alternativa B, con tres consecuencias que se aceptan a proposito:

1. **La tarea de pago solo se ejecuta una vez.** El selector no ofrece "por lotes": un desplegable
   con una opcion peligrosa acaba elegida algun dia.
2. **Un envio correctivo lo aprueba alguien distinto de quien lo solicito.** Sin excepcion por
   urgencia.
3. **Lo archivado es inmutable.** Corregir crea un lote nuevo con su propia aprobacion; nunca se
   edita lo ya enviado, porque un archivo con huella que cambia deja de servir como prueba.

## Experiencia

- El panel abre con **el dinero sin resolver**, no con un menu ni un saludo.
- El ambar de "sin confirmar" se distingue del rojo de "rechazado" sin leer el texto.
- El motivo de un bloqueo se lee **debajo del boton apagado**, no al pasar el raton: un boton con
  `disabled` nativo no emite eventos de raton, y con teclado no habria forma de enterarse.
- El recorrido de un pago es una linea de tiempo con horas, no una tabla que cada persona ordena
  a su manera.
- Ninguna lista acotada se muestra sin decir cuantos elementos faltan.

## Salidas esperadas

- Consola operable por un turno de manana sin mas formacion que el vocabulario bancario.
- Cero acciones que muevan dinero sin motivo escrito, y doble firma donde corresponde.
- Trazabilidad de extremo a extremo consultable por un auditor sin ayuda tecnica.

## Lo que se decidio NO hacer

- **Editar un importe archivado.** Rompe la cadena de prueba.
- **Reintentar automaticamente un pago sin confirmar.** Es la unica regla que no se negocia.
- **Ocultar el boton de aprobar al solicitante.** Se muestra apagado con su motivo: quien no puede
  actuar necesita entender por que, no dejar de ver la accion.

## Gate

`gate-spdd-approved`: **pendiente**. Aprueba: product_designer / product_owner (humano).
