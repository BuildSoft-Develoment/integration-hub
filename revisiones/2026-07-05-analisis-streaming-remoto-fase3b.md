# Análisis — streaming remoto FASE 3b (paginación de records) — #3

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar). Planifica la **Fase 3b**: paginar la respuesta de
records del reader remoto para acotar la memoria de la plataforma. Sobre la [Fase 3a](2026-07-05-implementacion-streaming-remoto-fase3a.md)
(input por referencia). Fuera del money-path.

## Estado real (verificado)

- `RemoteReaderProvider.readInBatches` (3a) hace **una sola** invocación READ y recibe `outputs.records` (TODA la lista)
  → la rebana en batches (consumer) → devuelve `ReadResult(records, count, ...)` con la lista completa. La memoria de la
  plataforma es O(todos los records).
- **Ningún caller usa `ReadResult.records()` del reader remoto** (re-confirmado): `StreamingPipelineService`,
  `StreamingPipelineWorker` y `FileReadRuntimeSupport` usan solo `recordCount()`/`skippedCount()`/`skippedRows()` + el
  **callback** `ReadBatchConsumer.accept`. → devolver `ReadResult` con **records vacíos** es **seguro** y **acota la
  memoria** en el streaming pipeline. (`collectReadResult` acumula igual via el callback — O(todos), **preexistente**,
  fuera de alcance de 3b.)
- No hay config de max-páginas/iteración a reusar → se añade un guard.

## Diseño propuesto (SOLID)

**`readInBatches` pasa de una invocación a un LOOP con cursor** (checkpoint por página):
```
cursor = null; total = 0; batchNumber = 1; allSkips = []
repeat:
    result = invoke(READ, { configuration, sourceFile, artifactRef(GET), batchSize, cursor })
    page   = result.outputs.records          // una PÁGINA de records
    allSkips += result.outputs.skippedRows
    consumer.accept(ReadBatch(name, batchNumber++, page))   // streamea la página
    total += page.size
    cursor = result.outputs.nextCursor
until cursor está vacío/ausente  (o se alcanza el guard de max-páginas)
deleteStaged(key)                 // cleanup tras el loop (finally)
return ReadResult(List.of(), total, allSkips.size(), allSkips)   // records VACÍOS -> bounded
```

- **Backward-compatible → SIN bump de spiVersion**: un plugin que **ignora** el cursor y devuelve todo en una página sin
  `nextCursor` → el loop hace **una iteración** (= comportamiento 3a). La paginación es una **extensión** del contrato
  `artifactRef` (spiVersion 2): `cursor`/`nextCursor` son opcionales. Los plugins que paginan devuelven `nextCursor`.
- **Guard de seguridad**: `MAX_PAGES` (constante o config, p.ej. 1_000_000) para cortar si un plugin devuelve
  `nextCursor` indefinidamente → falla-fast con mensaje accionable (evita loop infinito).
- **Return `ReadResult` con records vacíos**: acota la memoria (una página a la vez) en el streaming pipeline; seguro
  porque nadie lee `records()` del reader remoto.
- **TTL del GET**: debe cubrir el tiempo total de lectura (el plugin descarga el input una vez o por página; la URL
  presignada vive `DOWNLOAD_TTL`=15 min). El input staged se limpia tras el loop (o en fallo, por el `finally`).

## Pruebas (plan)

- **Unit `RemoteReaderProviderTest`**: invoker-stub que devuelve **N páginas** con `nextCursor` → asevera que el
  consumer recibe todas las páginas (batchNumbers 1..N), `recordCount()` = total, `records()` **vacío**, y el cursor se
  threadea correcto; **backward-compat**: plugin de una página sin cursor → una iteración; **guard**: plugin con cursor
  infinito → falla-fast al alcanzar MAX_PAGES.
- **E2E `RemoteReaderArtifactRefMinioIT`**: invoker-stub paginado (descarga el input por la URL GET + devuelve páginas)
  → el consumer procesa todos los records por streaming, con cleanup.
- **Actualizar el assert de 3a**: el unit de 3a asevera `result.records().size()`; con 3b `records()` es vacío →
  cambiar a `recordCount()` (cambio de test, no de caller: ningún caller productivo usa `records()`).

## Alcance / riesgo

- **Cambio acotado** a `RemoteReaderProvider.readInBatches` (loop + cursor + return vacío + guard) + tests. No toca el
  registry ni el staging (3a ya los dejó).
- **Beneficio de memoria scopeado al streaming pipeline** (`collectReadResult` materializa via callback, preexistente,
  fuera de alcance — documentado).
- **Sin bump de spiVersion** (loop backward-compatible). **No** money-path ni correctitud.

## Doble-check — refinamientos (self-review)

Reté el diseño. Sin bug, pero **una cuestión de fondo subestimada** + dos refinamientos:

1. **¿CÓMO pagina un plugin stateless-por-invoke? (subestimado).** Cada `READ(cursor)` es una invocación gRPC/broker
   **separada** y sin estado. Para devolver la "página N", el plugin debe reanudar desde el cursor **sin re-descargar y
   re-parsear todo el input cada página** (eso sería **O(N²)**). El camino eficiente: el cursor codifica un **offset**
   (de byte en una frontera de record), y el plugin hace un **Range GET** de la URL presignada (S3/MinIO soportan
   `Range:` en URLs presignadas si `Range` no va en las cabeceras firmadas) → cada byte se lee una vez en total
   (O(archivo)). → **La plataforma provee el MECANISMO** (cursor opaco threadeado + URL GET capaz de Range); la
   **paginación eficiente es responsabilidad del plugin** y **no es trivial** (manejar records que cruzan la frontera
   del rango). Un plugin naïve que re-parsea desde el inicio cada página funciona pero es O(N²). **A documentar en el
   contrato del SDK**: el cursor debería ser un offset y el plugin usar Range GET.
2. **Guard: mejor detectar NO-PROGRESO que un `MAX_PAGES` fijo.** Un `MAX_PAGES` constante puede **falso-positivo** en un
   archivo legítimamente enorme con páginas chicas (batchSize=1 → 1M páginas = 1M records). Mejor guard: cortar si una
   página viene **vacía con `nextCursor` no vacío** (el plugin no avanza) o si el `nextCursor` **no cambia** entre
   iteraciones (stuck) → fail-fast. Complementar con un ceiling **generoso** de páginas como red, no como límite
   funcional.
3. **La memoria es O(página + TODOS los skips), no O(página).** El loop **acumula `skippedRows`** de todas las páginas
   para devolverlos en el `ReadResult` (los callers los usan). En un caso patológico (casi todo skippeado), los skips
   son O(todos). Para la mayoría de archivos los skips son pocos, pero el bound real incluye los skips acumulados.
4. **Inconsistencia menor de API**: el reader remoto devolvería `ReadResult.records()` **vacío** mientras los readers
   locales (Csv/Xls...) lo devuelven poblado. Es **seguro** (ningún caller lee `records()` del remoto, verificado) pero
   es una divergencia semántica — documentar que el reader remoto streamea por el consumer y no por `records()`.

## Veredicto (revisado)

Fase 3b es **factible y acotada** en la PLATAFORMA (loop con cursor + `ReadResult` vacío + guard de no-progreso), pero el
doble-check aclara que la **paginación EFICIENTE recae en el plugin** (cursor=offset + Range GET; el naïve es O(N²)) — la
plataforma solo provee el mecanismo. El beneficio de memoria de plataforma es O(página + skips) y aplica al **streaming
pipeline**. Sin bump de spiVersion (backward-compatible). Recomiendo **proceder** con la reescritura de `readInBatches`
a loop (cursor threadeado + return vacío + guard de no-progreso) + tests (multi-página + backward-compat + no-progreso +
E2E MinIO paginado + ajustar el assert de 3a), **documentando en el contrato del SDK** que el cursor es un offset y el
plugin debe usar Range GET para paginar eficientemente. Sigue fuera del money-path.
