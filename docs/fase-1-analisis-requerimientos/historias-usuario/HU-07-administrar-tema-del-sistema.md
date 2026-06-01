# HU-07 Administrar tema del sistema

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [HU-06 Programar procesos](HU-06-programar-procesos.md)
- Siguiente: [Matriz de huecos de fase 1](../01.01-matriz-huecos-fase-1.md)
<!-- nav-guided:end -->

## Como

`Platform Admin`

## Quiero

configurar el tema visual, el idioma y el modo de barra lateral de la consola

## Para

que la plataforma tenga una apariencia y preferencias de presentacion consistentes y gobernadas

## Criterios de aceptacion

- permite consultar la configuracion de tema vigente
- permite ajustar esquema, preset, densidad y colores (`primary`/`error`/`neutral`)
- permite ajustar idioma (`locale`) y modo de barra lateral (`sidebar_mode`)
- el cambio persiste como ajuste unico del sistema y la consola lo refleja

## Reglas de negocio

- la configuracion de tema es un ajuste unico (singleton) del sistema, no por usuario
- solo perfiles administrativos pueden modificarla; `auditor` solo consulta
- los valores deben pertenecer a los catalogos soportados

## Trazabilidad

- RF global `RF-10` · Modulo: administracion del sistema · Feature: `specs/007-tema-del-sistema` · UC: `casos-de-uso/UC-07-configurar-tema.md`
