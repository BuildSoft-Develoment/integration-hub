# Evidencia frontend visual/a11y y arbol Git - 2026-06-26

## Alcance

- Validar si puede ejecutarse evidencia visual/a11y autenticada del frontend.
- Revisar el estado del arbol Git para separar cambios por alcance antes de stage/commit.

## Evidencia visual/a11y

### Comando ejecutado

```bash
cmd.exe /c "cd frontend && node scripts\\lh-screenshots.js"
```

### Resultado

Estado: **PASS con stack completo**

El primer intento quedo bloqueado porque `http://localhost:8080` no estaba disponible. Se reintento con el entrypoint operativo indicado para la plataforma:

```bash
cmd.exe /c start-platform-stack.cmd
```

Resultado del stack: app OK en `http://localhost:8080/`, health app OK en `/q/health` y audit-consumer OK en `http://localhost:8082/q/health`.

Luego se ejecuto la evidencia visual/a11y autenticada:

```bash
cmd.exe /c "cd frontend && node scripts\\lh-screenshots.js"
```

El script autentico con Keycloak (`admin`) y recorrio 9 rutas: `overview`, `connections`, `sources`, `readers`, `processes`, `schedules`, `executions`, `audit` y `payment-rules`.

| Ruta | Nav ms | DOM | KB | Botones | Foco | Errores consola | Botones sin nombre | Landmark/lang |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| overview | 2 | 269 | 1204 | 3 | 17 | 0 | 0 | PASS |
| connections | 2 | 543 | 1341 | 13 | 46 | 0 | 0 | PASS |
| sources | 2 | 487 | 1396 | 14 | 40 | 0 | 0 | PASS |
| readers | 2 | 635 | 1468 | 14 | 47 | 0 | 0 | PASS |
| processes | 2 | 579 | 2128 | 27 | 51 | 0 | 0 | PASS |
| schedules | 2 | 308 | 2151 | 11 | 29 | 0 | 0 | PASS |
| executions | 2 | 323 | 2228 | 11 | 29 | 0 | 0 | PASS |
| audit | 3 | 441 | 2371 | 19 | 37 | 0 | 0 | PASS |
| payment-rules | 2 | 445 | 2433 | 8 | 35 | 0 | 0 | PASS |

### Lectura

- Se genero evidencia fresca en `lighthouse-report/screenshots/` y `lighthouse-report/screenshots/metrics.json`.
- El helper `frontend/scripts/lh-screenshots.js` fue ajustado para reconocer `aria-labelledby` como nombre accesible valido en controles Angular Material (`mat-slide-toggle`).
- Se agregaron nombres accesibles a filas seleccionables, acciones icon-only de flujo y acciones icon-only de reglas de pago.
- `node scripts\\lh-audit-app.js` fue intentado previamente, pero expiro dentro del timeout local de 5 minutos; no se usa como evidencia fresca de cierre.

## Arbol Git

### Resumen actual

```text
total=145
modified=129
untracked=16
```

Distribucion por area:

| Area | Archivos | Lectura |
| --- | ---: | --- |
| frontend catalogs | 40 | Cambios amplios en catalogos CRUD/operativos; no mezclar con RBAC si se busca PR pequeno. |
| frontend platform/tooling | 30 | Layout, core services, scripts Lighthouse, docs frontend, package/config. |
| frontend processes | 22 | Editor/flow/forms de procesos; alto riesgo visual/regresion si se commitea junto a RBAC. |
| frontend audit | 18 | Incluye audit, spool, cuarentena y acciones; parte relevante para capacidades `audit-*`. |
| backend platform-app | 18 | Recursos REST RBAC y `PlatformRoles`; parte relevante para alineamiento de roles. |
| docs/specs/qa | 6 | Evidencia y arquitectura actualizadas. |
| frontend payments | 5 | Pantalla/reglas de pago y specs; parte relevante para `payment-rules`. |
| local QA artifacts | 4 | Credenciales/cookies/headers/reportes locales; revisar antes de versionar. |

### Recomendacion de saneamiento

1. Crear un commit/PR para RBAC y permisos:
   - `platform-app/src/main/java/com/integrationhub/platform/api/security/PlatformRoles.java`
   - recursos REST con `@RolesAllowed(...)`
   - `auth-access.service.ts`
   - `app-section-access.policy.ts`
   - specs de acceso/RBAC
   - ADR/AuthZ/evidencia asociada

2. Crear un commit/PR para mejoras UI operativas:
   - componentes compartidos (`actions`, `empty-state`, `loading`, `floating-action-bar`, `duration-input`)
   - cambios visuales en catalogos y procesos
   - i18n/layout/toolbars

3. Crear un commit/PR para tooling visual/a11y:
   - `frontend/scripts/*`
   - `frontend/lighthouserc.json`
   - `frontend/docs/lighthouse-*`
   - evidencia QA, excluyendo secretos locales

4. Mantener fuera de Git o sanear antes de stage:
   - `lighthouse-bearer.txt`
   - `lighthouse-cookies.txt`
   - `lighthouse-headers.json`
   - reportes generados en `lighthouse-report/` si contienen tokens, cookies, URLs internas o datos de sesion

## Estado

- Build frontend productivo: PASS sin warnings de presupuesto.
- Tests/lint frontend y compile/tests backend RBAC ya verificados en la evidencia de `008-mensajeria-pagos.md`.
- Evidencia visual/a11y fresca: PASS con `start-platform-stack.cmd` y `lh-screenshots.js`.
- Arbol Git: requiere staging selectivo por alcance antes de cualquier commit.

## Actualizacion RF-010 - riesgo operacional audit UI

### Cambios verificados

- Contrato UI de riesgo operacional para acciones auditables criticas.
- Workspace audit comun para `/audit/*` con navegacion interna y clasificacion
  visual de consulta vs operacion gobernada.
- Senalizacion visible en `/audit/spool` para `cleanup SENT` y `retry DEAD`.
- Senalizacion visible en `/audit/mt101-quarantine` para construir cuarentena,
  solicitar/aprobar/ejecutar rebuild, correccion de staging y PAY correctivo.
- `frontend/scripts/lh-screenshots.js` ahora cubre tambien:
  `audit-record-lineage`, `audit-spool`, `audit-mt101-fragments`,
  `audit-mt101-quarantine`.

### Comandos ejecutados

```bash
cmd.exe /c npx nx test web --skip-nx-cache
cmd.exe /c npx nx build web --skip-nx-cache
cmd.exe /c start-platform-stack.cmd
cmd.exe /c "cd frontend && node scripts\\lh-screenshots.js"
```

### Resultado

- `web:test`: PASS, 63 archivos y 279 tests.
- `web:build:production`: PASS, initial total `1.22 MB`, sin warnings de budget.
- Stack: PASS con app `http://localhost:8080/` y audit-consumer OK.
- Visual/a11y autenticado: PASS en 13 rutas.

| Ruta | Nav ms | DOM | KB | Botones | Foco | Errores consola | Botones sin nombre | Landmark/lang |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| overview | 6 | 269 | 1209 | 3 | 17 | 0 | 0 | PASS |
| connections | 3 | 543 | 1347 | 13 | 46 | 0 | 0 | PASS |
| sources | 3 | 487 | 1402 | 14 | 40 | 0 | 0 | PASS |
| readers | 2 | 635 | 1474 | 14 | 47 | 0 | 0 | PASS |
| processes | 2 | 579 | 2134 | 27 | 51 | 0 | 0 | PASS |
| schedules | 2 | 308 | 2157 | 11 | 29 | 0 | 0 | PASS |
| executions | 2 | 323 | 2234 | 11 | 29 | 0 | 0 | PASS |
| audit | 2 | 459 | 2388 | 19 | 42 | 0 | 0 | PASS |
| audit-record-lineage | 2 | 203 | 2388 | 8 | 28 | 0 | 0 | PASS |
| audit-spool | 2 | 281 | 2389 | 6 | 30 | 0 | 0 | PASS |
| audit-mt101-fragments | 2 | 249 | 2389 | 5 | 30 | 0 | 0 | PASS |
| audit-mt101-quarantine | 2 | 338 | 2389 | 9 | 39 | 0 | 0 | PASS |
| payment-rules | 3 | 463 | 2451 | 9 | 38 | 0 | 0 | PASS |
