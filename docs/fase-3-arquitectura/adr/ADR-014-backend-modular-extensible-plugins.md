# ADR-014 Backend modular extensible por plugins instalables

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Estado

Aceptado; base implementada (descriptor, registry, seam de invocacion,
`RemoteTaskProvider`, catalogo persistente `plugin_descriptor`, resolucion desde
`TaskProviderRegistry`, politica inicial de confianza/procedencia y diagnostico
administrativo `/api/plugins`).

Contraparte backend de [ADR-012](ADR-012-frontend-modular-extensible-plugins.md) y
[ADR-013](ADR-013-frontend-module-federation-remote-plugins.md). El frontend ya
permite plugins instalables desde fuera con gobernanza; esta ADR propone el modelo
equivalente para `platform-app` (Quarkus).

## Contexto

El motor ya es **extensible por SPI**, pero en build-time:

- Contratos SPI: `TaskProvider` (`type()` + `execute(TaskContext, config)`),
  `SourceProvider`, `ReaderProvider`, `PaymentMessageFormatter/Transport`,
  `ValidationRuleProvider`, `MessageBrokerProvider`.
- Resolucion por CDI: `TaskProviderRegistry` inyecta `Instance<TaskProvider>` y
  resuelve por `type()`; `TaskTypeRegistry` une los tipos builtin con los aportados
  por providers.
- Estructura actual: las verticales (SWIFT/MT101 en `provider/.../swift`, ISO20022/
  PAIN001 en `provider/.../iso20022`) son **paquetes compilados dentro de
  `platform-app`**, no modulos separados. El reactor Maven tiene tres modulos:
  `platform-contract` (contratos SPI compartidos, p.ej. `MessageBrokerProvider`),
  `platform-app` y `audit-consumer`.

Limitacion: anadir un proveedor nuevo exige recompilar/empaquetar el core. No hay
forma de **instalar una extension desde fuera** sin reconstruir `platform-app`.

Ademas, Quarkus es **build-time/closed-world**: el grafo CDI se resuelve en build y
el target puede ser nativo (GraalVM). Cargar JARs arbitrarios con beans CDI nuevos
en runtime no esta soportado de forma nativa. Es el mismo tipo de restriccion que
en el frontend obligo a Native Federation en vez de webpack: el modelo de build es
cerrado.

Riesgo agravado respecto al frontend: un plugin de backend ejecuta codigo con
acceso potencial a datos, secretos y red. La gobernanza (procedencia, permisos,
aislamiento) es aun mas critica.

## Decision

Adoptar plugins **out-of-process** como mecanismo de extension instalable desde
fuera, con un contrato estable y la misma gobernanza que el modelo frontend. Las
verticales de primera parte siguen como modulos de build.

### Opciones evaluadas

1. **Modulo de build.** Formaliza el estado actual: hoy las verticales son paquetes
   en `platform-app`; este modelo las extraeria a modulos Maven / extensiones
   Quarkus ensambladas en una distribucion. "Instalar" = reconstruir. Seguro y
   compatible con nativo, pero NO instalable en runtime. Se conserva para verticales
   de confianza (primera parte).
2. **Out-of-process (sidecar) [RECOMENDADO].** Cada plugin es un proceso/contenedor
   propio que expone el contrato SPI por un transporte estable. El core delega la
   ejecucion y nunca carga su codigo. Encaja con el modelo closed-world/nativo de
   Quarkus, da aislamiento real (crash, recursos, memoria), y permite despliegue,
   versionado y rollback independientes. Es el analogo backend del "remote" del
   frontend.
3. **In-process classloader aislado (JVM ServiceLoader + URLClassLoader).**
   RECHAZADO: incompatible con compilacion nativa, sin sandbox real (Java
   SecurityManager esta deprecado/eliminado), y el plugin correria en el mismo
   proceso con acceso completo. Riesgo inaceptable para codigo de terceros.

### Contrato de plugin

- Manifest del plugin: `id`, `version`, `platformVersion`, `spiVersion`,
  `capabilities`, `providedTypes` (tipos task/source/reader que aporta),
  `endpoint`/`image` y `signature`/`integrity`.
- Superficie SPI por el cable: el mismo contrato `TaskProvider` serializado. El core
  envia `TaskContext` + `configuration` + los registros necesarios y recibe un
  `TaskResult`. El plugin NO accede a la BD ni a secretos del core: solo opera sobre
  los datos que el core le pasa (frontera de datos explicita).
- Transporte agnostico tras un seam (analogo a `REMOTE_MODULE_LOADER` del front):
  `RemoteTaskProviderTransport`. Default recomendado **gRPC** (contrato tipado,
  streaming para lotes); alternativa asincrona sobre el broker ya existente
  (`MessageBrokerProvider`) para tareas largas.
- El contrato (SPI serializado + IDL) reside en `platform-contract`, el modulo
  compartido ya existente (donde hoy vive `MessageBrokerProvider`), para que el core
  y los autores de plugins dependan del mismo artefacto versionado.

### Procedencia, firma e integridad

- El artefacto/imagen del plugin se firma (p.ej. cosign/sigstore para imagenes de
  contenedor) y solo se admite si su firma valida contra una clave de confianza y su
  origen esta en una allowlist.
- El manifest declara `integrity` y `signature`; el core los verifica antes de
  activar el plugin (mismo principio que el verifier del frontend).

### Capabilities y permisos

- El plugin declara `capabilities` y el core las concede explicitamente: tipos que
  puede aportar, egress de red permitido, y limites de recursos. Sin secretos ni
  conexiones del core salvo las que el core medie y pase por el contrato.
- RBAC: un tipo de tarea aportado por plugin se sujeta a los mismos roles/permisos
  del motor; el plugin no amplia privilegios.

### Aislamiento (sandbox)

- Proceso/contenedor separado: aislamiento de crash, cuotas de CPU/memoria, y sin
  memoria compartida. Un plugin defectuoso no tumba el motor.
- Timeout + circuit breaker en el transporte (reutiliza el patron de
  `ResilientHttpSender`): un plugin que falla se marca `degraded` y el tipo de tarea
  queda no disponible, sin romper el resto del motor.

### Descubrimiento y resolucion

- Registro de plugins externos (tabla `plugin_descriptor` o catalogo firmado) con
  `id`, `version`, `endpoint`, `providedTypes`, estado.
- `TaskProviderRegistry` se extiende para incluir **providers remotos**: ante un
  `type()` no cubierto por un bean CDI local, resuelve un `RemoteTaskProvider` que
  delega en el endpoint del plugin via el transporte. `TaskTypeRegistry` une builtin
  + locales + remotos.

### Ciclo de vida y rollback

- Instalacion: registrar el descriptor (verificado) + health-check del endpoint.
- Activacion: el tipo aportado pasa a estar disponible solo si el plugin esta sano.
- Rollback declarativo: retirar/fijar la version previa del descriptor; el core no
  retiene codigo del plugin.

### Observabilidad

- Estado por plugin (`active`/`degraded`/`unavailable`) expuesto para una vista de
  administracion (equivalente a la vista `/plugins` del frontend).
- Auditoria de invocaciones a plugins por el trail existente (traceId del proceso).

## Consecuencias

- El motor pasa de extensible-en-build a extensible-en-runtime sin perder el modelo
  closed-world/nativo de Quarkus.
- Los plugins de terceros corren aislados; su procedencia se verifica y sus permisos
  se conceden explicitamente. Un plugin no accede a BD/secretos del core.
- Aparece coste operativo: gestion de firmas, despliegue de sidecars, y latencia de
  red por invocacion (mitigada por gRPC + breaker; tareas locales builtin no se ven
  afectadas).
- La frontera de datos del contrato obliga a serializar lo necesario; tareas que hoy
  asumen acceso directo al proceso deben pasar por el contrato.
- Las verticales de primera parte (MT101, PAIN001) pueden seguir como modulos de
  build por rendimiento y confianza; solo los plugins de terceros van out-of-process.

## Reglas

- Todo plugin externo declara `id`, `version`, `platformVersion`, `spiVersion`,
  `capabilities` y firma valida; sin firma/origen valido, no se activa.
- El plugin solo opera sobre los datos que el core le pasa por el contrato; nunca
  accede a BD, secretos o conexiones del core directamente.
- Un tipo aportado por plugin se sujeta al RBAC del motor; no amplia privilegios.
- Toda invocacion remota tiene timeout + circuit breaker; un fallo marca el plugin
  `degraded` y deja su tipo no disponible, sin tumbar el motor.
- El catalogo de descriptores es la unica fuente de verdad de que plugins externos
  estan activos; rollback = editar el catalogo.
- La compilacion nativa del core no depende de codigo de plugin.

## Alcance implementado (base)

- Contrato compartido `AsyncTaskEnvelope` (`platform-contract`) que cruza el broker
  y la frontera del plugin ([ADR-015](ADR-015-backend-task-async-broker-execution.md)).
- `RemotePluginDescriptor` (id, version, spiVersion, providedTypes, transport,
  `trusted`) y `RemotePluginRegistry` (resolucion por tipo, listado de
  descriptores, tipos disponibles, rechazo de duplicados, recarga atomica del
  catalogo y estado `degraded`).
- Tabla persistente `plugin_descriptor` (`V70`) con identidad, version, version SPI,
  tipos aportados, transporte, endpoint, estado activo, confianza e integridad.
- `PluginDescriptorRepository`, `PluginDescriptorCatalogMapper` y
  `BackendPluginCatalogService`: al arrancar, el core hidrata
  `RemotePluginRegistry` desde descriptores activos y marca como degradados los
  descriptores malformados sin tumbar el motor.
- `PluginDescriptorTrustPolicy`: antes de publicar un descriptor activo en el
  registry valida identidad/version/SPI, transporte soportado (`GRPC`, `KAFKA`),
  endpoint `GRPC`, HTTPS obligatorio fuera de local dev, origen no local en
  `integrationhub.plugins.backend.allowed-origins`, e integridad/firma en formato
  declarativo cuando `trusted=true`. Los rechazados se exponen como `degraded` y
  no quedan disponibles para resolucion.
- `RemotePluginInvoker` (seam de transporte, analogo a `REMOTE_MODULE_LOADER` del
  frontend) y `RemoteTaskProvider` con limite de error: invocacion fallida o
  descriptor no confiable marcan `degraded` y devuelven `TaskResult.failure` sin
  tumbar el motor.
- `TaskProviderRegistry` conserva prioridad de providers CDI locales y delega a
  `RemoteTaskProvider` cuando un tipo no local esta cubierto por un descriptor
  remoto; si no existe `RemotePluginInvoker`, falla rapido con diagnostico claro.
- Endpoint `GET /api/plugins` con RBAC (`PLATFORM_ADMIN`, `INTEGRATION_ADMIN`,
  `AUDITOR`) que expone plugins backend instalados, tipos aportados, transporte,
  confianza, estado y razon de degradacion.
- La vista frontend `/plugins` consume `/api/plugins` y muestra el diagnostico
  backend junto con instalados/cuarentena/degradados del runtime frontend.
- Verde: unit tests de `RemotePluginRegistry`, `RemoteTaskProvider`,
  `TaskProviderRegistry`, `PluginDescriptorCatalogMapper`,
  `PluginDiagnosticsResource` y `PluginDiagnosticsPage`.

## Alcance pendiente (implementacion)

- IDL gRPC del contrato serializado (`AsyncTaskEnvelope` -> `TaskResult`) y la impl
  por defecto de `RemotePluginInvoker` (gRPC; alternativa broker).
- Verificacion criptografica real de firma/integridad contra claves de confianza
  (la base actual valida presencia/formato y allowlist de origenes antes de
  activar).
- Flujo administrativo de instalacion/activacion/rollback sobre
  `plugin_descriptor`; por ahora la carga se realiza al arranque desde la tabla.
- Union explicita en `TaskTypeRegistry`/catalogos administrativos si se requiere
  exponer tipos remotos fuera de la resolucion de ejecucion.
- Circuit breaker/timeout en el invoker (reusa el patron `ResilientHttpSender`).
- Plugin de ejemplo (sidecar) que aporte un `type()` y prueba e2e de la cadena.
- Extension del mismo patron a `SourceProvider`/`ReaderProvider` segun necesidad.
