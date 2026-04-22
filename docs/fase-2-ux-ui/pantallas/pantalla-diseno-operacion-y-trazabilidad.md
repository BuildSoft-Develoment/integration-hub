# Pantalla de diseno, operacion y trazabilidad

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Pantalla de catalogos y configuracion](pantalla-catalogos-y-configuracion.md)
- Siguiente: [Criterios de wireframes y componentes](../wireframes/criterios-wireframes-y-componentes.md)
<!-- nav-guided:end -->

## Objetivo

Describir el conjunto de pantallas que soporta el ciclo operativo completo: diseno, ejecucion, monitoreo y auditoria.

## Pantallas incluidas

- `overview`
- `processes`
- `executions`
- `schedules`
- `audit`

## Patron UX por pantalla

| Pantalla | Patron principal | Enfoque UX |
| --- | --- | --- |
| `overview` | header + metricas + tablas | lectura rapida y priorizacion |
| `processes` | catalogo + editor lateral especializado | modelado y accion sobre procesos |
| `executions` | catalogo + drawer con detalle navegable | investigacion de corridas y archivos |
| `schedules` | catalogo liviano + drawer operativo | revisar agenda y ejecutar puntualmente |
| `audit` | catalogo + drawer de evento | trazabilidad y evidencia |

## Reglas de experiencia

- `overview` no debe competir con las pantallas de detalle; solo orientar.
- `processes` debe hacer visible el flujo y sus dependencias, no solo una secuencia de formularios.
- `executions` debe priorizar diagnostico: estado, tareas, hijos, archivos y acciones cercanas.
- `schedules` debe dejar clara la diferencia entre una agenda configurada y una ejecucion puntual.
- `audit` debe facilitar busqueda, filtros y lectura de eventos sin ambiguedad.

## Acciones criticas por pantalla

| Pantalla | Acciones criticas |
| --- | --- |
| `overview` | abrir ejecuciones recientes o fallidas |
| `processes` | crear, editar, activar, ejecutar |
| `executions` | abrir detalle, navegar hijas, ejecutar acciones sobre archivos |
| `schedules` | refrescar, abrir detalle, correr agenda seleccionada |
| `audit` | filtrar, seleccionar y revisar evento |

## Riesgos UX a controlar

- sobrecargar `processes` con demasiados controles simultaneos
- perder contexto al navegar entre ejecuciones relacionadas
- duplicar conceptos entre `executions` y `audit`
- dejar `overview` sin señales claras de prioridad

## Resultado esperado

El operador puede pasar de resumen a diagnostico y de diagnostico a evidencia sin romper su hilo mental ni cambiar de patron visual en cada ruta.
