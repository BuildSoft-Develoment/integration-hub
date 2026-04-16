# Frontend Nx Angular
## Estado actual
El frontend React anterior fue reemplazado por un nuevo workspace Angular 21 sobre Nx en:
- /frontend
El backup del frontend anterior qued? en:
- /frontend-react-legacy-20260404
## Stack base validado
- Angular 21
- Nx monorepo
- Angular Material
- Angular CDK
- Angular Aria
- TailwindCSS v4
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
En [application.properties](/platform-app/src/main/resources/application.properties):
- quarkus.quinoa.ui-dir=../frontend
- quarkus.quinoa.build-dir=dist/browser
El build validado sale en:
- /frontend/dist/browser
## Arquitectura base
Se dej? una base orientada a SOLID y extensibilidad en:
- /frontend/libs/core/providers
- /frontend/libs/core/services
- /frontend/libs/shared/ui
- /frontend/libs/features/sources
### Provider pattern inicial
Primer dominio aterrizado con API real:
- sources
Piezas principales:
- [source-provider.abstract.ts](/frontend/libs/core/providers/src/lib/sources/source-provider.abstract.ts)
- [source-provider.token.ts](/frontend/libs/core/providers/src/lib/source-provider.token.ts)
- providers concretos:
  - [file-system-source.provider.ts](/frontend/libs/core/providers/src/lib/implementations/sources/file-system-source.provider.ts)
  - [ftp-source.provider.ts](/frontend/libs/core/providers/src/lib/implementations/sources/ftp-source.provider.ts)
  - [sftp-source.provider.ts](/frontend/libs/core/providers/src/lib/implementations/sources/sftp-source.provider.ts)
  - [rest-source.provider.ts](/frontend/libs/core/providers/src/lib/implementations/sources/rest-source.provider.ts)
- [source-manager.service.ts](/frontend/libs/core/services/src/lib/source-manager.service.ts)
- [source-api.service.ts](/frontend/libs/features/sources/src/lib/source-api.service.ts)
- [source-catalog.store.ts](/frontend/libs/features/sources/src/lib/source-catalog.store.ts)
- [source-catalog-page.ts](/frontend/libs/features/sources/src/lib/source-catalog-page.ts)
- componentes de layout/estrategia:
  - [source-list.component.ts](/frontend/libs/features/sources/src/lib/components/source-list/source-list.component.ts)
  - [source-inspector.component.ts](/frontend/libs/features/sources/src/lib/components/source-inspector/source-inspector.component.ts)
  - [source-editor.component.ts](/frontend/libs/features/sources/src/lib/components/source-editor/source-editor.component.ts)
  - [source-type-form-host.component.ts](/frontend/libs/features/sources/src/lib/components/source-type-form/source-type-form-host.component.ts)
Este patr?n est? pensado para repetirse luego en:
- readers
- tasks
- connections
- processes
## Seguridad frontend
Se integr? Keycloak en frontend con:
- [auth.service.ts](/frontend/libs/core/services/src/lib/auth.service.ts)
- [auth.interceptor.ts](/frontend/libs/core/services/src/lib/auth.interceptor.ts)
- [auth.guard.ts](/frontend/libs/core/services/src/lib/auth.guard.ts)
Configuraci?n por defecto alineada con el realm local:
- URL: http://localhost:8180
- Realm: integration-hub
- ClientId: integration-hub-ui
El route sources ya qued? protegido con:
- autenticaci?n
- validaci?n de roles platform-admin, integration-admin, auditor
## Router y fechas
Qued? activado:
- withHashLocation() en [app.config.ts](/frontend/apps/web/src/app/app.config.ts)
- lazy routing para sources en [app.routes.ts](/frontend/apps/web/src/app/app.routes.ts)
- base de fechas con Luxon en [date-time.service.ts](/frontend/libs/core/services/src/lib/date-time.service.ts)
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
- [app-shell.component.ts](/frontend/libs/shared/ui/src/lib/app-shell/app-shell.component.ts)
- [app-shell.component.html](/frontend/libs/shared/ui/src/lib/app-shell/app-shell.component.html)
- [source-catalog-page.html](/frontend/libs/features/sources/src/lib/source-catalog-page.html)
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

- [source-catalog-page.ts](/frontend/libs/features/sources/src/lib/source-catalog-page.ts)
- [schedules-page.ts](/frontend/libs/features/schedules/src/lib/schedules-page.ts)
- [overview-page.ts](/frontend/libs/features/overview/src/lib/overview-page.ts)
- [audit-page.ts](/frontend/libs/features/audit/src/lib/audit-page.ts)

### Regla de uso de `catalog`

Usar `catalog` cuando la feature tiene este patron:

- toolbar de filtros/acciones
- lista o tabla principal
- paginacion
- drawer lateral o panel de detalle/edicion
- store orientado a seleccion, filtros y CRUD

Ejemplos:

- [source-catalog-page.ts](/frontend/libs/features/sources/src/lib/source-catalog-page.ts)
- [reader-catalog-page.ts](/frontend/libs/features/readers/src/lib/reader-catalog-page.ts)
- [connection-catalog-page.ts](/frontend/libs/features/connections/src/lib/connection-catalog-page.ts)
- [process-catalog-page.ts](/frontend/libs/features/processes/src/lib/process-catalog-page.ts)
- [execution-catalog-page.ts](/frontend/libs/features/executions/src/lib/execution-catalog-page.ts)

### Regla de uso de `page`

Usar `page` simple cuando la feature representa una pantalla mas directa de:

- resumen
- consulta
- operacion puntual
- lista liviana sin necesidad de un catalogo CRUD completo

Ejemplos:

- [overview-page.ts](/frontend/libs/features/overview/src/lib/overview-page.ts)
- [audit-page.ts](/frontend/libs/features/audit/src/lib/audit-page.ts)
- [schedules-page.ts](/frontend/libs/features/schedules/src/lib/schedules-page.ts)

### Nomenclatura de tokens

La convencion actual de tokens en `core/providers` es explicita por dominio:

- [source-provider.token.ts](/frontend/libs/core/providers/src/lib/source-provider.token.ts)
- [reader-provider.token.ts](/frontend/libs/core/providers/src/lib/reader-provider.token.ts)
- [connection-provider.token.ts](/frontend/libs/core/providers/src/lib/connection-provider.token.ts)
- [process-task-provider.token.ts](/frontend/libs/core/providers/src/lib/process-task-provider.token.ts)

### Providers por dominio

Las implementaciones concretas ya no viven mezcladas en una sola carpeta.

Ahora quedan separadas por dominio en:

- [implementations/sources](/frontend/libs/core/providers/src/lib/implementations/sources)
- [implementations/readers](/frontend/libs/core/providers/src/lib/implementations/readers)
- [implementations/connections](/frontend/libs/core/providers/src/lib/implementations/connections)
- [implementations/tasks](/frontend/libs/core/providers/src/lib/implementations/tasks)

Esto deja mas claro:

- que es contrato abstracto
- que es token
- que es manager
- y que implementacion pertenece a cada dominio

## Feedback y mensajes estandar

Quedo definida una capa transversal de feedback para el frontend Angular:

- presentacion visual:
  - [ui-message.service.ts](/frontend/libs/core/services/src/lib/ui-message.service.ts)
- semantica de mensajes:
  - [app-feedback.service.ts](/frontend/libs/core/services/src/lib/app-feedback.service.ts)
- captura global de errores HTTP:
  - [http-error.interceptor.ts](/frontend/libs/core/services/src/lib/http-error.interceptor.ts)

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
Desde /frontend:
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
  - [app-feedback.service.ts](/frontend/libs/core/services/src/lib/app-feedback.service.ts)
  - [ui-message.service.ts](/frontend/libs/core/services/src/lib/ui-message.service.ts)
  - [ui-message.presentation.ts](/frontend/libs/core/services/src/lib/ui-message.presentation.ts)
  - [ui-message-snackbar.component.ts](/frontend/libs/core/services/src/lib/ui-message-snackbar.component.ts)
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

## Feature processes

La feature `/processes` ya no usa un store monolitico. Quedo separada por capas con `signals`, una fachada estable para la pagina y componentes mas pequenos en el editor.

### Estructura actual

- pagina:
  - [process-catalog-page.ts](/frontend/libs/features/processes/src/lib/process-catalog-page.ts)
  - [process-catalog-page.html](/frontend/libs/features/processes/src/lib/process-catalog-page.html)
- fachada publica:
  - [process-catalog.store.ts](/frontend/libs/features/processes/src/lib/process-catalog.store.ts)
- query de catalogo:
  - [process-catalog-query.store.ts](/frontend/libs/features/processes/src/lib/process-catalog-query.store.ts)
- comandos:
  - [process-catalog-command.service.ts](/frontend/libs/features/processes/src/lib/process-catalog-command.service.ts)
- editor:
  - [process-editor.store.ts](/frontend/libs/features/processes/src/lib/process-editor.store.ts)
- referencias:
  - [process-reference.store.ts](/frontend/libs/features/processes/src/lib/process-reference.store.ts)

### Responsabilidades

- `ProcessCatalogPageComponent`
  - expone `viewModel()` para lectura
  - traduce eventos de UI a comandos explicitos
- `ProcessCatalogStore`
  - mantiene una API estable hacia la pagina
  - coordina query, editor, referencias y comandos
- `ProcessCatalogQueryStore`
  - listado
  - filtros
  - paginacion
  - debounce de busqueda
  - refresh del item seleccionado
- `ProcessCatalogCommandService`
  - `save`
  - `toggleActive`
  - `execute`
  - feedback al usuario
- `ProcessEditorStore`
  - drawer
  - seleccion
  - formulario
  - flow y tareas
- `ProcessReferenceStore`
  - carga y cache de `sources`, `readers` y `connections`
  - lazy load cuando el editor realmente lo necesita

### Flujo actual

#### Listado inicial

1. la pagina llama `store.load()`
2. `ProcessCatalogStore` delega en `ProcessCatalogQueryStore`
3. se carga solo el catalogo
4. las referencias no se cargan al entrar a la ruta

#### Apertura del editor

1. la pagina dispara `selectProcess`, `startCreate` o `startEdit`
2. `ProcessCatalogStore` llama `prepareEditor()`
3. `ProcessReferenceStore.ensureLoaded()` resuelve referencias si aun no existen
4. `ProcessEditorStore` abre el drawer y prepara estado y formulario

#### Guardado o ejecucion

1. la pagina llama `store.save()` o `store.execute()`
2. `ProcessCatalogStore` delega en `ProcessCatalogCommandService`
3. el comando usa `ProcessApiService`
4. se refresca el catalogo via `ProcessCatalogQueryStore.reload()`
5. el editor conserva el contexto necesario

### Editor dividido

El editor visual tambien fue partido para bajar mezcla de responsabilidades:

- shell:
  - [process-editor.component.ts](/frontend/libs/features/processes/src/lib/components/process-editor/process-editor.component.ts)
- header:
  - [process-editor-header.component.ts](/frontend/libs/features/processes/src/lib/components/process-editor/process-editor-header.component.ts)
- acciones readonly:
  - [process-editor-actions.component.ts](/frontend/libs/features/processes/src/lib/components/process-editor/process-editor-actions.component.ts)
- overview:
  - [process-editor-overview.component.ts](/frontend/libs/features/processes/src/lib/components/process-editor/process-editor-overview.component.ts)

### Testing

La feature ya cuenta con specs propios:

- [process-catalog.store.spec.ts](/frontend/libs/features/processes/src/lib/process-catalog.store.spec.ts)
- [process-editor.store.spec.ts](/frontend/libs/features/processes/src/lib/process-editor.store.spec.ts)
- [process-reference.store.spec.ts](/frontend/libs/features/processes/src/lib/process-reference.store.spec.ts)

Validacion reciente:

- `npm.cmd run test -- --watch=false` OK
- `npm.cmd run build` OK

### Regla de mantenimiento

Para cambios futuros en `processes`:

- cambios de listado -> `ProcessCatalogQueryStore`
- cambios de persistencia o acciones -> `ProcessCatalogCommandService`
- cambios de formulario o flow -> `ProcessEditorStore`
- nuevas referencias externas -> `ProcessReferenceStore`
- composicion visual -> pagina o componentes presentacionales

## Convencion SOLID actual por feature

La convencion actual del frontend busca seguir la misma direccion de dependencias que el backend:

- providers y managers como frontera de infraestructura
- stores y command services como capa de aplicacion de la feature
- components y pages como capa de presentacion

### Regla de dependencias

- `core/providers`
  - define contratos, tokens e implementaciones concretas por dominio
- `core/services`
  - expone managers y servicios transversales
  - los managers coordinan providers concretos
- `features/*`
  - consumen managers, APIs y stores
  - no deberian conocer implementaciones concretas de providers
- `page providers`
  - se usan solo para estado por pantalla y servicios con ciclo de vida de ruta
  - no para infraestructura compartida

### Patron recomendado para features catalogo

Cuando una feature tiene lista, filtros, seleccion, drawer y acciones, la estructura objetivo es:

- `*-catalog-page`
  - compone UI
  - expone `viewModel()` basado en `signals`
  - traduce eventos de UI a comandos explicitos
- `*-catalog.store`
  - fachada delgada y estable para la pagina
  - coordina stores y servicios internos
- `*-catalog-query.store`
  - listado
  - filtros
  - paginacion
  - seleccion y refresh del catalogo
- `*-catalog-command.service`
  - persistencia
  - acciones laterales como `test`, `toggleActive` o `execute`
  - feedback al usuario
- `*-editor-state.service` o `*-editor.store`
  - formulario
  - draft
  - view mode
  - estado local del editor

### Regla de `providers` por pagina

La pagina debe proveer solo las piezas stateful de la feature. Ejemplo tipico:

- `CatalogStore`
- `CatalogQueryStore`
- `CatalogCommandService`
- `EditorStateService`

Los managers siguen resolviendose por DI global, normalmente desde `core/services`, para mantener:

- `SRP`
- `DIP`
- `OCP`

### Base compartida de editor

Para evitar duplicacion entre features con comportamiento parecido, ahora existe:

- [managed-editor-state.base.ts](/frontend/libs/core/services/src/lib/managed-editor-state.base.ts)

Esta base concentra:

- `viewMode`
- `form`
- `draft`
- `formTitle`
- `startCreate`
- `startEdit`
- `cancelEdit`
- `patchForm`
- `updateFormField`
- resolucion del item seleccionado

Cada feature conserva solo su logica particular.

## Feature executions

La feature `/executions` quedo alineada al mismo patron de capas con `signals` y specs propios.

### Estructura actual

- pagina:
  - [execution-catalog-page.ts](/frontend/libs/features/executions/src/lib/execution-catalog-page.ts)
  - [execution-catalog-page.html](/frontend/libs/features/executions/src/lib/execution-catalog-page.html)
- fachada:
  - [execution-catalog.store.ts](/frontend/libs/features/executions/src/lib/execution-catalog.store.ts)
- query:
  - [execution-catalog-query.store.ts](/frontend/libs/features/executions/src/lib/execution-catalog-query.store.ts)
- detalle:
  - [execution-detail.store.ts](/frontend/libs/features/executions/src/lib/execution-detail.store.ts)
- comandos:
  - [execution-catalog-command.service.ts](/frontend/libs/features/executions/src/lib/execution-catalog-command.service.ts)
- editor:
  - [execution-editor.store.ts](/frontend/libs/features/executions/src/lib/components/execution-editor/execution-editor.store.ts)
- archivos:
  - [execution-files-panel.store.ts](/frontend/libs/features/executions/src/lib/components/execution-files-panel/execution-files-panel.store.ts)

### Regla de mantenimiento

- cambios de listado -> `ExecutionCatalogQueryStore`
- cambios de detalle o lineage -> `ExecutionDetailStore`
- cambios de acciones sobre archivos -> `ExecutionCatalogCommandService`
- cambios de estado local del editor -> `ExecutionEditorStore`
- cambios de seleccion y filtros de archivos -> `ExecutionFilesPanelStore`

## Familia sources, connections y readers

Las features `/sources`, `/connections` y `/readers` quedaron alineadas entre si para reducir mezcla y duplicacion.

### Estructura actual por feature

- page:
  - `*-catalog-page`
- fachada:
  - `*-catalog.store`
- query:
  - `*-catalog-query.store`
- comandos:
  - `*-catalog-command.service`
- editor:
  - `*-editor-state.service`

### Relacion con managers y providers

- `SourceManagerService`, `ConnectionManagerService` y `ReaderManagerService`
  - siguen siendo la frontera de dominio hacia providers
- `CatalogCommandService`
  - usa manager + api service
- `EditorStateService`
  - resuelve draft e hidratacion a traves del manager
- `CatalogStore`
  - no conoce implementaciones concretas de providers

### Regla de mantenimiento

- cambios de listado/filtros -> `QueryStore`
- cambios de `save`, `test`, `toggleActive` -> `CommandService`
- cambios de editor o draft -> `EditorStateService`
- cambios visuales -> page y componentes presentacionales

## Testing por feature

La convencion actual es dejar specs propios dentro de cada libreria de feature y hacer que el target de tests de `apps/web` los incluya.

Ejemplos recientes:

- `processes`
  - [process-catalog.store.spec.ts](/frontend/libs/features/processes/src/lib/process-catalog.store.spec.ts)
  - [process-editor.store.spec.ts](/frontend/libs/features/processes/src/lib/process-editor.store.spec.ts)
  - [process-reference.store.spec.ts](/frontend/libs/features/processes/src/lib/process-reference.store.spec.ts)
- `executions`
  - [execution-catalog-query.store.spec.ts](/frontend/libs/features/executions/src/lib/execution-catalog-query.store.spec.ts)
  - [execution-detail.store.spec.ts](/frontend/libs/features/executions/src/lib/execution-detail.store.spec.ts)
  - [execution-catalog-command.service.spec.ts](/frontend/libs/features/executions/src/lib/execution-catalog-command.service.spec.ts)
  - [execution-editor.store.spec.ts](/frontend/libs/features/executions/src/lib/components/execution-editor/execution-editor.store.spec.ts)
  - [execution-files-panel.store.spec.ts](/frontend/libs/features/executions/src/lib/components/execution-files-panel/execution-files-panel.store.spec.ts)
- `sources`
  - [source-editor-state.service.spec.ts](/frontend/libs/features/sources/src/lib/source-editor-state.service.spec.ts)
  - [source-catalog-query.store.spec.ts](/frontend/libs/features/sources/src/lib/source-catalog-query.store.spec.ts)
  - [source-catalog-command.service.spec.ts](/frontend/libs/features/sources/src/lib/source-catalog-command.service.spec.ts)
- `connections`
  - [connection-editor-state.service.spec.ts](/frontend/libs/features/connections/src/lib/connection-editor-state.service.spec.ts)
  - [connection-catalog-query.store.spec.ts](/frontend/libs/features/connections/src/lib/connection-catalog-query.store.spec.ts)
  - [connection-catalog-command.service.spec.ts](/frontend/libs/features/connections/src/lib/connection-catalog-command.service.spec.ts)
- `readers`
  - [reader-editor-state.service.spec.ts](/frontend/libs/features/readers/src/lib/reader-editor-state.service.spec.ts)
  - [reader-catalog-query.store.spec.ts](/frontend/libs/features/readers/src/lib/reader-catalog-query.store.spec.ts)
  - [reader-catalog-command.service.spec.ts](/frontend/libs/features/readers/src/lib/reader-catalog-command.service.spec.ts)

Validacion reciente:

- `npm.cmd run test -- --watch=false` OK
- `npm.cmd run build` OK
- `60` tests pasando
