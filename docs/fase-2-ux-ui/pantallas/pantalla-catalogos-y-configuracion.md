# Pantalla de catalogos y configuracion

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Mapa de pantallas y rutas](mapa-pantallas-y-rutas.md)
- Siguiente: [Pantalla de diseno, operacion y trazabilidad](pantalla-diseno-operacion-y-trazabilidad.md)
<!-- nav-guided:end -->

## Objetivo

Definir el patron UX compartido por `sources`, `connections` y `readers`.

## Estructura comun

1. Toolbar superior con busqueda, filtros y accion principal de creacion.
2. Lista o tabla paginada para browsing y seleccion.
3. Drawer lateral para detalle, edicion y acciones de estado.
4. Formularios especializados por tipo de provider o reader.

## Componentes UX que deben mantenerse

- filtros visibles y simples
- seleccion clara del item activo
- drawer reutilizable para modo lectura y modo edicion
- feedback de exito y error consistente
- cambios de estado `active` o `inactive` desde contexto cercano

## Variaciones por dominio

| Pantalla | Diferencia UX relevante |
| --- | --- |
| `sources` | prueba tecnica de fuente y formularios por `filesystem`, `ftp`, `sftp` o `rest` |
| `connections` | prueba tecnica de conexion y manejo de credenciales o secretos |
| `readers` | configuracion de parsing por formato y layout de datos |

## Criterios de diseño

- No mezclar todas las variantes de formulario dentro de la pagina principal.
- Priorizar lectura del catalogo antes que edicion agresiva.
- Mantener botones primarios solo en el drawer para que la lista siga siendo escaneable.
- Mostrar mensajes de prueba o validacion cerca del formulario que los genero.

## Estados criticos

- lista vacia
- error de carga
- edicion sin permisos
- guardado en curso
- prueba tecnica exitosa
- prueba tecnica fallida

## Resultado esperado

Un usuario con permisos puede administrar catalogos sin cambiar de pantalla ni perder el contexto del listado.
