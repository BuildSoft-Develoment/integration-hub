# Frontend Nx Angular
## Estado actual
El frontend React anterior fue reemplazado por un nuevo workspace Angular 21 sobre Nx en:
- C:\chatgtp\quarkus\frontend
El backup del frontend anterior qued? en:
- C:\chatgtp\quarkus\frontend-react-legacy-20260404
## Stack base validado
- Angular 21
- Nx monorepo
- Angular Material
- Angular CDK
- TailwindCSS
- CSS
- Signals
- Standalone components
- Keycloak con keycloak-js
- Luxon para fechas
- Vitest para unit tests
- Playwright disponible para E2E
- Quinoa integrado con Quarkus
- Hash routing con withHashLocation
## Integraci?n con Quinoa
En [application.properties](C:/chatgtp/quarkus/platform-app/src/main/resources/application.properties):
- quarkus.quinoa.ui-dir=../frontend
- quarkus.quinoa.build-dir=dist/browser
El build validado sale en:
- C:\chatgtp\quarkus\frontend\dist\browser
## Arquitectura base
Se dej? una base orientada a SOLID y extensibilidad en:
- C:\chatgtp\quarkus\frontend\libs\core\providers
- C:\chatgtp\quarkus\frontend\libs\core\services
- C:\chatgtp\quarkus\frontend\libs\shared\ui
- C:\chatgtp\quarkus\frontend\libs\features\sources
### Provider pattern inicial
Primer dominio aterrizado con API real:
- sources
Piezas principales:
- [source-provider.abstract.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/sources/source-provider.abstract.ts)
- [source-provider.token.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/source-provider.token.ts)
- providers concretos:
  - [file-system-source.provider.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/sources/file-system-source.provider.ts)
  - [ftp-source.provider.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/sources/ftp-source.provider.ts)
  - [sftp-source.provider.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/sources/sftp-source.provider.ts)
  - [rest-source.provider.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/sources/rest-source.provider.ts)
- [source-manager.service.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/source-manager.service.ts)
- [source-api.service.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/source-api.service.ts)
- [source-catalog.store.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/source-catalog.store.ts)
- [source-catalog-page.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/source-catalog-page.ts)
- componentes de layout/estrategia:
  - [source-list.component.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/components/source-list/source-list.component.ts)
  - [source-inspector.component.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/components/source-inspector/source-inspector.component.ts)
  - [source-editor.component.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/components/source-editor/source-editor.component.ts)
  - [source-type-form-host.component.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/components/source-type-form/source-type-form-host.component.ts)
Este patr?n est? pensado para repetirse luego en:
- readers
- tasks
- connections
- processes
## Seguridad frontend
Se integr? Keycloak en frontend con:
- [auth.service.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/auth.service.ts)
- [auth.interceptor.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/auth.interceptor.ts)
- [auth.guard.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/auth.guard.ts)
Configuraci?n por defecto alineada con el realm local:
- URL: http://localhost:8180
- Realm: integration-hub
- ClientId: integration-hub-ui
El route sources ya qued? protegido con:
- autenticaci?n
- validaci?n de roles platform-admin, integration-admin, auditor
## Router y fechas
Qued? activado:
- withHashLocation() en [app.config.ts](C:/chatgtp/quarkus/frontend/apps/web/src/app/app.config.ts)
- lazy routing para sources en [app.routes.ts](C:/chatgtp/quarkus/frontend/apps/web/src/app/app.routes.ts)
- base de fechas con Luxon en [date-time.service.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/date-time.service.ts)
## UI actual
Se dej? un shell inicial con:
- sidenav
- toolbar
- theming por signals
- i18n base por signals
- estado de sesi?n y login/logout
- layout con Material + Tailwind
- feature sources responsive con:
  - resumen tipo dashboard
  - lista estilo directory/grid
  - panel lateral de detalle/edici?n
  - formulario por strategy/provider
  - create/edit/activate
Archivos principales:
- [app-shell.component.ts](C:/chatgtp/quarkus/frontend/libs/shared/ui/src/lib/app-shell/app-shell.component.ts)
- [app-shell.component.html](C:/chatgtp/quarkus/frontend/libs/shared/ui/src/lib/app-shell/app-shell.component.html)
- [source-catalog-page.html](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/source-catalog-page.html)
### Patr?n visual actual para sources
/sources qued? como referencia inicial para los siguientes dominios:
- resumen superior con tiles
- lista navegable a la izquierda
- panel lateral a la derecha para inspecci?n o edici?n
- formularios espec?ficos por tipo fuera del page principal
Esto evita crecer con if/switch grandes dentro del contenedor y deja la p?gina lista para repetir el mismo patr?n en:
- connections
- readers
- tasks

## Convenciones actuales

### Nomenclatura de pages

Las pages de feature ya no usan sufijo `.component` en archivos principales.

Patron esperado:

- `*-page.ts`
- `*-page.html`
- `*-page.css`

Ejemplos:

- [source-catalog-page.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/source-catalog-page.ts)
- [schedules-page.ts](C:/chatgtp/quarkus/frontend/libs/features/schedules/src/lib/schedules-page.ts)
- [overview-page.ts](C:/chatgtp/quarkus/frontend/libs/features/overview/src/lib/overview-page.ts)
- [audit-page.ts](C:/chatgtp/quarkus/frontend/libs/features/audit/src/lib/audit-page.ts)

### Regla de uso de `catalog`

Usar `catalog` cuando la feature tiene este patron:

- toolbar de filtros/acciones
- lista o tabla principal
- paginacion
- drawer lateral o panel de detalle/edicion
- store orientado a seleccion, filtros y CRUD

Ejemplos:

- [source-catalog-page.ts](C:/chatgtp/quarkus/frontend/libs/features/sources/src/lib/source-catalog-page.ts)
- [reader-catalog-page.ts](C:/chatgtp/quarkus/frontend/libs/features/readers/src/lib/reader-catalog-page.ts)
- [connection-catalog-page.ts](C:/chatgtp/quarkus/frontend/libs/features/connections/src/lib/connection-catalog-page.ts)
- [process-catalog-page.ts](C:/chatgtp/quarkus/frontend/libs/features/processes/src/lib/process-catalog-page.ts)
- [execution-catalog-page.ts](C:/chatgtp/quarkus/frontend/libs/features/executions/src/lib/execution-catalog-page.ts)

### Regla de uso de `page`

Usar `page` simple cuando la feature representa una pantalla mas directa de:

- resumen
- consulta
- operacion puntual
- lista liviana sin necesidad de un catalogo CRUD completo

Ejemplos:

- [overview-page.ts](C:/chatgtp/quarkus/frontend/libs/features/overview/src/lib/overview-page.ts)
- [audit-page.ts](C:/chatgtp/quarkus/frontend/libs/features/audit/src/lib/audit-page.ts)
- [schedules-page.ts](C:/chatgtp/quarkus/frontend/libs/features/schedules/src/lib/schedules-page.ts)

### Nomenclatura de tokens

La convencion actual de tokens en `core/providers` es explicita por dominio:

- [source-provider.token.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/source-provider.token.ts)
- [reader-provider.token.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/reader-provider.token.ts)
- [connection-provider.token.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/connection-provider.token.ts)
- [process-task-provider.token.ts](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/process-task-provider.token.ts)

### Providers por dominio

Las implementaciones concretas ya no viven mezcladas en una sola carpeta.

Ahora quedan separadas por dominio en:

- [implementations/sources](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/sources)
- [implementations/readers](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/readers)
- [implementations/connections](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/connections)
- [implementations/tasks](C:/chatgtp/quarkus/frontend/libs/core/providers/src/lib/implementations/tasks)

Esto deja mas claro:

- que es contrato abstracto
- que es token
- que es manager
- y que implementacion pertenece a cada dominio

## Feedback y mensajes estandar

Quedo definida una capa transversal de feedback para el frontend Angular:

- presentacion visual:
  - [ui-message.service.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/ui-message.service.ts)
- semantica de mensajes:
  - [app-feedback.service.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/app-feedback.service.ts)
- captura global de errores HTTP:
  - [http-error.interceptor.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/http-error.interceptor.ts)

Regla aplicada:

- operaciones CRUD normales:
  - mostrar `snack-bar` de exito
  - dejar que el interceptor maneje errores HTTP globales
- operaciones contextuales de prueba o validacion, por ejemplo `test connection`:
  - exito:
    - mensaje local en pantalla
    - y `snack-bar` global
  - error:
    - solo mensaje local en la pantalla
    - sin duplicar `snack-bar`

Para evitar duplicacion de mensajes en requests manejados localmente, se usa:

- `SKIP_GLOBAL_ERROR_FEEDBACK`

Ejemplo actual:

- `/connections`
  - `test connection` captura el error en el panel lateral
  - el request de test marca `SKIP_GLOBAL_ERROR_FEEDBACK=true`
  - si el test es exitoso, se mantiene el mensaje del panel y ademas se lanza feedback global

Estado en /sources:

- ya usa el mismo estandar para:
  - create`r
  - update`r
  - ctivate`r
  - deactivate`r
  - 	est source`r
- 	est source ya sigue la misma regla de 	est connection:
  - exito:
    - mensaje local en panel
    - y snack-bar global
  - error:
    - solo mensaje local
    - sin snack-bar duplicado

Esto sirve como patron para futuros casos como:

- `test source`
- `test reader`
- `preview file`
- `validate process`
## Comandos ?tiles
Desde C:\chatgtp\quarkus\frontend:
- 
pm run build
- 
pm run test -- --watch=false
- 
pm run start
## Verificaci?n realizada
Validado en esta fase:
- 
pm run build OK
- 
pm run test -- --watch=false OK
- 2 archivos de test ejecutados
- 3 tests OK
- [http://localhost:8080/](http://localhost:8080/) OK
- [http://localhost:8080/q/health](http://localhost:8080/q/health) OK
## Siguiente paso recomendado
Migrar el siguiente dominio con el mismo patr?n:
- connections
Eso permite aterrizar primero:
- provider abstracto de conexiones
- cat?logo/lista
- formularios modulares por tipo
- uso de secrets ${secret:connections/...} en la nueva UI

## Feedback contextual y severidades
- 	est connection y 	est source siguen la misma regla: exito en panel + snack-bar, error solo en panel.
- Los snackbars ya no usan texto plano directo; ahora pasan por una arquitectura en capas:
  - [app-feedback.service.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/app-feedback.service.ts)
  - [ui-message.service.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/ui-message.service.ts)
  - [ui-message.presentation.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/ui-message.presentation.ts)
  - [ui-message-snackbar.component.ts](C:/chatgtp/quarkus/frontend/libs/core/services/src/lib/ui-message-snackbar.component.ts)
- AppFeedbackService resuelve mensajes semanticos (created, updated, ctivated, deactivated, deleted, 	estSuccess).
- UiMessageService abre el snackbar usando una sola API desde stores y componentes.
- ui-message.presentation.ts resuelve la presentacion por severidad, separando el mapeo kind -> iconografia para mantener SOLID.
- UiMessageSnackbarComponent solo renderiza: titulo, mensaje e icono SVG inline.
- Severidades soportadas:
  - success
  - error
  - warning
  - info
- Diferenciacion visual actual:
  - fondo por severidad
  - borde lateral por severidad
  - titulo de severidad
  - icono SVG propio, sin depender de fonts
