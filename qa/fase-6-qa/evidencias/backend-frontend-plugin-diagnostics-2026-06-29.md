# Evidencia QA - Diagnostico de plugins front/back

Fecha: 2026-06-29  
Alcance: arquitectura modular extensible para plugins backend/frontend, diagnostico
observable y presupuesto de build frontend.

## Cambios validados

- Backend: `TaskProviderRegistry` conserva prioridad local y delega tipos remotos
  a `RemoteTaskProvider` cuando existe descriptor en `RemotePluginRegistry`.
- Backend: `plugin_descriptor` persiste descriptores externos y el core hidrata
  `RemotePluginRegistry` al arrancar desde descriptores activos.
- Backend: `PluginDescriptorTrustPolicy` valida procedencia operacional antes de
  activar descriptores (`GRPC` local/HTTPS allowlistado, transportes soportados,
  metadatos de firma/integridad cuando `trusted=true`).
- Backend: los descriptores rechazados por politica quedan visibles como
  `degraded` despues de la recarga atomica del registry.
- Backend: `RemotePluginDescriptor` conserva el `endpoint` validado y
  `ResilientRemotePluginInvoker` selecciona un `RemotePluginTransport` compatible
  detras de timeout/circuit breaker.
- Backend: `GET /api/plugins` expone diagnostico de plugins backend con RBAC.
- Frontend: `/plugins` consume `/api/plugins` y muestra diagnostico backend junto
  al diagnostico de runtime frontend.
- Frontend: `federation.manifest.json` queda vacio por defecto; no hay remoto demo
  `mfe1`/`localhost:3000` cargado en arranque.

## Comandos ejecutados

### Backend unit/integration slice

```powershell
mvn -pl platform-app -am "-Dtest=TaskProviderRegistryTest,RemotePluginRegistryTest,RemoteTaskProviderTest,PluginDiagnosticsResourceTest,PluginDescriptorCatalogMapperTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 18 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Nota no bloqueante: Maven informa relocation de `quarkus-junit5-mockito` a
  `quarkus-junit-mockito`; no afecta esta validacion.

### Backend trust-policy slice

```powershell
mvn -pl platform-app -am "-Dtest=BackendPluginCatalogServiceTest,TaskProviderRegistryTest,RemotePluginRegistryTest,RemoteTaskProviderTest,PluginDiagnosticsResourceTest,PluginDescriptorCatalogMapperTest,PluginDescriptorTrustPolicyTest,ResilientRemotePluginInvokerTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Resultado:

- PASS.
- Tests: 30 ejecutados, 0 fallos, 0 errores, 0 omitidos.
- Cobertura puntual agregada:
  - plugin `GRPC` local trusted permitido para dev;
  - `integrity` y `signature` requeridos/formateados cuando `trusted=true`;
  - `http` no local rechazado;
  - `https` no local exige allowlist;
  - transporte no soportado rechazado;
  - descriptor sin `id` rechazado sin romper la recarga;
  - descriptor `KAFKA` permitido sin endpoint;
  - recarga con catalogo mixto conserva el plugin valido y expone el invalido como
    `degraded` despues de `replaceDescriptors`.
  - invoker resiliente delega al transporte compatible;
  - invoker resiliente falla de forma controlada cuando no hay transporte
    compatible.
- Notas no bloqueantes: warnings de Mockito dynamic agent y JBoss LogManager en
  test; el reactor termino `BUILD SUCCESS`.

### Frontend tests

```powershell
cmd.exe /c npx nx test web --skip-nx-cache --output-style=static
```

Resultado:

- PASS.
- Test files: 79 passed.
- Tests: 358 passed.

### Frontend build y presupuesto

```powershell
cmd.exe /c npx nx build web --skip-nx-cache --output-style=static
```

Resultado:

- PASS.
- `web:validate-plugins`: PASS, catalogo valido, manifests: 0.
- Bundle inicial production: 172.47 kB raw, 26.72 kB transfer estimado.
- Chunk lazy `plugin-diagnostics-page-component`: 11.27 kB raw, 1.47 kB transfer
  estimado tras marcar la consulta `/api/plugins` como feedback no disruptivo.

### Stack local

```powershell
cmd.exe /c start-platform-stack.cmd
```

Resultado:

- PASS.
- App health: `http://localhost:8080/q/health` respondio 200.
- Audit consumer: `CONSUMER_OK`.
- Flyway valido 70 migraciones y aplico `V70__backend_plugin_descriptor.sql`.
- Tabla verificada en Postgres: `to_regclass('public.plugin_descriptor') =
  plugin_descriptor`.
- Historial Flyway verificado: version `70`, descripcion
  `backend plugin descriptor`, `success=true`.
- Log de arranque: `Backend plugin descriptors loaded: 0`, esperado sin plugins
  externos activos instalados.
- `GET http://localhost:8080/api/plugins` sin sesion respondio 401, esperado por
  RBAC del endpoint.

## Evidencia visual / a11y

- La ruta `http://localhost:8080/#/plugins` se verifico autenticada con usuario
  `admin`.
- Captura: `qa/fase-6-qa/evidencias/backend-frontend-plugin-diagnostics-2026-06-29.png`.
- Estado visible validado:
  - Titulo: `Plugins - Integration Hub`.
  - Secciones: `Instalados (1)`, `En cuarentena (0)`, `Degradados (0)`,
    `Backend (0)`.
  - Tabla frontend: plugin `platform`, nombre `Integration Hub Platform`,
    version `1.0.0`, origen `Plataforma`.
  - Empty state backend: `No hay plugins de backend instalados.`
- Tras reiniciar Quarkus dev, el shell sirvio el bundle nuevo
  `main-3225VQT4.js`. Antes del reinicio, Quinoa seguia sirviendo el bundle
  anterior del proceso dev.
- Consola antes del ajuste mostro intentos de cargar
  `http://localhost:3000/remoteEntry.json` desde el remoto demo `mfe1`.
- Se elimino el remoto demo del manifest estatico; `rg "mfe1|localhost:3000"
  frontend\apps\web\public frontend\dist -n` no encontro referencias despues del
  build.
- La consulta de diagnostico backend usa `SKIP_GLOBAL_ERROR_FEEDBACK` para que un
  fallo opcional de `/api/plugins` muestre el estado local de la pagina sin
  disparar feedback global.
- La consola del navegador retenia un error antiguo (`ERROR E`) con timestamp
  previo al reinicio; no se observo nuevo error al cargar el bundle actualizado.

## Riesgos residuales

- Falta implementacion productiva del transporte `RemotePluginTransport` (gRPC o
  broker). El seam resiliente ya existe; falta el transporte concreto.
- Falta verificacion criptografica real de firma/integridad contra claves de
  confianza; ya existe validacion de formato y allowlist de origen antes de
  activar.
- Falta flujo administrativo de instalacion/activacion/rollback sobre
  `plugin_descriptor`; por ahora la carga se realiza al arrancar.
- Falta automatizar como e2e la navegacion autenticada `/plugins`; la evidencia
  visual manual ya fue capturada.
- El log de ambiente local muestra un fallo no relacionado del scheduler MT101
  por autenticacion de Postgres; no impidio health ni la migracion V70.
