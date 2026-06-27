# Evidencia tooling de firma y e2e de la cadena de remotos (ADR-013) - 2026-06-27

Aporta la herramienta operacional para firmar `remoteEntry` y una prueba e2e
headless de la cadena completa de gobernanza (firma -> descarga -> verificacion ->
montaje -> degradacion).

## Alcance

- Herramienta de firma `scripts/sign-plugin-remote.js` (genkey + sign).
- Test e2e que ejercita el loader + verifier reales + registry con cripto real.

## Cambios verificados

- `scripts/sign-plugin-remote.js`:
  - `genkey`: genera par ECDSA P-256 (JWK privado/publico).
  - `sign`: computa la `integrity` SRI (sha384) del `remoteEntry` y firma el
    payload canonico `id@version:integrity` (ECDSA P-256/SHA-256), emitiendo el
    bloque `remote` `{ url, exposedModule, integrity, signature: "keyId:base64" }`.
  - El payload canonico coincide EXACTAMENTE con `canonicalRemotePayload` del
    verifier runtime, garantizando interoperabilidad firma <-> verificacion.
- `scripts/sign-plugin-remote.spec.js`: round-trip con `node:crypto` (firma de la
  herramienta verifica contra la clave publica; tamper de version -> falla).
- `app-plugin-remote.e2e.spec.ts`: cadena completa headless usando el verifier
  REAL (no stub): un remoto bien firmado se monta; contenido manipulado ->
  `integrity-mismatch` -> `degraded`.
- `test-plugins` incluye ahora el spec de la herramienta de firma.

## Pruebas

### Comandos

```bash
npx nx test web --skip-nx-cache
npx nx test-plugins web --skip-nx-cache
```

### Resultado

- `nx test web`: 79 test files, 357 passed, 0 failed (e2e de la cadena +2).
- `nx test-plugins web`: 30 passed, 0 failed (herramienta de firma +3); gate
  `validate-plugins` ejecutado como dependencia.

## Uso de la herramienta (operacion)

```bash
# 1. Generar claves del firmante
node scripts/sign-plugin-remote.js genkey > signer.json
# (guardar privateJwk en secreto; publicJwk va a provideAppPluginRemoteKeys del host)

# 2. Firmar el remoteEntry del plugin
node scripts/sign-plugin-remote.js sign \
  --id demo --version 1.0.0 \
  --url https://plugins.example.com/remoteEntry.json \
  --exposedModule ./Widget \
  --entry dist/demo/remoteEntry.json \
  --keyId key-1 --key private.jwk
# -> imprime el bloque "remote" para el manifest del catalogo
```

## Riesgo residual / pendiente

- Falta el proyecto Angular remoto de ejemplo (`init --type=remote`) que exponga un
  componente y produzca el `remoteEntry.json` real; su verificacion runtime
  (montaje en navegador) necesita el dev server host+remoto.
- La cadena de seguridad (firma/verificacion/montaje/degradacion) ya queda probada
  headless de extremo a extremo; el remoto de ejemplo es la demo visual final.
