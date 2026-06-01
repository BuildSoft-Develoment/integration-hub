# Spec tecnica - Tema del sistema

## Componentes relacionados

### Backend (`platform-app`)
- API: `SystemThemeSettingResource` (`/api/system/theme`, `GET` + `PUT`).
- Servicio: `SystemThemeSettingService`; mapeo `SystemThemeSettingApiMapper`.
- Persistencia (Panache): `SystemThemeSettingRepository`.

### Frontend (`frontend/libs/core/services` + `frontend/libs/shared/ui`, Angular/Nx)
- Servicios: `theme.service.ts`, `system-theme-config.service.ts` (aplican el tema en la consola).
- Componente: `app-theme-action` (accion de cambio de tema en el layout).

## Modelo de datos

Tabla `system_theme_setting` (Flyway `V9__system_theme_setting.sql` y `V10__system_theme_setting_locale_sidebar.sql`):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | PK (registro unico / singleton) |
| `scheme` | varchar(20) | esquema (claro/oscuro/auto) |
| `preset` | varchar(20) | preset visual |
| `density` | varchar(20) | densidad de la UI |
| `primary_color` | varchar(20) | color primario |
| `error_color` | varchar(20) | color de error |
| `neutral_color` | varchar(20) | color neutral |
| `locale` | varchar(10) | idioma de la consola (`V10`) |
| `sidebar_mode` | varchar(20) | modo de barra lateral (`V10`) |

Indices: PK en `id`. La tabla mantiene un unico registro (configuracion global del sistema).

## Consideraciones tecnicas

- la configuracion es singleton: `GET` devuelve el registro vigente; `PUT` lo actualiza
- validar que `scheme`/`preset`/`density`/`sidebar_mode` esten dentro de los valores soportados
- el frontend aplica el tema de forma reactiva al recibir la configuracion

## Endpoints (resumen; detalle en `api-contract.md`)

- `GET /api/system/theme` (lectura de la configuracion vigente).
- `PUT /api/system/theme` (actualizacion de la configuracion).

## Pruebas tecnicas sugeridas

- lectura de la configuracion por defecto
- actualizacion de tema/locale/sidebar y persistencia
- control de permisos (escritura admin; lectura incluye `auditor`)
