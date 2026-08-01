# ADR-012 Frontend modular extensible por contribuciones

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Estado

Aceptado e implementado parcialmente.

## Contexto

La consola `frontend/` debe crecer con modulos internos y, a futuro, con
extensiones o plugins instalables desde fuera. Si cada modulo modifica el shell,
la navegacion, los permisos o los formularios directamente, la plataforma pierde
gobernanza y aumenta el riesgo de colisiones entre equipos o proveedores.

La arquitectura actual ya usa Angular/Nx, rutas lazy, guards y librerias
compartidas. El siguiente paso es exponer contratos estables para que los
modulos se registren como contribuciones, igual que haria un plugin externo.

## Decision

El frontend adopta un modelo de **contribuciones declarativas validadas**.

Las extensiones no deben acoplarse al shell ni manipular navegacion global de
forma imperativa. Deben declarar contratos:

- `AppPluginManifest`: identidad, version, version de plataforma, capabilities y
  contribuciones.
- `AppNavigationContribution`: entradas de navegacion con `id`, `route`,
  `labelKey`, `requiredCapability`, `source`, `group` y `order`.
- `AppRouteContribution`: rutas exponibles por un modulo/plugin.
- `AppWorkspaceContribution`: superficies internas de un workspace, clasificadas
  como `query`, `operation` o `configuration`.
- `AppActionContribution`: acciones declarativas para toolbars, registros,
  workspaces o acciones globales. Una accion puede ser `command`, `navigation`
  o `external-link`, pero siempre publica metadata y no funciones remotas.

La primera implementacion real aplica al shell de navegacion:

- `APP_PLUGIN_MANIFESTS` registra manifiestos internos o externos.
- `provideAppPluginManifests(...)` registra el manifiesto y traduce sus
  contribuciones de navegacion al SPI vigente.
- `buildAppPluginRegistry(...)` valida identidad, version de plataforma,
  duplicados de rutas/workspaces y colisiones de navegacion.
- `buildAppRoutesFromPluginManifests(...)` materializa rutas Angular desde los
  manifests validados y conserva `pluginSource`/`pluginRouteId` en `data`.
- `APP_WORKSPACE_CONTRIBUTIONS` registra superficies internas de workspaces y
  `normalizeWorkspaceContributions(...)` valida/ordena esas superficies.
- `APP_ACTION_CONTRIBUTIONS` registra acciones declarativas y
  `normalizeActionContributions(...)` valida `id`, `labelKey`, duplicados y el
  campo obligatorio segun tipo de accion: `command`, `route` o `href`.
- `APP_ACTION_COMMAND_HANDLERS` registra handlers de comandos instalados por
  provider estatico. `AppActionExecutor` resuelve acciones declarativas hacia
  navegacion Angular, enlaces externos seguros o comandos con handler local.
- `AppActionQueryService` filtra acciones visibles por `placement`, `group`,
  `source`, `kind`, capability y ejecutabilidad. Tambien adapta acciones al
  contrato `ActionBarAction` para toolbars flotantes u otras superficies.
- `AppPluginRuntimeRegistry` centraliza manifests estaticos y manifests externos
  metadata-only cargados en runtime.
- `provideExternalAppPluginManifestCatalog(...)` carga
  `/plugins/catalog.json` durante el bootstrap. El catalogo externo no puede
  declarar rutas Angular ejecutables; solo puede aportar metadata hacia rutas ya
  instaladas.
- `/plugins/catalog.schema.json` publica el contrato JSON Schema del catalogo
  metadata-only para proveedores externos y tooling de edicion.
- `npm run validate:plugins` valida el catalogo externo antes de publicar:
  identidad, version compatible, capabilities conocidas, duplicados y enlaces
  solamente hacia rutas instaladas del shell.
- Las acciones metadata-only del catalogo externo se validan contra rutas
  instaladas del shell y solo permiten enlaces externos `https://`.
- El validador rechaza propiedades fuera del contrato publico para evitar
  errores silenciosos por typos o campos no gobernados.
- `web:build` depende de `web:validate-plugins`, por lo que el build productivo
  falla antes de compilar si el catalogo externo rompe el contrato.
- `web:test-plugins` valida el catalogo real y ejecuta pruebas del validador
  contra casos de rutas remotas, rutas desconocidas, duplicados y permisos.
- Las pruebas del gate verifican que las rutas y capabilities del JSON Schema
  permanezcan sincronizadas con el validador.
- `scripts/manage-plugin-catalog.js` permite instalar, reemplazar, listar y
  retirar manifests metadata-only con validacion antes de escribir el catalogo.
- `provideAppPluginRegistryValidation(...)` ejecuta la validacion en bootstrap
  para fallar temprano ante un plugin incompatible.
- `APP_NAVIGATION_CONTRIBUTIONS` es un multi-provider.
- `provideAppNavigationContributions(...)` registra contribuciones internas o de
  plugins.
- `normalizeNavigationContributions(...)` ordena y valida duplicados por `id` y
  `route`.
- `AppNavigationComponent` consume contribuciones y filtra por capability.
- La navegacion existente de la plataforma se registra como manifest interno
  `platform`.
- Las rutas internas de la plataforma tambien se declaran en el manifest
  `platform`; `app.routes.ts` ya no define rutas de negocio a mano.
- El workspace `/audit/*` consume superficies desde el manifest `platform` en
  vez de mantener una lista hardcodeada en el componente.

## Consecuencias

- Los modulos internos empiezan a comportarse como plugins instalados.
- Un plugin externo no puede sobrescribir silenciosamente una ruta o entrada de
  menu existente: la normalizacion falla por duplicado.
- Un plugin incompatible por version de plataforma no debe iniciar dentro del
  shell.
- El shell conserva control de permisos, orden y navegacion.
- El router conserva lazy loading y guards por capability, pero la fuente de
  verdad pasa a ser el manifest.
- Los workspaces funcionales pueden extenderse por contribuciones de plugin,
  filtradas por `group` y capability.
- Las acciones de UI quedan desacopladas de su resolucion: el plugin declara un
  comando simbolico, ruta o enlace seguro; el shell o una facade publica decide
  como ejecutarlo.
- Los comandos extensibles solo se ejecutan si existe un handler registrado por
  DI estatica, evitando que el catalogo JSON aporte comportamiento remoto.
- Los componentes de feature no deben consultar manifests directamente para
  acciones. Deben consumir `AppActionQueryService` y ejecutar por
  `AppActionExecutor`, manteniendo una frontera estable entre UI y SPI.
- Cuando una feature registra handlers en su injector local, tambien debe
  proveer `AppActionExecutor`/`AppActionQueryService` en ese scope para que la
  resolucion vea los handlers del modulo.
- `connections` queda como primera feature migrada: sus acciones bulk
  `activate`/`deactivate` se declaran en el manifest `platform`, se consultan
  por `AppActionQueryService` y se ejecutan con handlers locales.
- Los manifests JSON externos quedan limitados a metadata. Un plugin con codigo
  Angular debe registrarse mediante provider estatico y pasar por build/release.
- El contrato queda preparado para extender el mismo patron a rutas, workspaces,
  acciones, formularios y validadores.
- La instalacion runtime/remota de codigo aun no queda implementada; esta ADR
  establece la base de SPI frontend, runtime registry metadata-only y los
  primeros puntos de extension.

> **Superado en parte por [ADR-013](ADR-013-frontend-module-federation-remote-plugins.md).** Los dos
> puntos de arriba —"manifests JSON externos limitados a metadata" y "la instalacion remota aun no
> queda implementada"— describian el estado de esta decision y dejaron de ser ciertos: ADR-013
> anadio el canal `remote` por Native Federation, con firma ECDSA P-256, verificacion de integridad
> SRI y allowlist de origen, y esta implementado y en verde. Lo que sigue vigente de esta ADR es la
> prohibicion de declarar **rutas Angular** desde el catalogo (`routes` en `maxItems: 0`).
>
> No se reescribe el cuerpo: una ADR es un registro fechado de lo que se decidio entonces. Lo que se
> anota es la supersesion.

## Reglas

- Toda extension debe declarar `id`, `version`, `platformVersion` y `source`.
- El `platformVersion` debe ser exacto o compatible por major version con la
  version de extension soportada por el shell.
- Toda contribucion visible debe tener `labelKey` i18n.
- Toda contribucion sensible debe declarar `requiredCapability`.
- Las rutas y ids deben ser unicos.
- El shell no importa componentes de plugins directamente; consume contratos.
- Los plugins no acceden a servicios internos salvo mediante facades publicas.
- Un manifest externo cargado desde JSON no puede declarar `loadChildren`,
  `loadComponent` ni rutas nuevas; sus enlaces deben apuntar a rutas conocidas
  del shell.
- Una accion externa de tipo `navigation` debe apuntar a una ruta instalada del
  shell; una accion `external-link` solo puede usar `https://`; una accion
  `command` solo publica un identificador simbolico.
- Un `command` solo puede ejecutarse mediante `APP_ACTION_COMMAND_HANDLERS`;
  handlers duplicados para un mismo comando fallan en runtime controlado.
- Todo cambio en `frontend/apps/web/public/plugins/catalog.json` debe pasar
  `npm run validate:plugins` o `npx nx run web:validate-plugins` antes de
  build/release.
- El catalogo versionado debe declarar `"$schema": "./catalog.schema.json"`; un
  `$schema` distinto falla en el gate local.

## Flujo de instalacion metadata-only

1. El proveedor entrega un manifest JSON con `id`, `version`,
   `platformVersion`, `displayName`, `navigation`, `workspaces` y/o `actions`.
2. El proveedor valida/autocompleta el archivo con
   `frontend/apps/web/public/plugins/catalog.schema.json`.
3. El equipo de plataforma revisa que el manifest apunte a rutas ya instaladas
   por un modulo estatico del shell.
4. Se instala con `npm run plugins:install -- <manifest.json>` o se prueba con
   `--dry-run`.
5. Se ejecuta `npm run validate:plugins` desde `frontend/`.
6. Si el catalogo pasa, se ejecutan build, pruebas y publicacion del frontend.

Este flujo no habilita carga remota de codigo. Un plugin con componentes,
rutas Angular o dependencias propias debe entrar como artefacto de build
controlado y provider estatico, con ADR o ampliacion explicita del contrato.

> Esa ampliacion explicita **ocurrio**: es [ADR-013](ADR-013-frontend-module-federation-remote-plugins.md),
> que abrio el canal `remote` gobernado. Este parrafo se conserva porque describe la puerta que
> ADR-012 dejo abierta a proposito, no una prohibicion vigente.

## Evidencia

- Contratos y registries:
  `frontend/libs/shared/ui/src/lib/app-layout/navigation/*` y
  `frontend/libs/shared/ui/src/lib/app-layout/plugins/*`.
- Provider de la plataforma: `frontend/apps/web/src/app/core/app-navigation.providers.ts`.
- Pruebas: `app-navigation.registry.spec.ts` y `app-plugin.registry.spec.ts`.
- Rutas desde manifest: `app-plugin.routes.spec.ts` y
  `frontend/apps/web/src/app/core/platform-plugin.manifest.ts`.
- Workspaces desde manifest: `app-workspace.registry.spec.ts` y
  `audit-workspace-nav.component.spec.ts`.
- Acciones declarativas:
  `frontend/libs/shared/ui/src/lib/app-layout/plugins/app-action.registry.ts`
  y `app-action.registry.spec.ts`.
- Ejecucion gobernada de acciones:
  `frontend/libs/shared/ui/src/lib/app-layout/plugins/app-action.executor.ts`,
  `app-action.command.ts` y `app-action.executor.spec.ts`.
- Consulta/adaptacion de acciones:
  `frontend/libs/shared/ui/src/lib/app-layout/plugins/app-action.query.ts` y
  `app-action.query.spec.ts`.
- Consumo real en feature:
  `frontend/libs/features/connections/src/lib/catalog/connection-catalog-page.ts`
  y `connection-bulk-action.handlers.ts`.
- Runtime metadata-only: `app-plugin-runtime.registry.spec.ts` y
  `frontend/apps/web/public/plugins/catalog.json`.
- Schema publico:
  `frontend/apps/web/public/plugins/catalog.schema.json`.
- Gate de publicacion de catalogo:
  `frontend/scripts/validate-plugin-catalog.js`.
- Target Nx y CI: `frontend/apps/web/project.json` (`web:validate-plugins`) y
  `.github/workflows/ci.yml` (`Plugin catalog gate`).
- Pruebas del gate:
  `frontend/scripts/validate-plugin-catalog.spec.js`.
- Gestor de catalogo:
  `frontend/scripts/manage-plugin-catalog.js` y
  `frontend/scripts/manage-plugin-catalog.spec.js`.
- Guia de instalacion metadata-only:
  `docs/fase-5-construccion/modulos/frontend-plugin-catalog.md`.
- Build/test frontend registrados en
  `qa/fase-6-qa/evidencias/frontend-extensible-plugins-2026-06-26.md`.
