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

## Veredicto

**La Fase 4 no requiere implementación** y **la Fase 5 ya está hecha** — ambas resueltas por el diseño transport-agnostic
de la opción B: la referencia viaja por cualquier control channel (gRPC o broker), el archivo va por el object store, y
el guard v58 se retiró al migrar el reader. Recomiendo **cerrar el proyecto #3** tras 3b, con **opcionalmente** un test
de round-trip del `artifactRef` sobre el envelope del broker como blindaje del diseño. El proyecto queda: contrato+SDK
(1) → staging+MinIO (2a) → source por ref (2b) → reader input por ref (3a) → paginación (3b) → broker/guard (4/5,
resueltos por diseño). Sigue fuera del money-path.
