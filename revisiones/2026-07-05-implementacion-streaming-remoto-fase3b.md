# Implementación — streaming remoto FASE 3b: paginación de records (#3)

Fecha: 2026-07-05
Alcance: pagina la respuesta de records del reader remoto para acotar la memoria de la plataforma, sobre la
[Fase 3a](2026-07-05-implementacion-streaming-remoto-fase3a.md). Aplica los refinamientos del
[doble-check de Fase 3b](2026-07-05-analisis-streaming-remoto-fase3b.md). Fuera del money-path.

## Cambios (SOLID)

- **`RemoteReaderProvider.readInBatches` → LOOP con cursor** (checkpoint por página): repite
  `invoke(READ, {..., artifactRef, cursor})` → una **página** de records + `nextCursor` (+ skips), re-batcha la página en
  trozos de `batchSize` para el `consumer`, acumula counts/skips, hasta `nextCursor` vacío. Devuelve
  `ReadResult(List.of(), total, skips)` — **records VACÍOS** (streameó por el consumer; ningún caller lee `records()`
  del reader remoto → acota la memoria en el streaming pipeline).
  - **Backward-compatible SIN bump de spiVersion**: un plugin no-paginado (sin `nextCursor`) hace **una iteración** =
    comportamiento 3a.
  - **Guard de NO-PROGRESO** (refinamiento del doble-check): corta con error si el `nextCursor` **no cambia** entre
    iteraciones (stuck); más un ceiling `MAX_PAGES` generoso como red contra loop infinito.
  - **Cleanup** del input staged en `finally` (éxito o fallo).
- **`ArtifactTransfer.openRange(reference, offset)`** (SDK, NUEVO): descarga por **Range GET** desde un offset, para que
  el plugin **pagine sin re-descargar todo** (cada byte se lee una vez, O(archivo), en vez de O(N²) re-parseando desde
  el inicio). Documenta que el `cursor` debería ser un offset de byte en frontera de record. S3/MinIO honran `Range` en
  URLs presignadas.

## Pruebas (evidenciadas, 4 capas)

- **Unit `RemoteReaderProviderTest`** (4): backward-compat (una página, sin cursor → una iteración); **multi-página**
  (2 páginas con cursor → `recordCount`=3, el consumer recibe una página por invocación, `records()` vacío, cleanup);
  **no-progreso** (cursor sin cambio → fail-fast + cleanup); gate `spiVersion`.
- **Unit SDK `ArtifactTransferTest`** (7): `openRange` hace un Range GET desde el offset y trae los bytes desde ahí
  (server 206).
- **E2E `RemoteReaderArtifactRefMinioIT`** (MinIO real, 3): happy+cleanup, leak-on-failure, y **paginado por Range GET
  contra MinIO real** — el plugin pagina por offset con `Range: bytes=N-` de la URL presignada (206), 2 páginas →
  `recordCount`=2, una página por invocación, cleanup. **BUILD SUCCESS ~11 s.**
- **Integración `collectReadResult` + reader paginado (doble-check)**: `FileReadRuntimeSupport.collectReadResult` (el
  path de `ProcessTaskRuntimeService`) con el reader paginado (2 páginas) **acumula las 3 filas via el callback** y
  devuelve `recordCount`=3 + `records().size()`=3 — aunque el reader devuelva `records()` **vacío**. Cierra el hueco: el
  otro consumidor (el que materializa) funciona con 3b.
- **Regresión amplia**: 28 tests (StreamingPipeline Service/Worker, reader/source registries, `ProcessTaskRuntimeService`)
  verdes → el `ReadResult` vacío no rompe el streaming pipeline ni `collectReadResult`. El wiring CDI no cambió respecto
  a 3a (que booteó OK).

## Alcance honesto

- **Plataforma bounded** a O(página + skips acumulados) en el streaming pipeline; `collectReadResult`
  (`ProcessTaskRuntimeService`) materializa via callback igual — **preexistente**, fuera de alcance de 3b.
- **Paginación eficiente = responsabilidad del plugin** (cursor=offset + Range GET; el naïve re-parsea desde el inicio,
  O(N²)). La plataforma provee el mecanismo (cursor opaco threadeado + URL GET capaz de Range) y el SDK el helper
  (`openRange`).

## Estado del proyecto #3

- Fase 1 · 2a · 2b · 3a · **3b (paginación): ✅ HECHA**.
- Fase 4 (broker transport: llevar solo la referencia sobre el broker), Fase 5 (retirar guard v58 — **hecho para el
  reader**; queda revisar el source): pendientes.

## Conclusión

El reader remoto ya pagina: la plataforma repite `READ(cursor)` acumulando counts y streameando cada página por el
consumer, con `ReadResult` vacío (bounded en el streaming pipeline), backward-compatible (una página = 3a), con guard de
no-progreso. El SDK aporta `openRange` para que el plugin pagine eficientemente por Range GET. Validado en 4 capas,
incluido el Range GET contra MinIO real.
