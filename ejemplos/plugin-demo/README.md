# plugin-demo — plugins externos INDEPENDIENTES (front + back) en Docker

Ejemplo completo y **desacoplado del monorepo** de cómo un tercero publica plugins para la
plataforma, los levanta en Docker y los instala en la instancia local. Nada aquí depende del
workspace Nx ni del `pom` padre: el único contrato compartido es el `.proto` (backend) y un
paquete UI versionado que se instala por **tarball local** (frontend).

```
                          ┌──────────────────────────────────────────┐
   Plataforma (host, dev) │  http://localhost:8080                    │
   ┌──────────────┐       │  · engine: task DEMO_TRANSFORM_* ─(gRPC)──┼──► backend-grpc-*
   │  shell UI    │──carga remoteEntry.json (Native Federation)───────┼──► frontend-widget
   └──────────────┘       └──────────────────────────────────────────┘
        docker compose:  50061 (java) · 50062 (node) · 50063 (py) · 4300 (front)
```

## Componentes

| Carpeta | Qué es | Contrato | Independencia |
|---|---|---|---|
| `backend-grpc-java` | Task provider gRPC `DEMO_TRANSFORM_JAVA` | `remote_plugin.proto` (copiado) | pom sin parent, grpc-netty plano, fat-jar |
| `backend-grpc-node` | `DEMO_TRANSFORM_NODE` | idem | `@grpc/grpc-js` + proto-loader |
| `backend-grpc-python` | `DEMO_TRANSFORM_PY` | idem | `grpcio`, stubs generados en build |
| `frontend-widget` | Widget Native Federation (`./Widget`) | manifest + firma ADR-013 | Angular standalone, UI kit por tarball |

Los tres backends implementan **el mismo contrato** `RemotePluginService.Execute` (la
plataforma es el cliente gRPC, ADR-014) y transforman un texto: `{text, op}` → `{result}`,
con `op ∈ upper|lower|reverse|identity`.

## Independencia (por qué es "de verdad")

- **Backend**: cada proyecto **copia** `remote_plugin.proto` y genera sus stubs. No depende
  de `platform-contract` ni de ningún artefacto del monorepo. Se compila y corre solo.
- **Frontend**: no pertenece al workspace Nx. Consume `@integration-hub/plugin-ui-kit` desde
  `frontend-widget/vendor/integration-hub-plugin-ui-kit-0.0.1.tgz` (tarball local vendorizado),
  **sin publicar a ningún registry público**. Ver `frontend-widget/README.md`.

## 1) Levantar los plugins en Docker

```bash
cd ejemplos/plugin-demo
docker compose up --build
```

Esto construye y arranca los 3 backends (puertos 50061/50062/50063) y el front (4300).
La **plataforma no se levanta aquí**: corre en el host en modo dev (`http://localhost:8080`).
Los puertos publicados hacen que la plataforma alcance los backends como
`http://localhost:5006x`, el único origen que la trust-policy admite sobre HTTP plano para
gRPC (`PluginDescriptorTrustPolicy`: HTTP solo se permite a `localhost/127.0.0.1`).

## 2) Firmar el front (ADR-013)

La shell verifica **SRI + firma ECDSA P-256** antes de montar el remoto. Tras el build:

```bash
cd frontend-widget
node sign-remote.mjs dist/browser/remoteEntry.json demo-transform-key-1
```

- Registra la **clave pública** que imprime en el host (`APP_PLUGIN_REMOTE_TRUSTED_KEYS`,
  con `keyId=demo-transform-key-1`).
- Pega `integrity` y `signature` en `frontend-widget/manifest.json → remote`.

> El `manifest.json` versionado trae placeholders `REEMPLAZAR-…` a propósito: sin firmar y
> sin registrar la clave, la shell rechaza el remoto (fail-loud), no lo monta silenciosamente.

## 3) Instalar en la plataforma

Ambos endpoints exigen rol `PLATFORM_ADMIN` o `INTEGRATION_ADMIN`. Inicia sesión como admin,
copia el JWT y:

```bash
# Linux/macOS
./install/register.sh <BEARER_TOKEN>
# Windows
powershell -File install/register.ps1 -Token "<JWT>"
```

Qué hace el script:

| Plugin | Endpoint | Cuerpo |
|---|---|---|
| 3 backends | `POST /api/plugins/install` | `install/backend-*.json` (transport GRPC + endpoint local) |
| front | `POST /api/plugins/ui-catalog` | `frontend-widget/manifest.json` |

Al instalar un backend, el `reloadInstalledPlugins()` publica el descriptor en el
`RemotePluginRegistry`; el engine enruta entonces `DEMO_TRANSFORM_*` al plugin por gRPC
(`TaskProviderRegistry.descriptorForInvocation`). El front queda en el catálogo de UI que la
shell lee al arrancar.

## 4) Probar

- Crea/ejecuta una tarea con `taskType = DEMO_TRANSFORM_JAVA` (o `_NODE` / `_PY`) y
  configuración `{"text":"hola mundo","op":"upper"}`. El output será
  `{"result":"HOLA MUNDO","op":"upper","engine":"java"}`.
- Abre la sección de plugins de la UI: el widget **Demo Transform** se carga por Native
  Federation con el look nativo (design tokens del kit compartido).

## Evidencia de verificación (este ejemplo)

- **Backends**: unit tests de la lógica pura (Java 5/5, Node 5/5, Python vía Docker) y prueba
  **E2E gRPC cross-language** — un cliente invoca `Execute` contra los 3 servidores con el
  wire-format real (`configuration_json → outputs_json`), los 3 devuelven `HOLA MUNDO`, y un
  `task_type` no soportado responde `INVALID_ARGUMENT` (fail-loud).
- **Frontend**: `npm install` (tarball resuelto) + `ng build` → `remoteEntry.json` con
  `exposes:["./Widget"]` y `plugin-ui-kit` en `shared`; `sign-remote` produce
  `integrity`+`signature` sobre el `remoteEntry.json` real.

## Modelo alternativo (referencia)

Existe además el modelo **broker + HTTP-resume** (asíncrono) en
`ejemplos/backend-plugin-sidecar`, que consume `AsyncTaskEnvelope` y reanuda vía
`POST /api/process-executions/resume/{token}`. Este ejemplo usa el modelo **gRPC síncrono**
por ser el camino más limpio para independencia (un plugin solo necesita el `.proto`).
