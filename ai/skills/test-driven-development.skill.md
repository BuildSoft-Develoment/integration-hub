---
name: aif-test-driven-development
description: "Usa al implementar una feature o cambio de comportamiento con criterio de aceptacion o contrato; obliga el ciclo red-green-refactor con evidencia verificable. No la uses en cambios solo-doc o investigacion sin codigo."
---

# Skill Test-Driven Development

## Objetivo
Obligar el ciclo red-green-refactor para que el codigo nazca desde criterios verificables.

## Aplicala cuando
- se implementa una feature o cambio de comportamiento,
- existe criterio de aceptacion o contrato,
- el cambio toca reglas de negocio, permisos, datos, API o UX critica.

## No la apliques cuando
- el cambio es solo documental,
- se hace una investigacion sin modificar codigo,
- no existe forma practica de automatizar prueba y debe declararse evidencia manual.

## Entradas minimas
- criterio de aceptacion,
- spec tecnica o contrato,
- archivo o modulo afectado,
- comando de pruebas.

## Flujo recomendado
1. Red: escribe o ajusta una prueba que falle por el comportamiento esperado.
2. Green: implementa lo minimo para pasar.
3. Refactor: mejora nombres, duplicacion y diseno sin cambiar comportamiento.
4. Ejecuta pruebas relevantes.
5. Registra evidencia red-green-refactor.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Agrego tests despues | La prueba guia el cambio |
| No hay tiempo para red | Sin red no sabemos que la prueba valida el cambio |
| Compilar basta | Compilar no demuestra comportamiento |

## Red flags
- No se vio prueba fallar antes.
- La prueba no se relaciona con criterio de aceptacion.
- Se implementa demasiado antes del test.
- Refactor cambia comportamiento sin nueva prueba.

## Verification evidence
- prueba creada o ajustada,
- evidencia de fallo inicial o razon si no fue posible capturarla,
- evidencia de prueba pasando,
- refactor realizado o descartado con razon.

## Referencias
- `../references/feature-delivery-workflow.md`
- `../references/quality-release-and-operations.md`
