# UI Test Cases - Tema del sistema

> Feature de reingenieria: la configuracion de tema ya existe en `frontend/libs/core/services`
> (theme.service / system-theme-config.service) y el componente `app-theme-action` del layout.
> Cobertura backend dedicada pendiente de Fase 6.

## Pantallas cubiertas
- Accion/panel de tema en el layout (`app-theme-action`).
- Lectura y guardado de la configuracion (`GET`/`PUT /api/system/theme`).

## Casos manuales por estado

### Loading / Success
- [ ] Al abrir la consola se carga la configuracion vigente (`GET`) y se aplica el tema (RF-001).
- [ ] Cambiar `scheme` (claro/oscuro/auto) actualiza la apariencia y persiste (`PUT`) (RF-002).
- [ ] Cambiar preset/densidad/colores se refleja y persiste (RF-002, RF-003).
- [ ] Cambiar `locale` cambia el idioma de la consola (RF-002).
- [ ] Cambiar `sidebar_mode` cambia el modo de la barra lateral (RF-002).

### Error / Reglas
- [ ] Un valor fuera del catalogo soportado es rechazado.
- [ ] Backend 5xx muestra error y conserva el tema previo.

### Permission denied
- [ ] `auditor` puede ver la configuracion pero no guardarla.
- [ ] Rol sin permiso no accede a la edicion.

## Casos por rol
| Rol | Caso | Resultado esperado |
|---|---|---|
| platform-admin / integration-admin | edita tema/locale/sidebar | exito |
| auditor | consulta configuracion | solo lectura |

## Cobertura automatizada
Trace: `RF-001`..`RF-003`
- Backend: sin clase de prueba dedicada a la fecha (cobertura pendiente de Fase 6).
- e2e de UI: pendiente de Fase 6.
