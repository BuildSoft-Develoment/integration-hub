# Criterios de wireframes y componentes

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Pantalla de diseno, operacion y trazabilidad](../pantallas/pantalla-diseno-operacion-y-trazabilidad.md)
- Siguiente: [Validacion UX con operacion](../validaciones/validacion-ux-con-operacion.md)
<!-- nav-guided:end -->

## Objetivo

Dejar el wireframe funcional de baja fidelidad expresado como estructura de layout y componentes clave, usando como referencia la UI actual.

## Wireframe base para catalogos

```text
+-------------------------------------------------------------+
| Toolbar: buscar | filtros | accion principal                |
+---------------------------+---------------------------------+
| Lista / tabla paginada    | Drawer lateral                  |
| - items                   | - detalle                       |
| - estado                  | - formulario por tipo           |
| - seleccion actual        | - acciones save/test/activate   |
+---------------------------+---------------------------------+
```

Aplicable a:

- `sources`
- `connections`
- `readers`
- `executions`
- `schedules`
- `audit`

## Wireframe base para overview

```text
+-------------------------------------------------------------+
| Header de contexto                                           |
+-------------------+-------------------+---------------------+
| metrica 1         | metrica 2         | metrica 3           |
+-------------------------------------------------------------+
| tabla ejecuciones | tabla fallos      | tabla auditoria     |
+-------------------------------------------------------------+
```

## Wireframe base para editor de procesos

```text
+-------------------------------------------------------------+
| Toolbar + listado de procesos                                |
+---------------------------+---------------------------------+
| Lista de procesos         | Drawer editor                   |
| - filtros                 | - cabecera                      |
| - seleccion               | - overview del proceso          |
|                           | - tareas / flujo               |
|                           | - acciones save/execute        |
+---------------------------+---------------------------------+
```

## Componentes UX obligatorios

- toolbar con filtros y accion principal
- lista o tabla con seleccion visible
- drawer o panel lateral para no romper el contexto
- feedback local y global con reglas consistentes
- estados `loading`, `empty`, `readonly`, `error`, `success`

## Decision de fidelidad

- El proyecto usa wireframes de baja fidelidad documentados aqui y validados con la UI ejecutable.
- No se requiere mockup visual separado si la estructura, estados y recorrido quedan claros.
- Si se crea un mockup externo en el futuro, no reemplaza este documento; debe complementarlo.

## Uso de IA como apoyo

- La IA puede proponer variantes de layout o microcopy.
- La version oficial debe reflejar componentes reales del frontend y restricciones del dominio.
- Cualquier ajuste sugerido por IA debe consolidarse aqui o en la implementacion del frontend.
