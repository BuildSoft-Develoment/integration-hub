# Evidencia hardening Prioridad 1 - 2026-06-27

Cierre de los cuatro hallazgos de Prioridad 1 de la revision de arquitectura
(UI/UX + extensibilidad + resiliencia). Implementacion y evidencia de pruebas.

## Alcance

1. Enforcement de `AppActionContribution.confirmation` en `AppActionExecutor`.
2. Validacion i18n: paridad de diccionarios y cobertura de claves del manifest.
3. `PLATFORM_VERSION` con fuente unica de verdad protegida por guard test.
4. Circuit breaker / timeout / retry en llamadas HTTP salientes del backend.

## 1. Enforcement de confirmacion (frontend)

### Cambios verificados

- Nuevo `app-action.confirmation.ts`: contrato `AppActionConfirmationGate`,
  token `APP_ACTION_CONFIRMATION_GATE`, `provideAppActionConfirmationGate(...)`
  y gate por defecto `WindowActionConfirmationGate` con resolucion i18n.
- `AppActionExecutor.execute(...)` consulta el gate antes de cualquier efecto
  (navegacion, enlace externo o comando).
- Politica fail-safe: una accion que declara `confirmation` sin gate registrado
  NO se ejecuta (retorna `false`).
- `platform-plugin.manifest.ts`: las bulk actions de conexiones declaran
  confirmacion (`warning` para activar, `danger` para desactivar).
- `connection-catalog-page.ts` provee el gate por defecto.
- Claves i18n `connections.bulk.confirmActivate` / `confirmDeactivate` en en/es.

### Casos de prueba (app-action.executor.spec.ts)

- Comando sin confirmacion se ejecuta normal.
- Accion confirmada se ejecuta y la severidad llega al gate.
- Comando con confirmacion rechazada NO ejecuta el handler (retorna `false`).
- Navegacion con confirmacion rechazada NO llama al Router.
- Enlace externo con confirmacion rechazada NO abre ventana.
- Fail-safe: accion con confirmacion y sin gate NO se ejecuta.

## 2. Validacion i18n (frontend)

### Cambios verificados

- Nuevo `dictionaries/dictionary-parity.spec.ts`: garantiza identico conjunto de
  claves entre `en` y `es` y ausencia de traducciones vacias.
- Nuevo `platform-plugin.manifest.spec.ts`: toda `labelKey`, `titleKey`,
  `descriptionKey` y `confirmation.labelKey` del manifest resuelve en ambos
  idiomas (atrapa typos antes de que lleguen crudos a la UI).

## 3. PLATFORM_VERSION fuente unica (frontend / tooling)

### Cambios verificados

- `FRONTEND_EXTENSION_PLATFORM_VERSION` documentado como fuente unica de verdad.
- Nuevo guard en `validate-plugin-catalog.spec.js`: lee el `const` de TypeScript
  y falla si `scripts/validate-plugin-catalog.js#PLATFORM_VERSION` diverge.

## 4. Circuit breaker en HTTP saliente (backend)

### Cambios verificados

- Dependencia `quarkus-smallrye-fault-tolerance` en `platform-app/pom.xml`.
- Nuevo bean `ResilientHttpSender` (`@ApplicationScoped`) con `@Timeout(35s)`,
  `@Retry(maxRetries=2, backoff con jitter, retryOn IOException)` y
  `@CircuitBreaker(requestVolumeThreshold=8, failureRatio=0.5, delay=10s,
  successThreshold=2)`.
- `RestCallTaskProvider` enruta el envio saliente por el bean resiliente
  (la auto-invocacion privada no era interceptable por MP Fault Tolerance).
- El epilogo de interpretacion de estado (2xx vs error) permanece en el provider.

## Validacion de catalogo y tooling

### Comando

```bash
node --test scripts/validate-plugin-catalog.spec.js scripts/manage-plugin-catalog.spec.js
```

### Resultado

- Estado: PASS.
- Tests Node: 22 passed, 0 failed.
- Caso nuevo: guard de sincronizacion de `PLATFORM_VERSION`.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 74 passed.
- Tests: 326 passed, 0 failed.
- Cobertura nueva: casos de confirmacion en `app-action.executor.spec.ts`,
  `dictionary-parity.spec.ts`, `platform-plugin.manifest.spec.ts`.
- Hallazgo colateral detectado y resuelto: la asercion estricta de placeholders
  marcaba ejemplos ilustrativos localizados (`{code}`/`{codigo}`); se acoto la
  validacion a paridad de claves y no-vacios (sin falsos positivos).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins` ejecutado como dependencia de build.
- Initial total: `1.24 MB`.
- Estimated transfer initial: `245.92 kB`.

## Compilacion y pruebas backend

### Comando

```bash
mvn -pl platform-app -am compile
mvn -pl platform-app test -Dtest='RestTaskSupportTest,HttpRequestSupportLoginTest,RestPaymentTransportTest'
```

### Resultado

- Compilacion: BUILD SUCCESS (descarga y enlace de
  `quarkus-smallrye-fault-tolerance` y su artefacto deployment).
- Pruebas REST/HTTP: 25 run, 0 failures, 0 errors. BUILD SUCCESS.
- Sin regresion por el cableado del `ResilientHttpSender`.

## Riesgo residual

- El gate por defecto usa `window.confirm`. Para una UX rica, inyectar un gate
  basado en dialogo Material via `provideAppActionConfirmationGate(custom)`.
- El breaker actua sobre fallos de E/S y timeout; un 5xx del destino hoy se trata
  como error de negocio en el provider y no alimenta el breaker (mejora futura:
  promover 503/502 a fallo de infraestructura).
- El circuit breaker se cableo en `RestCallTaskProvider`; queda pendiente
  extender el mismo bean al canal webhook de notificacion y al
  `RestPaymentTransport` si se requiere la misma politica.
- La validacion i18n cubre el manifest de plataforma; los plugins externos
  aportan sus propios `i18nNamespaces` y se validan en su propio catalogo.
```
