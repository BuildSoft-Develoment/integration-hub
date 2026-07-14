# Evidencia E2E - audit/* con data y tareas remotas de plugin

Fecha: 2026-07-09

## Objetivo

Validar en `http://localhost:8080` que:

- Las pantallas `/#/audit/*` renderizan datos representativos con casos correctos y con error.
- `/#/processes` muestra tareas remotas aportadas por plugins backend en la paleta del editor.
- Una tarea remota `AVAILABLE` queda usable y una `UNTRUSTED` queda visible pero deshabilitada.

## Artefactos

- Spec E2E: `frontend/apps/web-e2e/src/audit-processes-data.spec.ts`
- Seed SQL para BD real: `scripts/seed-audit-mt101-e2e.sql`

## Datos cubiertos por la prueba visual

- Audit events: evento `MT101_QA_SEED` con estado `COMPLETED_WITH_ERRORS`.
- Audit spool: fila `DEAD` con `qa-audit-mt101-spool-dead`.
- Record lineage: traza `INGESTED -> VALIDATED` con error `Currency XXX no permitida`.
- MT101 fragments: fragmento `QA20B` rechazado.
- MT101 quarantine: regla `QA.CURRENCY`, mensaje `Moneda XXX rechazada para evidencia visual`.
- PAY dispatch: intento `UNCERTAIN` con timeout posterior al envio.
- PAY conflicts: conflicto abierto `QA20A`, worker `SENT` vs banco `REJECTED`.
- Processes: plugin group con `DEMO_TRANSFORM_NODE` disponible y `DEMO_TRANSFORM_PY` deshabilitado por `UNTRUSTED`.

## Ejecucion

Comando ejecutado:

```powershell
cd frontend
set BASE_URL=http://localhost:8080&& npx playwright test -c apps/web-e2e/playwright.config.ts src/audit-processes-data.spec.ts --project=chromium --reporter=line
```

Resultado:

```text
2 passed (9.0s)
```

Validaciones adicionales:

```text
npx tsc -p tsconfig.base.json --noEmit
OK

npx nx lint web-e2e
OK, con 1 warning preexistente en frontend/apps/web-e2e/src/example.spec.ts:678
```

## Nota sobre seed real

El archivo `scripts/seed-audit-mt101-e2e.sql` deja preparado el lote `QA-AUDIT-MT101-001` para poblar BD real con las mismas condiciones operativas. La ejecucion directa contra Postgres via Docker quedo pendiente porque la autorizacion automatica del comando de seed fue rechazada por limite de uso; no se intento un workaround.
