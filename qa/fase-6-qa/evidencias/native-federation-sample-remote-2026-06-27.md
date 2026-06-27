# Evidencia remoto de ejemplo y cadena probada con artefacto real (ADR-013) - 2026-06-27

Crea un plugin remoto de ejemplo (`sample-plugin`) y prueba la cadena completa de
ADR-013 sobre su `remoteEntry.json` REAL: construir -> firmar -> verificar
(integridad + firma) -> el build gate acepta.

## Alcance

- App Angular remoto `apps/sample-plugin` convertido a remoto Native Federation,
  exponiendo un componente standalone (`./Widget`).
- Firma del `remoteEntry.json` real con `scripts/sign-plugin-remote.js`.
- Verificacion de extremo a extremo del artefacto real.

## Cambios verificados

- `npx nx g @nx/angular:application` + `native-federation:init --type=remote`.
- `apps/sample-plugin/src/app/widget.component.ts`: componente standalone expuesto.
- `apps/sample-plugin/federation.config.js`: `exposes { './Widget': ... }`.
- `project.json` del remoto sin target `test` (demo; su valor es construir/federar),
  evitando contaminar `nx run-many -t test`.
- `nx build sample-plugin` produce `dist/apps/sample-plugin/browser/remoteEntry.json`.

## Cadena probada sobre el artefacto REAL

Generada una clave ECDSA P-256 (`genkey`) y firmado el `remoteEntry.json` real:

```
node scripts/sign-plugin-remote.js sign --id sample-plugin --version 1.0.0 \
  --url https://plugins.example.com/sample-plugin/remoteEntry.json \
  --exposedModule ./Widget \
  --entry dist/apps/sample-plugin/browser/remoteEntry.json \
  --keyId sample-key --key private.jwk
```

Verificacion (mismo algoritmo/payload que `AppPluginRemoteVerifier`):

- `integrity match: true` — el hash SRI del `remoteEntry.json` real coincide con la
  `integrity` firmada.
- `signature valid: true` — la firma ECDSA verifica contra la clave publica sobre
  el payload canonico `sample-plugin@1.0.0:<integrity>`.
- Build gate: `validate-plugin-catalog.js` ACEPTA un catalogo con el bloque
  `remote` firmado (`Manifests: 1`).

(Las claves privadas y artefactos de firma se mantienen fuera del repo.)

## Estado del workspace

- `nx test web`: 79 test files, 357 passed.
- `nx build web` (host, federacion): PASS.
- `nx build sample-plugin`: PASS.

## Pendiente: demo visual en navegador

- El gate y el runtime exigen `remote.url` `https://`. Un dev server local es
  `http://localhost`, por lo que el montaje visual requiere servir el remoto por
  https o desplegarlo, mas anadir su origen/clave a la confianza del host
  (`provideAppPluginRemoteOrigins/TrustedKeys/Keys`) y el manifest firmado al
  catalogo. La cadena de seguridad subyacente ya queda probada sobre el artefacto
  real; resta solo la demostracion visual en un entorno https.
