# Evidencia G1: kit de autor de plugin frontend (ejemplo + guía) - 2026-07-01

Habilita que un tercero construya, firme y publique un **plugin de interfaz instalable
desde fuera**. Cierra el cuello de botella real detectado en el análisis: la plataforma
ya carga plugins frontend externos en runtime (verificados), pero faltaba el ejemplo
publicable y la guía de autor.

## Corrección del análisis (doble check aplicado)

Durante la implementación se confirmó que **ya existía `apps/sample-plugin`**: un remote
Native Federation construible (widget + `federation.config.js` + target de build). Por
tanto **no se duplicó**: se enriqueció ese remote con lo que le faltaba, en lugar de crear
un ejemplo paralelo.

## Cambios

- `frontend/apps/sample-plugin/manifest.json`: manifiesto publicable (`AppPluginManifest`)
  del remote, con `remote` (`./Widget`, `integrity` SRI, `signature` `keyId:base64`).
- `frontend/apps/sample-plugin/sign-remote.mjs`: herramienta de autor que calcula la
  integridad SRI (sha384) y firma ECDSA P-256 del `remoteEntry` (genera par de claves si
  no se aporta uno).
- `frontend/apps/sample-plugin/README.md`: estructura, reglas del contrato y flujo de
  publicación.
- `docs/fase-3-arquitectura/guia-autor-plugins.md`: guía completa front+back (contrato,
  modelo de seguridad fail-safe, versionado/compatibilidad), apuntando a
  `apps/sample-plugin` y a `ejemplos/backend-plugin-sidecar`.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: **PASS**. Test files: **80 passed**. Tests: **376 passed** (+2 nuevos en
  `AppPluginRuntimeRegistry`: el manifiesto de `sample-plugin` se **acepta** con origen+key
  en allowlist y se pone **en cuarentena** con los allowlists vacíos por defecto).

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

### Resultado

- Suite completa: **4 passed (2.7m)**.
- Nuevo test "quarantines an untrusted external frontend plugin from the catalog":
  mockea `/plugins/catalog.json` con el manifiesto de `sample-plugin`; el shell lo carga
  al arranque y, con los allowlists por defecto (vacíos), lo pone **en cuarentena**
  (visible en `/plugins`, filtro "En cuarentena", con el motivo
  "not in the allowed plugin origins") — sin romper el shell. Verifica el pipeline
  externo + el fail-safe end-to-end contra el app real.

## Estado

- G1 entregado: un autor externo ya tiene ejemplo funcional + herramienta de firma + guía.
- Siguientes (del análisis): G4 (widget de salud en Overview) y G2 (UI admin del catálogo
  frontend, simétrica al marketplace backend).
