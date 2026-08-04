# UI Test Cases - Mensajeria de pagos (SWIFT MT101)

Casos de la consola del money-path. Todos son de interaccion: ningun validador automatico los
sustituye, porque lo que comprueban es que una persona entienda lo que ve.

## Pantallas cubiertas

- Panel del dia (dinero sin resolver, aceptados, contradicciones, cuarentena)
- Despacho (intentos abiertos, conciliacion con motivo)
- Conflictos de pago (reconocimiento con cuatro ojos)
- Cuarentena (correccion y lote correctivo)
- Linaje de un pago (recorrido con horas)
- Archivo (consulta de lo cerrado)

## Casos manuales por estado

### Loading / Empty

| # | Caso | Resultado esperado |
|---|---|---|
| L1 | Abrir Archivo con una consulta lenta | Aparece el esqueleto de carga; ninguna cifra a medias |
| L2 | Buscar una referencia inexistente | "Sin coincidencias" nombrando el periodo consultado, no un vacio mudo |
| L3 | Despacho sin intentos atascados | Mensaje de que no hay nada que conciliar, sin tabla vacia |

### Success

| # | Caso | Resultado esperado |
|---|---|---|
| S1 | Conciliar una intencion con motivo escrito | Confirmacion visible y la fila desaparece de atascados |
| S2 | Reconocer un conflicto siendo checker distinto del maker | Aviso de exito y el conflicto queda cerrado a su nombre |
| S3 | Ver el linaje de un pago enviado | Secuencia completa con horas y huella del archivado |

### Error

| # | Caso | Resultado esperado |
|---|---|---|
| E1 | El servicio de archivo no responde | Dice que los pagos NO se ven afectados: es solo lectura |
| E2 | Conciliar sin escribir motivo | El boton no envia; el motivo es obligatorio y se explica |
| E3 | Aprobar un envio cuya configuracion cambio tras solicitarlo | Se invalida la solicitud y se pide volver a solicitar |

### Permission denied

| # | Caso | Resultado esperado |
|---|---|---|
| P1 | Operador sin capacidad de aprobacion abre Conflictos | Ve el conflicto, no ve el boton de aprobar |
| P2 | Auditor entra en Cuarentena | Lectura completa, cero acciones |
| P3 | Aprobador abre un envio que solicito el mismo | Boton apagado y el motivo VISIBLE debajo, no en un tooltip |

## Casos por rol

| Rol | Caso | Resultado esperado |
|---|---|---|
| payments-operator | solicita un envio correctivo | puede solicitar, no puede aprobar |
| payments-approver | aprueba un envio que NO solicito | puede aprobar |
| payments-approver | aprueba un envio que SI solicito | bloqueado, con el motivo legible sin pasar el raton |
| auditor | consulta linaje y archivo | lectura total, ninguna accion |
| platform-admin | opera cuarentena y conflictos | acciones gobernadas con evidencia obligatoria |

## El caso que ningun test automatico cubre

**El color de "sin confirmar".** Que se lea como advertencia y no como error es la distincion que
decide si un operador reintenta un pago que quiza ya salio. Se comprueba mirando la pantalla con
los dos estados juntos, no con una asercion. Durante meses se pinto igual que "rechazado", y
ningun test lo detecto porque ningun test mira.

## Enlaces

- Prototipo navegable: [prototype-html5/index.html](prototype-html5/index.html)
- Decisiones de experiencia: [prototype-html5/decisiones-ux.md](prototype-html5/decisiones-ux.md)
- Requisitos: [spec-funcional.md](spec-funcional.md)
