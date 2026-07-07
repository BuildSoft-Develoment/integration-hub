# demo-transform-widget — plugin de UI externo (independiente)

Widget Angular expuesto como **Native Federation remote** (`./Widget`). Es un proyecto
**totalmente independiente del monorepo**: tiene su propio `package.json` / `angular.json`
(no pertenece al workspace Nx) y consume el UI kit de la plataforma como un paquete
**versionado instalado desde un tarball local** — sin publicar a ningún registry público.

## Independencia: el UI kit por tarball local

`@integration-hub/plugin-ui-kit` se declara en `package.json` como:

```json
"@integration-hub/plugin-ui-kit": "file:vendor/integration-hub-plugin-ui-kit-0.0.1.tgz"
```

El `.tgz` vendorizado en `vendor/` se generó con:

```bash
# en el monorepo (una sola vez, por el mantenedor del kit):
npx nx build plugin-ui-kit
cd dist/libs/plugin-ui-kit && npm pack --pack-destination <este-proyecto>/vendor
```

`federation.config.js` lo comparte como **singleton del host** (`singleton: true`), de modo
que host y remoto usan una sola instancia del kit + los mismos design tokens `--ih-*`.

## Build local

```bash
npm install
npm run build          # ng build -> dist/browser/remoteEntry.json
```

Salida relevante: `dist/browser/remoteEntry.json` con `exposes: ["./Widget"]` y el kit en
`shared`.

## Firma (ADR-013)

La shell verifica **SRI integrity + firma ECDSA P-256** antes de montar el código remoto.
Tras cada build, recalcula ambos sobre el `remoteEntry.json` publicado:

```bash
node sign-remote.mjs dist/browser/remoteEntry.json demo-transform-key-1
```

- Sin clave privada, genera un keypair y **imprime la PÚBLICA**: regístrala en el host
  (`APP_PLUGIN_REMOTE_TRUSTED_KEYS`, su `keyId` debe coincidir) y guarda la privada.
- Pega `integrity` y `signature` en `manifest.json → remote`.

## Docker

```bash
docker build -t demo-transform-widget:1.0.0 .
docker run -p 4300:80 demo-transform-widget:1.0.0
# remoteEntry: http://localhost:4300/remoteEntry.json  (nginx con CORS habilitado)
```

## Instalar en la plataforma local

Ver [`../README.md`](../README.md) para el flujo completo (catálogo + `docker-compose`).
El `manifest.json` de este widget apunta a `http://localhost:4300/remoteEntry.json`.
