# plugin-demo - plugins externos front + back en Docker

Ejemplo completo y desacoplado del monorepo para publicar plugins externos de Integration Hub.
La plataforma corre en el host (`http://localhost:8080`) y estos plugins corren fuera del
runtime principal.

## Componentes

| Carpeta | Que es | Contrato | Independencia |
|---|---|---|---|
| `backend-grpc-java` | Task `DEMO_TRANSFORM_JAVA` + reader `DEMO_REMOTE_CSV` | `remote_plugin.proto` copiado | Maven standalone, sin parent |
| `backend-grpc-node` | Task `DEMO_TRANSFORM_NODE` + reader `DEMO_REMOTE_CSV_NODE` | `remote_plugin.proto` copiado | Node + grpc-js |
| `backend-grpc-python` | Task `DEMO_TRANSFORM_PY` + reader `DEMO_REMOTE_CSV_PY` | `remote_plugin.proto` copiado | Python + grpcio |
| `frontend-widget` | Widget Native Federation `./Widget` | manifest + firma ADR-013 | Angular standalone + UI kit por tarball |

Los backends implementan `RemotePluginService.Execute`. La plataforma es cliente gRPC.
El frontend se carga como remote module firmado y verificado por la shell.

## Backend task demo

Los tres backends transforman texto:

```json
{ "text": "hola mundo", "op": "upper" }
```

Resultado esperado:

```json
{ "result": "HOLA MUNDO", "op": "upper", "engine": "java" }
```

Tipos:

- `DEMO_TRANSFORM_JAVA`
- `DEMO_TRANSFORM_NODE`
- `DEMO_TRANSFORM_PY`

## Backend reader demo

Los tres backends exponen un reader remoto CSV SPI 2:

- Java: `DEMO_REMOTE_CSV`, invocado como `READER_READ:DEMO_REMOTE_CSV`.
- Node: `DEMO_REMOTE_CSV_NODE`, invocado como `READER_READ:DEMO_REMOTE_CSV_NODE`.
- Python: `DEMO_REMOTE_CSV_PY`, invocado como `READER_READ:DEMO_REMOTE_CSV_PY`.

La plataforma los invoca con el patron:

```text
READER_READ:<readerType>
```

Payload esperado en `configuration_json`:

- `artifactRef`: URL presignada `GET` creada por la plataforma.
- `batchSize`: cantidad maxima de records por pagina.
- `cursor`: byte offset opcional para continuar.
- `configuration.columns`: nombres de columnas opcionales.
- `configuration.delimiter`: delimitador opcional, por defecto `,`.

El plugin descarga el archivo por HTTP, usa `Range: bytes=<cursor>-`, devuelve una pagina
en `outputs.records` y publica `outputs.nextCursor` cuando hay mas datos.

Para probarlo en la plataforma:

1. Registra un `ReaderDefinition` con el `readerType` del backend elegido.
2. Usa config opcional:

```json
{ "columns": ["name", "amount"], "delimiter": "," }
```

3. Encadena un proceso `FILE_READ -> DB_WRITE`. El motor debe entrar por fast path porque
   el reader remoto declara capacidad streaming en la plataforma.

## Levantar en Docker

```bash
cd ejemplos/plugin-demo
docker compose up --build
```

Puertos:

- Java gRPC: `50061`
- Node gRPC: `50062`
- Python gRPC: `50063`
- Front widget: `4300`

## Firmar el frontend

La shell verifica SRI + firma ECDSA P-256 antes de montar el remoto.

```bash
cd frontend-widget
npm install
npm run build
node sign-remote.mjs dist/browser/remoteEntry.json demo-transform-key-1
```

Luego:

- registra la clave publica en `APP_PLUGIN_REMOTE_TRUSTED_KEYS`.
- pega `integrity` y `signature` en `frontend-widget/manifest.json`.

El manifest versionado trae placeholders a proposito; sin firma valida la shell debe rechazar
el remoto.

## Instalar en la plataforma

Requiere rol `PLATFORM_ADMIN` o `INTEGRATION_ADMIN`.

```bash
./install/register.sh <BEARER_TOKEN>
```

En Windows:

```powershell
powershell -File install/register.ps1 -Token "<JWT>"
```

Los descriptores backend de ejemplo quedan con `trusted:false`. Eso permite instalacion y
diagnostico, pero la ejecucion real queda bloqueada por el core hasta instalar metadata de
confianza (`integrity`/`signature`) o usar un flujo corporativo de confianza.

## Evidencia esperada

- Java: unit tests de `TransformTask` y `DemoRemoteCsvReader` con HTTP Range local.
- Node/Python: unit tests de transform y reader CSV remoto con HTTP Range local.
- Cross-language: cliente gRPC invoca los tres servidores.
- Frontend: `npm install`, `ng build`, firma de `remoteEntry.json`.

## Modelo alternativo

El modelo broker + HTTP resume vive en `ejemplos/backend-plugin-sidecar`. Este demo usa gRPC
sincrono porque es el camino minimo para plugins independientes.
