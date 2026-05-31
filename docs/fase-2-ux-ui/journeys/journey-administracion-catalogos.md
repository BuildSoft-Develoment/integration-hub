# Journey de administracion de catalogos

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Rubrica de Calidad de Prototipo HTML5](../02.16-rubrica-calidad-prototipo-html5.md)
- Siguiente: [Journey de diseno, ejecucion y seguimiento](journey-diseno-ejecucion-y-seguimiento.md)
<!-- nav-guided:end -->

## Objetivo

Describir el recorrido para dar de alta, validar y mantener fuentes, conexiones y readers usando el patron comun de catalogo + lista + drawer.

## Alcance

- `sources`
- `connections`
- `readers`

## Disparador

Un usuario administrativo necesita registrar o ajustar una configuracion base para que un proceso pueda ejecutarse correctamente.

## Flujo principal

1. El usuario ingresa desde el menu lateral a `sources`, `connections` o `readers`.
2. La pantalla muestra toolbar superior con filtros, buscador y accion de creacion.
3. El usuario revisa la lista paginada y selecciona un elemento para inspeccionarlo.
4. Un drawer lateral abre el detalle del item seleccionado.
5. Si tiene permisos, cambia a modo edicion o crea un nuevo registro.
6. El formulario cambia segun el tipo de provider o reader elegido.
7. El usuario valida datos y ejecuta acciones contextuales como `test connection` o `test source` cuando aplica.
8. La UI muestra feedback local en el panel y feedback global de exito cuando corresponde.
9. El item se guarda, cambia de estado o queda listo para ser usado por procesos.

## Estados UX esperados

- `empty state` cuando no existen registros.
- `loading` en listado y operaciones de guardado.
- `readonly` para perfiles sin permiso de edicion.
- `edit` para formularios activos.
- `test success` con mensaje local y confirmacion global.
- `test error` con mensaje local sin duplicar snack-bar.
- `active` y `inactive` visibles desde lista y detalle.

## Decisiones de experiencia

- Mantener el mismo patron visual para catalogos reduce curva de aprendizaje.
- La lista sirve para seleccion y scanning rapido; el drawer concentra lectura y edicion.
- Los formularios por tipo se separan del contenedor principal para evitar `if` grandes y ruido cognitivo.
- Las pruebas tecnicas se resuelven en contexto, sin sacar al usuario del flujo de configuracion.

## Riesgos UX a vigilar

- formularios largos segun tipo de provider
- mensajes tecnicos demasiado crudos en errores de conectividad
- confusion entre guardar, probar y activar
- diferencias visuales entre `sources`, `connections` y `readers` que rompan el patron comun

## Trazabilidad

- `UC-01 Configurar fuente`
- `UC-02 Configurar reader`
- `HU-01 Administrar fuentes`
- `HU-02 Configurar readers`
- `docs/fase-5-construccion/modulos/frontend-nx-angular.md`
