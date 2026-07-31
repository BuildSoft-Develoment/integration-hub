# Rollback

> ## ⚠️ Esta release NO es reversible solo con el artefacto
>
> **Rollback = artefacto anterior + restauracion de la base de datos.** No se puede volver atras
> desplegando el binario viejo.
>
> ADR-023 reescribio las 53 migraciones del vertical SWIFT para que sus objetos nazcan en el esquema
> `vertical_mt101`. Reescribirlas les cambio el **checksum**. Como `application-prod.properties`
> declara `quarkus.flyway.migrate-at-start=true`, el artefacto ANTERIOR arranca contra la base NUEVA,
> encuentra checksums que no coinciden con los suyos y **aborta**. No se degrada: no levanta.
>
> Antes de desplegar esta version hay que tener un backup de la base **con el que se pueda volver**, y
> el plan de vuelta atras tiene que restaurarlo. Verificar que el backup existe ANTES, no despues.

> ## ⚠️ Restaurar la base NO revierte los pagos ya despachados
>
> El dinero que salio al banco no vuelve porque se restaure una tabla. Un restore deja el ledger
> (`mt101_pay_dispatch_intent`, `mt101_build_fragment`) diciendo una cosa y al banco habiendo recibido
> otra, y esa desalineacion es peor que el problema que se intentaba resolver: los fragmentos vuelven a
> estado re-pagable y la siguiente corrida puede **pagar dos veces**.
>
> Si hubo despachos entre el backup y el momento del rollback, la conciliacion es manual y previa:
> cruzar lo despachado contra lo que el banco acuso, y solo entonces decidir. Nunca re-ejecutar un
> proceso de pago sobre una base restaurada sin ese cruce.

## Principio

Cada despliegue debe poder revertirse a la version estable previa. Cuando una release cambia el
esquema o el estado del money-path, "revertir" incluye datos, no solo binario.

## Acciones minimas

- conservar artefacto previo
- **verificar que existe backup restaurable de la base ANTES de desplegar**
- restaurar configuracion estable
- validar health checks
- revisar ejecuciones pendientes o fallidas, incluidas las que quedaron en `NEEDS_RECONCILIATION`
- **si hubo pagos despachados: conciliar contra el banco ANTES de reintentar nada**
