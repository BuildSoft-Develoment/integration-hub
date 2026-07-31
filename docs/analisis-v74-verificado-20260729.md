# Analisis v74 verificado contra el código — 2026-07-29

Revisión del análisis externo v74, contrastado punto por punto contra el árbol real
(rama `experiment/quarkus-lts-native`, HEAD `a022b919`) y contra evidencia medida hoy.

**Resumen del contraste:** de los 12 puntos, **8 se confirman**, **2 son incorrectos por
desactualización**, **1 tiene el diagnóstico correcto pero la causa raíz equivocada**, y **1 se
confirma pero con alcance mucho menor del que sugiere**.

El veredicto de fondo del análisis —*"v74 mejora fuerte la arquitectura; falta cerrar evidencia de
release"*— **se sostiene**. Lo que cambia es la lista de pendientes: es más corta de lo que dice.

---

## Tabla de contraste

| # | Punto del análisis | Veredicto | Qué se midió |
|---|---|---|---|
| 1 | Motor sin literales `MT101_PAY` / `MT101_PARSE` | ✅ **Confirmado** | 0 literales funcionales en `platform-app/src/main`; la única aparición es javadoc histórico |
| 2 | Readers verticales fuera del core | ✅ **Confirmado** | Ambos en su vertical; 0 clases main con nombre `Mt101`/`Swift`/`Pain001` en el motor |
| 3 | `sinkRef` en MT101_STATUS (ADR-017) | ✅ **Confirmado** | `withResolvedStatusSink` integrado en provider y en `Mt101PayUncertainResolutionService` |
| 4 | Validador compara `sinkRef` por ruta | ✅ **Confirmado**, con el límite que describe | `validateRouteSinks` retorna temprano si un lado no declara sink |
| 5 | UI de STATUS: preservación sí, gobierno parcial | ✅ **Confirmado** | 0 ocurrencias en el HTML; el código lo documenta explícitamente |
| 6 | Preservación genérica en el frontend | ✅ Diseño confirmado; alarma del cache **falsa** — pero la suite **sí** está roja por otro test | 734/735: falla `swift-mt101-i18n` por timeout de hook, no por claves |
| 7 | Evidencia 1M post-refactor | ✅ **Confirmado** | 3 tests, 0 fallos, 1046 s, Java 25.0.2 |
| 8 | Reactor rojo por MySQL | ⚠️ **Hecho correcto, causa raíz equivocada** | No es la imagen: es contención. Ver abajo |
| 9 | Nativo post-refactor pendiente | ❌ **Incorrecto — desactualizado** | Imagen construida 53 min *después* del último commit del refactor, y desplegada |
| 10 | Money-path sin regresión | ✅ **Confirmado** y reforzado | 185 casos del CP v2 ejecutados contra el nativo, 0 `Fail` |
| 11 | Capacidad opt-in sin trinquete | ✅ **Confirmado** — el mejor aporte del análisis | No existe ninguna prueba de convención |
| 12 | Deuda documental | ⚠️ **Confirmado pero mucho menor** | **1** referencia obsoleta, no varias |

---

## Los cuatro puntos donde el análisis se corrige

### Punto 8 — El reactor falla, pero no por lo que dice

El análisis acierta en el hecho: `reactor-v73-20260728/reactor-completo.log` termina en `BUILD
FAILURE`, con `platform-app` en `FAILURE [24:26 min]` y `audit-consumer` en `SKIPPED`. El error es
`ContainerLaunchException: Container startup failed for image mysql:8.4`.

Pero su lectura —*"falla ambiental / Testcontainers / MySQL"*, con la recomendación de mover el test
a un perfil `-Pcompat-db` o *"estabilizar ese contenedor"*— trata el síntoma. Tres mediciones dicen
otra cosa:

1. **El mismo test, en aislamiento, pasa** (medido hoy):
   `Tests run: 1, Failures: 0, Errors: 0, Time elapsed: 237.0 s — BUILD SUCCESS`.
2. **Otro contenedor de la misma imagen pasó en la misma corrida del reactor**:
   `StoredProcedureTaskProviderMySqlCompatibilityTest` con `mysql:8.4` → `117.8 s`, sin error.
3. **El que falló consumió 383,2 s antes de rendirse** — más que el arranque exitoso en aislamiento.
   `RetryCountExceededException` es Testcontainers agotando su presupuesto de reintentos, no la
   imagen negándose a arrancar.

La suite de compatibilidad multi-DB es cara por sí sola en esa corrida: Oracle 288 s + 200 s,
MySQL 383 s + 118 s, SQL Server 85 s + 67 s, PostgreSQL 12 s + 8 s. Son **~1 160 s** de los
24:26 min de `platform-app`, con varios contenedores compitiendo por I/O.

**Causa raíz medida:** el contenedor de MySQL en este host tarda ~4 min en estar sano incluso sin
carga; el timeout de arranque por defecto de Testcontainers (120 s) no alcanza, y bajo la contención
del reactor tampoco alcanzan los reintentos. **El test no declara `withStartupTimeout`.**

**Consecuencia para la recomendación:** mover el test a un perfil aparte lo esconde, no lo arregla —
y deja la compatibilidad multi-DB fuera del build base, que es justo lo contrario de lo que quiere
una homologación bancaria. El arreglo determinista es calibrar el timeout a la realidad medida del
host, para que el resultado deje de depender de la carga de la máquina.

### Punto 9 — El nativo post-refactor existe

El análisis dice: *"no encontré evidencia nueva de native build / native smoke / native SFTP-PAY-STATUS
post-refactor"*.

Medido:

| Hito | Marca de tiempo |
|---|---|
| Último commit del refactor (`a022b919`) | 2026-07-28 **21:31:25** |
| Imagen `integration-hub:native-appih` (`2b549c859e88`) | 2026-07-28 **22:24:06** |

La imagen es **53 minutos posterior** al último commit del refactor, está desplegada
(`ih-int-app` corre sobre ella) y arranca en **1,340 s**. Contra ese binario se ejecutaron hoy
**185 casos del plan de pruebas v2** — incluido el money-path completo (SFTP, FTP, S3, TXT, XLSX),
el flujo maker-checker con dos identidades y la corrección de staging con bloqueo optimista.

El riesgo que el análisis enumera (*beans CDI no detectados, reflection faltante, reader vertical no
visible, STATUS/PAY no resuelve sinkRef en nativo*) **está descartado empíricamente**: si alguno
ocurriera, esas 185 verificaciones no habrían pasado sobre la imagen nativa.

### Punto 6 — El cache de Vitest era falsa alarma, pero la suite **sí** está roja (por otra cosa)

El análisis sospecha de `task-config-roundtrip.spec.ts` por una entrada de cache. La señal es falsa, y
se demuestra sin correr nada:

```json
[":src/app/architecture/task-config-roundtrip.spec.ts", {"duration": 0, "failed": true}]
```

`duration: 0` significa que **el spec nunca llegó a ejecutarse** — corrida abortada o error de
colección, no un test que falló. Un test que falla de verdad tiene duración. Además el directorio de
cache es `da39a3ee5e6b4b0d3255bfef95601890afd80709`: el SHA-1 de la cadena vacía, o sea una clave por
defecto sin contenido que la respalde.

**Se reejecutó la suite completa** (`nx test web --skip-nx-cache`) y el resultado corrige a los dos:

```
Test Files  1 failed | 134 passed (135)
     Tests  1 failed | 734 passed (735)
```

- `task-config-roundtrip.spec.ts` **pasa**. La alarma del cache queda descartada.
- Pero falla **otro** que ni el análisis ni la documentación previa habían detectado:
  `swift-mt101-i18n.spec.ts > declara las mismas claves en ambos idiomas`.

**Y no es lo que el nombre sugiere.** No es una discrepancia de claves entre español e inglés:

```
Error: Hook timed out in 10000ms.
 ❯ apps/web/src/app/architecture/swift-mt101-i18n.spec.ts:44:3
   44| beforeEach(async () => {
   45|   // Dinamico: importar la lib lazy de forma estatica la traeria al bundle inicial.
   46|   const { SWIFT_MT101_MESSAGES } = await import('@integration-hub/fe…
```

El `beforeEach` hace un `import()` dinámico del chunk lazy del vertical. En frío, en esta máquina y
bajo carga, tarda más de los 10 s del hook. Prueba de que es eso y no las claves: de los **3 tests
del archivo, 2 pasaron** — los que corrieron después, cuando el módulo ya estaba cacheado. Y esos dos
(*"toda clave que el vertical USA está declarada"* y *"las claves del vertical ya no están en el
diccionario del core"*) dependen del mismo objeto, así que los diccionarios están sanos.

Las estadísticas de la corrida lo confirman: `import 107.86s`, `environment 791.59s`.

**Corrección a documentación propia:** el `.md` del plan de pruebas afirmaba *"la suite de frontend
(735 tests)"* como evidencia en verde. Son 734 de 735. Hay que corregirlo.

### Punto 12 — La deuda documental es una línea, no un conjunto

El análisis menciona `spec-tareas.md` y `spec-tecnica.md` más *"docs/evidencias históricas"*. La
búsqueda real encuentra **una sola** referencia viva a las rutas viejas:

```
specs/008-mensajeria-pagos/spec-tareas.md:60   (fila T-015)
```

Y es discutible que sea deuda: esa fila es el **registro histórico de dónde se implementó** una tarea,
en una tabla de trazabilidad. Corregirla a la ruta nueva reescribe la historia; dejarla puede
desorientar. La decisión razonable es anotarla, no reescribirla.

---

## Lo que el análisis aporta y hay que atender

### Punto 11 — Capacidad opt-in sin trinquete (el hallazgo más valioso)

Confirmado, y es el más importante de los que quedan abiertos:

```java
default boolean movesMoney() { return false; }
default boolean producesConsumableRecords() { return false; }
```

Búsqueda exhaustiva: **no existe ninguna prueba de convención** que obligue a una tarea de pago a
declarar `movesMoney()`. `VerticalBoundaryArchTest` solo menciona la capacidad en un javadoc que
explica por qué su lista de literales congelados quedó vacía.

El riesgo es exactamente el que describe: un vertical nuevo con `SBS_PAY` que olvide el `@Override`
queda **fuera de la protección anti-doble-pago**. Tras una caída de nodo, el barrido de ejecuciones
huérfanas re-encolaría esa ejecución a ciegas en vez de dejarla en `NEEDS_RECONCILIATION`.

Y hay un agravante que el análisis no menciona: el default es `false`, o sea **el modo inseguro es el
silencioso**. No hay error, no hay warning, no hay test rojo. El único síntoma sería un pago
duplicado en producción.

### Punto 4 — Endurecer la política de `sinkRef` para producción

Confirmado tal como lo describe. `validateRouteSinks` retorna temprano cuando un lado no declara
`sinkRef`, así que la combinación *PAY con `sinkRef` / STATUS inline* (o al revés) no se bloquea.

Es la decisión correcta para migrar, y peligrosa para producción bancaria: es precisamente la forma
en que el pago sale hacia un banco y su confirmación se busca en otro.

### Punto 5 — Gobierno de `resolveNormalPay` desde la UI

Confirmado, y el propio código lo dice sin ambigüedad:

> *"El flag hoy llega por config sembrada (el form todavía no lo expone), pero el selector ya lo
> respeta."*

El provider preserva `resolveNormalPay`, `resolvesPayTaskRef`, `resolveCorrectivePay`, `poll` y
`callback`; el selector de `executionMode` ya restringe a `once` cuando `resolveNormalPay` está
activo. Lo que falta son los controles en la pantalla.

---

## Ejecución — bloques A y B (autorizados 2026-07-29)

### Bloque A — hecho

`platform-app/src/test/.../architecture/MoneyMovementCapabilityRatchetTest.java`. Congela el mapa
`tipo -> {movesMoney, producesConsumableRecords}` de los 27 providers CDI registrados, más una regla
léxica que exige `movesMoney()` a todo tipo cuyo nombre denote pago (incluye castellano: `PAGO`,
`ENVIO`, `DESPACHO`, además de `PAY`, `SEND`, `DISPATCH`, `TRANSFER`, `REMIT`).

**Verificado por mutación**, porque un trinquete verde que no puede ponerse rojo no protege nada:

| Código | Resultado |
|---|---|
| `Mt101PayTaskProvider.movesMoney()` → `true` (real) | `Tests run: 3, Failures: 0` · BUILD SUCCESS |
| mutado a `return false` | `Tests run: 3, Failures: 3` · BUILD FAILURE |

Los tres tests caen con diagnósticos distintos y accionables. Mutación revertida; evidencia cruda en
`qa/fase-6-qa/evidencias/bloque-A-trinquete-20260729/`.

Sin exclusiones ocultas: los dobles de prueba `TEST_*` también están en el mapa. Filtrarlos por
prefijo habría sido un agujero silencioso.

**Límite conocido, encontrado en el doble check de este mismo bloque.** La capacidad se declara por
*tipo de provider*, pero *"¿esto mueve dinero?"* es en realidad una propiedad de la **tarea
configurada**. `FileDeliverTaskProvider` acepta cualquier `sinkRef` con `direction` de salida — el
mismo mecanismo con el que `MT101_PAY` deja el archivo en el banco (en el stack de integración, el
sink 11 es `Sink SFTP banco E2E`). Un operador puede armar una entrega de pagos con `FILE_DELIVER`:
ese tipo declara `movesMoney=false` **con razón** (es genérico) y aun así movería dinero, así que la
recuperación de huérfanas lo re-encolaría.

No es una regresión de ADR-021: con el literal `"MT101_PAY"` anterior el hueco era idéntico, y el
trinquete no lo empeora. Pero conviene decirlo en vez de dejar que el bloque A se lea como cobertura
total. Queda anotado en el javadoc del propio trinquete y propuesto como **bloque E** más abajo.

### Bloque B — hecho

**Frontend: 735/735.** El `beforeEach` de `swift-mt101-i18n.spec.ts` reimportaba el chunk lazy en cada
test sin necesidad —los diccionarios son de solo lectura—. Pasarlo a `beforeAll` importa una vez:
quita el trabajo repetido y, con él, la fragilidad. No se tocó ningún timeout.

**Backend:** se descubrió que **el proyecto ya tenía la respuesta**. Los tests de Oracle declaraban
`withStartupTimeout(Duration.ofMinutes(8))` — por eso Oracle pasaba con 288 s mientras MySQL reventaba
con el default de 120 s. No se inventó una política nueva: se completó la existente en los seis
contenedores JDBC que no la tenían (MySQL ×2, SQL Server ×2, PostgreSQL ×2), con el valor unificado en
`CompatibilityContainerTimeouts`, que documenta los tiempos medidos y por qué son 8 minutos.

La suite multi-BD **no se movió a un perfil aparte**: eso habría sacado la compatibilidad multi-BD del
build base, que es lo contrario de lo que exige una homologación bancaria.

#### Resultado medido, y por qué el reactor todavía no está verde

| Fase | v73 | v74 (con el arreglo) |
|---|---|---|
| Surefire `platform-app` | 558 tests, **1 error** (MySQL) | **478 tests, 0 fallos** |
| MySQL compat (funciones) | falló a los 383 s | **pasó en 143,7 s** |
| Failsafe (ITs) | **nunca se ejecutó** | 179 tests, 2 fallos + 1 error |
| Total | 30:23 min · BUILD FAILURE | 39:31 min · BUILD FAILURE |

**El objetivo del bloque B se cumplió**: la fase que fallaba está verde y el fallo de MySQL quedó
resuelto con evidencia. **Pero el reactor sigue rojo**, y hay que decirlo sin adornos.

Lo que pasó es que arreglar surefire **destapó una fase que llevaba tiempo sin correr**: el log de v73
tiene **cero** menciones de failsafe: el build moría antes de `integration-test`, así que ningún IT se
ejecutaba. El build ahora tarda *más* (39 min contra 30) precisamente porque hace estrictamente más.

Los tres ITs que fallan son todos de broker/plugins, y la evidencia apunta a colisión con el stack de
integración que estaba corriendo (25 contenedores, con `ih-int-kafka` en 9092 y cuatro sidecars):

| IT | Error | Lectura |
|---|---|---|
| `AsyncDispatchLivenessBadBrokerIT` | *"la readiness debe ser false con un broker inalcanzable"* → `expected: false but was: true` | El test apunta a un broker que debe estar caído y **sí alcanzó uno**. Casi con seguridad el del stack int |
| `BrokerRemotePluginTransportKafkaIT` | `expected: <exec-42> but was: <null>` | Publica en un broker y lee de otro |
| `RemotePluginSidecarHttpE2EIT` | `Plugin acme-tasks signature is invalid` | El menos claro; no parece ambiental a primera vista |

**Pendiente para cerrar el bloque B:** re-ejecutar con el stack de integración detenido, que es el
experimento controlado. Sin eso no se puede distinguir un fallo real de una colisión de puertos.

---

## Propuesta de trabajo — 4 bloques

Ordenados por riesgo de dinero, no por esfuerzo. **Ninguno introduce fallback: donde el código quede
obsoleto, se elimina.**

### Bloque A — Trinquete de capacidad money-path (P0)

**Problema:** el modo inseguro es el silencioso.

**Solución:** una prueba de arquitectura que recorra los `TaskProvider` registrados y falle si un
provider cuyo tipo denota pago (`*_PAY`, `*_DISPATCH`, `*_SEND`) no declara `movesMoney() == true`.
Con lista de excepciones explícita y vacía, al estilo del freeze-store de `VerticalBoundaryArchTest`:
volver a llenarla tiene que ser una decisión visible en el diff.

**Evidencia:** la prueba en verde, más una prueba negativa que demuestre que un provider de pago sin
la capacidad la pone en rojo.

### Bloque B — Build determinista: timeouts calibrados a la realidad del host (P1)

**Problema — y es uno solo, no dos.** El build tiene *timeouts por debajo de la latencia real de esta
clase de máquina*, en el backend y en el frontend. El resultado verde/rojo depende de la carga, no
del código:

| Dónde | Timeout | Latencia medida | Síntoma |
|---|---|---|---|
| `DatabaseFunctionTaskProviderMySqlCompatibilityTest` | 120 s (default Testcontainers) | 237 s en aislamiento | `ContainerLaunchException` tras 383 s de reintentos |
| `swift-mt101-i18n.spec.ts` (`beforeEach`) | 10 s (default hook de Vitest) | `import` en frío del chunk lazy | `Hook timed out in 10000ms` |

**Solución backend:** declarar `withStartupTimeout` explícito en los contenedores de compatibilidad
multi-DB, dimensionado a lo medido (MySQL ~237 s, Oracle ~288 s). **No se mueve nada a un perfil
aparte**: la compatibilidad multi-DB debe seguir en el build base de un producto bancario, que es
justo lo contrario de lo que proponía el análisis.

**Solución frontend:** el `beforeEach` de `swift-mt101-i18n.spec.ts` re-importa el chunk lazy en cada
test sin necesidad — los datos son de solo lectura. Pasarlo a `beforeAll` importa una sola vez: quita
el trabajo repetido *y* la fragilidad, sin tocar ningún timeout. Es el arreglo correcto, no un parche.

**Evidencia:** reactor completo verde y `nx test web` en 735/735, con ambos logs crudos archivados en
`evidencias/`.

### Bloque C — Política productiva de `sinkRef` (P1)

**Problema:** PAY con `sinkRef` y STATUS inline no se bloquea.

**Solución:** endurecer `Mt101PayStatusConnectionCoverageValidator` para exigir simetría: si un lado
de una ruta declara `sinkRef`, el otro también debe declararlo, y deben coincidir. Gobernado por
configuración para no romper definiciones en migración, con el default **estricto** en el perfil de
producción (misma línea que `maker-checker=true` y `direct-list=false`).

**Evidencia:** pruebas de las cuatro combinaciones (ambos sink iguales / ambos sink distintos / uno
inline / ninguno) en ambos perfiles.

### Bloque D — Gobierno de conciliación en la UI de STATUS (P2)

**Problema:** el operador no puede activar ni auditar la conciliación normal desde pantalla.

**Solución:** exponer `resolveNormalPay`, `resolvesPayTaskRef` y `resolveCorrectivePay` en el
formulario, respetando la restricción de `executionMode` que el selector ya implementa.

**Evidencia:** prueba de round-trip que demuestre que activar y desactivar desde la UI no pierde ni
resucita configuración, integrada al `task-config-roundtrip.spec.ts` existente.

---

### Bloque E — Capacidad a nivel de tarea configurada (P1, propuesto tras el doble check)

**Problema:** la protección anti-doble-pago mira el *tipo* de tarea, no la *tarea configurada*. Una
tarea genérica (`FILE_DELIVER`) apuntando al sink del banco mueve dinero y es invisible al modelo.

**Solución propuesta:** marcar la **definición de fuente** como crítica de dinero (una bandera en
`/sources` con `direction` de salida, p.ej. `moneyCritical`), y que el motor considere que una
ejecución movió dinero si arrancó una tarea que declara `movesMoney()` **o** una tarea cuyo `sinkRef`
resuelve a una fuente marcada. Así la propiedad viaja con el destino real, no con el nombre del tipo.

**Por qué no se hizo en el bloque A:** cambia el SPI y el modelo de datos de `/sources`, y merece su
propia decisión — probablemente un ADR. El bloque A cubre el caso que sí es declarable por tipo, que
es el mayoritario, y deja el hueco documentado en vez de tapado.

## Lo que queda fuera de estos bloques

Tres pendientes del análisis **no se pueden cerrar desde aquí**, y conviene decirlo explícitamente en
vez de simular cobertura:

- **Dos réplicas reales + broker + caída de nodo.** Es el hueco de homologación más grande. No se
  cubre con testcontainers en una sola JVM: hace falta el despliegue de dos nodos reales.
- **Banco real.** Todo lo verificado usa el simulador SFTP y el gateway mock.
- **49 casos Manual-QA de pantalla.** La navegación está deshabilitada por política del entorno.

## Estado consolidado

| Área | v74 según el análisis | v74 medido |
|---|---|---|
| Motor sin literales verticales | Corregido | ✅ Confirmado |
| Recovery money-path genérico | Mejorado fuerte | ✅ Confirmado |
| Readers fuera del core | Corregido | ✅ Confirmado |
| `sinkRef` en STATUS | Implementado | ✅ Confirmado |
| Validación PAY/STATUS por ruta | Implementada con límite | ✅ Confirmado — Bloque C |
| Preservación genérica frontend | Muy mejorada | ✅ Confirmado; alarma del cache descartada |
| UI `resolveNormalPay` | Parcial | ✅ Confirmado — Bloque D |
| Trinquete de capacidad | Falta | ✅ Confirmado — **Bloque A, P0** |
| Evidencia 1M post-refactor | PASS | ✅ Confirmado |
| Reactor completo | Falla por MySQL | ⚠️ Falla por **timeout mal calibrado** — Bloque B |
| Suite de frontend | No evaluada (solo el cache) | ⚠️ **734/735** — un test rojo no reportado — Bloque B |
| Nativo post-refactor | Pendiente | ❌ **Ya existe y está desplegado** |
| Deuda documental | Varios docs | ⚠️ **1 línea** |
| Dos réplicas reales | Pendiente | Pendiente — fuera de alcance |
| Banco real | Pendiente | Pendiente — fuera de alcance |
