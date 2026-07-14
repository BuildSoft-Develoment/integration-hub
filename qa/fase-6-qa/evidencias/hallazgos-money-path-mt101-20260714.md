# Hallazgos — money-path MT101 sobre el ambiente de integración nativo (2026-07-14)

Ambiente: `ops/fase-7-deploy/dist/onprem/docker-compose.int.yml` (todo nativo, UPX, tras nginx en
`https://192.168.0.15:8443/appih`). Ejercicios: money-path 10k y 2k con 100 filas malas, cuarentena,
corrección con bloqueo optimista, reproceso maker-checker, pago correctivo, rechazo parcial con run
hijo y resolución de pagos UNCERTAIN.

Los pagos se validaron contra el contenedor `sftp-bank` (archivos FIN reales en `/inbox`).

---

## Resumen

| # | Hallazgo | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | Las fuentes de secretos locales (`secret`/`config`/`env`) no existían en el contenedor CDI | Crítico | **Arreglado** (código) |
| 2 | `set-task-secret.cmd` corrompe el valor del secreto | Alto | Abierto (tooling) |
| 3 | Un pago correctivo rechazado **en su totalidad** queda sin camino de recuperación | Alto | Abierto (reportado, no tocado) |
| 4 | Las filas de cuarentena no reflejan el pago del run hijo (quedan `REBUILD_REJECTED`) | Medio | Abierto |
| 5 | `MT101_STATUS` en el pipeline no soporta `routeQuery`/SFTP (exige `query.url`) | Medio | Abierto |
| 6 | `sftp.knownHostsPath` se trata como credencial y exige referencia a fuente externa | Bajo (diseño) | Documentado |
| 7 | El insert de fragmentos flushea por nº de filas, nunca por bytes → deadlock de pgJDBC a escala | Alto | Abierto |
| 8 | Un monto no numérico rompe el lote entero del BUILD (sin cuarentena por fila) | Medio | Abierto |
| 9 | Cobertura: la resolución de secretos nunca se ejercita vía CDI en los tests | Medio | Abierto |

---

## 1. Las fuentes de secretos locales no existían en el contenedor CDI — **arreglado**

**Síntoma.** `POST .../rebuild-runs/request-pay` → `400 "Unsupported secret source: secret"` al resolver
`${secret:tasks/sftp/bank/password}` en la config de `MT101_PAY`.

**Causa.** `SecretResolver` recibe `Instance<SecretValueProvider>` y elige el provider por `supports(source)`.
`FileVaultSecretValueProvider`, `ConfigSecretValueProvider` y `EnvironmentSecretValueProvider` estaban
anotados con `@DefaultBean`, mientras que `AwsSecretManagerValueProvider`, `AzureKeyVaultValueProvider`,
`GcpSecretManagerValueProvider` y `VaultSecretValueProvider` son beans normales **del mismo tipo**. La
semántica de `@DefaultBean` ("úsame sólo si no hay otro bean de este tipo") hace que ArC elimine a los tres
de la resolución: en runtime el resolver sólo veía los de nube.

Impacto real: **`${secret:...}`, `${config:...}` y `${env:...}` eran irresolubles en producción**. Sólo
funcionaban donde el código se arma su propio resolver a mano (`JsonConfigurationMapper.defaultSecretResolver()`,
que además usa un `FileVaultSecretClient` stub que devuelve vacío).

**Fix aplicado.** Quitado el `@DefaultBean` de los tres providers: no son implementaciones que compitan por
un mismo rol, son una **cadena de fuentes** que se selecciona por `supports(source)`.

- `platform-app/src/main/java/com/integrationhub/platform/service/secret/FileVaultSecretValueProvider.java`
- `platform-app/src/main/java/com/integrationhub/platform/service/secret/ConfigSecretValueProvider.java`
- `platform-app/src/main/java/com/integrationhub/platform/service/secret/EnvironmentSecretValueProvider.java`

**Pendiente asociado.** En el classpath de test, `TestConfigBackedSecretValueProvider` también declara
`supports("secret")`. Con los tres providers ya activos, en `@QuarkusTest` habrá dos candidatos para `secret`
y `findFirst()` no es determinista: hay que darle prioridad explícita al de test (o restringir su `supports`).

---

## 2. `set-task-secret.cmd` corrompe el valor del secreto

**Síntoma.** El pago correctivo rechazó los 40 fragmentos con
`SFTP JSchException: Auth fail for methods 'publickey,password,keyboard-interactive'`.

**Causa.** El alias `tasks/sftp/bank` del keystore `secrets/dev-secrets.p12` contenía **`C/B;B?bank`**
(10 bytes) en vez de `bank` (4 bytes). El script antepone basura al valor.

**Workaround verificado.**

```
keytool -delete    -alias "tasks/sftp/bank" -keystore secrets/dev-secrets.p12 -storetype PKCS12 -storepass <store>
printf 'bank\nbank\n' | keytool -importpass -alias "tasks/sftp/bank" -keystore secrets/dev-secrets.p12 -storetype PKCS12 -storepass <store>
```

Conviene arreglar el script y, sobre todo, **añadir un `verify`** que lea el alias recién escrito: un secreto
corrupto sólo se manifiesta como un `Auth fail` en el banco, que es indistinguible de una credencial revocada.

---

## 3. Un pago correctivo rechazado en su totalidad queda sin camino de recuperación

**Síntoma.** Con los 40 fragmentos `REJECTED`, el run queda `status=FAILED` / `payStatus=FAILED` y **no hay
forma de reintentar**:

- `request-pay` → `400 must be ARCHIVED before requesting corrective pay; current status is FAILED`
- `request-child` → `400 must have payStatus PARTIALLY_SENT to request a child corrective`
- `request` (rebuild normal) → `400 only REJECTED fragments can be superseded: [P1=SUPERSEDED, ...]`
  (mira los fragmentos del set **original**, que ya fueron superseded por el correctivo, en vez de la última generación)

**Causa.** `Mt101RebuildService.requestRebuildFromRejectedCorrective` (línea ~173) exige
`payStatus == PARTIALLY_SENT`. El rechazo **total** es el caso más rechazado posible y, sin embargo, es el
único que no tiene salida — pese a que el método se llama literalmente "rebuild *from rejected corrective*".

**Agravante de clasificación.** El lifecycle marca `FAILED` (rechazo del banco) tanto si el banco rechazó de
verdad como si falló la **autenticación o el transporte** (nuestro caso: credencial corrupta). Un fallo de
infraestructura no debería consumir el único camino de recuperación. Sugerencia: distinguir "rechazo de
negocio" de "fallo de transporte/credencial" (este último ya existe como `INVALIDATED`, que **sí** es
re-solicitable), o admitir `FAILED` en el guard del run hijo.

**Nota.** El estado sí es recuperable a nivel de filas (`reopen-rejected` devuelve `REBUILD_REJECTED → QUARANTINED`),
pero el rebuild posterior choca con la comprobación de fragmentos superseded descrita arriba.

---

## 4. Las filas de cuarentena no reflejan el pago del run hijo

**Síntoma.** Tras un rechazo parcial resuelto con éxito por el run hijo (`E2E10K-12-FIX-4-FIX-5`, 20/20
fragmentos `SENT`), las 52 filas de cuarentena asociadas siguen en `REBUILD_REJECTED`. El `execute` del hijo
reporta `resolvedQuarantine: 0`.

**Causa probable.** La sincronización del ciclo usa `run.originalFragmentSetId()`, que en el hijo es el set
**correctivo del padre** (`E2E10K-12-FIX-4`), donde no hay filas de `mt101_failed_record`. Las filas del set
original nunca se vuelven a tocar.

**Impacto.** Un operador que mire la cuarentena ve filas "rechazadas" cuyos pagos ya salieron, y puede
reabrirlas con `reopen-rejected` → riesgo de reproceso innecesario sobre pagos ya entregados.

---

## 5. `MT101_STATUS` en el pipeline no soporta `routeQuery`/SFTP

**Síntoma.** Un `MT101_STATUS` con `mode: query` y config route-aware SFTP (`routeQuery.SFTP_BANK`) falla la
ejecución del proceso con `MT101_STATUS requires configuration.query.url`.

**Causa.** `Mt101StatusTaskProvider.executeQuery` (línea ~497) exige `query.url` sin contemplar `routeQuery`.
La rama route-aware (REST + SFTP) sólo existe en el camino correctivo / de resolución (`executeCorrectiveQuery`,
`resolveNormalPay`), que sí usa el ejecutor compartido `Mt101StatusQueryExecutor`.

**Impacto.** Un banco que confirme por ACK/NACK sobre SFTP (sin API REST) **no puede** tener STATUS en el
pipeline normal: la tarea siempre falla. La resolución de UNCERTAIN sí funciona con esa misma config, lo que
deja al proceso en un estado incómodo (tarea roja en cada ejecución, resolución correcta).

---

## 6. `knownHostsPath` se trata como credencial (diseño)

`Mt101DispatchPlanCompiler.SECRET_NAME_TOKENS` incluye `knownhosts` junto a `password`, `token`, `apikey`…, y
todo campo de credencial debe ser una **referencia COMPLETA** `${secret|vault|env|config:...}`. Como
`sftp.knownHostsPath` es una *ruta* (no un secreto), hay que publicarla por config:

```properties
# int/config/application.properties
tasks.sftp.bank.known-hosts=/work/sftp/known_hosts
```

y referenciarla como `${config:tasks.sftp.bank.known-hosts}`. Es defendible (el known_hosts es el ancla de
confianza del host), pero conviene documentarlo: el mensaje de error habla de "secret" para una ruta.

---

## 7. El insert de fragmentos flushea por nº de filas, nunca por bytes

Con `INSERT_BATCH_SIZE=100` fijo y fragmentos grandes (`maxBytesPerMessage: 100000`), el batch llega a 5-10 MB
y **pgJDBC deadlockea** (`wait_event = Client/ClientWrite`, cuelgue de 12+ minutos, y luego
`Cannot persist MT101 fragment batch (100 fragments)`). El flush debería considerar también el tamaño
acumulado en bytes, no sólo el número de filas.

**Mitigación usada en las pruebas:** `maxTransactionsPerMessage: 25`, `maxBytesPerMessage: 10000` (≈8 KB por
fragmento → batch ≈800 KB).

---

## 8. Un monto no numérico rompe el lote entero del BUILD

Un valor no numérico en el campo de importe hace fallar el parseo de `MT101_BUILD_FROM_TABLE` y **mata el lote
completo**: no hay cuarentena por fila para errores de tipo de dato, sólo para errores estructurales que
detecta el `MT101_VALIDATE`. En una carga de 10 000 filas, una sola fila mal tipada impide construir las 9 999
restantes.

---

## 9. Cobertura de tests: la resolución de secretos nunca se ejercita vía CDI

Todos los tests construyen `new SecretResolver(List.of(...))` a mano
(`JsonConfigurationMapperTest`, `SourceCatalogServiceTest`, `Mt101ArchiveTaskProviderTest`,
`ConfigPluginTrustMaterialProviderTest`), y los ITs inyectan un `TestConfigBackedSecretValueProvider` propio.
Por eso el hallazgo #1 —que rompía **toda** resolución de secretos en runtime— pasó desapercibido. Hace falta
al menos un `@QuarkusTest` que resuelva un `${secret:...}` real a través del contenedor CDI.

---

## Comportamientos que SÍ se validaron (y conviene no perder)

- **Idempotencia remota.** Con la política por defecto `SKIP_IF_SAME_HASH`, un archivo preexistente con
  distinto tamaño/hash se **rechaza** (`manual review required`) en vez de sobrescribirse. `OVERWRITE` está
  prohibido en el pago correctivo.
- **Clasificación por fase.** Un fallo *antes* del despacho (connect/stat) es `REJECTED` (reutilizable); *durante
  o después* del `put`/`rename` es `UNCERTAIN`, y el sistema **nunca reenvía a ciegas**: verificado que el banco
  se quedó en 880 archivos durante toda la resolución.
- **Resolución de UNCERTAIN por STATUS.** 20 ACK → `SENT`, 10 NAK → `REJECTED`, 10 sin respuesta → siguen
  `UNCERTAIN` con el motivo registrado; una segunda ronda los cerró. El snapshot congelado de la config de
  STATUS permite autenticar la consulta diferida (por eso exige refs y no literales).
- **Segregación de funciones.** `admin` solicita y `approver` aprueba, tanto en el rebuild como en el pago;
  el mismo actor no puede hacer ambas.
- **Inmutabilidad del plan de pago.** Un trigger de Postgres
  (`mt101_pay_plan_fragment_immutable`) bloquea el borrado/modificación de los fragmentos de un plan
  `ACTIVE`/`SUPERSEDED`. Impidió incluso un intento de "arreglo" por DB, que es exactamente lo que debe hacer.
- **Historial append-only.** `mt101_corrective_pay_action` registra cada transición con actor:
  `PAY_REQUESTED → PAY_PLAN_PREPARED → PAY_CLAIMED → PAY_DISPATCHING → PAY_UNCERTAIN → PAY_RESOLVED (×2)`.
- **Bloqueo optimista en la corrección.** `PATCH /staging-row` con `If-Match` sobre la versión de la fila.

---

## Evidencia (entregas reales al banco)

| Set | Fragmentos | Resultado |
|-----|-----------|-----------|
| `E2E10K-11` (10 000 filas) | 400 | 360 `SENT` + 40 `SUPERSEDED` |
| `E2E10K-11-FIX-3` (correctivo) | 40 | 40 `SENT` — pago correctivo completo |
| `E2E10K-12` (2 000 filas) | 80 | 40 `SENT` + 40 `SUPERSEDED` |
| `E2E10K-12-FIX-4` (correctivo, colisión plantada) | 40 | 20 `SENT` + 20 `SUPERSEDED` → `PARTIALLY_SENT` |
| `E2E10K-12-FIX-4-FIX-5` (run hijo, generación 2) | 20 | 20 `SENT` |
| `E2E10K-13` (2 000 filas) | 80 | 40 `SENT` + 40 `SUPERSEDED` |
| `E2E10K-13-FIX-6` (correctivo, UNCERTAIN forzado) | 40 | 30 `SENT` + 10 `REJECTED` tras resolver por STATUS |

Total en `sftp-bank:/inbox`: **880 archivos FIN**, cada instrucción entregada exactamente una vez.

## Config de prueba a revertir antes de producción

- `directAccessGrants` habilitado en el cliente `integration-hub-ui` del realm (usado para automatizar el e2e
  con el password-grant).
- Certificado self-signed y `PUBLIC_BASE_URL` por IP.
- Usuarios de fixture `admin` / `approver` del realm.
