# Análisis — streaming remoto FASE 4 (broker transport) — #3

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar). Evalúa la **Fase 4** del roadmap del
[proyecto #3](2026-07-05-analisis-proyecto-streaming-remoto.md): "llevar solo la referencia sobre el broker". Fuera del
money-path.

## Conclusión adelantada: la Fase 4 es (casi) un NO-OP

El diseño de opción B (**artefacto por referencia**) es **transport-agnostic**: la referencia es un dato de
configuración pequeño que viaja en el request, no un archivo. Verificado contra el código, **no hay nada que migrar en
el broker**. Razones:

### 1. Source/reader (el file-transfer de #3) son gRPC-only
`BrokerRemotePluginTransport.invoke` publica el envelope y devuelve `TaskResult.suspended(...)` (async: publish +
callback/resume). Pero `RemoteSourceProvider.invoke` y `RemoteReaderProvider.invoke` **rechazan `suspended`**
(`"requires immediate result"`) → un source/reader plugin **no puede usar el broker** (necesita resultado inmediato). →
El file-transfer de #3 (2b source, 3a/3b reader) es **solo gRPC**, ya migrado. El broker es para **tasks async**, no para
leer archivos.

### 2. El path async/broker NO embebe archivos
`grep` de `contentBase64`/`readAllBytes`/`Base64.encode` en `service/execution/async/` → **vacío**. Las tasks async
procesan datos referenciados, no embeben el archivo. → **No hay `contentBase64` que retirar** en el broker.

### 3. El `artifactRef` YA fluiría por el broker si hiciera falta (transport-agnostic)
`BrokerRemotePluginTransport.payload(...)` serializa `body.put("configuration", configuration)` — el mismo mapa donde
source/reader ponen `artifactRef`. → Si algún día una task async necesitara un archivo grande, poner `artifactRef` en su
configuración **viajaría por el envelope del broker sin cambios de plataforma**, y el plugin lo resolvería con el mismo
SDK (`ArtifactTransfer`/`openRange`). El mecanismo de referencia es **independiente del transporte** por diseño.

## Qué (no) hay que hacer

- **Migración: ninguna.** No hay Base64 de archivos en el broker; source/reader no usan broker; la referencia es
  transport-agnostic.
- **Verificación opcional (belt-and-suspenders)**: un test unit que confirme que el `payload(...)` del
  `BrokerRemotePluginTransport` **serializa un `configuration` que contiene `artifactRef`** (round-trip) — prueba la
  afirmación "la referencia sobrevive el envelope del broker" sin implementar nada. Es defensivo (hoy ninguna task async
  pone `artifactRef`), pero blinda el diseño transport-agnostic ante un uso futuro.

## Estado de la Fase 5 (retirar guard v58) — también resuelta

- El **guard v58 era SOLO del reader** (`RemoteReaderProvider.maxContentBytes`); se **retiró en 3a** (el input va por
  S3, no por gRPC). El **source nunca tuvo** guard de tamaño (embebía Base64 sin cap, migrado en 2b). → **La Fase 5 ya
  está hecha** como parte de 3a/2b.

## Doble-check — verificación del no-op (self-review)

Reté el "no-op" (donde más fácil se esconde un agujero). **Confirmado, sin hueco**, con verificación extra:

- **El pipeline async invoca source/reader SÍNCRONOS.** `StreamingPipelineWorker` llama `sourceProvider.openFile(...)` y
  `readerProvider.readInBatches(...)` **directamente** (interfaz síncrona). Aun dentro del worker async, el remote
  source/reader va por gRPC (síncrono) — nunca por el broker. → el file-transfer es gRPC-only, sin ambigüedad.
- **El RESULTADO de una task async NO transfiere archivos.** `RemoteTaskProvider` mapea el resume a
  `TaskResult.success(details, outputs)` donde `outputs` es un `Map` estructurado (del `RemoteTaskResumePayload`); no hay
  `contentBase64`/`byte[]`/`SourcePayload`. → el canal de callback/resume devuelve datos estructurados, no archivos.
- **Sin residuos del guard v58**: solo queda un comentario en `ReaderProviderRegistry` (`// el guard v58 … se retira`),
  ningún código. Fase 5 confirmada hecha.

### Clarificación de frontera (honestidad)
El `outputs` del resume async es un `Map` (podría, en teoría, llevar un valor grande). Hoy **ninguna task async devuelve
archivos**. Si en el futuro una task async necesitara **producir un archivo grande**, sería una **extensión separada**
(un `artifactRef` en `outputs` sobre el canal de resume/HTTP) — fuera del alcance de #3 (readers/sources) y no necesaria
hoy. No es un agujero del no-op; es un límite del alcance, documentado.

## Veredicto

**La Fase 4 no requiere implementación** y **la Fase 5 ya está hecha** — ambas resueltas por el diseño transport-agnostic
de la opción B: la referencia viaja por cualquier control channel (gRPC o broker), el archivo va por el object store, y
el guard v58 se retiró al migrar el reader. Recomiendo **cerrar el proyecto #3** tras 3b, con **opcionalmente** un test
de round-trip del `artifactRef` sobre el envelope del broker como blindaje del diseño. El proyecto queda: contrato+SDK
(1) → staging+MinIO (2a) → source por ref (2b) → reader input por ref (3a) → paginación (3b) → broker/guard (4/5,
resueltos por diseño). Sigue fuera del money-path.
