# Evidencia #1: split de tráfico canary en caliente - 2026-07-02

Cablea el enrutado real del canary en la ruta de invocación: una versión canary con peso
recibe su porcentaje de invocaciones; el resto va a la versión activa/estable. Completa la
feature de canary por porcentaje (antes solo config + selector + endpoint de decisión).

## Diseño (bounded, seguro, backward-compatible)

- **Por porcentaje** (no por segmento). El punto de resolución (`resolve(type)`) no recibe
  una routing key, así que el split usa una clave aleatoria por invocación → % correcto
  reutilizando el `CanaryRolloutSelector` ya probado. El split *sticky por segmento*
  requeriría hilar una routing key por toda la cadena de resolución (documentado como follow-up).
- **Sin romper nada:** `descriptorFor*` (resolución estable/diagnóstico) queda intacto; se
  añaden `descriptorFor*Invocation` que aplican el split. Sin canary registrado, el resultado
  es idéntico al estable.

## Cambios

- `RemotePluginRegistry`: índice canary por capability (`CanaryCandidate` = descriptor + peso),
  sobrecarga `replaceDescriptors(stable, canaries)`, y `descriptorForInvocation` /
  `descriptorForSourceInvocation` / `descriptorForReaderInvocation` (resolución ponderada vía
  `CanaryRolloutSelector`). Constructor `@Inject` (+ no-arg para tests).
- `PluginDescriptorCatalogMapper.toRemoteDescriptor(PluginDescriptorVersion)`: construye el
  descriptor de una versión canary.
- `BackendPluginCatalogService`: en el arranque/reload construye los candidatos canary desde
  las versiones (channel 'canary' con `canaryWeight` > 0) y los registra.
- `TaskProviderRegistry` / `ReaderProviderRegistry` / `SourceProviderRegistry`: usan la variante
  `*Invocation` al resolver el plugin remoto a invocar.

## Pruebas backend

```bash
mvn -pl platform-app test -Dtest=RemotePluginRegistryTest,BackendPluginCatalogServiceTest,\
TaskProviderRegistryTest,ReaderProviderRegistryRemoteTest,SourceProviderRegistryRemoteTest,\
PluginDiagnosticsResourceTest -Dsurefire.failIfNoSpecifiedTests=false
```

- Estado: **BUILD SUCCESS, 35 tests**. Nuevos en `RemotePluginRegistryTest` (+4):
  - sin canary → siempre estable;
  - peso 100 → todo a canary (task/source/reader);
  - peso 0 → ignorado (siempre estable);
  - peso 50 → sobre 300 draws aparecen **ambas** versiones (split real).
- Resolvers de tarea/source/reader en **regresión verde** (comportamiento idéntico sin canary).
- Arranque en vivo: **health 200**, log `Backend plugin descriptors loaded: N (canary candidates: M)`
  sin errores.

## e2e

- El split ocurre en la ruta de invocación backend (no hay superficie UI que lo dispare por %),
  así que se valida con las pruebas unitarias (deterministas 0/100 + estadística 50%) + arranque
  sano + regresión de los resolvers. El endpoint `GET /api/plugins/{id}/canary/route` sigue
  exponiendo la decisión por segmento.

## Follow-up documentado

- **Split sticky por segmento**: hilar una routing key estable (execution/connection/tenant id)
  por la cadena `TaskProviderRegistry.resolve(type)` → `descriptorForInvocation(type, key)` para
  que el mismo segmento caiga siempre en el mismo lado.
