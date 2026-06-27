# ADR-013 Frontend Module Federation para plugins remotos con codigo

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Estado

Propuesto. Implementado parcialmente: el contrato `remote` y su validacion
(JSON Schema, build gate y runtime con allowlist de origenes y cuarentena) ya
estan en codigo. La carga de codigo via Module Federation y el sandbox de
ejecucion siguen pendientes.

Extiende [ADR-012](ADR-012-frontend-modular-extensible-plugins.md). No reemplaza el
modelo metadata-only: lo complementa con un canal gobernado para plugins que
aportan codigo Angular.

## Contexto

ADR-012 dejo una base de contribuciones declarativas validadas y un runtime
metadata-only: los plugins externos solo aportan navegacion, workspaces y
acciones hacia rutas ya instaladas del shell, sin codigo remoto. Sobre esa base
ya se implemento:

- Aislamiento de fallos por plugin (`installExternalManifests`): un plugin
  invalido o en conflicto queda en cuarentena sin romper el shell.
- Gobernanza de namespaces i18n: un plugin solo aporta claves dentro de sus
  `i18nNamespaces` declarados.
- Materializacion de mensajes i18n por plugin (`I18nService.registerMessages`):
  las claves base de plataforma siempre ganan.
- Diagnostico observable (`diagnostics`) y vista `/plugins`.

El siguiente paso es permitir plugins **instalables desde fuera que aporten
codigo** (componentes, formularios, vistas), no solo metadata. Hoy un plugin con
codigo Angular debe registrarse por provider estatico y pasar por build/release,
lo que impide un ecosistema de extensiones instalables sin recompilar el shell.

El riesgo de cargar codigo de terceros en runtime es real: procedencia no
confiable, ejecucion sin aislamiento, incompatibilidad de version, dependencia
duplicada y ausencia de rollback. Esta ADR define como hacerlo de forma
gobernada.

## Decision

El frontend adopta **Module Federation** como unico mecanismo para cargar codigo
de plugins en runtime, sujeto a las mismas garantias de gobernanza que el modelo
metadata-only.

### Plugin de build: Native Federation

Se adopta **`@angular-architects/native-federation`**, no la variante webpack
(`@angular-architects/module-federation`). Razon decisiva: el workspace usa el
builder esbuild `@angular/build:application` (Angular 21, Nx 22). Webpack Module
Federation obligaria a degradar el builder de host y remotos a webpack y perder
esbuild; Native Federation es agnostico del bundler, funciona con el builder
actual y esta alineado con la direccion esbuild-first de Angular. El modelo de
API (`withNativeFederation`, `shareAll`, `loadRemoteModule`) es equivalente.

### Contrato de remoto

- Cada plugin con codigo se publica como un `remoteEntry.json` de Native
  Federation (manifest import-map) que expone modulos Angular standalone
  (componentes/rutas) bajo nombres declarados.
- El manifest del plugin se extiende con un bloque opcional `remote`:
  `url` del `remoteEntry.json`, `exposedModule`, `integrity` (hash SRI sobre el
  manifest), `signature` (`keyId:base64`) y `sharedDependencies` esperadas.
- El shell carga el modulo con `loadRemoteModule({ remoteEntry: url, exposedModule })`.
- El shell expone como `shared singleton` las dependencias del marco (Angular
  core, router, RxJS, la libreria `shared/ui`) para evitar duplicacion y choques
  de version.

### Procedencia, firma e integridad

- El `remoteEntry` solo se carga si su hash coincide con `integrity` y su
  `signature` valida contra una clave publica de confianza configurada en el
  shell.
- El origen del `url` debe pertenecer a una allowlist de hosts de plugin; nunca
  un origen arbitrario.
- Un remoto que falla integridad/firma/origen no se carga y queda en cuarentena
  con motivo, reutilizando el flujo resiliente existente.

### Versionado y compatibilidad

- El plugin declara `platformVersion`; la carga del remoto reusa la misma regla
  de compatibilidad por major version que el resto del runtime.
- Las `sharedDependencies` declaradas se validan contra las versiones singleton
  del shell antes de instanciar el modulo; una incompatibilidad va a cuarentena.

### Aislamiento de ejecucion (sandbox)

- La carga e instanciacion del modulo remoto se envuelve en un limite de error:
  un fallo de carga, de parseo o de runtime del plugin no propaga al shell.
- El plugin se monta en una ruta lazy propia con su `capabilityGuard`; no accede
  a servicios internos salvo por las facades publicas (igual que ADR-012).
- Un error en runtime del plugin lo marca como degradado en `diagnostics` y
  desmonta su superficie, sin tumbar la navegacion ni otros plugins.

### Instalacion y rollback

- La instalacion registra el remoto en el catalogo con su version e `integrity`.
- El rollback es declarativo: retirar o fijar la version previa en el catalogo;
  el shell no conserva codigo remoto entre sesiones mas alla del catalogo
  vigente.
- El gate de validacion del catalogo se extiende para exigir `integrity`,
  `signature` y origen permitido en todo manifest con bloque `remote`.

## Consecuencias

- El shell pasa de extensible por metadata a extensible por codigo, manteniendo
  la frontera de contratos y la gobernanza de permisos, i18n y navegacion.
- Un plugin remoto no puede sobrescribir rutas, claves i18n ni capabilities del
  core: se aplican las mismas validaciones que a los manifests metadata-only.
- La procedencia deja de ser implicita: sin firma/integridad/origen valido, no
  hay ejecucion.
- El aislamiento por limite de error convierte un plugin defectuoso en una
  degradacion local y observable, no en una caida del shell.
- Aparece coste operativo nuevo: gestion de claves de firma, allowlist de
  origenes, y disciplina de `sharedDependencies` para evitar duplicar Angular.
- El bundle inicial no crece por plugins remotos: el codigo se carga lazy solo
  cuando se navega a su superficie.
- Requiere herramienta de build del plugin alineada con la version de Angular y
  Module Federation del shell; un desalineo se detecta en validacion de version.

## Reglas

- Todo plugin con codigo se carga unicamente por Module Federation; queda
  prohibido `eval`, inyeccion de `<script>` arbitrario o import dinamico de
  origenes no allowlisted.
- Todo manifest con bloque `remote` debe declarar `url`, `exposedModule`,
  `integrity`, `signature` y `platformVersion`.
- El `remoteEntry` se carga solo si integridad, firma y origen son validos; en
  caso contrario va a cuarentena.
- Las dependencias del marco se comparten como singleton; el plugin no empaqueta
  su propio Angular/router.
- Todo modulo remoto se monta en ruta lazy con `requiredCapability` y dentro de
  un limite de error.
- El plugin no accede a servicios internos salvo por facades publicas.
- El catalogo es la unica fuente de verdad de que codigo remoto esta activo;
  rollback = editar el catalogo.

## Alcance implementado

- Contrato `remote` en `AppPluginManifest` (`AppPluginRemote`): `url`,
  `exposedModule`, `integrity`, `signature`, `sharedDependencies`.
- JSON Schema `pluginRemote` y campo `remote` en `pluginManifest`.
- Build gate (`validatePluginRemote`): exige `https`, `exposedModule`,
  `integrity` y `signature`; rechaza propiedades fuera del contrato.
- Runtime: `APP_PLUGIN_REMOTE_ALLOWED_ORIGINS` (fail-safe, vacio por defecto) y
  `provideAppPluginRemoteOrigins(...)`. Un `remote` sin https, sin procedencia
  completa o de origen no allowlisted queda en cuarentena, sin tumbar el shell.
- Verificacion de procedencia en metadata: `integrity` debe ser un hash SRI
  valido (`sha256|sha384|sha512-...`) y `signature` debe tener formato
  `keyId:base64` cuyo `keyId` este en `APP_PLUGIN_REMOTE_TRUSTED_KEYS`
  (`provideAppPluginRemoteTrustedKeys(...)`, fail-safe vacio). El build gate
  valida los mismos formatos.
- Verificacion criptografica de carga (`AppPluginRemoteVerifier`, asincrona):
  descarga el `remoteEntry.json`, recomputa el hash SRI y lo compara con
  `integrity`, y verifica la `signature` (ECDSA P-256 / SHA-256) sobre el payload
  canonico `id@version:integrity` contra la clave publica JWK del `keyId`
  (`provideAppPluginRemoteKeys(...)`). `fetch` y `crypto` son inyectables (test/SSR).
- Orquestacion de carga con limite de error (`AppPluginRemoteLoader`): verifica y
  monta el modulo via `REMOTE_MODULE_LOADER` (inyectable, agnostico del bundler).
  Cualquier fallo de verificacion, carga o montaje marca el plugin `degraded` en
  el runtime registry y nunca lanza, de modo que un plugin defectuoso no rompe el
  shell. La vista `/plugins` muestra instalados, en cuarentena y degradados.

## Alcance pendiente

- Instalar y configurar `@angular-architects/native-federation` en el build del
  host (esbuild): `withNativeFederation` y `shareAll` de Angular/router/RxJS/
  `shared/ui`.
- Proveer en el host `provideAppPluginRemoteModuleLoader(loadRemoteModule)` con la
  funcion `loadRemoteModule` de Native Federation, conectando el seam
  `REMOTE_MODULE_LOADER` con la implementacion real.
- Construir un plugin remoto de ejemplo y una prueba e2e de extremo a extremo
  (descarga, verificacion, montaje y degradacion ante fallo).
